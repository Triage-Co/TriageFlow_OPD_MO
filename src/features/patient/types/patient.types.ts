import { Gender } from "@/features/auth/types/auth.types";

export type Patient = {
  patient_id: string;
  account_id: string;
  medical_coverage_id: string;
  full_name: string;
  dob: string; 
  gender: Gender;
  citizen_id: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreatePatientRequest = {
  medical_coverage_id: string;
  dob: string; 
  gender: Gender;
  full_name: string;
  citizen_id: string;
};

export type CreatePatientResponse = {
  code: number;
  status: string;
  message: string;
  data: Patient;
};

export type PatientListResponse = {
  code: number;
  status: string;
  message: string;
  data: Patient[];
};

export type PatientDetailResponse = {
  code: number;
  status: string;
  message: string;
  data: Patient;
};

export type UpdatePatientRequest = {
  dob?: string;
  gender?: Gender;
  full_name?: string;
  medical_coverage_id?: string;
};

export type UpdatePatientResponse = {
  code: number;
  status: string;
  message: string;
  data: Patient;
};

export type DeletePatientResponse = {
  code: number;
  status: string;
  message: string;
};
