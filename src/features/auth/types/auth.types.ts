


/** Giới tính theo API */
export type Gender = "MALE" | "FEMALE";

/** POST /api/auth/register */
export type RegisterRequest = {
  email: string;
  user_name: string;
  password: string;
  gender: Gender;
  phone: string;

};

/** Response 201 từ /api/auth/register */
export type RegisterResponse = {
  code: number;
  status: string;
  message: string;
  data: {
    email: string;
    id: string;
  };
};

export type OtpSendRequest = {
  email: string;
};

export type OtpVerifyLoginRequest = {
  email: string;
  otp: string;
};

export type LoginEmailRequest = {
  email: string;
  password: string;
};

export type LoginCitizenRequest = {
  citizen_id: string;
  password: string;
};

export type LoginRequest = LoginEmailRequest | LoginCitizenRequest;

export type LoginResponse = {
  code: number;
  status: string;
  message: string;
  data: {
    token: string;
    refresh_token: string;
  };
};

export type RefreshTokenRequest = {
  refreshToken: string;
};

export type RefreshTokenResponse = {
  code: number;
  status: string;
  message: string;
  data: {
    token: string;
    refresh_token: string;
  };
};

/** Role của bệnh nhân được lưu trong user_metadata.role của Supabase JWT */
export type UserRole = "USER";

export type UserProfile = {
  id: string;
  account_id?: string;
  avatar?: string;
  full_name: string;
  email?: string;
  phone?: string;
  citizen_id?: string;
  dob?: string;
  gender?: Gender;
  role: UserRole | string;
  is_banned?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiError = {
  message: string;
  statusCode?: number;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ForgotPasswordResponse = {
  code: number;
  status: string;
  message: string;
};

export type ForgotPasswordVerifyRequest = {
  email: string;
  otp: string;
  password: string;
};

export type ForgotPasswordVerifyResponse = {
  code: number;
  status: string;
  message: string;
};

