import React from "react";
import DealerCard from "./DealerCard";
import { getDealerKey } from "../utils/dealerFilters";
import "./SmartSection.css";

export default function SmartSection({
  sectionKey,
  title,
  subtitle,
  dealers,
  hoveredDealerKey,
  onHover,
  onSelect,
  map,
  inventoryFilter = "all",
}) {
  if (!dealers.length) return null;

  const sid = sectionKey || "smart-section";

  return (
    <section className="smart-section" aria-labelledby={`${sid}-heading`}>
      <div className="smart-section-header">
        <h3 className="smart-section-title" id={`${sid}-heading`}>
          {title}
        </h3>
        {subtitle ? <p className="smart-section-subtitle">{subtitle}</p> : null}
      </div>
      <div className="smart-section-track">
        {dealers.map((dealer, index) => {
          const dealerKey = getDealerKey(dealer, index);
          return (
            <div className="smart-section-card-wrap" key={`${dealerKey}-wrap`}>
              <DealerCard
                dealer={dealer}
                dealerKey={dealerKey}
                isHovered={hoveredDealerKey === dealerKey}
                inventoryFilter={inventoryFilter}
                onSelect={(d) => {
                  onSelect(d);
                  if (map && d.lat != null && d.lng != null) {
                    map.panTo({ lat: Number(d.lat), lng: Number(d.lng) });
                  }
                }}
                onHover={onHover}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
