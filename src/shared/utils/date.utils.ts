
export function calculateAgeFromDob(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (isNaN(age) || age < 0 || age > 150) {
    console.warn("[DateUtils] Không thể tính tuổi từ dob, dùng mặc định 30:", dob);
    return 30;
  }

  return age;
}

export function formatDate(dateStr?: string | null, fallback = ""): string {
  if (!dateStr) return fallback;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateTime(dateTimeStr?: string | null, fallback = ""): string {
  if (!dateTimeStr) return fallback;
  if (dateTimeStr.includes("T")) {
    const parts = dateTimeStr.split("T");
    const dateStr = parts[0].split("-").reverse().join("/");
    const timeStr = parts[1] ? parts[1].substring(0, 5) : "";
    return timeStr ? `${dateStr} ${timeStr}` : dateStr;
  }
  const d = new Date(dateTimeStr);
  if (isNaN(d.getTime())) return dateTimeStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${mins}`;
}

export function formatDateTimeWithDot(dateTimeStr?: string | null, fallback = ""): string {
  if (!dateTimeStr) return fallback;
  const d = new Date(dateTimeStr);
  if (isNaN(d.getTime())) return dateTimeStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${mins} • ${day}/${month}/${year}`;
}

export function toISODateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
