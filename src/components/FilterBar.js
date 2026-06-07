import React from "react";
import "./FilterBar.css";

const DISTANCE_OPTIONS = [
  { value: "", label: "Any distance" },
  { value: "10", label: "Within 10 mi" },
  { value: "25", label: "Within 25 mi" },
  { value: "50", label: "Within 50 mi" },
  { value: "100", label: "Within 100 mi" },
];

export default function FilterBar({ filters, onChange }) {
  //console.log('FilterBar rendered with filters:', filters);
  return (
    <div className="filter-bar" role="group" aria-label="Dealer filters">
      <div className="filter-field">
        <label htmlFor="filter-inventory">Inventory</label>
        <select
          id="filter-inventory"
          className="filter-select"
          value={filters.inventory}
          onChange={(e) => {
            onChange({ ...filters, inventory: e.target.value });
          }}
        >
          <option value="all">New &amp; used</option>
          <option value="new">New cars</option>
          <option value="used">Used cars</option>
        </select>
      </div>

      <div className="filter-field">
        <label htmlFor="filter-budget">Typical budget</label>
        <select
          id="filter-budget"
          className="filter-select"
          value={filters.budgetBand}
          onChange={(e) => {
            onChange({ ...filters, budgetBand: e.target.value });
          }}
        >
          <option value="all">Any budget</option>
          <option value="under_10k">Under ~$10K</option>
          <option value="10k_25k">$10K – $25K</option>
          <option value="25k_50k">$25K – $50K</option>
          <option value="50k_plus">$50K+</option>
        </select>
      </div>

      <div className="filter-field">
        <label htmlFor="filter-distance">Distance</label>
        <select
          id="filter-distance"
          className="filter-select"
          value={filters.maxDistanceMiles === null ? "" : String(filters.maxDistanceMiles)}
          onChange={(e) => {
            const v = e.target.value;
            onChange({
              ...filters,
              maxDistanceMiles: v === "" ? null : Number(v),
            });
          }}
        >
          {DISTANCE_OPTIONS.map((o) => (
            <option key={o.value || "any"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
