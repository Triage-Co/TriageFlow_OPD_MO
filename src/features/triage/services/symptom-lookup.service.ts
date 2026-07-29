import { BodyGender } from "@/features/body-map/types";
import { commonSymptomDataset, Symptom } from "../data/commonSymptoms";
import { maleSymptomDataset } from "../data/maleSymptoms";
import { femaleSymptomDataset } from "../data/femaleSymptoms";
import { TranslatedSymptomSearchItem } from "../types/triage.types";

const BODY_PART_MAPPING: Record<string, string> = {
  'head': 'head',
  'eye': 'eye',
  'ear': 'ear',
  'nose': 'nose',
  'oral-cavity': 'mouth',
  'oral cavity': 'mouth',
  'neck-or-throat': 'neckAndThroat',
  'neck or throat': 'neckAndThroat',
  'chest': 'chest',
  'upper-arm': 'upperArm',
  'upper arm': 'upperArm',
  'upper-abdomen': 'upperAbdomen',
  'upper abdomen': 'upperAbdomen',
  'forearm': 'forearm',
  'middle-abdomen': 'midAbdomen',
  'middle abdomen': 'midAbdomen',
  'lower-abdomen': 'lowerAbdomen',
  'lower abdomen': 'lowerAbdomen',
  'hand': 'hand',
  'thigh': 'thigh',
  'knee': 'knee',
  'lower-leg': 'lowerLeg',
  'lower leg': 'lowerLeg',
  'foot': 'foot',
  'nap-of-neck': 'napeOfNeck',
  'nap of neck': 'napeOfNeck',
  'nape of neck': 'napeOfNeck',
  'back': 'back',
  'elbow': 'elbow',
  'lower-back': 'lowerBack',
  'lower back': 'lowerBack',
  'buttocks': 'buttocks',
  'anus': 'anus',
};

function toTranslated(symptom: Symptom): TranslatedSymptomSearchItem {
  return {
    id: symptom.id,
    labelEn: symptom.labelEn,
    labelVi: symptom.labelVn,
  };
}

function deduplicateById(items: TranslatedSymptomSearchItem[]): TranslatedSymptomSearchItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function getLocalSymptoms(bodyPartId: string, gender: BodyGender): TranslatedSymptomSearchItem[] {
  const result: TranslatedSymptomSearchItem[] = [];

  
  if (bodyPartId === 'genitals') {
    if (gender === 'female') {
      result.push(...(femaleSymptomDataset.femaleGenitals?.symptoms ?? []).map(toTranslated));
    } else {
      result.push(...(maleSymptomDataset.maleSpecificGenitals?.symptoms ?? []).map(toTranslated));
    }
    return deduplicateById(result);
  }

  
  const datasetKey = BODY_PART_MAPPING[bodyPartId];
  if (datasetKey && commonSymptomDataset[datasetKey]) {
    result.push(...commonSymptomDataset[datasetKey].symptoms.map(toTranslated));
  }

  
  if (bodyPartId === 'chest' && gender === 'female') {
    result.push(...(femaleSymptomDataset.breast?.symptoms ?? []).map(toTranslated));
  }

  return deduplicateById(result);
}
