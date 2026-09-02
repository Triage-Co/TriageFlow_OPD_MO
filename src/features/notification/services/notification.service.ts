import apiClient from "@/shared/services/api-client";
import { NotificationListResponse } from "@/features/notification/types/notification.types";

export const notificationService = {
  async getNotifications(page = 1, limit = 20): Promise<NotificationListResponse> {
    const response = await apiClient.get<NotificationListResponse>("/api/notification", {
      params: { page, limit },
    });
    return response.data;
  },

  async deleteNotification(id: string): Promise<{ code: number; status: string; message: string }> {
    const response = await apiClient.delete(`/api/notification/${id}`);
    return response.data;
  },

  async deleteAllNotifications(): Promise<{ code: number; status: string; message: string }> {
    const response = await apiClient.delete("/api/notification/all");
    return response.data;
  },
};
