import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { LoadScript } from "@react-google-maps/api";
import "./App.css";

import DealerCard from "./components/DealerCard";
import MapView from "./components/MapView";
import SearchBar from "./components/SearchBar";
import FilterBar from "./components/FilterBar";
import SmartSection from "./components/SmartSection";
import { API_BASE } from "./config";
import {
  enrichDealers,
  filterDealers,
  getDealerKey,
  topRatedDealers,
  budgetFriendlyDealers,
  trendingDealers,
} from "./utils/dealerFilters";

const libraries = ["places"];

const INITIAL_MAP_CENTER = { lat: 40.7934, lng: -77.86 };

const defaultFilters = {
  inventory: "all",
  budgetBand: "all",
  maxDistanceMiles: null,
};

function App() {
  const [dealers, setDealers] = useState([]);
  const [userLocation, setUserLocation] = useState({
    ...INITIAL_MAP_CENTER,
    label: "",
  });
  const [filters, setFilters] = useState(defaultFilters);
  console.log('Current filters:', filters);
  const [hoveredDealerKey, setHoveredDealerKey] = useState(null);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [map, setMap] = useState(null);

  const fetchDealers = useCallback(async (lat, lng) => {
    try {
      const res = await axios.get(`${API_BASE}/api/dealers`, {
        params: { lat, lng },
      });
      setDealers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching dealers:", err);
      setDealers([]);
    }
  }, []);

  useEffect(() => {
    fetchDealers(INITIAL_MAP_CENTER.lat, INITIAL_MAP_CENTER.lng);
  }, [fetchDealers]);

  const onLocationResolved = useCallback((loc) => {
    setUserLocation((prev) => ({
      ...prev,
      lat: loc.lat,
      lng: loc.lng,
      label: loc.label || prev.label,
    }));
  }, []);

  const enriched = useMemo(
    () => enrichDealers(dealers, userLocation.lat, userLocation.lng),
    [dealers, userLocation.lat, userLocation.lng]
  );

  const filtered = useMemo(
    () => filterDealers(enriched, filters),
    [enriched, filters]
  );

  const topRated = useMemo(
    () => topRatedDealers(filtered, 8),
    [filtered]
  );
  const budgetPicks = useMemo(
    () => budgetFriendlyDealers(filtered, 8),
    [filtered]
  );
  const trendingPicks = useMemo(
    () => trendingDealers(filtered, 8),
    [filtered]
  );

  const headline =
    userLocation.label && userLocation.label.trim()
      ? "Dealers near you"
      : "Find dealers near you";

  const subline =
    userLocation.label && userLocation.label.trim()
      ? userLocation.label
      : "Search by city or ZIP to see local inventory and distances.";

  return (
    <LoadScript
      googleMapsApiKey={
        process.env.REACT_APP_GOOGLE_MAPS_API_KEY ||
        "AIzaSyD3yhCdBAgTR_Ny0SgMGf_hJlvLDnGPyQU"
      }
      libraries={libraries}
    >
            <div className="app-container">
        <div className="left-panel">

          {/* ── NAVBAR ── */}
          <nav className="site-nav">
            <div className="site-nav-logo">Car Finder</div>
            <div className="site-nav-links">
              <a href="#dealers" className="site-nav-link">Find Dealers</a>
              <a href="#top-rated" className="site-nav-link">Top Rated</a>
              <a href="#budget" className="site-nav-link">Budget Picks</a>
            </div>
          </nav>

          {/* ── HERO ── */}
          <div className="hero-banner">
            <div className="hero-inner">
              {userLocation.label && <p className="hero-location">📍 {userLocation.label}</p>}
              <h1 className="hero-title">Find the right dealer for you</h1>
              <p className="hero-sub">Search local inventory, compare ratings, and connect directly.</p>
              <SearchBar map={map} setDealers={setDealers} onLocationResolved={onLocationResolved} />
            </div>
          </div>

          
          

          {/* ── MAIN CONTENT ── */}
          <div className="main-content">
            <FilterBar filters={filters} onChange={setFilters} />

            <SmartSection
              sectionKey="top-rated"
              title="Top rated near you"
              subtitle="Highest customer ratings in your results."
              dealers={topRated}
              hoveredDealerKey={hoveredDealerKey}
              onHover={setHoveredDealerKey}
              onSelect={setSelectedDealer}
              map={map}
              inventoryFilter={filters.inventory}
            />

            <SmartSection
              sectionKey="budget"
              title="Budget-friendly dealers"
              subtitle="Great for used and value inventory — or set your budget in filters."
              dealers={budgetPicks}
              hoveredDealerKey={hoveredDealerKey}
              onHover={setHoveredDealerKey}
              onSelect={setSelectedDealer}
              map={map}
              inventoryFilter={filters.inventory}
            />

            <SmartSection
              sectionKey="trending"
              title="Recently opened & trending"
              subtitle="New on the platform or highlighted by owners."
              dealers={trendingPicks}
              hoveredDealerKey={hoveredDealerKey}
              onHover={setHoveredDealerKey}
              onSelect={setSelectedDealer}
              map={map}
              inventoryFilter={filters.inventory}
            />

            <h2 className="all-dealers-title" id="dealers">
              All matching dealers
              <span className="all-dealers-count">{filtered.length}</span>
            </h2>

            {filtered.length === 0 ? (
              <p className="empty-state">
                No dealers match these filters. Try widening distance or budget,
                or search a different area.
              </p>
            ) : (
              <div className="grid">
                {filtered.map((d, index) => {
                  const dealerKey = getDealerKey(d, index);
                  return (
                    <DealerCard
                      key={dealerKey}
                      dealer={d}
                      dealerKey={dealerKey}
                      isHovered={hoveredDealerKey === dealerKey}
                      onSelect={(dealer) => {
                        setSelectedDealer(dealer);
                        if (map && dealer.lat != null && dealer.lng != null) {
                          map.panTo({ lat: Number(dealer.lat), lng: Number(dealer.lng) });
                        }
                      }}
                      onHover={setHoveredDealerKey}
                      inventoryFilter={filters.inventory}
                    />
                  );
                })}
              </div>
            )}
          </div>{/* end main-content */}

        </div>{/* end left-panel */}
                

        <MapView
          dealers={filtered}
          hoveredDealerKey={hoveredDealerKey}
          selectedDealer={selectedDealer}
          setSelectedDealer={setSelectedDealer}
          setMap={setMap}
          inventoryFilter={filters.inventory}
        />
      
      </div>
      
    
            

         
                  
    </LoadScript>
  );
}

export default App;
