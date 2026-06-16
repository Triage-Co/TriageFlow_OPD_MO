// Auth feature types
// Based on TriageFlow Backend API – /auth endpoints

export type RegisterRequest = {
  fullName: string;
  phone: string;
  dateOfBirth: string; // ISO date string "YYYY-MM-DD"
  nationalId: string; // Số CCCD
  insuranceId?: string; // Số thẻ BHYT (optional)
  password: string;
};

export type OtpVerifyRequest = {
  phone: string;
  otp: string;
};

export type ResendOtpRequest = {
  phone: string;
};

export type LoginRequest = {
  phoneOrNationalId: string; // Số điện thoại hoặc CCCD
  password: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken?: string;
  user: UserProfile;
};

export type UserProfile = {
  id: string;
  fullName: string;
  phone: string;
  nationalId?: string;
  insuranceId?: string;
  dateOfBirth?: string;
  role: string;
};

export type ApiError = {
  message: string;
  statusCode?: number;
};
