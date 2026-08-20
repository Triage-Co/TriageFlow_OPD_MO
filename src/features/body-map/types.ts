export type BodyGender = "male" | "female";

export type BodySide = "front" | "back";

export type BodyPart = {
  id: string;
  name: string;
  d: string;
};

export type OutlinePath = {
  d: string;
  strokeWidth?: number;
};

export type OutlineCircle = {
  cx: number;
  cy: number;
  r: number;
  strokeWidth?: number;
};

export type BodyModelData = {
  viewBox: string;
  bodyParts: BodyPart[];
  outlines: OutlinePath[];
  outlineCircles?: OutlineCircle[];
};

export type SelectedBodyPart = BodyPart & {
  gender: BodyGender;
  side: BodySide;
  labelVi: string;
  labelEn: string;
  searchPhrase: string;
};

/**
 * Giữ lại type này để các màn cũ đang import BodyRegion chưa bị vỡ ngay.
 * Sau khi refactor xong hết flow search/triage thì có thể đổi tên sang SelectedBodyPart.
 */
export type BodyRegion = {
  id: string;
  name?: string;
  labelVi?: string;
  labelEn?: string;
  gender?: BodyGender;
  side: BodySide;
  d?: string;
  searchPhrase?: string;
  fallbackSearchPhrases?: string[];
};
