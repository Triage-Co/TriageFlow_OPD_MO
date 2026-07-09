import { Gender } from "@/features/auth/types/auth.types";

export type UserProfileResponse = {
  code: number;
  status: string;
  message: string;
  data: {
    account_id: string;
    user_name: string;
    email: string;
    role: string;
    gender: Gender;
    phone: string | null;
    createdAt: string;
    updatedAt: string;
  };
};

export type UpdateProfileRequest = {
  full_name?: string;
  dob: string;
  gender: Gender;
  phone?: string;
};

export type UpdateProfileResponse = {
  code: number;
  status: string;
  message: string;
};
