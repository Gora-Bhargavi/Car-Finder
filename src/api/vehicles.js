import axios from "axios";
import { API_BASE } from "../config";

/**
 * Full vehicle list for a dealer (images, ids, VIN, etc.).
 *
 * GET /api/dealers/{dealerId}/vehicles
 *
 * Response: JSON array of vehicles, or Spring Page { content: [...] },
 * or { vehicles: [...] }.
 */
export async function fetchAllVehiclesForDealer(dealerId) {
  const { data } = await axios.get(
    `${API_BASE}/api/dealers/${encodeURIComponent(dealerId)}/vehicles`
  );
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.content)) return data.content;
  if (data && Array.isArray(data.vehicles)) return data.vehicles;
  return [];
}
