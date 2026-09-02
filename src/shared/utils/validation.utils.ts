
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VN_PHONE_REGEX = /^(0|\+84|84)(3|5|7|8|9)[0-9]{8}$/;

export function isValidEmail(email: string): boolean {
  if (!email) return false;
  return EMAIL_REGEX.test(email.trim());
}

export function isValidVietnamesePhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s.-]/g, "");
  return VN_PHONE_REGEX.test(cleaned);
}

export function isValidPassword(password: string, minLength = 6): boolean {
  if (!password) return false;
  return password.length >= minLength;
}

export function validateEmailField(email: string): string | undefined {
  if (!email || !email.trim()) {
    return "Vui lòng nhập email.";
  }
  if (!isValidEmail(email)) {
    return "Email không đúng định dạng.";
  }
  return undefined;
}

export function validatePhoneField(phone: string): string | undefined {
  if (!phone || !phone.trim()) {
    return "Vui lòng nhập số điện thoại.";
  }
  if (!isValidVietnamesePhone(phone)) {
    return "Số điện thoại không hợp lệ (10 chữ số).";
  }
  return undefined;
}

export function validatePasswordField(password: string, minLength = 6): string | undefined {
  if (!password || !password.trim()) {
    return "Vui lòng nhập mật khẩu.";
  }
  if (!isValidPassword(password, minLength)) {
    return `Mật khẩu phải có ít nhất ${minLength} ký tự.`;
  }
  return undefined;
}

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

export function validateRequiredField(value: string, label: string): string | undefined {
  if (!value || !value.trim()) {
    return `Vui lòng nhập ${label.toLowerCase()}.`;
  }
  return undefined;
}

export type FormErrors<T> = Partial<Record<keyof T, string>>;
