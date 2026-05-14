import { useState } from 'react';
import { AlertCircle, ClipboardList, Clock3, Fuel, Map, Route, Timer } from 'lucide-react';
import TripForm from './components/TripForm';
import RouteMap from './components/RouteMap';
import DailyLogSheet from './components/DailyLogSheet';
import TripSummary from './components/TripSummary';
import TopNav from './components/dashboard/TopNav';
import KpiCard from './components/dashboard/KpiCard';
import TabButton from './components/dashboard/TabButton';
import { EmptyRoutePreview, PreviewEvents, PreviewLogs, SidebarPreview } from './components/dashboard/PreviewDashboard';
import { demoKpis } from './data/demoTrip';
import './App.css';

function getDashboardKpis(tripData) {
  if (!tripData) {
    const icons = [Route, Clock3, Timer, Fuel];
    const tones = ['blue', 'slate', 'emerald', 'amber'];
    return demoKpis.map((item, index) => ({
      ...item,
      icon: icons[index],
      tone: tones[index],
      hint: item.trend,
    }));
  }

  const fuelStops = tripData.stops.filter((stop) => stop.stop_type === 'fuel').length;
  return [
    {
      label: 'Total distance',
      value: tripData.route.total_distance_miles?.toLocaleString() || '0',
      unit: 'mi',
      hint: 'Calculated across pickup and drop-off legs',
      icon: Route,
      tone: 'blue',
    },
    {
      label: 'Drive time',
      value: tripData.route.total_duration_hours?.toFixed(1) || '0.0',
      unit: 'hrs',
      hint: 'Estimated wheel time',
      icon: Clock3,
      tone: 'slate',
    },
    {
      label: 'Trip length',
      value: tripData.daily_logs.length,
      unit: tripData.daily_logs.length === 1 ? 'day' : 'days',
      hint: 'Generated ELD log sheets',
      icon: Timer,
      tone: 'emerald',
    },
    {
      label: 'Fuel stops',
      value: fuelStops,
      unit: 'planned',
      hint: `${tripData.stops.length} total route events`,
      icon: Fuel,
      tone: 'amber',
    },
  ];
}

function ErrorBanner({ error }) {
  if (!error) return null;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
      <AlertCircle className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
      <span>{error}</span>
    </div>
  );
}

function DashboardHeader({ tripData }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
          <Route size={14} aria-hidden="true" />
          Logistics SaaS dashboard
        </div>
        <h2 className="text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">
          Dispatch route planning
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Plan HOS-compliant long-haul routes, validate drive windows, and review route events from one clean workspace.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="status-pill bg-white text-slate-600 ring-1 ring-slate-200">
          Desktop optimized
        </span>
        <span className="status-pill bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
          {tripData ? 'Route generated' : 'Ready to plan'}
        </span>
      </div>
    </div>
  );
}

function LogsPanel({ tripData }) {
  if (!tripData) {
    return <PreviewLogs />;
  }

  return (
    <div className="space-y-6">
      {tripData.daily_logs.map((log, idx) => (
        <DailyLogSheet key={`${log.date_display}-${idx}`} log={log} dayNumber={idx + 1} />
      ))}
    </div>
  );
}

function MapPanel({ tripData }) {
  if (!tripData) {
    return (
      <div className="space-y-6">
        <EmptyRoutePreview />
        <PreviewEvents />
      </div>
    );
  }

  return <RouteMap route={tripData.route} stops={tripData.stops} />;
}

function App() {
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('map');

  const handleTripSubmit = (data) => {
    setTripData(data);
    setActiveTab('map');
    setError(null);
  };

  const kpis = getDashboardKpis(tripData);

  return (
    <div className="min-h-screen bg-app-bg text-slate-950">
      <TopNav />

      <main className="mx-auto grid max-w-[1760px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[410px_minmax(0,1fr)] lg:px-8">
        <aside className="space-y-5 lg:sticky lg:top-[84px] lg:h-[calc(100vh-108px)] lg:overflow-y-auto lg:pr-1">
          <TripForm
            onSubmit={handleTripSubmit}
            loading={loading}
            setLoading={setLoading}
            setError={setError}
          />
          <ErrorBanner error={error} />
          {tripData ? <TripSummary data={tripData} /> : <SidebarPreview />}
        </aside>

        <section className="min-w-0 space-y-6">
          <DashboardHeader tripData={tripData} />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((item) => (
              <KpiCard
                key={item.label}
                icon={item.icon}
                label={item.label}
                value={item.value}
                unit={item.unit}
                hint={item.hint}
                tone={item.tone}
              />
            ))}
          </div>

          <div className="flex rounded-2xl bg-slate-100 p-1">
            <TabButton active={activeTab === 'map'} icon={Map} onClick={() => setActiveTab('map')}>
              Route Map
            </TabButton>
            <TabButton active={activeTab === 'logs'} icon={ClipboardList} onClick={() => setActiveTab('logs')}>
              Daily Logs {tripData ? `(${tripData.daily_logs.length})` : ''}
            </TabButton>
          </div>

          <div className="transition duration-200">
            {activeTab === 'map' ? <MapPanel tripData={tripData} /> : <LogsPanel tripData={tripData} />}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
