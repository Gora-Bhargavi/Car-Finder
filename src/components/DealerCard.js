import React from "react";
import { formatDistanceMiles } from "../utils/geo";
import { phoneHref, websiteHref } from "../utils/links";
import { getListingsFromDealer, filterVehiclesByInventory } from "../utils/inventory";
import DealerInventory from "./DealerInventory";
import { API_BASE } from "../config"; // ✅ IMPORTANT
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
    !Number.isNaN(dealer.vehicleCount) &&
    dealer.vehicleCount >= 0
      ? dealer.vehicleCount
      : 0;

  const saleCountLabel =
    rawEmbedded.length > 0 ? embeddedCount : backendVehicleCount;

  const stop = (e) => e.stopPropagation();

  // ✅ FIX: imageUrl MUST be outside return
  const imageUrl = dealer.image
    ? `${API_BASE}${dealer.image}`
    : "https://via.placeholder.com/300x200";

  return (
    <div
      className={`dealer-card${isHovered ? " dealer-card--hovered" : ""}`}
      onClick={() => onSelect(dealer)}
      onMouseEnter={() => onHover(dealerKey)}
      onMouseLeave={() => onHover(null)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(dealer);
        }
      }}
    >
      {/* Image */}
      <div className="dealer-image-container">
        <img
          src={imageUrl}
          alt={dealer.name}
          loading="lazy"
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/300x200";
          }}
        />
        {dealer.rating != null && (
          <span className="dealer-rating-badge">
            ⭐ {Number(dealer.rating).toFixed(1)}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="dealer-body">
        <h3 className="dealer-title">{dealer.name}</h3>
        <p className="dealer-address">{dealer.address}</p>

        <div className="dealer-meta-row">
          {distLabel && (
            <span className="dealer-meta-pill">📍 {distLabel}</span>
          )}
          {saleCountLabel > 0 && (
            <span className="dealer-meta-pill dealer-meta-pill--green">
              {saleCountLabel} for sale
            </span>
          )}
        </div>

        <div className="dealer-links">
          {tel ? (
            <a
              className="dealer-link dealer-link--call"
              href={tel}
              onClick={stop}
            >
              📞 {dealer.phone || "Call"}
            </a>
          ) : (
            <span className="dealer-link dealer-link--muted">
              No phone
            </span>
          )}

          {web ? (
            <a
              className="dealer-link"
              href={web}
              target="_blank"
              rel="noopener noreferrer"
              onClick={stop}
            >
              Website ↗
            </a>
          ) : (
            <span className="dealer-link dealer-link--muted">
              No site
            </span>
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