"""
HOS (Hours of Service) Engine for property-carrying CMV drivers.

Rules implemented (70hr/8day cycle, no adverse conditions):
- 11-Hour Driving Limit per shift
- 14-Hour Driving Window from start of duty (wall-clock)
- 30-Minute Rest Break after 8 cumulative hours of driving
- 70-Hour/8-Day On-Duty Limit with a 34-hour restart when the cycle is exhausted
- 10 consecutive hours off-duty required between shifts
- Fueling stop every 1,000 miles
- 1 hour for pickup, 1 hour for drop-off
"""

from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional, Tuple


class DutyStatus(str, Enum):
    OFF_DUTY = "off_duty"
    SLEEPER_BERTH = "sleeper_berth"
    DRIVING = "driving"
    ON_DUTY_NOT_DRIVING = "on_duty_not_driving"


@dataclass
class LogEntry:
    status: DutyStatus
    start_time: datetime
    end_time: datetime
    location: str = ""
    remarks: str = ""

    @property
    def duration_hours(self) -> float:
        return (self.end_time - self.start_time).total_seconds() / 3600


@dataclass
class DailyLog:
    date: datetime
    entries: List[LogEntry] = field(default_factory=list)
    total_miles: float = 0.0
    remarks: List[str] = field(default_factory=list)
    driving_hours: float = 0.0
    on_duty_hours: float = 0.0
    window_hours: float = 0.0

    @property
    def total_hours_by_status(self) -> dict:
        totals = {s: 0.0 for s in DutyStatus}
        for entry in self.entries:
            day_start = self.date.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(hours=24)
            eff_start = max(entry.start_time, day_start)
            eff_end = min(entry.end_time, day_end)
            if eff_start < eff_end:
                totals[entry.status] += (eff_end - eff_start).total_seconds() / 3600
        return totals


@dataclass
class Stop:
    location: str
    lat: float
    lng: float
    stop_type: str
    arrival_time: datetime
    departure_time: datetime
    duration_hours: float
    cumulative_miles: float
    remarks: str = ""


# --- HOS Constants ---
MAX_DRIVING_HOURS = 11.0
MAX_WINDOW_HOURS = 14.0
MANDATORY_BREAK_AFTER = 8.0
MANDATORY_BREAK_DURATION = 0.5  # 30 minutes
OFF_DUTY_RESET = 10.0
CYCLE_RESTART = 34.0
CYCLE_LIMIT = 70.0
CYCLE_DAYS = 8
FUEL_INTERVAL_MILES = 1000.0
FUEL_STOP_DURATION = 0.5  # 30 min for fueling
PICKUP_DURATION = 1.0
DROPOFF_DURATION = 1.0
AVG_SPEED_MPH = 55.0


