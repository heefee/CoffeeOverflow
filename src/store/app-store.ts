import { create } from "zustand";
import type { AncpiFeature, CaenRoadmap, PropertyRecord } from "@/types";

interface AppState {
  selectedFeature: AncpiFeature | null;
  selectedProperty: PropertyRecord | null;
  loadingParcel: boolean;
  loadingProperty: boolean;
  selectedCaen: string | null;
  roadmap: CaenRoadmap | null;
  showRoadmap: boolean;
  setSelectedFeature: (f: AncpiFeature | null) => void;
  setSelectedProperty: (p: PropertyRecord | null) => void;
  setLoadingParcel: (v: boolean) => void;
  setLoadingProperty: (v: boolean) => void;
  setSelectedCaen: (code: string | null) => void;
  setRoadmap: (r: CaenRoadmap | null) => void;
  setShowRoadmap: (v: boolean) => void;
  clearSelection: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedFeature: null,
  selectedProperty: null,
  loadingParcel: false,
  loadingProperty: false,
  selectedCaen: null,
  roadmap: null,
  showRoadmap: false,
  setSelectedFeature: (selectedFeature) => set({ selectedFeature }),
  setSelectedProperty: (selectedProperty) => set({ selectedProperty }),
  setLoadingParcel: (loadingParcel) => set({ loadingParcel }),
  setLoadingProperty: (loadingProperty) => set({ loadingProperty }),
  setSelectedCaen: (selectedCaen) => set({ selectedCaen }),
  setRoadmap: (roadmap) => set({ roadmap }),
  setShowRoadmap: (showRoadmap) => set({ showRoadmap }),
  clearSelection: () =>
    set({
      selectedFeature: null,
      selectedProperty: null,
      selectedCaen: null,
      roadmap: null,
      showRoadmap: false,
    }),
}));
