import { useState } from 'react';
import TripForm from './components/TripForm';
import RouteMap from './components/RouteMap';
import DailyLogSheet from './components/DailyLogSheet';
import TripSummary from './components/TripSummary';
import './App.css';

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

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#1a56db" />
              <path d="M8 20L16 8L24 20H8Z" fill="white" opacity="0.9" />
              <circle cx="16" cy="22" r="3" fill="white" />
            </svg>
            <h1>ELD Trip Planner</h1>
          </div>
          <p className="tagline">HOS-Compliant Route Planning & Electronic Logging</p>
        </div>
      </header>

      <main className="app-main">
        <div className="sidebar">
          <TripForm
            onSubmit={handleTripSubmit}
            loading={loading}
            setLoading={setLoading}
            setError={setError}
          />
          {error && (
            <div className="error-banner">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7 4h2v5H7V4zm0 6h2v2H7v-2z" />
              </svg>
              {error}
            </div>
          )}
          {tripData && <TripSummary data={tripData} />}
        </div>

        <div className="content-area">
          {tripData ? (
            <>
              <div className="tab-bar">
                <button
                  className={`tab ${activeTab === 'map' ? 'active' : ''}`}
                  onClick={() => setActiveTab('map')}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M1 3.5L5.5 1l5 2.5L15 1v11.5l-4.5 2.5-5-2.5L1 15V3.5z" />
                  </svg>
                  Route Map
                </button>
                <button
                  className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
                  onClick={() => setActiveTab('logs')}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M2 2h12v12H2V2zm2 3h8v1H4V5zm0 3h8v1H4V8zm0 3h5v1H4v-1z" />
                  </svg>
                  Daily Logs ({tripData.daily_logs.length})
                </button>
              </div>

              <div className="tab-content">
                {activeTab === 'map' && (
                  <RouteMap
                    route={tripData.route}
                    stops={tripData.stops}
                    locations={tripData.locations}
                  />
                )}
                {activeTab === 'logs' && (
                  <div className="logs-container">
                    {tripData.daily_logs.map((log, idx) => (
                      <DailyLogSheet key={idx} log={log} dayNumber={idx + 1} />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="36" stroke="#d1d5db" strokeWidth="2" fill="none" />
                <path d="M25 50L40 20L55 50H25Z" stroke="#9ca3af" strokeWidth="2" fill="none" />
                <circle cx="40" cy="55" r="4" stroke="#9ca3af" strokeWidth="2" fill="none" />
                <path d="M30 35h20M35 42h10" stroke="#9ca3af" strokeWidth="1.5" />
              </svg>
              <h2>Plan Your Trip</h2>
              <p>Enter your trip details on the left to generate an HOS-compliant route with ELD daily log sheets.</p>
              <div className="features-grid">
                <div className="feature">
                  <strong>Route Planning</strong>
                  <span>Optimized routes with mandatory stops</span>
                </div>
                <div className="feature">
                  <strong>HOS Compliance</strong>
                  <span>11hr drive / 14hr window / 70hr cycle</span>
                </div>
                <div className="feature">
                  <strong>ELD Logs</strong>
                  <span>Auto-generated daily log sheets</span>
                </div>
                <div className="feature">
                  <strong>Fuel Stops</strong>
                  <span>Scheduled every 1,000 miles</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
