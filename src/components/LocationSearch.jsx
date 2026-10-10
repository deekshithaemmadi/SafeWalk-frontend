import { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, X, Loader2, Search } from "lucide-react";
import { geocodeLocation } from "../services/routeService";

export default function LocationSearch({
  id,
  label,
  placeholder,
  value,
  onChange,
  onSelectSuggestion,
  showCurrentLocationButton = false,
  onCurrentLocationSuccess,
  disabled = false,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);
  const [geoError, setGeoError] = useState("");
  const dropdownRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions with debouncing (450ms)
  const handleInputChange = (e) => {
    const newVal = e.target.value;
    onChange(newVal);
    setGeoError("");

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!newVal || newVal.trim().length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        // Use geocoding service (supports backend and direct fallback)
        const results = await geocodeLocation(newVal, { useDirectOsmFallback: true });
        if (Array.isArray(results) && results.length > 0) {
          setSuggestions(results.slice(0, 5));
          setShowDropdown(true);
        } else {
          setSuggestions([]);
          setShowDropdown(false);
        }
      } catch {
        // Silently fail suggestion dropdown without breaking user typing
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 450);
  };

  const handleSelect = (item) => {
    const displayName = item.display_name || item.name;
    onChange(displayName);
    setShowDropdown(false);
    setSuggestions([]);
    if (onSelectSuggestion) {
      onSelectSuggestion(item);
    }
  };

  const handleClear = () => {
    onChange("");
    setSuggestions([]);
    setShowDropdown(false);
    setGeoError("");
  };

  // Browser Geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }

    setLocatingUser(true);
    setGeoError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const formatted = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        onChange(formatted);
        setLocatingUser(false);
        if (onCurrentLocationSuccess) {
          onCurrentLocationSuccess({
            lat: latitude,
            lon: longitude,
            display_name: `My Current Location (${formatted})`,
          });
        }
      },
      (error) => {
        setLocatingUser(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGeoError("Location access was denied. You can still type your location manually.");
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setGeoError("Location information is unavailable. Please type manually.");
        } else {
          setGeoError("Location request timed out. Please enter manually.");
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="location-search-field" ref={dropdownRef}>
      {label && (
        <label htmlFor={id} className="field-label">
          {label}
        </label>
      )}

      <div className="search-input-wrapper">
        <span className="input-leading-icon" aria-hidden="true">
          <MapPin size={18} />
        </span>

        <input
          id={id}
          type="text"
          className="search-text-input"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          disabled={disabled}
          autoComplete="off"
        />

        <div className="input-trailing-actions">
          {loadingSuggestions && (
            <span className="trailing-icon loading-spin" title="Searching places...">
              <Loader2 size={16} />
            </span>
          )}

          {value && !disabled && (
            <button
              type="button"
              className="action-icon-btn"
              onClick={handleClear}
              title="Clear input"
              aria-label="Clear location input"
            >
              <X size={16} />
            </button>
          )}

          {showCurrentLocationButton && (
            <button
              type="button"
              className={`location-btn-chip ${locatingUser ? "loading" : ""}`}
              onClick={handleUseCurrentLocation}
              disabled={disabled || locatingUser}
              title="Use current GPS location"
              aria-label="Use my current location"
            >
              {locatingUser ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Navigation size={14} />
              )}
              <span>GPS</span>
            </button>
          )}
        </div>
      </div>

      {geoError && <p className="field-warning-text">{geoError}</p>}

      {/* Autocomplete Suggestion Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <ul className="suggestions-dropdown" role="listbox">
          {suggestions.map((item, idx) => (
            <li
              key={`${item.place_id || idx}-${item.lat}`}
              className="suggestion-item"
              onClick={() => handleSelect(item)}
              role="option"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSelect(item);
              }}
            >
              <Search size={14} className="suggestion-icon" />
              <div className="suggestion-text">
                <span className="suggestion-main-name">
                  {item.name || item.display_name?.split(",")[0]}
                </span>
                <span className="suggestion-sub-address">{item.display_name}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
