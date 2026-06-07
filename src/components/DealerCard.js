import React from "react";
import { formatDistanceMiles } from "../utils/geo";
import { phoneHref, websiteHref } from "../utils/links";
import {
  getListingsFromDealer,
  filterVehiclesByInventory,
} from "../utils/inventory";
import DealerInventory from "./DealerInventory";
import { API_BASE } from "../config";
import "./DealerCard.css";

function DealerCard({
  dealer,
  onSelect,
  onHover,
  dealerKey,
  isHovered,
  inventoryFilter = "all",
}) {
  const distLabel = formatDistanceMiles(dealer.distanceMiles);
  const tel = phoneHref(dealer.phone);
  const web = websiteHref(dealer.website);

  const rawEmbedded = getListingsFromDealer(dealer);
  const embeddedCount = filterVehiclesByInventory(
    rawEmbedded,
    inventoryFilter
  ).length;

  const backendVehicleCount =
    typeof dealer.vehicleCount === "number" &&
    !Number.isNaN(dealer.vehicleCount)
      ? dealer.vehicleCount
      : 0;

  const saleCountLabel =
    rawEmbedded.length > 0 ? embeddedCount : backendVehicleCount;

  const stop = (e) => e.stopPropagation();

  const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='300' height='200' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif' font-size='16'%3ENo Image%3C/text%3E%3C/svg%3E";

const rawImage = dealer?.image || "";
const imagePath = rawImage.replace(/^https?:\/\/[^/]+/, "");
const imageUrl = imagePath ? `${API_BASE}${imagePath}` : FALLBACK_IMAGE;

  return (
    <div
      className={`dealer-card${isHovered ? " dealer-card--hovered" : ""}`}
      onClick={() => onSelect(dealer)}
      onMouseEnter={() => onHover(dealerKey)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="dealer-image-container">
        <img
          src={imageUrl}
          alt={dealer.name}
          loading="lazy"
          style={{ minHeight: "180px", background: "#f3f3f3" }}
          onError={(e) => {
            if (e.target.src !== FALLBACK_IMAGE) {
              e.target.onerror = null;
              e.target.src = FALLBACK_IMAGE;
            }
          }}
        />

        {dealer.rating != null && (
          <span className="dealer-rating-badge">
            ⭐ {Number(dealer.rating).toFixed(1)}
          </span>
        )}
      </div>

      <div className="dealer-body">
        <h3 className="dealer-title">{dealer.name}</h3>
        <p className="dealer-address">{dealer.address}</p>

        <div className="dealer-meta-row">
          {distLabel && <span>📍 {distLabel}</span>}
          {saleCountLabel > 0 && (
            <span className="dealer-meta-pill dealer-meta-pill--green">
              {saleCountLabel} for sale
            </span>
          )}
        </div>

        <div className="dealer-links">
          {tel ? (
            <a href={tel} onClick={stop}>
              📞 {dealer.phone || "Call"}
            </a>
          ) : (
            <span>No phone</span>
          )}

          {web ? (
            <a href={web} target="_blank" rel="noopener noreferrer">
              Website ↗
            </a>
          ) : (
            <span>No site</span>
          )}
        </div>

        <DealerInventory
          dealer={dealer}
          variant="card"
          inventoryFilter={inventoryFilter}
        />
      </div>
    </div>
  );
}

export default DealerCard;