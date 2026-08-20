import { Gender } from "@/features/auth/types/auth.types";

export type UserProfileResponse = {
  code: number;
  status: string;
  message: string;
  data: {
    account_id: string;
    avatar: string | null;
    user_name: string;
    email: string;
    role: string;
    gender: Gender;
    phone: string | null;
    is_banned: boolean;
    createdAt: string;
    updatedAt: string;
  };
};

export type UpdateProfileRequest = {
  user_name?: string;
  gender?: Gender;
  phone?: string;
  avatar?: string;
};

export type UpdateProfileResponse = {
  code: number;
  status: string;
  message: string;
};
