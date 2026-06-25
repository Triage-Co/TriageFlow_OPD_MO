import { Gender } from "@/features/auth/types/auth.types";

export type UserProfileResponse = {
  code: number;
  status: string;
  message: string;
  data: {
    id: string;
    full_name: string;
    fullName?: string;
    dob: string;
    gender: Gender;
    citizen_id?: string;
    phone?: string;
    email?: string;
    role: string;
    createdAt?: string;
    updatedAt?: string;
  };
};

export type UpdateProfileRequest = {
  fullName?: string;
  full_name?: string;
  dob: string;
  gender: Gender;
};

export type UpdateProfileResponse = {
  code: number;
  status: string;
  message: string;
};
