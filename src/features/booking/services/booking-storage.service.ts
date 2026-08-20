import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "today_booking_step";

export interface SavedStep {
  stepId: string;
  patientName: string;
  date: string; 
}

export const bookingStorageService = {
  async saveActiveBookingStep(stepId: string, patientName: string): Promise<void> {
    const today = new Date().toISOString().split("T")[0];
    const data: SavedStep = { stepId, patientName, date: today };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  async getActiveBookingStep(): Promise<{ stepId: string; patientName: string } | null> {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return null;
    try {
      const data: SavedStep = JSON.parse(json);
      const today = new Date().toISOString().split("T")[0];
      if (data.date === today) {
        return { stepId: data.stepId, patientName: data.patientName };
      }
      
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
    return null;
  },

  async clearActiveBookingStep(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
};
