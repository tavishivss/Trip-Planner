import { useEffect } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Clock3, Fuel, MapPin, Moon, Package, Route, Timer, Truck } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const STOP_COLORS = {
  start: '#16a34a',
  pickup: '#2563eb',
  dropoff: '#334155',
  end: '#dc2626',
  break: '#d97706',
  off_duty_reset: '#16a34a',
  fuel: '#b45309',
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
  off_duty_reset: 'R',
  fuel: 'F',
};

const timelineIcons = {
  start: Truck,
  pickup: Package,
  dropoff: MapPin,
  end: MapPin,
  break: Timer,
  off_duty_reset: Moon,
  fuel: Fuel,
};

function createIcon(color, letter) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div class="marker-pin" style="--marker-color: ${color}">
      <span>${letter}</span>
    </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
  });
}

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [48, 48] });
    }
  }, [map, bounds]);
  return null;
}

function formatTime(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
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

function RouteEvents({ stops }) {
  return (
    <section className="dashboard-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Route Events</h2>
          <p className="mt-1 text-sm text-slate-500">{stops.length} scheduled stops and duty events</p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
          <Route size={20} aria-hidden="true" />
        </div>
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        {stops.map((stop, idx) => {
          const Icon = timelineIcons[stop.stop_type] || MapPin;
          const color = STOP_COLORS[stop.stop_type] || '#64748b';
          return (
            <article
              key={`${stop.stop_type}-${stop.arrival_time}-${idx}`}
              className="group rounded-2xl border border-slate-100 bg-slate-50 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-blue-100 hover:bg-white hover:shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-white p-2 shadow-sm" style={{ color }}>
                  <Icon size={17} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-slate-950">
                      {STOP_LABELS[stop.stop_type] || stop.stop_type}
                    </h3>
                    <span className="whitespace-nowrap text-xs text-slate-400">{formatTime(stop.arrival_time)}</span>
                  </div>
                  <p className="mt-1 truncate text-sm text-slate-600">{stop.location}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {stop.duration_hours > 0 && (
                      <span className="status-pill bg-blue-50 text-blue-700">
                        <Clock3 size={13} aria-hidden="true" />
                        <span className="ml-1">{formatDuration(stop.duration_hours)}</span>
                      </span>
                    )}
                    {stop.cumulative_miles > 0 && (
                      <span className="status-pill bg-slate-100 text-slate-600">
                        Mile {stop.cumulative_miles.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default function RouteMap({ route, stops }) {
  const toPickupCoords = (route.to_pickup?.waypoints || []).map(([lng, lat]) => [lat, lng]);
  const toDropoffCoords = (route.to_dropoff?.waypoints || []).map(([lng, lat]) => [lat, lng]);

  const allCoords = [...toPickupCoords, ...toDropoffCoords];
  const bounds = allCoords.length > 0 ? allCoords : [[39.8, -98.5]];

  return (
    <div className="space-y-6">
      <section className="dashboard-card overflow-hidden p-3">
        <div className="relative min-h-[540px] overflow-hidden rounded-[1.25rem] bg-slate-100">
          <MapContainer center={[39.8, -98.5]} zoom={4} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <FitBounds bounds={bounds} />

            {toPickupCoords.length > 1 && (
              <Polyline
                positions={toPickupCoords}
                pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.82 }}
              />
            )}
            {toDropoffCoords.length > 1 && (
              <Polyline
                positions={toDropoffCoords}
                pathOptions={{ color: '#334155', weight: 5, opacity: 0.78 }}
              />
            )}

            {stops.map((stop, idx) => (
              <Marker
                key={`${stop.lat}-${stop.lng}-${idx}`}
                position={[stop.lat, stop.lng]}
                icon={createIcon(
                  STOP_COLORS[stop.stop_type] || '#64748b',
                  STOP_ICONS[stop.stop_type] || '?'
                )}
              >
                <Popup>
                  <div className="min-w-48 font-sans">
                    <strong className="block text-sm font-semibold text-slate-950">
                      {STOP_LABELS[stop.stop_type] || stop.stop_type}
                    </strong>
                    <p className="mt-1 max-w-64 text-xs leading-5 text-slate-600">{stop.location}</p>
                    <p className="mt-2 text-xs text-slate-400">{formatTime(stop.arrival_time)}</p>
                    {stop.duration_hours > 0 && (
                      <p className="mt-1 text-xs text-slate-400">Duration: {formatDuration(stop.duration_hours)}</p>
                    )}
                    {stop.cumulative_miles > 0 && (
                      <p className="mt-1 text-xs text-slate-400">
                        Mile {stop.cumulative_miles.toLocaleString()}
                      </p>
                    )}
                    {stop.remarks && <p className="mt-2 text-xs text-slate-500">{stop.remarks}</p>}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </section>

      <RouteEvents stops={stops} />
    </div>
  );
}
