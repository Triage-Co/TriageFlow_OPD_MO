export type BodySide = "front" | "back";

export type BodyRegion = {
  id: string;
  labelVi: string;
  labelEn: string;
  side: BodySide;
  searchPhrase: string;
  fallbackSearchPhrases?: string[];
};
