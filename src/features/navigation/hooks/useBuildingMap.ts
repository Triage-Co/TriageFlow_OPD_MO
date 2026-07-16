import { useState, useEffect, useRef } from "react";
import { GeoJSONFeatureCollection } from "../types/map.types";
import { fetchBuildingMap } from "../services/map.service";
import { buildingMapToGeoJSON } from "../utils/building-to-geojson";

// In-memory cache to avoid redundant API requests when toggling floors
const cache = new Map<number, GeoJSONFeatureCollection>();

/**
 * Hook to fetch building map data for a specific floor.
 * Automatically transforms backend coordinate geometry to 3D scene GeoJSON features.
 */
export function useBuildingMap(floorNumber: number) {
  const [data, setData] = useState<GeoJSONFeatureCollection | null>(
    () => cache.get(floorNumber) ?? null
  );
  const [loading, setLoading] = useState<boolean>(!cache.has(floorNumber));
  const [error, setError] = useState<Error | null>(null);

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (cache.has(floorNumber)) {
      setData(cache.get(floorNumber)!);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetchBuildingMap()
      .then((buildingData) => {
        const floorData = buildingData?.floors?.find(f => f.floorNumber === floorNumber);
        if (!floorData) {
          throw new Error(`Tầng ${floorNumber} không tồn tại trong dữ liệu tòa nhà.`);
        }

        const geojson = buildingMapToGeoJSON(floorData);
        cache.set(floorNumber, geojson);

        if (isMounted.current) {
          setData(geojson);
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
  }, [floorNumber]);

  return { data, loading, error };
}
