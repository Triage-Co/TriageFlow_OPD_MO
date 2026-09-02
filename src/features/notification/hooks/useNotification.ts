import { useState, useCallback, useEffect, useRef } from "react";
import { NotificationItem, NotificationMeta } from "@/features/notification/types/notification.types";
import { notificationService } from "@/features/notification/services/notification.service";
import { showGlobalToast } from "@/shared/components/ToastProvider";
import { getErrorMessage } from "@/shared/utils/error.utils";

const PAGE_SIZE = 20;

export function useNotification() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [meta, setMeta] = useState<NotificationMeta>({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFetchingRef = useRef(false);

  const fetchNotifications = useCallback(async (pageToFetch = 1, isRefresh = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isRefresh) {
      setIsRefreshing(true);
    } else if (pageToFetch === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const response = await notificationService.getNotifications(pageToFetch, PAGE_SIZE);
      const items = response?.data || [];
      const resMeta = response?.meta || {
        total: items.length,
        page: pageToFetch,
        limit: PAGE_SIZE,
        totalPages: Math.ceil(items.length / PAGE_SIZE) || 1,
      };

      setNotifications((prev) => (pageToFetch === 1 ? items : [...prev, ...items]));
      setMeta(resMeta);
      setError(null);
    } catch (err: any) {
      const msg = getErrorMessage(err, "Không thể tải danh sách thông báo.");
      setError(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  const refresh = useCallback(async () => {
    await fetchNotifications(1, true);
  }, [fetchNotifications]);

  const loadMore = useCallback(async () => {
    if (isLoading || isRefreshing || isLoadingMore) return;
    if (meta.page >= meta.totalPages) return;
    await fetchNotifications(meta.page + 1);
  }, [fetchNotifications, isLoading, isRefreshing, isLoadingMore, meta.page, meta.totalPages]);

  const removeOne = useCallback(
    async (id: string) => {
      const previousList = [...notifications];
      const previousTotal = meta.total;

      // Optimistic update
      setNotifications((prev) => prev.filter((item) => item.id !== id));
      setMeta((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));

      try {
        await notificationService.deleteNotification(id);
        showGlobalToast("Đã xóa thông báo.", "success");
      } catch (err: any) {
        // Revert on error
        setNotifications(previousList);
        setMeta((prev) => ({ ...prev, total: previousTotal }));
        showGlobalToast(getErrorMessage(err, "Không thể xóa thông báo."), "error");
      }
    },
    [notifications, meta.total]
  );

  const removeAll = useCallback(async () => {
    const previousList = [...notifications];
    const previousMeta = { ...meta };

    // Optimistic update
    setNotifications([]);
    setMeta({ total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 });

    try {
      await notificationService.deleteAllNotifications();
      showGlobalToast("Đã xóa tất cả thông báo.", "success");
    } catch (err: any) {
      // Revert on error
      setNotifications(previousList);
      setMeta(previousMeta);
      showGlobalToast(getErrorMessage(err, "Không thể xóa tất cả thông báo."), "error");
    }
  }, [notifications, meta]);

  return {
    notifications,
    total: meta.total,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore: meta.page < meta.totalPages,
    error,
    refresh,
    loadMore,
    removeOne,
    removeAll,
  };
}
