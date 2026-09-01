import { useEffect, useState } from "react";
import { useAuthContext } from "@/features/auth/context/AuthContext";
import { symptomPreloadService, RegionPreloadState } from "../services/symptom-preload.service";
import { PatientSex } from "../types/triage.types";
import { maleFrontData } from "@/features/body-map/data/maleFrontData";
import { maleBackData } from "@/features/body-map/data/maleBackData";
import { femaleFrontData } from "@/features/body-map/data/femaleFrontData";
import { femaleBackData } from "@/features/body-map/data/femaleBackData";

export function useBodyMapPreload() {
  const { user } = useAuthContext();
  const [preloadStates, setPreloadStates] = useState<Record<string, RegionPreloadState>>({});

  const gender: PatientSex = user?.gender?.toLowerCase() === "female" ? "female" : "male";

  const getRegionIdsForGender = (sex: PatientSex): string[] => {
    const frontParts = sex === "female" ? femaleFrontData.bodyParts : maleFrontData.bodyParts;
    const backParts = sex === "female" ? femaleBackData.bodyParts : maleBackData.bodyParts;
    
    const ids = new Set<string>();
    frontParts.forEach((p) => ids.add(p.id));
    backParts.forEach((p) => ids.add(p.id));
    return Array.from(ids);
  };

  useEffect(() => {
    
    const unsubscribe = symptomPreloadService.addListener((regionId, state) => {
      setPreloadStates((prev) => ({
        ...prev,
        [regionId]: state,
      }));
    });

    const regionIds = getRegionIdsForGender(gender);
    symptomPreloadService.startPreload(regionIds);

    const initialStates: Record<string, RegionPreloadState> = {};
    regionIds.forEach((id) => {
      const state = symptomPreloadService.getState(id);
      if (state) {
        initialStates[id] = state;
      }
    });
    setPreloadStates(initialStates);

    console.log(`[BodyMap] mounted`);

    return () => {
      unsubscribe();
    };
  }, [gender]);

  const isRegionReady = (regionId: string): boolean => {
    return symptomPreloadService.isReady(regionId);
  };

  const prioritizeRegion = (regionId: string) => {
    symptomPreloadService.prioritize(regionId);
  };

  return {
    preloadStates,
    isRegionReady,
    prioritizeRegion,
    gender,
  };
}
