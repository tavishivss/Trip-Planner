import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const STOP_COLORS = {
  start: '#10b981',
  pickup: '#3b82f6',
  dropoff: '#8b5cf6',
  end: '#ef4444',
  break: '#eab308',
  off_duty_reset: '#f59e0b',
  fuel: '#f97316',
};

const STOP_LABELS = {
  start: 'Start',
  pickup: 'Pickup',
  dropoff: 'Drop-off',
  end: 'End',
  break: '30-min Break',
  off_duty_reset: '10-hr Off-Duty',
  fuel: 'Fuel',
};

const STOP_ICONS = {
  start: 'S',
  pickup: 'P',
  dropoff: 'D',
  end: 'E',
  break: 'B',
  off_duty_reset: 'Z',
  fuel: 'F',
};

function createIcon(color, letter) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background: ${color};
      width: 28px; height: 28px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
    ">
      <span style="transform: rotate(45deg); color: white; font-size: 10px; font-weight: 700;">
        ${letter}
      </span>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, bounds]);
  return null;
}

function formatTime(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
    hour12: true,
  });
}

function formatDuration(hours) {
  if (hours >= 1) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${Math.round(hours * 60)}m`;
}

export default function RouteMap({ route, stops, locations }) {
  const toPickupCoords = (route.to_pickup?.waypoints || []).map(([lng, lat]) => [lat, lng]);
  const toDropoffCoords = (route.to_dropoff?.waypoints || []).map(([lng, lat]) => [lat, lng]);

  const allCoords = [...toPickupCoords, ...toDropoffCoords];
  const bounds = allCoords.length > 0 ? allCoords : [[39.8, -98.5]];

  const breakCount = stops.filter(s => s.stop_type === 'break').length;
  const resetCount = stops.filter(s => s.stop_type === 'off_duty_reset').length;
  const fuelCount = stops.filter(s => s.stop_type === 'fuel').length;

  return (
    <div className="map-wrapper">
      <div className="map-info-bar">
        <div className="map-stat">
          <span className="stat-label">Total Distance</span>
          <span className="stat-value">{route.total_distance_miles?.toLocaleString()} mi</span>
        </div>
        <div className="map-stat">
          <span className="stat-label">Est. Drive Time</span>
          <span className="stat-value">{route.total_duration_hours?.toFixed(1)} hrs</span>
        </div>
        <div className="map-stat">
          <span className="stat-label">30-min Breaks</span>
          <span className="stat-value">{breakCount}</span>
        </div>
        <div className="map-stat">
          <span className="stat-label">Off-Duty Resets</span>
          <span className="stat-value">{resetCount}</span>
        </div>
        <div className="map-stat">
          <span className="stat-label">Fuel Stops</span>
          <span className="stat-value">{fuelCount}</span>
        </div>
      </div>

      <MapContainer
        center={[39.8, -98.5]}
        zoom={4}
        style={{ height: '100%', width: '100%', borderRadius: '0 0 12px 12px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds bounds={bounds} />

        {toPickupCoords.length > 1 && (
          <Polyline
            positions={toPickupCoords}
            pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.8 }}
          />
        )}
        {toDropoffCoords.length > 1 && (
          <Polyline
            positions={toDropoffCoords}
            pathOptions={{ color: '#8b5cf6', weight: 4, opacity: 0.8 }}
          />
        )}

        {stops.map((stop, idx) => (
          <Marker
            key={idx}
            position={[stop.lat, stop.lng]}
            icon={createIcon(
              STOP_COLORS[stop.stop_type] || '#6b7280',
              STOP_ICONS[stop.stop_type] || '?'
            )}
          >
            <Popup>
              <div className="popup-content">
                <strong>{STOP_LABELS[stop.stop_type] || stop.stop_type}</strong>
                <p className="popup-location">{stop.location}</p>
                <p className="popup-time">{formatTime(stop.arrival_time)}</p>
                {stop.duration_hours > 0 && (
                  <p className="popup-duration">Duration: {formatDuration(stop.duration_hours)}</p>
                )}
                {stop.cumulative_miles > 0 && (
                  <p className="popup-miles">Mile {stop.cumulative_miles.toLocaleString()}</p>
                )}
                {stop.remarks && <p className="popup-remarks">{stop.remarks}</p>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="stops-timeline">
        <h3>Route Events</h3>
        <div className="timeline">
          {stops.map((stop, idx) => (
            <div key={idx} className={`timeline-item ${stop.stop_type}`}>
              <div
                className="timeline-dot"
                style={{ background: STOP_COLORS[stop.stop_type] || '#6b7280' }}
              />
              <div className="timeline-content">
                <div className="timeline-header">
                  <span className="timeline-type" style={{ color: STOP_COLORS[stop.stop_type] || '#6b7280' }}>
                    {STOP_LABELS[stop.stop_type] || stop.stop_type}
                  </span>
                  <span className="timeline-time">{formatTime(stop.arrival_time)}</span>
                </div>
                <p className="timeline-location">{stop.location}</p>
                <div className="timeline-meta">
                  {stop.duration_hours > 0 && (
                    <span className="timeline-duration">{formatDuration(stop.duration_hours)}</span>
                  )}
                  {stop.cumulative_miles > 0 && (
                    <span className="timeline-miles">
                      Mile {stop.cumulative_miles.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
