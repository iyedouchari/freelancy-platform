import React, { useState, useEffect, useRef } from "react";
import { searchFallbackCities, rankLocations } from "../../data/citiesFallback";

export const formatLocationLabel = (city, state, country) => {
  const parts = [];
  const c = String(city || "").trim();
  const s = String(state || "").trim();
  const co = String(country || "").trim();

  if (c) parts.push(c);

  // Add state/region if informative (not "Pays", and not redundant with city or country)
  if (
    s &&
    s.toLowerCase() !== "pays" &&
    !c.toLowerCase().includes(s.toLowerCase()) &&
    !s.toLowerCase().includes(c.toLowerCase()) &&
    !co.toLowerCase().includes(s.toLowerCase())
  ) {
    parts.push(s);
  }

  // Add country if not identical to city (prevents "Allemagne, Allemagne")
  if (co && co.toLowerCase() !== c.toLowerCase()) {
    parts.push(co);
  }

  return parts.join(", ");
};

export const LocationAutocomplete = ({
  value = "",
  onChange,
  onValidationChange,
  required = true,
  hasSubmitted = false,
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSelected, setIsSelected] = useState(Boolean(value));
  const [activeIndex, setActiveIndex] = useState(-1);
  const [touched, setTouched] = useState(false);

  const containerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Sync external value changes
  useEffect(() => {
    if (value !== query) {
      setQuery(value || "");
      setIsSelected(Boolean(value));
    }
  }, [value]);

  // Notify parent of validity state
  useEffect(() => {
    const isValid = (isSelected || query.trim().length >= 3) && query.trim().length > 0;
    if (onValidationChange) {
      onValidationChange(isValid);
    }
  }, [isSelected, query, onValidationChange]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        if (!isSelected && query.trim().length > 0) {
          setTouched(true);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSelected, query]);

  // Fetch places from instant fallback + global Photon OSM API
  const fetchPlaces = async (text = "") => {
    const trimmed = String(text || "").trim();

    // 1. Instant local results (instant response, full coverage of all 24 Tunisian governorates + major global cities)
    const localMatches = searchFallbackCities(trimmed).map((item) => ({
      id: `local-${item.city}-${item.state || ""}-${item.country}`,
      city: item.city,
      state: item.state || "",
      country: item.country,
      isGovernorate: Boolean(item.isGovernorate),
      isCountry: Boolean(item.isCountry),
      label: formatLocationLabel(item.city, item.state, item.country),
    }));

    if (localMatches.length > 0) {
      setSuggestions(localMatches);
      setIsOpen(true);
    }

    if (trimmed.length < 2) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // 2. OpenStreetMap Photon API (free, worldwide coverage, supports all cities & administrative regions)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&lang=fr&limit=15`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const apiPlaces = (data.features || [])
          .filter((f) => {
            const props = f.properties || {};
            const type = String(props.type || "").toLowerCase();
            const osmVal = String(props.osm_value || "").toLowerCase();

            // Exclude rural hamlets, tiny localities, farms, isolated dwellings, street segments, houses, and stops
            const isExcluded = [
              "hamlet", "isolated_dwelling", "farm", "allotments", "residential",
              "street", "house", "building", "motorway", "service", "cycleway",
              "footway", "path", "track", "bus_stop", "stop", "platform", "locality"
            ].includes(type) || [
              "hamlet", "isolated_dwelling", "farm", "allotments", "residential",
              "street", "house", "building", "motorway", "service", "cycleway",
              "footway", "path", "track", "bus_stop", "stop", "platform", "locality"
            ].includes(osmVal);

            return props.name && props.country && !isExcluded;
          })
          .map((f) => {
            const p = f.properties;
            const city = p.name;
            const country = p.country;
            const state = p.state || p.county || p.district || "";
            return {
              id: `osm-${p.osm_id || Math.random()}`,
              city,
              state,
              country,
              label: formatLocationLabel(city, state, country),
            };
          });

        // Classement et déduplication unifiés selon la pertinence
        const combined = rankLocations([...localMatches, ...apiPlaces], trimmed);

        if (combined.length > 0) {
          setSuggestions(
            combined.slice(0, 24).map((item) => ({
              ...item,
              id: item.id || `loc-${item.city}-${item.country}`,
              label: item.label || formatLocationLabel(item.city, item.state, item.country),
            }))
          );
          setIsOpen(true);
        }
      }
    } catch {
      // Graceful fallback to local matches
      if (localMatches.length > 0) {
        setSuggestions(localMatches);
        setIsOpen(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setIsSelected(false);
    setActiveIndex(-1);
    setTouched(true);

    if (onChange) {
      onChange(val);
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim().length >= 1) {
      debounceTimerRef.current = setTimeout(() => {
        fetchPlaces(val);
      }, 200);
    } else {
      fetchPlaces("");
    }
  };

  const handleSelect = (place) => {
    const formatted = place.label;
    setQuery(formatted);
    setIsSelected(true);
    setIsOpen(false);
    setSuggestions([]);
    setActiveIndex(-1);

    if (onChange) {
      onChange(formatted);
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const showError = (hasSubmitted || touched) && !query.trim();

  return (
    <div className="location-autocomplete-container" ref={containerRef}>
      <div className="location-input-wrapper">
        <input
          className={`auth-input location-input ${showError ? "is-invalid" : ""} ${isSelected ? "is-valid" : ""}`}
          type="text"
          name="locationSearchField"
          placeholder="Ville, Gouvernorat, Pays"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (!isSelected) {
              fetchPlaces(query);
            }
          }}
          onKeyDown={handleKeyDown}
          required={required}
          autoComplete="one-time-code"
          autoCorrect="off"
          spellCheck={false}
        />

        {/* Right Status Indicator */}
        <div className="location-status-icon">
          {isLoading ? (
            <span className="location-spinner" />
          ) : isSelected ? (
            <svg className="location-check-icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clipRule="evenodd"
              />
            </svg>
          ) : query.trim().length > 0 ? (
            <button
              type="button"
              className="location-clear-btn"
              onClick={() => {
                setQuery("");
                setIsSelected(false);
                setSuggestions([]);
                if (onChange) onChange("");
              }}
              title="Effacer"
            >
              ×
            </button>
          ) : null}
        </div>
      </div>

      {/* Dropdown list with Governorates / Regions clearly displayed */}
      {isOpen && suggestions.length > 0 && (
        <ul className="location-dropdown" role="listbox">
          {suggestions.map((item, index) => (
            <li
              key={item.id}
              role="option"
              aria-selected={index === activeIndex}
              className={`location-item ${index === activeIndex ? "is-active" : ""}`}
              onClick={() => handleSelect(item)}
            >
              <div className="location-item-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
              </div>
              <div className="location-item-text">
                <div className="location-item-title-row">
                  <strong className="location-item-city">{item.city}</strong>
                  {item.state && (
                    <span className="location-item-gov-badge">{item.state}</span>
                  )}
                </div>
                <span className="location-item-country">{item.country}</span>
              </div>
              <span className="location-item-badge">Sélectionner</span>
            </li>
          ))}
        </ul>
      )}

      {/* Validation Message */}
      {showError && (
        <p className="location-error-msg">
          Veuillez renseigner votre localisation (ville, gouvernorat/région, pays).
        </p>
      )}
    </div>
  );
};
