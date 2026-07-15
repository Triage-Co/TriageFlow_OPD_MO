export interface Specialty {
  specialty_id: string;
  specialty_code: string;
  specialty_name: string;
  description: string | null;
}

export interface SpecialtyListResponse {
  code: number;
  message: string;
  status: string;
  data: Specialty[];
}
