import { useCallback, useState } from 'react';
import { AlertCircle, CalendarDays, ClipboardList, Fuel, Gauge, Map, Route } from 'lucide-react';
import TripForm from './components/TripForm';
import RouteMap from './components/RouteMap';
import DailyLogSheet from './components/DailyLogSheet';
import TripSummary from './components/TripSummary';
import SplashLoader from './components/SplashLoader';
import TopNav from './components/dashboard/TopNav';
import KpiCard from './components/dashboard/KpiCard';
import TabButton from './components/dashboard/TabButton';
import './App.css';

function getDashboardKpis(tripData) {
  const fuelStops = tripData.stops.filter((stop) => stop.stop_type === 'fuel').length;
  return [
    {
      label: 'Total distance',
      value: tripData.route.total_distance_miles?.toLocaleString() || '0',
      unit: 'mi',
      hint: 'Across pickup and drop-off legs',
      icon: Route,
    },
    {
      label: 'Drive time',
      value: tripData.route.total_duration_hours?.toFixed(1) || '0.0',
      unit: 'hrs',
      hint: 'Estimated wheel time',
      icon: Gauge,
    },
    {
      label: 'Trip length',
      value: tripData.daily_logs.length,
      unit: tripData.daily_logs.length === 1 ? 'day' : 'days',
      hint: 'ELD log sheets',
      icon: CalendarDays,
    },
    {
      label: 'Fuel stops',
      value: fuelStops,
      unit: 'planned',
      hint: `${tripData.stops.length} total route events`,
      icon: Fuel,
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

function DashboardHeader() {
  return (
    <div>
      <div>
        <h2 className="text-xl font-semibold tracking-normal text-slate-950 sm:text-2xl">
          Dispatch route planning
        </h2>
        <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500 sm:text-sm">
        </p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty-state-map flex min-h-[calc(100vh-104px)] flex-col items-center justify-center px-5 py-10 text-center sm:px-8">
      <svg className="mb-5 h-16 w-16 opacity-60" viewBox="0 0 80 80" fill="none" aria-hidden="true">
        <circle cx="40" cy="40" r="36" stroke="#d1d5db" strokeWidth="2" fill="none" />
        <path d="M25 50L40 20L55 50H25Z" stroke="#9ca3af" strokeWidth="2" fill="none" />
        <circle cx="40" cy="55" r="4" stroke="#9ca3af" strokeWidth="2" fill="none" />
        <path d="M30 35h20M35 42h10" stroke="#9ca3af" strokeWidth="1.5" />
      </svg>

      <h2 className="text-2xl font-semibold leading-tight tracking-normal text-slate-950 sm:text-3xl">
        Plan Your Trip
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
         Build compliant routes with intelligent trip planning and automated ELD log generation.
      </p>
    </div>
  );
}

function LogsPanel({ tripData }) {
  return (
    <div className="space-y-6">
      {tripData.daily_logs.map((log, idx) => (
        <DailyLogSheet key={`${log.date_display}-${idx}`} log={log} dayNumber={idx + 1} />
      ))}
    </div>
  );
}

function App() {
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('map');
  const [showSplash, setShowSplash] = useState(true);
  const [mainReady, setMainReady] = useState(false);

  const handleTripSubmit = (data) => {
    setTripData(data);
    setActiveTab('map');
    setError(null);
  };

  const handleSplashExitStart = useCallback(() => {
    setMainReady(true);
  }, []);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  const kpis = tripData ? getDashboardKpis(tripData) : [];

  return (
    <>
      {showSplash && (
        <SplashLoader
          duration={2400}
          onExitStart={handleSplashExitStart}
          onFinish={handleSplashFinish}
        />
      )}

      <div
        className={`min-h-screen bg-app-bg text-slate-950 transition-opacity duration-500 ${
          mainReady ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <TopNav />

        <main className="mx-auto grid max-w-[1760px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[410px_minmax(0,1fr)] lg:px-8">
          <aside className="space-y-5 lg:sticky lg:top-5 lg:h-[calc(100vh-40px)] lg:overflow-y-auto lg:pr-1">
            <TripForm
              onSubmit={handleTripSubmit}
              loading={loading}
              setLoading={setLoading}
              setError={setError}
            />
            <ErrorBanner error={error} />
            {tripData && <TripSummary data={tripData} />}
          </aside>

          <section className="min-w-0 space-y-5">
            {tripData ? (
              <>
                <DashboardHeader />

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {kpis.map((item) => (
                    <KpiCard
                      key={item.label}
                      icon={item.icon}
                      label={item.label}
                      value={item.value}
                      unit={item.unit}
                      hint={item.hint}
                    />
                  ))}
                </div>

                <div className="flex rounded-2xl bg-slate-100 p-1">
                  <TabButton active={activeTab === 'map'} icon={Map} onClick={() => setActiveTab('map')}>
                    Route Map
                  </TabButton>
                  <TabButton active={activeTab === 'logs'} icon={ClipboardList} onClick={() => setActiveTab('logs')}>
                    Daily Logs ({tripData.daily_logs.length})
                  </TabButton>
                </div>

                <div className="transition duration-200">
                  {activeTab === 'map' ? (
                    <RouteMap route={tripData.route} stops={tripData.stops} />
                  ) : (
                    <LogsPanel tripData={tripData} />
                  )}
                </div>
              </>
            ) : (
              <EmptyState />
            )}
          </section>
        </main>
      </div>
    </>
  );
}

export default App;
