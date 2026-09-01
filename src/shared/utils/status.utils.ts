export interface StatusBadgeInfo {
  label: string;
  color: string;
  bg: string;
  textColor: string;
  borderColor: string;
}

export function getStatusBadgeInfo(status?: string | null): StatusBadgeInfo {
  switch (status?.toUpperCase()) {
    case "COMPLETED":
    case "SUCCESSED":
    case "PAID":
      return {
        label: "Đã hoàn thành",
        color: "#16A34A",
        bg: "bg-green-50",
        textColor: "text-green-600",
        borderColor: "border-green-200",
      };
    case "IN_PROGRESS":
    case "SERVING":
      return {
        label: "Đang thực hiện",
        color: "#2563EB",
        bg: "bg-blue-50",
        textColor: "text-blue-600",
        borderColor: "border-blue-200",
      };
    case "WAITING":
    case "PENDING":
    case "UNPAID":
      return {
        label: "Chờ thực hiện",
        color: "#D97706",
        bg: "bg-amber-50",
        textColor: "text-amber-600",
        borderColor: "border-amber-200",
      };
    case "CANCELLED":
    case "FAILED":
      return {
        label: "Đã hủy",
        color: "#DC2626",
        bg: "bg-red-50",
        textColor: "text-red-600",
        borderColor: "border-red-200",
      };
    default:
      return {
        label: status || "Không xác định",
        color: "#6B7280",
        bg: "bg-gray-50",
        textColor: "text-gray-600",
        borderColor: "border-gray-200",
      };
  }
}
