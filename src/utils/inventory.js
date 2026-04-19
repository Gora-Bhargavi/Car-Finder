/**
 * Reads vehicle rows from dealer JSON. Backend can use any of these property names.
 * Each item can include: year, make, model OR title; price; mileage | miles;
 * condition: 'new'|'used' OR isNew (boolean); image (url); id
 */
export function getListingsFromDealer(dealer) {
  if (!dealer || typeof dealer !== "object") return [];
  const raw =
    dealer.listings ??
    dealer.vehicles ??
    dealer.cars ??
    dealer.carsForSale ??
    dealer.inventory;
  return Array.isArray(raw) ? raw : [];
}

export function resolveVehicleHref(v) {
  if (!v || typeof v !== "object") return null;
  const href =
    v.vdpUrl ??
    v.vehicleUrl ??
    v.url ??
    v.link ??
    v.detailsUrl;
  if (!href) return null;
  const s = String(href).trim();
  if (!s) return null;
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

export function listingTitle(v) {
  if (v?.title && String(v.title).trim()) return String(v.title).trim();
  const parts = [v?.year, v?.make, v?.model].filter(
    (x) => x != null && String(x).trim() !== ""
  );
  return parts.length ? parts.join(" ") : "Vehicle";
}

export function formatListingPrice(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatMileage(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return `${n.toLocaleString("en-US")} mi`;
}

export function listingCondition(v) {
  if (v?.condition) {
    const c = String(v.condition).toLowerCase();
    if (c === "new" || c === "used") return c;
  }
  if (v?.isNew === true) return "new";
  if (v?.isNew === false) return "used";
  return null;
}

/** When inventory is new|used, only rows with that condition are shown (unknown condition omitted). */
export function filterVehiclesByInventory(list, inventory) {
  if (!Array.isArray(list)) return [];
  if (!inventory || inventory === "all") return list;
  return list.filter((v) => listingCondition(v) === inventory);
}

/** Prefer primary image; supports common backend field names */
export function resolveVehicleImage(v) {
  if (!v || typeof v !== "object") return null;
  if (v.image) return String(v.image).trim() || null;
  if (v.imageUrl) return String(v.imageUrl).trim() || null;
  if (v.photoUrl) return String(v.photoUrl).trim() || null;
  if (v.primaryImage) return String(v.primaryImage).trim() || null;
  if (v.thumbnailUrl) return String(v.thumbnailUrl).trim() || null;
  if (Array.isArray(v.images) && v.images.length) {
    const first = v.images[0];
    if (typeof first === "string") return first;
    if (first?.url) return String(first.url);
  }
  if (Array.isArray(v.imageUrls) && v.imageUrls.length) {
    return String(v.imageUrls[0]);
  }
  return null;
}

export function resolveVehicleId(v) {
  if (!v || typeof v !== "object") return null;
  const id = v.id ?? v.vehicleId ?? v.stockId ?? v.listingId;
  if (id == null) return null;
  return String(id);
}

export function listingDetailLine(v) {
  if (!v || typeof v !== "object") return null;
  const parts = [
    v.vin,
    v.trim,
    v.exteriorColor || v.color || v.bodyColor,
    v.interiorColor,
    v.engine,
    v.transmission,
  ]
    .map((x) => (x != null && String(x).trim() !== "" ? String(x).trim() : null))
    .filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

export function listingDescription(v) {
  if (!v?.description && !v?.notes) return null;
  const t = String(v.description || v.notes || "").trim();
  if (!t) return null;
  return t.length > 160 ? `${t.slice(0, 157)}…` : t;
}
