export type EvidenceChoiceId = "present" | "absent" | "unknown";
export type PatientSex = "male" | "female";

export interface Evidence {
  id: string;
  choice_id: EvidenceChoiceId;
  name?: string;
}

export interface SymptomSearchItem {
  id: string;
  label: string;
}

export interface TranslatedSymptomSearchItem {
  id: string;
  labelEn: string;
  labelVi: string;
}

export interface DiagnosisQuestionChoice {
  id: EvidenceChoiceId;
  label: string;
  labelVi?: string;
}

export interface DiagnosisQuestionItem {
  id: string;
  name: string;
  nameVi?: string;
  choices: DiagnosisQuestionChoice[];
}

export interface DiagnosisQuestion {
  type: string;
  text: string;
  textVi?: string;
  extras?: Record<string, unknown>;
  items: DiagnosisQuestionItem[];
}

export interface DiagnosisRequest {
  sex: PatientSex;
  age: number;
  evidence: Evidence[];
}

export interface DiagnosisResponse {
  question: DiagnosisQuestion | null;
  conditions?: unknown[];
  extras?: Record<string, unknown>;
  has_emergency_evidence?: boolean;
  interview_token?: string;
  should_stop: boolean;
}

export interface RecommendSpecialistRequest {
  sex: PatientSex;
  age: number;
  evidence: Evidence[];
}

export interface RecommendedSpecialist {
  id: string;
  name: string;
  nameVi?: string;
  specialty_code?: string;
}

export interface RecommendSpecialistResponse {
  recommended_specialist: RecommendedSpecialist;
  recommended_channel: string;
  recommended_channel_vi?: string;
}

export type SelectedSymptomsMap = Record<string, TranslatedSymptomSearchItem[]>;

export interface DiagnosisSessionCache {
  sex: PatientSex;
  age: number;
  citizenId?: string;
  patientId?: string;
  patientName?: string;
  questionCount?: number;
  selectedSymptom?: TranslatedSymptomSearchItem;
  selectedSymptoms?: SelectedSymptomsMap;
  evidence: Evidence[];
  currentQuestion?: DiagnosisQuestion | null;
  interviewToken?: string;
  shouldStop?: boolean;
  recommendation?: RecommendSpecialistResponse;
  updatedAt: string;
}
