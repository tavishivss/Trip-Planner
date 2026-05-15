import signal
from contextlib import contextmanager
from datetime import datetime, timedelta

from django.test import SimpleTestCase

from .hos_engine import DutyStatus, plan_trip


@contextmanager
def bounded_planner_call(seconds=3):
    if not hasattr(signal, 'SIGALRM'):
        yield
        return

    def timeout_handler(_signum, _frame):
        raise TimeoutError('planner timed out')

    previous_handler = signal.signal(signal.SIGALRM, timeout_handler)
    signal.alarm(seconds)
    try:
        yield
    finally:
        signal.alarm(0)
        signal.signal(signal.SIGALRM, previous_handler)


class HOSEngineCycleTests(SimpleTestCase):
    def test_cycle_exhaustion_takes_34_hour_restart(self):
        start_time = datetime(2026, 5, 15, 8)
        current_loc = {'name': 'Current', 'lat': 32.7767, 'lng': -96.7970}
        pickup_loc = {'name': 'Pickup', 'lat': 33.0, 'lng': -97.0}
        dropoff_loc = {'name': 'Dropoff', 'lat': 34.0, 'lng': -98.0}
        route_segments = [
            {'distance_miles': 10, 'duration_hours': 0.2, 'waypoints': []},
            {'distance_miles': 10, 'duration_hours': 0.2, 'waypoints': []},
        ]

        with bounded_planner_call():
            stops, daily_logs, cycle_info, _shifts = plan_trip(
                current_loc=current_loc,
                pickup_loc=pickup_loc,
                dropoff_loc=dropoff_loc,
                current_cycle_used=70,
                route_segments=route_segments,
                start_time=start_time,
            )

        restarts = [stop for stop in stops if stop.stop_type == 'cycle_restart']
        self.assertEqual(len(restarts), 1)
        self.assertEqual(restarts[0].duration_hours, 34)
        self.assertEqual(restarts[0].departure_time, start_time + timedelta(hours=34))

        first_driving = next(
            entry
            for log in daily_logs
            for entry in log.entries
            if entry.status == DutyStatus.DRIVING
        )
        self.assertGreaterEqual(first_driving.start_time, restarts[0].departure_time)

        self.assertEqual(cycle_info['cycle_restarts'], 1)
        self.assertGreater(cycle_info['cycle_added_this_trip'], 0)
        self.assertGreater(cycle_info['cycle_remaining'], 0)
        self.assertLess(cycle_info['cycle_total_used'], 70)
