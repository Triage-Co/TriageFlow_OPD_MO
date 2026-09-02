import { useState, useEffect, useCallback } from "react";
import { specialtyService } from "../services/specialty.service";
import { Specialty } from "../types/specialty.types";

export function useSpecialties() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSpecialties = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    console.log("[useSpecialties] Calling API getSpecialties");
    try {
      const data = await specialtyService.getSpecialties({ page: 1, limit: 100 });
      console.log(`[useSpecialties] API Success: received ${data.length} specialties`);
      setSpecialties(data);
    } catch (err: any) {
      console.log("[useSpecialties] API Error:", err.message || err);
      // setError(getErrorMessage(err, "Không thể tải danh sách chuyên khoa"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      await Promise.resolve();
      if (active) {
        fetchSpecialties();
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [fetchSpecialties]);

  return { specialties, isLoading, error, refetch: fetchSpecialties };
}
