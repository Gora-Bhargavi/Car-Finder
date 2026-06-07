import React from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { formatDistanceMiles } from "../utils/geo";
import { phoneHref, websiteHref } from "../utils/links";
import { getDealerKey } from "../utils/dealerFilters";
import DealerInventory from "./DealerInventory";
import { API_BASE } from "../config"; // ✅ IMPORTANT
import "./MapView.css";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 40.7934,
  lng: -77.86,
};

const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='300' height='200' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif' font-size='16'%3ENo Image%3C/text%3E%3C/svg%3E";

function MapView({
  dealers,
  hoveredDealerKey,
  setSelectedDealer,
  selectedDealer,
  setMap,
  inventoryFilter = "all",
}) {

 const getImageUrl = (dealer) => {
  const rawImage = dealer?.image || "";
  const imagePath = rawImage.replace(/^https?:\/\/[^/]+/, "");
  return imagePath ? `${API_BASE}${imagePath}` : FALLBACK_IMAGE;
};

  return (
    <div className="right-panel map-panel">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={12}
        onLoad={(mapInstance) => setMap(mapInstance)}
        options={{
          mapTypeControl: false,
          streetViewControl: false,
        }}
      >
        {dealers
          .filter((d) => d.lat != null && d.lng != null)
          .map((d, index) => {
            const key = getDealerKey(d, index);
            return (
              <Marker
                key={key}
                position={{ lat: Number(d.lat), lng: Number(d.lng) }}
                onClick={() => setSelectedDealer(d)}
                icon={
                  hoveredDealerKey === key
                    ? {
                        url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                      }
                    : {
                        url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                      }
                }
              />
            );
          })}

        {selectedDealer &&
          selectedDealer.lat != null &&
          selectedDealer.lng != null && (
            <InfoWindow
              position={{
                lat: Number(selectedDealer.lat),
                lng: Number(selectedDealer.lng),
              }}
              onCloseClick={() => setSelectedDealer(null)}
            >
              <div className="map-info">
                <div className="map-info-media">
                  {/* ✅ FIXED IMAGE */}
                  <img
                    src={getImageUrl(selectedDealer)}
                    alt={selectedDealer.name}
                    className="map-info-img"
                    loading="lazy"
                    style={{ minHeight: "120px", background: "#f3f3f3" }}
                    onError={(e) => {
                      if (e.target.src !== FALLBACK_IMAGE) {
                        e.target.onerror = null;
                        e.target.src = FALLBACK_IMAGE;
                      }
                    }}
                  />
                </div>

                <div className="map-info-body">
                  <h4 className="map-info-title">{selectedDealer.name}</h4>

                  <p className="map-info-rating">
                    ⭐{" "}
                    {selectedDealer.rating != null
                      ? Number(selectedDealer.rating).toFixed(1)
                      : "—"}
                    {formatDistanceMiles(selectedDealer.distanceMiles) && (
                      <span className="map-info-dist">
                        {formatDistanceMiles(selectedDealer.distanceMiles)}
                      </span>
                    )}
                  </p>

                  <p className="map-info-address">
                    {selectedDealer.address}
                  </p>

                  <div className="map-info-actions">
                    {phoneHref(selectedDealer.phone) && (
                      <a
                        className="map-info-link"
                        href={phoneHref(selectedDealer.phone)}
                      >
                        {selectedDealer.phone
                          ? `Call ${selectedDealer.phone}`
                          : "Call"}
                      </a>
                    )}

                    {websiteHref(selectedDealer.website) && (
                      <a
                        className="map-info-link"
                        href={websiteHref(selectedDealer.website)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Website
                      </a>
                    )}

                    <a
                      className="map-info-link map-info-link--primary"
                      href={`https://www.google.com/maps/dir/?api=1&destination=${selectedDealer.lat},${selectedDealer.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Directions
                    </a>
                  </div>

                  <DealerInventory
                    key={
                      selectedDealer.id != null
                        ? String(selectedDealer.id)
                        : `${selectedDealer.lat}-${selectedDealer.name}`
                    }
                    dealer={selectedDealer}
                    variant="map"
                    inventoryFilter={inventoryFilter}
                  />
                </div>
              </div>
            </InfoWindow>
          )}
      </GoogleMap>
    </div>
  );
}

export default MapView;