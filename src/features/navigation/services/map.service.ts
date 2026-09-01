import apiClient from "@/shared/services/api-client";
import { BuildingMapResponse, BuildingMapData } from "../types/map.types";

export const HARDCODED_BUILDING_ID = "00b03ef8-7702-4b08-a07e-ec887432453c";

const cachedBuildingData = new Map<string, BuildingMapData>();
const buildingDataPromises = new Map<string, Promise<BuildingMapData>>();

export async function fetchBuildingMap(
  buildingId: string = HARDCODED_BUILDING_ID,
  forceRefresh: boolean = false
): Promise<BuildingMapData> {
  if (cachedBuildingData.has(buildingId) && !forceRefresh) {
    return cachedBuildingData.get(buildingId)!;
  }

  if (buildingDataPromises.has(buildingId) && !forceRefresh) {
    return buildingDataPromises.get(buildingId)!;
  }

  const promise = apiClient.get<BuildingMapResponse>(
    `/api/navigation/building/${buildingId}/map`
  )
    .then((response) => {
      if (response.data?.data) {
        cachedBuildingData.set(buildingId, response.data.data);
        buildingDataPromises.delete(buildingId);
        return response.data.data;
      }
      throw new Error("Invalid API response format");
    })
    .catch((err) => {
      buildingDataPromises.delete(buildingId); 
      throw err;
    });

  buildingDataPromises.set(buildingId, promise);
  return promise;
}

export async function fetchRoute(
  startId: string,
  startType: "ROOM" | "ROOM_ENTRANCE" | "JUNCTION" | "ELEVATOR" | "STAIR",
  targetId: string,
  targetType: "ROOM" | "ROOM_ENTRANCE" | "JUNCTION" | "ELEVATOR" | "STAIR"
): Promise<any> {
  const query = new URLSearchParams({
    startId,
    startType,
    targetId,
    targetType,
  }).toString();
  const response = await apiClient.get<any>(`/api/navigation/route?${query}`);
  if (response.data?.data) {
    return response.data.data;
  }
  if (response.data) {
    return response.data;
  }
  throw new Error("Không thể tải dữ liệu đường đi");
}
