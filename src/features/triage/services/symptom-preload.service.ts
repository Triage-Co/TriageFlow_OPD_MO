import { triageApiService } from "./triage-api.service";
import { triageCacheService } from "./triage-cache.service";
import { translationService } from "./translation.service";
import { TranslatedSymptomSearchItem } from "../types/triage.types";

export type PreloadStatus = "idle" | "loading" | "translating" | "completed" | "failed";

export interface RegionPreloadState {
  regionId: string;
  status: PreloadStatus;
  symptoms: TranslatedSymptomSearchItem[];
}

type PreloadListener = (regionId: string, state: RegionPreloadState) => void;

class SymptomPreloadService {
  private queue: string[] = [];
  private running = new Set<string>();
  private states = new Map<string, RegionPreloadState>();
  private listeners = new Set<PreloadListener>();
  private isPreloadingAll = false;

  addListener(listener: PreloadListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(regionId: string) {
    const state = this.states.get(regionId);
    if (state) {
      this.listeners.forEach((listener) => listener(regionId, state));
    }
  }

  getState(regionId: string): RegionPreloadState | null {
    return this.states.get(regionId) || null;
  }

  getStates(): Map<string, RegionPreloadState> {
    return this.states;
  }

  isReady(regionId: string): boolean {
    const state = this.states.get(regionId);
    return state?.status === "completed";
  }

  async startPreload(regionIds: string[]): Promise<void> {
    if (this.isPreloadingAll) return;
    this.isPreloadingAll = true;
    console.log(`[Preload] Queue started`);

    
    for (const id of regionIds) {
      if (!this.states.has(id)) {
        this.states.set(id, { regionId: id, status: "idle", symptoms: [] });
      }
    }

    
    for (const id of regionIds) {
      const cached = await triageCacheService.getSearchCache(id);
      if (cached) {
        this.states.set(id, { regionId: id, status: "completed", symptoms: cached });
        this.notify(id);
      } else {
        if (!this.queue.includes(id) && !this.running.has(id)) {
          this.queue.push(id);
        }
      }
    }

    
    const cachedRegions = Array.from(this.states.entries())
      .filter(([_, v]) => v.status === "completed")
      .map(([k]) => k);
    console.log(`[Preload] Current cached regions: ${JSON.stringify(cachedRegions)}`);

    this.processQueue();
  }

  private async processQueue() {
    
    while (this.running.size < 2 && this.queue.length > 0) {
      const nextRegion = this.queue.shift();
      if (nextRegion) {
        this.preloadRegion(nextRegion);
      }
    }

    if (this.running.size === 0 && this.queue.length === 0 && this.isPreloadingAll) {
      console.log(`[Preload] Queue completed`);
      this.isPreloadingAll = false;
    }
  }

  private async preloadRegion(regionId: string) {
    this.running.add(regionId);
    this.states.set(regionId, { regionId, status: "loading", symptoms: [] });
    this.notify(regionId);

    console.log(`[Preload] Current preload region: ${regionId}`);
    try {
      
      const searchItems = await triageApiService.searchSymptoms({
        age: 30,
        phrase: regionId,
      });

      
      const initialSymptoms: TranslatedSymptomSearchItem[] = searchItems.map((item) => ({
        id: item.id,
        labelEn: item.label,
        labelVi: item.label,
      }));

      
      await triageCacheService.setSearchCache(regionId, initialSymptoms);
      this.states.set(regionId, { regionId, status: "translating", symptoms: initialSymptoms });
      this.notify(regionId);

      
      this.translateSymptomsAsync(regionId, initialSymptoms);

    } catch (error: any) {
      console.warn(`[Preload] Cache miss / Lỗi khi preload region ${regionId}:`, error);
      if (error && error.stack) {
        console.error("[Preload] Stack trace:", error.stack);
      }
      this.states.set(regionId, { regionId, status: "failed", symptoms: [] });
      this.notify(regionId);
    } finally {
      this.running.delete(regionId);
      this.processQueue();
    }
  }

  private async translateSymptomsAsync(regionId: string, symptoms: TranslatedSymptomSearchItem[]) {
    console.log(`[Translation] Translation started for region ${regionId}`);
    try {
      const translated = await translationService.translateSymptomItems(
        symptoms.map((s) => ({ id: s.id, label: s.labelEn }))
      );

      
      await triageCacheService.setSearchCache(regionId, translated);
      this.states.set(regionId, { regionId, status: "completed", symptoms: translated });
      this.notify(regionId);
      console.log(`[Translation] Translation completed for region ${regionId}`);
    } catch (error) {
      console.warn(`[Translation] Lỗi khi dịch symptoms cho region ${regionId}:`, error);
      
      this.states.set(regionId, { regionId, status: "completed", symptoms });
      this.notify(regionId);
    }
  }

  async prioritize(regionId: string): Promise<void> {
    const state = this.states.get(regionId);
    if (state?.status === "completed") {
      console.log(`[Preload] Cache hit: ${regionId}`);
      return;
    }

    if (this.running.has(regionId)) {
      console.log(`[Preload] Region ${regionId} is already running`);
      return;
    }

    console.log(`[Preload] Cache miss`);
    console.log(`[Preload] Urgent request inserted: ${regionId}`);
    
    
    const index = this.queue.indexOf(regionId);
    if (index > -1) {
      this.queue.splice(index, 1);
    }

    
    this.preloadRegion(regionId);
  }
}

export const symptomPreloadService = new SymptomPreloadService();
