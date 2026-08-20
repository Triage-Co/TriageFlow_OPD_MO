/**
 * Validation utilities cho các form dữ liệu người dùng (Mobile App)
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Số điện thoại Việt Nam: bắt đầu bằng 0 hoặc +84/84, tiếp theo là 3, 5, 7, 8, 9 và thêm 8 chữ số
const VN_PHONE_REGEX = /^(0|\+84|84)(3|5|7|8|9)[0-9]{8}$/;

/** Kiểm tra email hợp lệ */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  return EMAIL_REGEX.test(email.trim());
}

/** Kiểm tra số điện thoại Việt Nam hợp lệ (10 chữ số) */
export function isValidVietnamesePhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s.-]/g, "");
  return VN_PHONE_REGEX.test(cleaned);
}

/** Kiểm tra mật khẩu (mặc định tối thiểu 6 ký tự) */
export function isValidPassword(password: string, minLength = 6): boolean {
  if (!password) return false;
  return password.length >= minLength;
}

/** Validate trường Email độc lập (dùng cho onBlur & onSubmit) */
export function validateEmailField(email: string): string | undefined {
  if (!email || !email.trim()) {
    return "Vui lòng nhập email.";
  }
  if (!isValidEmail(email)) {
    return "Email không đúng định dạng.";
  }
  return undefined;
}

/** Validate trường Số điện thoại độc lập (dùng cho onBlur & onSubmit) */
export function validatePhoneField(phone: string): string | undefined {
  if (!phone || !phone.trim()) {
    return "Vui lòng nhập số điện thoại.";
  }
  if (!isValidVietnamesePhone(phone)) {
    return "Số điện thoại không hợp lệ (10 chữ số).";
  }
  return undefined;
}

/** Validate trường Mật khẩu độc lập */
export function validatePasswordField(password: string, minLength = 6): string | undefined {
  if (!password || !password.trim()) {
    return "Vui lòng nhập mật khẩu.";
  }
  if (!isValidPassword(password, minLength)) {
    return `Mật khẩu phải có ít nhất ${minLength} ký tự.`;
  }
  return undefined;
}

/** Validate trường Xác nhận mật khẩu độc lập */
export function validateConfirmPasswordField(
  password: string,
  confirmPassword: string
): string | undefined {
  if (!confirmPassword || !confirmPassword.trim()) {
    return "Vui lòng xác nhận mật khẩu.";
  }
  if (password !== confirmPassword) {
    return "Mật khẩu xác nhận không khớp.";
  }
  return undefined;
}

/** Validate trường Bắt buộc chung */
export function validateRequiredField(value: string, label: string): string | undefined {
  if (!value || !value.trim()) {
    return `Vui lòng nhập ${label.toLowerCase()}.`;
  }
  return undefined;
}

/** Form error type generic */
export type FormErrors<T> = Partial<Record<keyof T, string>>;
