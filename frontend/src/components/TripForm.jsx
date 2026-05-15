import { useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Flag, LoaderCircle, Map, MapPin, Package, Timer } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '/_/backend');

const locationIcons = {
  current: MapPin,
  pickup: Package,
  dropoff: Flag,
};

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

function FieldLabel({ icon: Icon, children }) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon size={16} strokeWidth={2.1} aria-hidden="true" />
      </span>
      <span>{children}</span>
    </label>
  );
}

function LocationInput({ label, value, onChange, onSelect, placeholder, icon }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);
  const Icon = locationIcons[icon] || MapPin;

  const fetchSuggestions = useMemo(
    () => debounce(async (query) => {
      if (query.length < 3) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        const resp = await axios.get(`${API_BASE}/api/geocode/`, {
          params: { q: query },
        });
        setSuggestions(resp.data);
      } catch {
        setSuggestions([]);
      }
      setLoading(false);
    }, 400),
    []
  );

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val);
    fetchSuggestions(val);
    setShowSuggestions(true);
  };

  const handleSelect = (suggestion) => {
    onChange(suggestion.name);
    onSelect(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div className="relative flex flex-col gap-2" ref={wrapperRef}>
      <FieldLabel icon={Icon}>{label}</FieldLabel>
      <div className="relative">
        <input
          className="field-control pr-11"
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          aria-label={label}
        />
        {loading && (
          <LoaderCircle
            className="absolute right-4 top-1/2 -mt-2 animate-spin text-blue-600"
            size={16}
            aria-hidden="true"
          />
        )}
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-30 mt-2 max-h-60 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl shadow-slate-900/10">
          {suggestions.map((s, i) => (
            <li key={`${s.name}-${i}`}>
              <button
                type="button"
                onMouseDown={() => handleSelect(s)}
                className="city-suggestion flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-600 transition"
              >
                <MapPin className="mt-0.5 shrink-0 text-slate-400" size={15} aria-hidden="true" />
                <span className="leading-5">{s.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function TripForm({ onSubmit, loading, setLoading, setError }) {
  const [currentLocation, setCurrentLocation] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [cycleUsed, setCycleUsed] = useState('');

  const [currentLocData, setCurrentLocData] = useState(null);
  const [pickupLocData, setPickupLocData] = useState(null);
  const [dropoffLocData, setDropoffLocData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!currentLocation || !pickupLocation || !dropoffLocation) {
      setError('Please fill in all location fields');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        current_location: currentLocation,
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation,
        current_cycle_used: parseFloat(cycleUsed) || 0,
      };

      if (currentLocData) payload.current_loc_data = currentLocData;
      if (pickupLocData) payload.pickup_loc_data = pickupLocData;
      if (dropoffLocData) payload.dropoff_loc_data = dropoffLocData;

      const resp = await axios.post(`${API_BASE}/api/plan-trip/`, payload);
      onSubmit(resp.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to plan trip. Please try again.');
    }
    setLoading(false);
  };

  return (
    <form className="dashboard-card p-5 sm:p-6" onSubmit={handleSubmit}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Trip Details</h2>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <LocationInput
          label="Current location"
          value={currentLocation}
          onChange={(v) => { setCurrentLocation(v); setCurrentLocData(null); }}
          onSelect={setCurrentLocData}
          placeholder="e.g. Chicago, IL"
          icon="current"
        />

        <LocationInput
          label="Pickup location"
          value={pickupLocation}
          onChange={(v) => { setPickupLocation(v); setPickupLocData(null); }}
          onSelect={setPickupLocData}
          placeholder="e.g. Dallas, TX"
          icon="pickup"
        />

        <LocationInput
          label="Drop-off location"
          value={dropoffLocation}
          onChange={(v) => { setDropoffLocation(v); setDropoffLocData(null); }}
          onSelect={setDropoffLocData}
          placeholder="e.g. Los Angeles, CA"
          icon="dropoff"
        />

        <div className="flex flex-col gap-2">
          <FieldLabel icon={Timer}>Current cycle used</FieldLabel>
          <input
            className="field-control"
            type="number"
            min="0"
            max="70"
            step="0.5"
            value={cycleUsed}
            onChange={(e) => setCycleUsed(e.target.value)}
            placeholder="0 - 70 hours"
            aria-label="Current cycle used in hours"
          />
          <p className="text-xs leading-5 text-slate-400">
            Hours already used in the current 70-hour / 8-day cycle.
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-600/25 disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none"
      >
        {loading ? (
          <>
            <LoaderCircle className="animate-spin" size={17} aria-hidden="true" />
            Planning route
          </>
        ) : (
          <>
            <Map size={17} aria-hidden="true" />
            Plan
          </>
        )}
      </button>
    </form>
  );
}
