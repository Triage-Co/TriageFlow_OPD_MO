export interface Specialty {
  specialty_id: string;
  specialty_code: string;
  specialty_name: string;
  description: string | null;
  is_active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SpecialtyListResponse {
  code: number;
  message: string;
  status: string;
  data: {
    data: Specialty[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}