def plan_trip(
    current_loc: dict,
    pickup_loc: dict,
    dropoff_loc: dict,
    current_cycle_used: float,
    route_segments: list,
    start_time: Optional[datetime] = None,
) -> Tuple[List[Stop], List['DailyLog'], dict, list]:
    """
    Plan a trip with full HOS compliance.
    Returns: (stops, daily_logs, cycle_info, shifts_data)
    """
    if start_time is None:
        start_time = datetime.now().replace(minute=0, second=0, microsecond=0)

    stops: List[Stop] = []
    log_entries: List[LogEntry] = []

    clock = start_time
    shift_start = clock
    driving_in_shift = 0.0
    driving_since_break = 0.0
    cycle_used = current_cycle_used
    trip_on_duty_added = 0.0
    cycle_restarts = 0
    total_miles_driven = 0.0
    on_duty_in_shift = 0.0

    # Track completed shifts for compliance verification
    shifts: List[dict] = []
    current_shift_num = 1

    def close_shift():
        nonlocal current_shift_num
        shifts.append({
            'shift_number': current_shift_num,
            'start_time': shift_start,
            'end_time': clock,
            'driving_hours': round(driving_in_shift, 2),
            'on_duty_hours': round(on_duty_in_shift, 2),
            'window_hours': round(time_in_window(), 2),
            'driving_limit': MAX_DRIVING_HOURS,
            'window_limit': MAX_WINDOW_HOURS,
        })
        current_shift_num += 1

    legs = _build_legs(current_loc, pickup_loc, dropoff_loc, route_segments)

    stops.append(Stop(
        location=current_loc['name'],
        lat=current_loc['lat'],
        lng=current_loc['lng'],
        stop_type='start',
        arrival_time=clock,
        departure_time=clock,
        duration_hours=0,
        cumulative_miles=0,
        remarks='Trip start — Current location',
    ))

    # --- Helper functions (closures over trip state) ---

    def time_in_window():
        return (clock - shift_start).total_seconds() / 3600

    def remaining_drive_in_shift():
        return max(0, MAX_DRIVING_HOURS - driving_in_shift)

    def remaining_window():
        return max(0, MAX_WINDOW_HOURS - time_in_window())

    def remaining_before_break():
        return max(0, MANDATORY_BREAK_AFTER - driving_since_break)

    def remaining_cycle():
        return max(0, CYCLE_LIMIT - cycle_used)

    def drivable_hours():
        return max(0, min(
            remaining_drive_in_shift(),
            remaining_window(),
            remaining_before_break(),
            remaining_cycle(),
        ))

    def needs_shift_reset():
        return (remaining_drive_in_shift() <= 0.01 or
                remaining_window() <= 0.01)

    def needs_cycle_reset():
        return remaining_cycle() <= 0.01

    def ensure_window_for(needed_hours, location, lat, lng, reason):
        """Ensure enough 14-hr window and cycle time for an on-duty activity."""
        if remaining_cycle() < needed_hours:
            do_cycle_restart(location, lat, lng,
                             f"34-hr restart — cycle limit ({reason})")
        elif remaining_window() < needed_hours or needs_shift_reset():
            do_off_duty_reset(location, lat, lng,
                              f"10-hr off-duty reset — {reason}")

    def do_off_duty_reset(location, lat, lng, reason="10-hr off-duty reset"):
        nonlocal clock, shift_start, driving_in_shift, driving_since_break, on_duty_in_shift
        if driving_in_shift > 0 or on_duty_in_shift > 0:
            close_shift()
        start = clock
        clock = clock + timedelta(hours=OFF_DUTY_RESET)
        log_entries.append(LogEntry(
            status=DutyStatus.OFF_DUTY,
            start_time=start,
            end_time=clock,
            location=location,
            remarks=reason,
        ))
        stops.append(Stop(
            location=location, lat=lat, lng=lng,
            stop_type='off_duty_reset',
            arrival_time=start, departure_time=clock,
            duration_hours=OFF_DUTY_RESET,
            cumulative_miles=total_miles_driven,
            remarks=reason,
        ))
        shift_start = clock
        driving_in_shift = 0.0
        driving_since_break = 0.0
        on_duty_in_shift = 0.0

    def do_cycle_restart(location, lat, lng, reason="34-hr restart — cycle limit reached"):
        nonlocal clock, shift_start, driving_in_shift, driving_since_break
        nonlocal on_duty_in_shift, cycle_used, cycle_restarts
        if driving_in_shift > 0 or on_duty_in_shift > 0:
            close_shift()
        start = clock
        clock = clock + timedelta(hours=CYCLE_RESTART)
        log_entries.append(LogEntry(
            status=DutyStatus.OFF_DUTY,
            start_time=start,
            end_time=clock,
            location=location,
            remarks=reason,
        ))
        stops.append(Stop(
            location=location, lat=lat, lng=lng,
            stop_type='cycle_restart',
            arrival_time=start, departure_time=clock,
            duration_hours=CYCLE_RESTART,
            cumulative_miles=total_miles_driven,
            remarks=reason,
        ))
        shift_start = clock
        driving_in_shift = 0.0
        driving_since_break = 0.0
        on_duty_in_shift = 0.0
        cycle_used = 0.0
        cycle_restarts += 1

    def do_30min_break(location, lat, lng):
        nonlocal clock, driving_since_break
        start = clock
        clock = clock + timedelta(hours=MANDATORY_BREAK_DURATION)
        remark = f"30-min break — {driving_since_break:.1f} hrs driving accumulated"
        log_entries.append(LogEntry(
            status=DutyStatus.OFF_DUTY,
            start_time=start,
            end_time=clock,
            location=location,
            remarks=remark,
        ))
        stops.append(Stop(
            location=location, lat=lat, lng=lng,
            stop_type='break',
            arrival_time=start, departure_time=clock,
            duration_hours=MANDATORY_BREAK_DURATION,
            cumulative_miles=total_miles_driven,
            remarks=remark,
        ))
        driving_since_break = 0.0

    def do_on_duty(hours, location, lat, lng, reason, stop_type):
        nonlocal clock, on_duty_in_shift, cycle_used, trip_on_duty_added
        start = clock
        clock = clock + timedelta(hours=hours)
        log_entries.append(LogEntry(
            status=DutyStatus.ON_DUTY_NOT_DRIVING,
            start_time=start,
            end_time=clock,
            location=location,
            remarks=reason,
        ))
        on_duty_in_shift += hours
        cycle_used += hours
        trip_on_duty_added += hours
        stops.append(Stop(
            location=location, lat=lat, lng=lng,
            stop_type=stop_type,
            arrival_time=start, departure_time=clock,
            duration_hours=hours,
            cumulative_miles=total_miles_driven,
            remarks=reason,
        ))

    def do_fuel_stop(location, lat, lng):
        nonlocal clock, on_duty_in_shift, cycle_used, trip_on_duty_added
        if remaining_cycle() < FUEL_STOP_DURATION:
            do_cycle_restart(location, lat, lng,
                             "34-hr restart — cycle limit before fueling")
        elif remaining_window() < FUEL_STOP_DURATION:
            do_off_duty_reset(location, lat, lng,
                              "10-hr off-duty reset — window exhausted before fueling")
        start = clock
        clock = clock + timedelta(hours=FUEL_STOP_DURATION)
        log_entries.append(LogEntry(
            status=DutyStatus.ON_DUTY_NOT_DRIVING,
            start_time=start,
            end_time=clock,
            location=location,
            remarks='Fueling stop (on-duty, not driving)',
        ))
        on_duty_in_shift += FUEL_STOP_DURATION
        cycle_used += FUEL_STOP_DURATION
        trip_on_duty_added += FUEL_STOP_DURATION
        stops.append(Stop(
            location=location, lat=lat, lng=lng,
            stop_type='fuel',
            arrival_time=start, departure_time=clock,
            duration_hours=FUEL_STOP_DURATION,
            cumulative_miles=total_miles_driven,
            remarks='Fueling stop (on-duty, not driving)',
        ))

    def interpolate_position(leg, fraction):
        wps = leg.get('waypoints', [])
        if not wps or len(wps) < 2:
            lat = leg['start_lat'] + fraction * (leg['end_lat'] - leg['start_lat'])
            lng = leg['start_lng'] + fraction * (leg['end_lng'] - leg['start_lng'])
            return lat, lng
        total_points = len(wps)
        idx = fraction * (total_points - 1)
        lower = int(idx)
        upper = min(lower + 1, total_points - 1)
        t = idx - lower
        lat = wps[lower][1] + t * (wps[upper][1] - wps[lower][1])
        lng = wps[lower][0] + t * (wps[upper][0] - wps[lower][0])
        return lat, lng

    # --- Main trip loop ---
    miles_since_fuel = 0.0

    for leg in legs:
        # Pickup activity: on-duty not driving BEFORE driving the to_dropoff leg
        if leg['type'] == 'to_dropoff':
            ensure_window_for(PICKUP_DURATION, pickup_loc['name'],
                              pickup_loc['lat'], pickup_loc['lng'],
                              "need window for 1-hr pickup")
            do_on_duty(PICKUP_DURATION, pickup_loc['name'],
                       pickup_loc['lat'], pickup_loc['lng'],
                       'Pickup — loading (on-duty, not driving)', 'pickup')

        leg_distance = leg['distance']
        leg_duration = leg['duration']
        leg_miles_driven = 0.0
        speed = leg_distance / leg_duration if leg_duration > 0 else AVG_SPEED_MPH

        while leg_miles_driven < leg_distance - 0.1:
            # Check if a full shift reset is needed
            if needs_cycle_reset():
                frac = leg_miles_driven / leg_distance if leg_distance > 0 else 0
                lat, lng = interpolate_position(leg, frac)
                do_cycle_restart(
                    f"Mile {total_miles_driven:.0f}", lat, lng,
                    "34-hr restart — cycle limit reached")
                continue

            if needs_shift_reset():
                frac = leg_miles_driven / leg_distance if leg_distance > 0 else 0
                lat, lng = interpolate_position(leg, frac)
                do_off_duty_reset(
                    f"Mile {total_miles_driven:.0f}", lat, lng,
                    "10-hr off-duty reset — shift limit reached")
                continue

            available = drivable_hours()

            # Need a 30-min break?
            if available <= 0.01 and remaining_before_break() <= 0.01:
                frac = leg_miles_driven / leg_distance if leg_distance > 0 else 0
                lat, lng = interpolate_position(leg, frac)
                do_30min_break(f"Mile {total_miles_driven:.0f}", lat, lng)
                continue

            if available <= 0.01:
                frac = leg_miles_driven / leg_distance if leg_distance > 0 else 0
                lat, lng = interpolate_position(leg, frac)
                if remaining_cycle() <= 0.01:
                    do_cycle_restart(
                        f"Mile {total_miles_driven:.0f}", lat, lng,
                        "34-hr restart — no cycle hours available")
                else:
                    do_off_duty_reset(
                        f"Mile {total_miles_driven:.0f}", lat, lng,
                        "10-hr off-duty reset — no drivable hours")
                continue

            remaining_leg = leg_distance - leg_miles_driven
            miles_can_drive = available * speed

            fuel_remaining = FUEL_INTERVAL_MILES - miles_since_fuel
            if fuel_remaining <= 0:
                fuel_remaining = FUEL_INTERVAL_MILES

            drive_miles = min(remaining_leg, miles_can_drive, fuel_remaining)
            drive_hours = drive_miles / speed if speed > 0 else 0

            if drive_hours < 0.01:
                break

            start = clock
            clock = clock + timedelta(hours=drive_hours)

            frac_start = leg_miles_driven / leg_distance if leg_distance > 0 else 0
            frac_end = (leg_miles_driven + drive_miles) / leg_distance if leg_distance > 0 else 1

            loc_start = leg['start_name'] if frac_start < 0.01 else f"Mile {total_miles_driven:.0f}"
            loc_end = leg['end_name'] if frac_end > 0.99 else f"Mile {total_miles_driven + drive_miles:.0f}"

            log_entries.append(LogEntry(
                status=DutyStatus.DRIVING,
                start_time=start,
                end_time=clock,
                location=f"{loc_start} → {loc_end}",
                remarks=f"Driving {drive_miles:.0f} mi ({drive_hours:.1f} hrs)",
            ))

            driving_in_shift += drive_hours
            driving_since_break += drive_hours
            on_duty_in_shift += drive_hours
            cycle_used += drive_hours
            trip_on_duty_added += drive_hours
            total_miles_driven += drive_miles
            leg_miles_driven += drive_miles
            miles_since_fuel += drive_miles

            # Fuel stop needed?
            if miles_since_fuel >= FUEL_INTERVAL_MILES - 0.1 and remaining_leg - drive_miles > 1:
                end_lat, end_lng = interpolate_position(leg, frac_end)
                do_fuel_stop(f"Fuel stop — mile {total_miles_driven:.0f}", end_lat, end_lng)
                miles_since_fuel = 0.0

        # Dropoff activity: on-duty not driving AFTER driving the to_dropoff leg
        if leg['type'] == 'to_dropoff':
            ensure_window_for(DROPOFF_DURATION, dropoff_loc['name'],
                              dropoff_loc['lat'], dropoff_loc['lng'],
                              "need window for 1-hr dropoff")
            do_on_duty(DROPOFF_DURATION, dropoff_loc['name'],
                       dropoff_loc['lat'], dropoff_loc['lng'],
                       'Drop-off — unloading (on-duty, not driving)', 'dropoff')

    stops.append(Stop(
        location=dropoff_loc['name'],
        lat=dropoff_loc['lat'],
        lng=dropoff_loc['lng'],
        stop_type='end',
        arrival_time=clock,
        departure_time=clock,
        duration_hours=0,
        cumulative_miles=total_miles_driven,
        remarks='Trip complete',
    ))

    # Close final shift
    if driving_in_shift > 0 or on_duty_in_shift > 0:
        close_shift()

    # Build daily logs
    daily_logs = build_daily_logs(log_entries, start_time, clock, total_miles_driven)

    cycle_info = {
        'cycle_limit': CYCLE_LIMIT,
        'cycle_days': CYCLE_DAYS,
        'cycle_start_used': current_cycle_used,
        'cycle_added_this_trip': round(trip_on_duty_added, 2),
        'cycle_total_used': round(cycle_used, 2),
        'cycle_remaining': round(max(0, CYCLE_LIMIT - cycle_used), 2),
        'cycle_restarts': cycle_restarts,
    }

    # Serialize shifts
    shifts_data = []
    for s in shifts:
        shifts_data.append({
            'shift_number': s['shift_number'],
            'start_time': s['start_time'],
            'end_time': s['end_time'],
            'driving_hours': s['driving_hours'],
            'on_duty_hours': s['on_duty_hours'],
            'window_hours': s['window_hours'],
            'driving_limit': s['driving_limit'],
            'window_limit': s['window_limit'],
            'driving_ok': s['driving_hours'] <= s['driving_limit'] + 0.01,
            'window_ok': s['window_hours'] <= s['window_limit'] + 0.01,
        })

    return stops, daily_logs, cycle_info, shifts_data


