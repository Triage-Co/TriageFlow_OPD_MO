export interface NotificationItem {
  id: string;
  account_id: string;
  message: string;
  created_at: string;
}

export interface NotificationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationListResponse {
  code: number;
  status: string;
  message: string;
  data: NotificationItem[];
  meta: NotificationMeta;
}
