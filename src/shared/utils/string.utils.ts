
export function stripRoomName(roomName?: string | null): string {
  if (!roomName) return "";
  const trimmed = roomName.trim();
  const match = trimmed.match(/^Phòng\s+(.+)$/i);
  if (!match) return trimmed;
  const rest = match[1].trim();
  if (/^[\d\W]/.test(rest)) return trimmed;
  return rest;
}

export function getInitials(name?: string | null, fallback = "BN"): string {
  if (!name) return fallback;
  const cleanName = name.replace(/^(BS\.|BS|PGS\.|PGS|TS\.|TS|ThS\.|ThS)\s+/i, "").trim();
  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  const first = parts[0].charAt(0);
  const last = parts[parts.length - 1].charAt(0);
  return (first + last).toUpperCase();
}

export function maskCitizenId(id?: string | null, keepEnd: boolean = true): string {
  if (!id) return "";
  const trimmed = id.trim();
  if (trimmed.length <= 6) return trimmed;

  if (keepEnd && trimmed.length >= 9) {
    const start = trimmed.slice(0, 3);
    const end = trimmed.slice(-3);
    const middle = "*".repeat(trimmed.length - 6);
    return `${start}${middle}${end}`;
  }

  const start = trimmed.slice(0, 3);
  const rest = "*".repeat(trimmed.length - 3);
  return `${start}${rest}`;
}

export function formatVND(amount?: number | null, fallback: string = "0 đ"): string {
  if (amount === undefined || amount === null || isNaN(amount)) return fallback;
  return `${amount.toLocaleString("vi-VN")} đ`;
}

export function getQrCodeUrl(data: string, size: number = 300): string {
  if (!data) return "";
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
}

export function calculateOrderTotal(
  details?: Array<{ price_at_order?: number; quantity?: number; sub_total?: number }> | null
): number {
  if (!details || !Array.isArray(details)) return 0;
  return details.reduce((sum, item) => {
    const itemTotal = item.sub_total ?? (Number(item.price_at_order || 0) * (item.quantity || 1));
    return sum + itemTotal;
  }, 0);
}

export function formatGenderLabel(gender?: string | null, fallback = "---"): string {
  if (!gender) return fallback;
  const normalized = gender.trim().toUpperCase();
  if (normalized === "MALE" || normalized === "NAM") return "Nam";
  if (normalized === "FEMALE" || normalized === "NỮ" || normalized === "NU") return "Nữ";
  return fallback;
}