def _build_legs(current_loc, pickup_loc, dropoff_loc, route_segments):
    legs = []
    seg_to_pickup = route_segments[0] if route_segments else None
    seg_to_dropoff = route_segments[1] if len(route_segments) > 1 else None

    if seg_to_pickup:
        legs.append({
            'distance': seg_to_pickup['distance_miles'],
            'duration': seg_to_pickup['duration_hours'],
            'start_name': current_loc['name'],
            'end_name': pickup_loc['name'],
            'start_lat': current_loc['lat'],
            'start_lng': current_loc['lng'],
            'end_lat': pickup_loc['lat'],
            'end_lng': pickup_loc['lng'],
            'type': 'to_pickup',
            'waypoints': seg_to_pickup.get('waypoints', []),
        })
    if seg_to_dropoff:
        legs.append({
            'distance': seg_to_dropoff['distance_miles'],
            'duration': seg_to_dropoff['duration_hours'],
            'start_name': pickup_loc['name'],
            'end_name': dropoff_loc['name'],
            'start_lat': pickup_loc['lat'],
            'start_lng': pickup_loc['lng'],
            'end_lat': dropoff_loc['lat'],
            'end_lng': dropoff_loc['lng'],
            'type': 'to_dropoff',
            'waypoints': seg_to_dropoff.get('waypoints', []),
        })
    return legs


