/**
 * Tính tuổi dựa trên ngày sinh (dob).
 * @param dob - Ngày sinh dạng ISO string (YYYY-MM-DD hoặc ISO 8601)
 * @returns Số tuổi nguyên
 */
export function calculateAgeFromDob(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  // Giới hạn an toàn: nếu dob không hợp lệ, trả về 30 mặc định
  if (isNaN(age) || age < 0 || age > 150) {
    console.warn("[DateUtils] Không thể tính tuổi từ dob, dùng mặc định 30:", dob);
    return 30;
  }

  return age;
}
