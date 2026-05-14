export default function TripSummary({ data }) {
  const { route, stops, daily_logs, cycle_info, shifts, time_breakdown } = data;

  const breakStops = stops.filter((s) => s.stop_type === 'break');
  const resetStops = stops.filter((s) => s.stop_type === 'off_duty_reset');

  return (
    <div className="trip-summary">
      <h3>Trip Summary</h3>

      <div className="summary-grid">
        <div className="summary-item">
          <span className="summary-label">Total Distance</span>
          <span className="summary-value">{route.total_distance_miles?.toLocaleString()} mi</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Est. Drive Time</span>
          <span className="summary-value">{route.total_duration_hours?.toFixed(1)} hrs</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Total Days</span>
          <span className="summary-value">{daily_logs.length}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Total Stops</span>
          <span className="summary-value">{stops.length}</span>
        </div>
      </div>

      {/* Detailed Time Breakdown */}
      {time_breakdown && (
        <div className="time-breakdown">
          <h4>On-Duty Time Breakdown</h4>
          <div className="breakdown-rows">
            <div className="breakdown-row">
              <span className="breakdown-dot driving" />
              <span className="breakdown-label">Driving</span>
              <span className="breakdown-value">{time_breakdown.driving} hrs</span>
            </div>
            <div className="breakdown-row">
              <span className="breakdown-dot pickup" />
              <span className="breakdown-label">Pickup (loading)</span>
              <span className="breakdown-value">{time_breakdown.pickup} hrs</span>
            </div>
            <div className="breakdown-row">
              <span className="breakdown-dot dropoff" />
              <span className="breakdown-label">Drop-off (unloading)</span>
              <span className="breakdown-value">{time_breakdown.dropoff} hrs</span>
            </div>
            <div className="breakdown-row">
              <span className="breakdown-dot fuel" />
              <span className="breakdown-label">Fueling</span>
              <span className="breakdown-value">{time_breakdown.fueling} hrs</span>
            </div>
            <div className="breakdown-row total">
              <span className="breakdown-dot on-duty" />
              <span className="breakdown-label">Total On-Duty</span>
              <span className="breakdown-value">{time_breakdown.total_on_duty} hrs</span>
            </div>
          </div>
          <div className="breakdown-rows" style={{ marginTop: '8px' }}>
            <div className="breakdown-row">
              <span className="breakdown-dot break" />
              <span className="breakdown-label">30-min Breaks ({breakStops.length})</span>
              <span className="breakdown-value">{time_breakdown.breaks_30min} hrs</span>
            </div>
            <div className="breakdown-row">
              <span className="breakdown-dot reset" />
              <span className="breakdown-label">Off-Duty Resets ({resetStops.length})</span>
              <span className="breakdown-value">{time_breakdown.off_duty_resets} hrs</span>
            </div>
            <div className="breakdown-row total">
              <span className="breakdown-dot off-duty" />
              <span className="breakdown-label">Total Off-Duty</span>
              <span className="breakdown-value">{time_breakdown.total_off_duty} hrs</span>
            </div>
          </div>
        </div>
      )}

      {/* 70hr/8day Cycle Tracking */}
      {cycle_info && (
        <div className="cycle-tracker">
          <h4>70-Hour / 8-Day Cycle</h4>
          <div className="cycle-bar-wrapper">
            <div className="cycle-bar">
              <div
                className="cycle-bar-prior"
                style={{ width: `${(cycle_info.cycle_start_used / cycle_info.cycle_limit) * 100}%` }}
              />
              <div
                className="cycle-bar-trip"
                style={{ width: `${(cycle_info.cycle_added_this_trip / cycle_info.cycle_limit) * 100}%` }}
              />
            </div>
            <div className="cycle-labels">
              <span>0h</span>
              <span>{cycle_info.cycle_limit}h</span>
            </div>
          </div>
          <div className="cycle-details">
            <div className="cycle-detail">
              <span className="cycle-dot prior" />
              <span>Prior: {cycle_info.cycle_start_used}h</span>
            </div>
            <div className="cycle-detail">
              <span className="cycle-dot trip" />
              <span>This trip: {cycle_info.cycle_added_this_trip}h</span>
            </div>
            <div className="cycle-detail">
              <span className="cycle-dot remaining" />
              <span>Remaining: {cycle_info.cycle_remaining}h</span>
            </div>
          </div>
        </div>
      )}

      {/* Per-Shift HOS Compliance */}
      {shifts && shifts.length > 0 && (
        <div className="day-breakdown">
          <h4>Per-Shift HOS Compliance</h4>
          {shifts.map((shift, idx) => {
            const dPct = Math.min(100, (shift.driving_hours / shift.driving_limit) * 100);
            const wPct = Math.min(100, (shift.window_hours / shift.window_limit) * 100);
            return (
              <div key={idx} className="day-row">
                <span className="day-label">
                  Shift {shift.shift_number}
                </span>
                <div className="day-bars">
                  <div className="day-bar-group">
                    <span className={`bar-label ${shift.driving_ok ? 'ok' : 'alert'}`}>
                      Drive {shift.driving_hours}/{shift.driving_limit}h
                      {shift.driving_ok ? ' \u2713' : ' \u2717'}
                    </span>
                    <div className="mini-bar">
                      <div className="mini-bar-fill driving" style={{ width: `${dPct}%` }} />
                    </div>
                  </div>
                  <div className="day-bar-group">
                    <span className={`bar-label ${shift.window_ok ? 'ok' : 'alert'}`}>
                      Window {shift.window_hours}/{shift.window_limit}h
                      {shift.window_ok ? ' \u2713' : ' \u2717'}
                    </span>
                    <div className="mini-bar">
                      <div className="mini-bar-fill on-duty" style={{ width: `${wPct}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="route-legs">
        <div className="leg">
          <div className="leg-color pickup" />
          <div className="leg-info">
            <span className="leg-label">To Pickup</span>
            <span className="leg-detail">
              {route.to_pickup?.distance_miles?.toLocaleString()} mi &middot; {route.to_pickup?.duration_hours?.toFixed(1)} hrs
            </span>
          </div>
        </div>
        <div className="leg">
          <div className="leg-color dropoff" />
          <div className="leg-info">
            <span className="leg-label">To Drop-off</span>
            <span className="leg-detail">
              {route.to_dropoff?.distance_miles?.toLocaleString()} mi &middot; {route.to_dropoff?.duration_hours?.toFixed(1)} hrs
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
