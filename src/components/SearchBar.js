import React, { useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE } from "../config";

function pickLabel(place) {
  if (!place) return "";
  if (place.formatted_address) return place.formatted_address;
  if (place.name && place.vicinity) return `${place.name}, ${place.vicinity}`;
  return place.name || "";
}

export default function SearchBar({ map, setDealers, onLocationResolved }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (!window.google || !window.google.maps || !inputRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      { fields: ["geometry", "formatted_address", "name", "vicinity"] }
    );

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry?.location) return;

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const label = pickLabel(place);

      onLocationResolved?.({ lat, lng, label });

      if (map) {
        map.panTo({ lat, lng });
        map.setZoom?.(12);
      }

      axios
        .get(`${API_BASE}/api/dealers`, { params: { lat, lng } })
        .then((res) =>
          setDealers(Array.isArray(res.data) ? res.data : [])
        )
        .catch((err) => console.error("Error fetching dealers:", err));
    });

    return () => {
      window.google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [map, setDealers, onLocationResolved]);

  return (
    <div className="search-box">
      <span className="search-icon" aria-hidden>
        📍
      </span>
      <input
        ref={inputRef}
        type="text"
        placeholder="City, ZIP code, or neighborhood"
        className="search-input"
        autoComplete="street-address"
        aria-label="Search location"
      />
    </div>
  );
}
