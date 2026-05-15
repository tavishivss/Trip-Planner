from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime

from .route_service import geocode, geocode_suggestions, get_route
from .hos_engine import plan_trip, DutyStatus


@api_view(['POST'])
def plan_trip_view(request):
    data = request.data
    current_location = data.get('current_location', '')
    pickup_location = data.get('pickup_location', '')
    dropoff_location = data.get('dropoff_location', '')
    current_cycle_used = float(data.get('current_cycle_used', 0))

    current_loc_data = data.get('current_loc_data')
    pickup_loc_data = data.get('pickup_loc_data')
    dropoff_loc_data = data.get('dropoff_loc_data')

    if not all([current_location or current_loc_data,
                pickup_location or pickup_loc_data,
                dropoff_location or dropoff_loc_data]):
        return Response(
            {'error': 'All locations are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if current_loc_data:
        current_loc = current_loc_data
    else:
        current_loc = geocode(current_location)
    if pickup_loc_data:
        pickup_loc = pickup_loc_data
    else:
        pickup_loc = geocode(pickup_location)
    if dropoff_loc_data:
        dropoff_loc = dropoff_loc_data
    else:
        dropoff_loc = geocode(dropoff_location)

    if not current_loc:
        return Response({'error': f'Could not geocode current location: {current_location}'},
                        status=status.HTTP_400_BAD_REQUEST)
    if not pickup_loc:
        return Response({'error': f'Could not geocode pickup location: {pickup_location}'},
                        status=status.HTTP_400_BAD_REQUEST)
    if not dropoff_loc:
        return Response({'error': f'Could not geocode dropoff location: {dropoff_location}'},
                        status=status.HTTP_400_BAD_REQUEST)

    route_to_pickup = get_route(current_loc, pickup_loc)
    route_to_dropoff = get_route(pickup_loc, dropoff_loc)

    route_segments = [route_to_pickup, route_to_dropoff]

    start_time = datetime.now().replace(minute=0, second=0, microsecond=0)

    stops, daily_logs, cycle_info, shifts_data = plan_trip(
        current_loc=current_loc,
        pickup_loc=pickup_loc,
        dropoff_loc=dropoff_loc,
        current_cycle_used=current_cycle_used,
        route_segments=route_segments,
        start_time=start_time,
    )

    # Serialize stops
    stops_data = []
    for stop in stops:
        stops_data.append({
            'location': stop.location,
            'lat': stop.lat,
            'lng': stop.lng,
            'stop_type': stop.stop_type,
            'arrival_time': stop.arrival_time.isoformat(),
            'departure_time': stop.departure_time.isoformat(),
            'duration_hours': round(stop.duration_hours, 2),
            'cumulative_miles': round(stop.cumulative_miles, 1),
            'remarks': stop.remarks,
        })

    # Serialize daily logs with per-day HOS data
    logs_data = []
    for log in daily_logs:
        entries_data = []
        day_start = log.date.replace(hour=0, minute=0, second=0, microsecond=0)
        for entry in log.entries:
            start_offset = (entry.start_time - day_start).total_seconds() / 3600
            end_offset = (entry.end_time - day_start).total_seconds() / 3600
            start_offset = max(0, min(24, start_offset))
            end_offset = max(0, min(24, end_offset))
            entries_data.append({
                'status': entry.status.value,
                'start_time': entry.start_time.isoformat(),
                'end_time': entry.end_time.isoformat(),
                'start_hour': round(start_offset, 4),
                'end_hour': round(end_offset, 4),
                'duration_hours': round(entry.duration_hours, 2),
                'location': entry.location,
                'remarks': entry.remarks,
            })

        totals = log.total_hours_by_status
        logs_data.append({
            'date': log.date.strftime('%Y-%m-%d'),
            'date_display': log.date.strftime('%m/%d/%Y'),
            'entries': entries_data,
            'total_miles': round(log.total_miles, 1),
            'total_hours': {
                'off_duty': round(totals[DutyStatus.OFF_DUTY], 2),
                'sleeper_berth': round(totals[DutyStatus.SLEEPER_BERTH], 2),
                'driving': round(totals[DutyStatus.DRIVING], 2),
                'on_duty_not_driving': round(totals[DutyStatus.ON_DUTY_NOT_DRIVING], 2),
            },
            'hos_summary': {
                'driving_hours': log.driving_hours,
                'on_duty_hours': log.on_duty_hours,
            },
            'remarks': log.remarks,
        })

    all_waypoints_to_pickup = route_to_pickup.get('waypoints', [])
    all_waypoints_to_dropoff = route_to_dropoff.get('waypoints', [])

    # Serialize shifts for compliance display
    shifts_out = []
    for s in shifts_data:
        shifts_out.append({
            'shift_number': s['shift_number'],
            'start_time': s['start_time'].isoformat(),
            'end_time': s['end_time'].isoformat(),
            'driving_hours': s['driving_hours'],
            'on_duty_hours': s['on_duty_hours'],
            'window_hours': s['window_hours'],
            'driving_limit': s['driving_limit'],
            'window_limit': s['window_limit'],
            'driving_ok': s['driving_ok'],
            'window_ok': s['window_ok'],
        })

    # Compute on-duty time breakdown from stops
    driving_hrs = sum(
        log['total_hours']['driving'] for log in logs_data
    )
    pickup_hrs = sum(
        s['duration_hours'] for s in stops_data if s['stop_type'] == 'pickup'
    )
    dropoff_hrs = sum(
        s['duration_hours'] for s in stops_data if s['stop_type'] == 'dropoff'
    )
    fuel_hrs = sum(
        s['duration_hours'] for s in stops_data if s['stop_type'] == 'fuel'
    )
    break_hrs = sum(
        s['duration_hours'] for s in stops_data if s['stop_type'] == 'break'
    )
    reset_hrs = sum(
        s['duration_hours']
        for s in stops_data
        if s['stop_type'] in {'off_duty_reset', 'cycle_restart'}
    )
    total_on_duty = round(driving_hrs + pickup_hrs + dropoff_hrs + fuel_hrs, 2)
    total_off_duty = round(break_hrs + reset_hrs, 2)

    time_breakdown = {
        'driving': round(driving_hrs, 2),
        'pickup': round(pickup_hrs, 2),
        'dropoff': round(dropoff_hrs, 2),
        'fueling': round(fuel_hrs, 2),
        'breaks_30min': round(break_hrs, 2),
        'off_duty_resets': round(reset_hrs, 2),
        'total_on_duty': total_on_duty,
        'total_off_duty': total_off_duty,
        'total_trip_time': round(total_on_duty + total_off_duty, 2),
    }

    return Response({
        'stops': stops_data,
        'daily_logs': logs_data,
        'shifts': shifts_out,
        'cycle_info': cycle_info,
        'time_breakdown': time_breakdown,
        'route': {
            'to_pickup': {
                'waypoints': all_waypoints_to_pickup,
                'distance_miles': round(route_to_pickup['distance_miles'], 1),
                'duration_hours': round(route_to_pickup['duration_hours'], 2),
            },
            'to_dropoff': {
                'waypoints': all_waypoints_to_dropoff,
                'distance_miles': round(route_to_dropoff['distance_miles'], 1),
                'duration_hours': round(route_to_dropoff['duration_hours'], 2),
            },
            'total_distance_miles': round(
                route_to_pickup['distance_miles'] + route_to_dropoff['distance_miles'], 1
            ),
            'total_duration_hours': round(
                route_to_pickup['duration_hours'] + route_to_dropoff['duration_hours'], 2
            ),
        },
        'locations': {
            'current': current_loc,
            'pickup': pickup_loc,
            'dropoff': dropoff_loc,
        },
    })


@api_view(['GET'])
def geocode_search(request):
    query = request.query_params.get('q', '').strip()
    if len(query) < 2:
        return Response([])
    results = geocode_suggestions(query)
    return Response(results)
