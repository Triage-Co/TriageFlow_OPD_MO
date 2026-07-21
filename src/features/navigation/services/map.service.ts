import apiClient from "@/shared/services/api-client";
import { BuildingMapResponse, BuildingMapData } from "../types/map.types";

export const HARDCODED_BUILDING_ID = "00b03ef8-7702-4b08-a07e-ec887432453c";

// Global cache variables to ensure only a single API call is ever made for this building
let cachedBuildingData: BuildingMapData | null = null;
let buildingDataPromise: Promise<BuildingMapData> | null = null;

/**
 * Fetches the complete map detail data for the building.
 * Utilizes a Promise-based cache to avoid redundant network calls and handle concurrent requests.
 */
export async function fetchBuildingMap(
  buildingId: string = HARDCODED_BUILDING_ID,
  forceRefresh: boolean = false
): Promise<BuildingMapData> {
  if (cachedBuildingData && !forceRefresh) {
    return cachedBuildingData;
  }

  if (buildingDataPromise && !forceRefresh) {
    return buildingDataPromise;
  }

  buildingDataPromise = apiClient.get<BuildingMapResponse>(
    `/api/navigation/building/${buildingId}/map`
  )
    .then((response) => {
      if (response.data?.data) {
        cachedBuildingData = response.data.data;
        buildingDataPromise = null;
        return cachedBuildingData;
      }
      throw new Error("Invalid API response format");
    })
    .catch((err) => {
      buildingDataPromise = null; // Clear promise on failure to allow retries
      throw err;
    });

  return buildingDataPromise;
}
