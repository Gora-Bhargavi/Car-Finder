import React, { useState, useEffect, useRef, useMemo } from "react";
import { fetchAllVehiclesForDealer } from "../api/vehicles";
import {
  getListingsFromDealer,
  filterVehiclesByInventory,
  listingTitle,
  formatListingPrice,
  formatMileage,
  listingCondition,
  resolveVehicleImage,
  resolveVehicleId,
  resolveVehicleHref,
  listingDetailLine,
  listingDescription,
} from "../utils/inventory";
import "./DealerInventory.css";

const PREVIEW_COUNT = 4;

export default function DealerInventory({
  dealer,
  variant = "card",
  inventoryFilter = "all",
}) {
  const embedded = useMemo(() => getListingsFromDealer(dealer), [dealer]);
  const canFetchRemote = dealer?.id != null && String(dealer.id).trim() !== "";

  const [open, setOpen] = useState(variant === "map");
  const [remoteList, setRemoteList] = useState(null);
  const [loadStatus, setLoadStatus] = useState("idle");
  const [loadError, setLoadError] = useState(null);
  const fetchedIdRef = useRef(null);
  const inventoryRef = useRef(null);
  

  useEffect(() => {
    fetchedIdRef.current = null;
    setRemoteList(null);
    setLoadStatus("idle");
    setLoadError(null);
  }, [dealer?.id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (open && inventoryRef.current && !inventoryRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !canFetchRemote) return;
    if (fetchedIdRef.current === dealer.id) return;

    let cancelled = false;
    setLoadStatus("loading");
    setLoadError(null);

    fetchAllVehiclesForDealer(dealer.id)
      .then((rows) => {
        if (cancelled) return;
        fetchedIdRef.current = dealer.id;
        setRemoteList(Array.isArray(rows) ? rows : []);
        setLoadStatus("done");
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load vehicles:", err);
        setLoadError("Could not load full inventory from the server.");
        setLoadStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [open, canFetchRemote, dealer.id]);

  const displayList = remoteList != null ? remoteList : embedded;
  const filteredDisplayList = useMemo(
    () => filterVehiclesByInventory(displayList, inventoryFilter),
    [displayList, inventoryFilter]
  );

  const showSection = embedded.length > 0 || canFetchRemote;

  if (!showSection) return null;

  const stop = (e) => e.stopPropagation();

  const declaredCount =
    typeof dealer.vehicleCount === "number" &&
    !Number.isNaN(dealer.vehicleCount) &&
    dealer.vehicleCount >= 0
      ? dealer.vehicleCount
      : null;

  const visibleRows = open
    ? filteredDisplayList
    : [];
  const hiddenCount = filteredDisplayList.length;

  let countBadgeText;
  let countBadgePending = false;
  if (loadStatus === "loading" && remoteList == null && open) {
    countBadgeText = "…";
    countBadgePending = true;
  } else if (remoteList != null) {
    countBadgeText = String(filteredDisplayList.length);
  } else if (embedded.length > 0) {
    countBadgeText = String(filteredDisplayList.length);
  } else if (declaredCount != null) {
    countBadgeText = String(declaredCount);
  } else if (canFetchRemote) {
    countBadgeText = "—";
    countBadgePending = true;
  } else {
    countBadgeText = "0";
  }

  const showLoadingBanner =
    open && loadStatus === "loading" && canFetchRemote;

  return (
    <div
      ref={inventoryRef}
      className={`dealer-inventory dealer-inventory--${variant}`}
      onClick={stop}
    >
      <button
        type="button"
        className="dealer-inventory-toggle"
        onClick={(e) => {
          stop(e);
          setOpen((v) => !v);
        }}
        aria-expanded={open}
      >
        <span className="dealer-inventory-label">Vehicles for sale</span>
        <span
          className={
            countBadgePending
              ? "dealer-inventory-count dealer-inventory-count--pending"
              : "dealer-inventory-count"
          }
          title={
            countBadgePending && countBadgeText === "—"
              ? "Count loads when you open this list"
              : undefined
          }
        >
          {countBadgeText}
        </span>
        <span className="dealer-inventory-chevron" aria-hidden>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {loadError && open ? (
        <p className="dealer-inventory-error" role="alert">
          {loadError}
          {embedded.length ? " Showing cached list below." : ""}
        </p>
      ) : null}

      {!open &&
      canFetchRemote &&
      displayList.length === 0 &&
      loadStatus !== "loading" ? (
        <button
          type="button"
          className="dealer-inventory-cta"
          onClick={(e) => {
            stop(e);
            setOpen(true);
          }}
        >
          {declaredCount != null && declaredCount > 0
            ? `View ${declaredCount} vehicles (photos & IDs)`
            : "Load all vehicles (photos & IDs)"}
        </button>
      ) : null}

      {showLoadingBanner ? (
        <div className="dealer-inventory-loading" aria-live="polite">
          Loading full inventory…
        </div>
      ) : null}

      {!open &&
      filteredDisplayList.length === 0 &&
      displayList.length > 0 &&
      inventoryFilter !== "all" ? (
        <p className="dealer-inventory-empty">
          No vehicles match this inventory filter.
        </p>
      ) : null}

      {visibleRows.length > 0 ? (
        <ul className="dealer-inventory-list">
          {visibleRows.map((v, i) => {
            const href = resolveVehicleHref(v);
            const vid = resolveVehicleId(v);
            const key = vid != null ? `lv-${vid}` : `lv-${i}-${listingTitle(v)}`;
            const cond = listingCondition(v);
            const price = formatListingPrice(v.price);
            const miles = formatMileage(v.mileage ?? v.miles);
            const img = resolveVehicleImage(v);
            const detail = listingDetailLine(v);
            const desc = listingDescription(v);

           const rowContent = (
    <>
      <div className="listing-row-media">
        {img ? (
          <img className="listing-row-image" src={img} alt="" loading="lazy" />
        ) : (
          <div className="listing-row-image listing-row-image--empty" aria-hidden />
        )}
      </div>
      <div className="listing-row-main">
        <div className="listing-row-title-row">
          <span className="listing-row-title">{listingTitle(v)}</span>
          {vid != null ? <span className="listing-row-id">ID {vid}</span> : null}
        </div>
        {detail ? <div className="listing-row-detail">{detail}</div> : null}
        {desc ? <div className="listing-row-desc">{desc}</div> : null}
        <div className="listing-row-meta">
          {price ? <span className="listing-row-price">{price}</span> : null}
          {miles ? <span className="listing-row-miles">{miles}</span> : null}
          {cond ? (
            <span className={`listing-pill listing-pill--${cond}`}>
              {cond === "new" ? "New" : "Used"}
            </span>
          ) : null}
        </div>
      </div>
    </>
  );

           return (
  <li key={key} className="listing-row">
    {href ? (
      <a
        className="listing-row-link"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={stop}
      >
        {rowContent}
      </a>
    ) : (
      <div className="listing-row-link listing-row-link--static">
        {rowContent}
      </div>
    )}
  </li>
); 
          })}
        </ul>
      ) : open && loadStatus !== "loading" ? (
        <p className="dealer-inventory-empty">
          {displayList.length > 0 && filteredDisplayList.length === 0
            ? "No vehicles match this inventory filter."
            : "No vehicles in inventory."}
        </p>
      ) : null}

      {!open && hiddenCount > 0 ? (
        <button
          type="button"
          className="dealer-inventory-more"
          onClick={(e) => {
            stop(e);
            setOpen(true);
          }}
        >
          Show all {filteredDisplayList.length} — load full details
        </button>
      ) : null}
    </div>
  );
}