def build_daily_logs(
    entries: List[LogEntry],
    trip_start: datetime,
    trip_end: datetime,
    total_miles: float,
) -> List['DailyLog']:
    if not entries:
        return []

    total_driving_hours = sum(
        e.duration_hours for e in entries if e.status == DutyStatus.DRIVING
    )
    avg_speed = total_miles / total_driving_hours if total_driving_hours > 0 else AVG_SPEED_MPH

    first_day = trip_start.replace(hour=0, minute=0, second=0, microsecond=0)
    last_day = trip_end.replace(hour=0, minute=0, second=0, microsecond=0)
    num_days = (last_day - first_day).days + 1

    logs = []
    for day_offset in range(num_days):
        day_date = first_day + timedelta(days=day_offset)
        day_start = day_date
        day_end = day_date + timedelta(hours=24)

        day_log = DailyLog(date=day_date)
        day_entries = []

        for entry in entries:
            if entry.end_time <= day_start or entry.start_time >= day_end:
                continue
            clipped_start = max(entry.start_time, day_start)
            clipped_end = min(entry.end_time, day_end)
            day_entries.append(LogEntry(
                status=entry.status,
                start_time=clipped_start,
                end_time=clipped_end,
                location=entry.location,
                remarks=entry.remarks,
            ))

        # Fill gaps with off-duty
        if day_entries:
            first_entry_start = day_entries[0].start_time
            if first_entry_start > day_start:
                day_entries.insert(0, LogEntry(
                    status=DutyStatus.OFF_DUTY,
                    start_time=day_start,
                    end_time=first_entry_start,
                    location="",
                    remarks="Off duty",
                ))

            last_entry_end = day_entries[-1].end_time
            if last_entry_end < day_end:
                day_entries.append(LogEntry(
                    status=DutyStatus.OFF_DUTY,
                    start_time=last_entry_end,
                    end_time=day_end,
                    location="",
                    remarks="Off duty",
                ))
        else:
            day_entries.append(LogEntry(
                status=DutyStatus.OFF_DUTY,
                start_time=day_start,
                end_time=day_end,
                location="",
                remarks="Off duty — full day",
            ))

        day_log.entries = day_entries

        # Calculate per-day miles
        day_driving_miles = 0.0
        day_driving_hrs = 0.0
        day_on_duty_hrs = 0.0
        for entry in day_entries:
            hrs = entry.duration_hours
            if entry.status == DutyStatus.DRIVING:
                day_driving_miles += hrs * avg_speed
                day_driving_hrs += hrs
                day_on_duty_hrs += hrs
            elif entry.status == DutyStatus.ON_DUTY_NOT_DRIVING:
                day_on_duty_hrs += hrs

        day_log.total_miles = round(day_driving_miles, 1)
        day_log.driving_hours = round(day_driving_hrs, 2)
        day_log.on_duty_hours = round(day_on_duty_hrs, 2)

        for entry in day_entries:
            if entry.location and entry.remarks:
                day_log.remarks.append(f"{entry.location}: {entry.remarks}")

        logs.append(day_log)

    return logs
