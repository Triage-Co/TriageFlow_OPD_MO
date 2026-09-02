import { useState, useEffect, useRef } from "react";
import { GeoJSONFeatureCollection, BuildingMapData } from "../types/map.types";
import { fetchBuildingMap, HARDCODED_BUILDING_ID } from "../services/map.service";
import { buildingMapToGeoJSON } from "../utils/building-to-geojson";

const cache = new Map<string, GeoJSONFeatureCollection>();

export function useBuildingMap(floorNumber: number, buildingId: string = HARDCODED_BUILDING_ID) {
  const cacheKey = `${buildingId}-${floorNumber}`;

  const [data, setData] = useState<GeoJSONFeatureCollection | null>(
    () => cache.get(cacheKey) ?? null
  );
  const [rawMap, setRawMap] = useState<BuildingMapData | null>(null);
  const [loading, setLoading] = useState<boolean>(!cache.has(cacheKey));
  const [error, setError] = useState<Error | null>(null);

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      setData(cachedData);
      setRawMap(cachedData.rawMap ?? null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetchBuildingMap(buildingId)
      .then((buildingData) => {
        
        const floorData =
          buildingData?.floors?.find((f) => f.floorNumber === floorNumber) ||
          buildingData?.floors?.[0];

        if (!floorData) {
          throw new Error(`Không thể tìm thấy dữ liệu sơ đồ tầng.`);
        }

        const geojson = buildingMapToGeoJSON(floorData);
        geojson.rawMap = buildingData; 
        cache.set(cacheKey, geojson);

        if (isMounted.current) {
          setData(geojson);
          setRawMap(buildingData);
        }
      })
      .catch((err) => {
        if (isMounted.current) {
          setError(err instanceof Error ? err : new Error("Không thể tải thông tin bản đồ"));
        }
      })
      .finally(() => {
        if (isMounted.current) {
          setLoading(false);
        }
      });
  }, [floorNumber, buildingId]);

  return { data, rawMap, loading, error };
}
