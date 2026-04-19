import { distanceMiles } from "./geo";
import { getListingsFromDealer, listingCondition } from "./inventory";

/**
 * Optional backend fields (add in Spring DTOs when ready):
 * - id, phone, website, vehicleCount (optional; shown before /vehicles fetch)
 * - offersNew, offersUsed (boolean)
 * - priceBand: 'under_10k' | '10k_25k' | '25k_50k' | '50k_plus' | 'mixed'
 * - budgetFriendly (boolean)
 * - openedAt (ISO date) or establishedYear (number)
 * - trending (boolean)
 * - listings | vehicles | cars | carsForSale | inventory: array of
 *   { id?, title? | year+make+model, price?, mileage?|miles?, condition?|'new'|'used', isNew?, image? }
 * - Full list also loaded from GET /api/dealers/{id}/vehicles when user expands inventory.
 */

export function getDealerKey(dealer, indexInList = 0) {
  if (dealer.id != null) return `id-${dealer.id}`;
  const la = Number(dealer.lat);
  const ln = Number(dealer.lng);
  if (
    dealer.lat != null &&
    dealer.lng != null &&
    !Number.isNaN(la) &&
    !Number.isNaN(ln)
  ) {
    const lat = la.toFixed(5);
    const lng = ln.toFixed(5);
    return `d-${lat}-${lng}-${String(dealer.name || "").slice(0, 40)}`;
  }
  return `i-${indexInList}-${String(dealer.name || "dealer").slice(0, 24)}`;
}

export function enrichDealer(dealer, userLat, userLng) {
  const d = { ...dealer };
  if (
    userLat != null &&
    userLng != null &&
    dealer.lat != null &&
    dealer.lng != null
  ) {
    d.distanceMiles = distanceMiles(
      userLat,
      userLng,
      Number(dealer.lat),
      Number(dealer.lng)
    );
  } else if (dealer.distanceMiles != null) {
    d.distanceMiles = Number(dealer.distanceMiles);
  } else if (dealer.distance != null) {
    d.distanceMiles = Number(dealer.distance);
  } else {
    d.distanceMiles = null;
  }
  return d;
}

export function enrichDealers(dealers, userLat, userLng) {
  if (!Array.isArray(dealers)) return [];
  return dealers.map((d) => enrichDealer(d, userLat, userLng));
}

function matchesInventory(dealer, inventory) {
  if (inventory === "all") return true;
  const n = dealer.offersNew;
  const u = dealer.offersUsed;
  const rows = getListingsFromDealer(dealer);
  const resolved = rows.map(listingCondition).filter((c) => c != null);
  const anyNew = rows.some((v) => listingCondition(v) === "new");
  const anyUsed = rows.some((v) => listingCondition(v) === "used");

  if (inventory === "new") {
    if (n === false) return false;
    if (n === true) return true;
    if (rows.length === 0) {
      // No listing snapshot: require evidence of new inventory (do not treat "unknown" as new).
      if (u === false && n !== false) return true;
      return false;
    }
    if (anyNew) return true;
    if (resolved.length > 0 && resolved.every((c) => c === "used")) return false;
    return n !== false;
  }
  if (inventory === "used") {
    if (u === false) return false;
    if (u === true) return true;
    if (rows.length === 0) {
      if (n === false && u !== false) return true;
      // Used is common; when API omits flags, still show the dealer (vehicle rows filter client-side).
      if (n == null && u == null) return true;
      return u !== false;
    }
    if (anyUsed) return true;
    if (resolved.length > 0 && resolved.every((c) => c === "new")) return false;
    return u !== false;
  }
  return true;
}

const BAND_SETS = {
  under_10k: new Set(["under_10k", "budget", "mixed"]),
  "10k_25k": new Set(["10k_25k", "mid", "mixed"]),
  "25k_50k": new Set(["25k_50k", "mixed"]),
  "50k_plus": new Set(["50k_plus", "luxury", "premium", "mixed"]),
};

function matchesBudget(dealer, budgetBand) {
  if (budgetBand === "all") return true;
  const band = dealer.priceBand || dealer.avgPriceBand;
  if (band) {
    const allowed = BAND_SETS[budgetBand];
    return allowed ? allowed.has(band) : true;
  }

  const prices = getListingsFromDealer(dealer)
    .map((v) => Number(v?.price))
    .filter((n) => Number.isFinite(n) && n > 0);

  if (!prices.length) return true;

  const min = Math.min(...prices);
  const max = Math.max(...prices);

  if (budgetBand === "under_10k") return min < 10000;
  if (budgetBand === "10k_25k") return max >= 10000 && min <= 25000;
  if (budgetBand === "25k_50k") return max >= 25000 && min <= 50000;
  if (budgetBand === "50k_plus") return max >= 50000;
  return true;
}

export function filterDealers(dealers, { inventory, budgetBand, maxDistanceMiles }) {
  return dealers.filter((d) => {
    if (!matchesInventory(d, inventory)) return false;
    if (!matchesBudget(d, budgetBand)) return false;
    if (
      maxDistanceMiles != null &&
      d.distanceMiles != null &&
      d.distanceMiles > maxDistanceMiles
    ) {
      return false;
    }
    return true;
  });
}

export function topRatedDealers(dealers, limit = 8) {
  return [...dealers]
    .filter((d) => d.rating != null)
    .sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))
    .slice(0, limit);
}

export function budgetFriendlyDealers(dealers, limit = 8) {
  const pick = [...dealers].filter(
    (d) =>
      d.budgetFriendly === true ||
      ["under_10k", "10k_25k", "budget"].includes(d.priceBand || d.avgPriceBand) ||
      (d.offersUsed !== false && Number(d.rating) >= 4.2)
  );
  const sorted = pick.sort(
    (a, b) => (a.distanceMiles ?? 1e9) - (b.distanceMiles ?? 1e9)
  );
  if (sorted.length >= 2) return sorted.slice(0, limit);
  return [...dealers]
    .sort(
      (a, b) => (a.distanceMiles ?? 1e9) - (b.distanceMiles ?? 1e9)
    )
    .slice(0, limit);
}

export function trendingDealers(dealers, limit = 8) {
  const flagged = dealers.filter((d) => d.trending === true);
  if (flagged.length >= 2) {
    return flagged
      .sort((a, b) => (a.distanceMiles ?? 1e9) - (b.distanceMiles ?? 1e9))
      .slice(0, limit);
  }

  const withDate = dealers.filter((d) => d.openedAt || d.establishedYear);
  if (withDate.length >= 2) {
    return [...withDate]
      .sort((a, b) => {
        const ta = a.openedAt
          ? new Date(a.openedAt).getTime()
          : (a.establishedYear || 0) * 1e6;
        const tb = b.openedAt
          ? new Date(b.openedAt).getTime()
          : (b.establishedYear || 0) * 1e6;
        return tb - ta;
      })
      .slice(0, limit);
  }

  return [...dealers]
    .sort(
      (a, b) =>
        (Number(b.rating) || 0) - (Number(a.rating) || 0) ||
        (a.distanceMiles ?? 1e9) - (b.distanceMiles ?? 1e9)
    )
    .slice(0, limit);
}
