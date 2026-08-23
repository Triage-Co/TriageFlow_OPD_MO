
export function stripRoomName(roomName?: string | null): string {
  if (!roomName) return "";
  const trimmed = roomName.trim();
  const match = trimmed.match(/^Phòng\s+(.+)$/i);
  if (!match) return trimmed;
  const rest = match[1].trim();
  if (/^[\d\W]/.test(rest)) return trimmed;
  return rest;
}


export function getInitials(name?: string | null): string {
  if (!name) return "BN";
  const parts = name.trim().split(" ");
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
