import React, { useState, useEffect, useRef } from "react";
import {
  parsePhoneNumberFromString,
  AsYouType,
} from "libphonenumber-js";
import * as FlagIcons from "country-flag-icons/react/3x2";
import { COUNTRIES, DEFAULT_COUNTRY, findCountryByCode } from "../../data/countries";

/**
 * Pure SVG graphical country flag component
 * Renders official vector flags on all platforms (including Windows).
 */
export const CountryFlag = ({ code, title, className = "" }) => {
  const iso = String(code || "").toUpperCase();
  const FlagComponent = FlagIcons[iso];

  if (FlagComponent) {
    return (
      <span className={`intl-country-flag-badge ${className}`}>
        <FlagComponent title={title || iso} className="intl-country-flag-svg" />
      </span>
    );
  }

  // Graceful fallback to high-resolution CDN vector / image
  return (
    <span className={`intl-country-flag-badge ${className}`}>
      <img
        src={`https://flagcdn.com/w40/${iso.toLowerCase()}.png`}
        srcSet={`https://flagcdn.com/w80/${iso.toLowerCase()}.png 2x`}
        alt={title || iso}
        className="intl-country-flag-svg"
        loading="lazy"
      />
    </span>
  );
};

export const InternationalPhoneInput = ({
  value = "",
  onChange,
  onValidationChange,
  required = true,
  hasSubmitted = false,
}) => {
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const [nationalNumber, setNationalNumber] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [touched, setTouched] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Initialize from external value if passed
  useEffect(() => {
    if (value && value.startsWith("+")) {
      try {
        const parsed = parsePhoneNumberFromString(value);
        if (parsed) {
          if (parsed.country) {
            const countryMatch = findCountryByCode(parsed.country);
            if (countryMatch) setSelectedCountry(countryMatch);
          }
          setNationalNumber(parsed.formatNational());
          setIsValid(parsed.isValid());
        }
      } catch {
        // keep fallback
      }
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isDropdownOpen]);

  // Validation engine
  const validateNumber = (rawDigits, country) => {
    if (!rawDigits.trim()) {
      if (required) {
        return { valid: false, error: "Le numéro de téléphone est requis.", full: "" };
      }
      return { valid: true, error: "", full: "" };
    }

    const cleanInput = rawDigits.trim();
    // Combine dial code with national number
    const fullNumberString = `${country.dialCode}${cleanInput.replace(/^0+/, "")}`;

    try {
      const parsed = parsePhoneNumberFromString(fullNumberString, country.code);

      if (!parsed) {
        return {
          valid: false,
          error: `Format invalide pour ${country.name} (ex: ${country.placeholder}).`,
          full: fullNumberString,
        };
      }

      if (!parsed.isPossible()) {
        const length = cleanInput.replace(/\D/g, "").length;
        if (length < 6) {
          return {
            valid: false,
            error: `Numéro trop court pour ${country.name}.`,
            full: fullNumberString,
          };
        }
        return {
          valid: false,
          error: `Numéro trop long ou invalide pour ${country.name}.`,
          full: fullNumberString,
        };
      }

      if (!parsed.isValid()) {
        return {
          valid: false,
          error: `Numéro non reconnu pour ${country.name} (ex: ${country.placeholder}).`,
          full: fullNumberString,
        };
      }

      return {
        valid: true,
        error: "",
        full: parsed.format("E.164"),
      };
    } catch {
      return {
        valid: false,
        error: `Numéro invalide pour ${country.name}.`,
        full: fullNumberString,
      };
    }
  };

  const handleNumberChange = (e) => {
    const rawVal = e.target.value;
    // Format on the fly with AsYouType
    const asYouType = new AsYouType(selectedCountry.code);
    const formatted = asYouType.input(rawVal);
    setNationalNumber(formatted);
    setTouched(true);

    const { valid, error, full } = validateNumber(rawVal, selectedCountry);
    setIsValid(valid);
    setErrorMsg(error);

    if (onChange) {
      onChange(valid ? full : "");
    }
    if (onValidationChange) {
      onValidationChange(valid);
    }
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    setCountrySearch("");

    // Re-validate current input with new country
    const { valid, error, full } = validateNumber(nationalNumber, country);
    setIsValid(valid);
    setErrorMsg(error);

    if (onChange) {
      onChange(valid ? full : "");
    }
    if (onValidationChange) {
      onValidationChange(valid);
    }
  };

  // Filter countries by search query
  const filteredCountries = COUNTRIES.filter((c) => {
    const q = countrySearch.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.dialCode.includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  });

  const shouldShowError = (hasSubmitted || touched) && !isValid && (required || nationalNumber.trim().length > 0);

  return (
    <div className="intl-phone-container" ref={containerRef}>
      <div className={`intl-phone-wrapper ${shouldShowError ? "is-invalid" : ""} ${isValid ? "is-valid" : ""}`}>
        {/* Country Selector Trigger */}
        <button
          type="button"
          className="intl-country-btn"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          aria-haspopup="listbox"
          aria-expanded={isDropdownOpen}
          title={`${selectedCountry.name} (${selectedCountry.dialCode})`}
        >
          <CountryFlag code={selectedCountry.code} title={selectedCountry.name} />
          <span className="intl-country-prefix">{selectedCountry.dialCode}</span>
          <svg className="intl-chevron" viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* National Number Input */}
        <input
          className="intl-number-input"
          type="tel"
          placeholder={selectedCountry.placeholder}
          value={nationalNumber}
          onChange={handleNumberChange}
          onBlur={() => setTouched(true)}
          required={required}
          autoComplete="tel-national"
        />

        {/* Right Status Indicator */}
        <div className="intl-status-icon">
          {isValid ? (
            <svg className="intl-check-icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clipRule="evenodd"
              />
            </svg>
          ) : nationalNumber.trim().length > 0 ? (
            <button
              type="button"
              className="intl-clear-btn"
              onClick={() => {
                setNationalNumber("");
                setIsValid(false);
                setErrorMsg("");
                if (onChange) onChange("");
                if (onValidationChange) onValidationChange(false);
              }}
              title="Effacer"
            >
              ×
            </button>
          ) : null}
        </div>
      </div>

      {/* Country Dropdown Popover */}
      {isDropdownOpen && (
        <div className="intl-country-dropdown" role="listbox">
          <div className="intl-search-box">
            <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                clipRule="evenodd"
              />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              className="intl-search-input"
              placeholder="Rechercher un pays, indicatif..."
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
            />
            {countrySearch && (
              <button
                type="button"
                className="intl-search-clear"
                onClick={() => setCountrySearch("")}
              >
                ×
              </button>
            )}
          </div>

          <div className="intl-country-list">
            {filteredCountries.length === 0 ? (
              <div className="intl-no-country">Aucun pays trouvé</div>
            ) : (
              filteredCountries.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  className={`intl-country-option ${c.code === selectedCountry.code ? "is-selected" : ""}`}
                  onClick={() => handleCountrySelect(c)}
                >
                  <CountryFlag code={c.code} title={c.name} />
                  <span className="intl-option-name">{c.name}</span>
                  <span className="intl-option-code">{c.dialCode}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {shouldShowError && errorMsg && (
        <p className="intl-error-msg">{errorMsg}</p>
      )}
    </div>
  );
};
