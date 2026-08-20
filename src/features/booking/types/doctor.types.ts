export interface DoctorAccount {
  account_id: string;
  full_name?: string;
  user_name?: string;
  citizen_id: string;
  email: string;
  gender: string;
  role: string;
  phone: string | null;
  dob?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DoctorSpecialty {
  specialty_id: string;
  specialty_code: string;
  specialty_name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Slot {
  slot_id: string;
  slot_index: number;
  shift_id: string;
  start_time: string;
  end_time: string;
  capacity: number;
  max_capacity: number;
  status: "AVAILABLE" | "FULL" | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Shift {
  slots: Slot[];
}

export interface Doctor {
  staff_id: string;
  license_number: string;
  experience_years: number;
  specialty_id: string;
  full_name?: string;
  createdAt?: string;
  updatedAt?: string;
  account: DoctorAccount;
  specialty: DoctorSpecialty;
  shifts: Shift[];
}

export interface DoctorDetail {
  staff_id: string;
  license_number: string;
  experience_years: number;
  specialty_id: string;
  createdAt?: string;
  updatedAt?: string;
  account: DoctorAccount;
  specialty: DoctorSpecialty;
  existedSlot: Slot[];
}

export interface BookingRequest {
  patient_id: string;
  slot_id: string;
}

export interface BookingPaymentData {
  bin: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  description: string;
  orderCode: number;
  currency: string;
  paymentLinkId: string;
  status: string;
  expiredAt: string | null;
  checkoutUrl: string;
  qrCode: string;
}

export interface BookingResponseData {
  step_id: string;
  booking_id?: string;
  data?: {
    booking_id: string;
    patient_id: string;
    slot_id: string;
    status: string;
  };
  payment: {
    code: number;
    message: string;
    status: string;
    data: BookingPaymentData;
  };
}

export interface BookingResponse {
  code: number;
  status: string;
  message: string;
  data: BookingResponseData;
}

export interface BookingGenerateData {
  queue_id?: string;
  step_id?: string;
  queue_number?: string;
  status?: string;
  queue?: {
    queue_id?: string;
    step_id?: string;
    queue_number?: string;
    status?: string;
  };
  slot?: any;
  room?: any;
  specialty?: any;
}

export interface BookingGenerateResponse {
  code: number;
  status: string;
  message: string;
  data: BookingGenerateData;
}

export interface StepDetailSpecialty {
  specialty_id: string;
  specialty_code: string;
  specialty_name: string;
}

export interface StepDetailRoom {
  room_id: string;
  room_name: string;
  specialty: StepDetailSpecialty;
}

export interface StepDetailSlot {
  start_time: string;
  end_time: string;
  shift: {
    date: string;
    room: StepDetailRoom;
  };
}

export interface StepDetailQueue {
  queue_id: string;
  step_id: string;
  queue_number: string;
  status: string;
  ticket_code?: string;
}

export interface StepDetailStaff {
  staff_id: string;
  full_name: string;
  license_number: string;
  experience_years: number;
}

export interface StepDetailData {
  step_id: string;
  step_status: string;
  docNo: number;
  payment_status: string;
  ticket_code?: string;
  qr_text?: string;
  queues: StepDetailQueue[];
  staff: StepDetailStaff;
  flow: {
    ticket_code?: string;
    flow_id?: string;
    booking?: {
      slot?: StepDetailSlot;
    };
  };
}

export interface StepDetailResponse {
  code: number;
  status: string;
  message: string;
  data: StepDetailData;
}


