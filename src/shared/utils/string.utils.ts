/**
 * Utility functions cho xử lý chuỗi và định dạng văn bản
 */

/**
 * Chuẩn hóa tên phòng giống Kiosk (bỏ tiền tố "Phòng" nếu phía sau là chữ cái)
 * Ví dụ:
 * - "Phòng Khám Nội 1" -> "Khám Nội 1"
 * - "Phòng Siêu âm 2" -> "Siêu âm 2"
 * - "Phòng 201" -> "Phòng 201" (giữ nguyên nếu là số)
 */
export function stripRoomName(roomName?: string | null): string {
  if (!roomName) return "";
  const trimmed = roomName.trim();
  const match = trimmed.match(/^Phòng\s+(.+)$/i);
  if (!match) return trimmed;
  const rest = match[1].trim();
  // Nếu ký tự đầu sau "Phòng" là số hoặc ký hiệu -> giữ nguyên
  if (/^[\d\W]/.test(rest)) return trimmed;
  // Nếu ký tự đầu là chữ cái -> bỏ tiền tố "Phòng"
  return rest;
}

/**
 * Lấy chữ cái viết tắt của họ và tên (dùng cho Avatar)
 */
export function getInitials(name?: string | null): string {
  if (!name) return "BN";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  const first = parts[0].charAt(0);
  const last = parts[parts.length - 1].charAt(0);
  return (first + last).toUpperCase();
}
