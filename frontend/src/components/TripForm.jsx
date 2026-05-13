import { useState, useRef, useCallback } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000';

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

function LocationInput({ label, value, onChange, onSelect, placeholder, icon }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  const fetchSuggestions = useCallback(
    debounce(async (query) => {
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
    <div className="form-field" ref={wrapperRef}>
      <label>{icon} {label}</label>
      <div className="input-wrapper">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
        />
        {loading && <span className="input-spinner" />}
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <ul className="suggestions-list">
          {suggestions.map((s, i) => (
            <li key={i} onMouseDown={() => handleSelect(s)}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="#6b7280">
                <path d="M7 0C4.24 0 2 2.24 2 5c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5zm0 6.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
              </svg>
              <span>{s.name}</span>
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
    <form className="trip-form" onSubmit={handleSubmit}>
      <h2>Trip Details</h2>

      <LocationInput
        label="Current Location"
        value={currentLocation}
        onChange={(v) => { setCurrentLocation(v); setCurrentLocData(null); }}
        onSelect={setCurrentLocData}
        placeholder="e.g. Chicago, IL"
        icon="📍"
      />

      <LocationInput
        label="Pickup Location"
        value={pickupLocation}
        onChange={(v) => { setPickupLocation(v); setPickupLocData(null); }}
        onSelect={setPickupLocData}
        placeholder="e.g. Dallas, TX"
        icon="📦"
      />

      <LocationInput
        label="Drop-off Location"
        value={dropoffLocation}
        onChange={(v) => { setDropoffLocation(v); setDropoffLocData(null); }}
        onSelect={setDropoffLocData}
        placeholder="e.g. Los Angeles, CA"
        icon="🏁"
      />

      <div className="form-field">
        <label>⏱️ Current Cycle Used (Hours)</label>
        <input
          type="number"
          min="0"
          max="70"
          step="0.5"
          value={cycleUsed}
          onChange={(e) => setCycleUsed(e.target.value)}
          placeholder="0 - 70 hours (70hr/8day cycle)"
        />
        <span className="field-hint">Hours already used in the current 70-hour/8-day cycle</span>
      </div>

      <button type="submit" className="submit-btn" disabled={loading}>
        {loading ? (
          <>
            <span className="btn-spinner" />
            Planning Route...
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1 3.5L5.5 1l5 2.5L15 1v11.5l-4.5 2.5-5-2.5L1 15V3.5z" />
            </svg>
            Plan Trip
          </>
        )}
      </button>
    </form>
  );
}
