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

const ALL_DATASET_SYMPTOMS_MAP = new Map<string, { labelEn: string; labelVi: string }>();

function initAllSymptomsMap() {
  if (ALL_DATASET_SYMPTOMS_MAP.size > 0) return;
  Object.values(commonSymptomDataset).forEach((group) => {
    group.symptoms?.forEach((s) => {
      ALL_DATASET_SYMPTOMS_MAP.set(s.id, { labelEn: s.labelEn, labelVi: s.labelVn });
    });
  });
  Object.values(maleSymptomDataset).forEach((group) => {
    group.symptoms?.forEach((s) => {
      ALL_DATASET_SYMPTOMS_MAP.set(s.id, { labelEn: s.labelEn, labelVi: s.labelVn });
    });
  });
  Object.values(femaleSymptomDataset).forEach((group) => {
    group.symptoms?.forEach((s) => {
      ALL_DATASET_SYMPTOMS_MAP.set(s.id, { labelEn: s.labelEn, labelVi: s.labelVn });
    });
  });
}

export function lookupSymptomInDatasets(id: string): { labelEn: string; labelVi: string } | null {
  initAllSymptomsMap();
  return ALL_DATASET_SYMPTOMS_MAP.get(id) || null;
}

const REGION_SEARCH_PHRASES: Record<string, string[]> = {
  head: ['headache', 'head pain', 'dizziness'],
  eye: ['eye pain', 'vision problem', 'eye redness'],
  ear: ['ear pain', 'tinnitus', 'hearing loss'],
  nose: ['nasal congestion', 'runny nose', 'sneezing'],
  'oral-cavity': ['mouth pain', 'toothache', 'sore throat'],
  'oral cavity': ['mouth pain', 'toothache', 'sore throat'],
  mouth: ['mouth pain', 'toothache', 'sore throat'],
  'neck-or-throat': ['neck pain', 'sore throat', 'stiff neck'],
  'neck or throat': ['neck pain', 'sore throat', 'stiff neck'],
  chest: ['chest pain', 'chest tightness', 'cough'],
  'upper-arm': ['arm pain', 'shoulder pain', 'bicep pain'],
  'upper arm': ['arm pain', 'shoulder pain', 'bicep pain'],
  'upper-abdomen': ['stomach pain', 'epigastric pain', 'heartburn'],
  'upper abdomen': ['stomach pain', 'epigastric pain', 'heartburn'],
  forearm: ['forearm pain', 'wrist pain', 'arm pain'],
  'middle-abdomen': ['abdominal pain', 'belly pain', 'stomach cramps'],
  'middle abdomen': ['abdominal pain', 'belly pain', 'stomach cramps'],
  'lower-abdomen': ['lower abdominal pain', 'pelvic pain', 'cramping'],
  'lower abdomen': ['lower abdominal pain', 'pelvic pain', 'cramping'],
  genitals: ['genital pain', 'groin pain', 'painful urination'],
  hand: ['hand pain', 'finger pain', 'wrist pain'],
  thigh: ['thigh pain', 'leg pain', 'hip pain'],
  knee: ['knee pain', 'knee swelling', 'joint pain'],
  'lower-leg': ['calf pain', 'shin pain', 'leg pain'],
  'lower leg': ['calf pain', 'shin pain', 'leg pain'],
  foot: ['foot pain', 'ankle pain', 'heel pain'],
  'nap-of-neck': ['nape pain', 'neck stiffness', 'neck pain'],
  'nap of neck': ['nape pain', 'neck stiffness', 'neck pain'],
  'nape of neck': ['nape pain', 'neck stiffness', 'neck pain'],
  back: ['upper back pain', 'backache', 'dorsal pain'],
  elbow: ['elbow pain', 'arm joint pain'],
  'lower-back': ['lower back pain', 'lumbar pain', 'lumbago', 'sciatica'],
  'lower back': ['lower back pain', 'lumbar pain', 'lumbago', 'sciatica'],
  buttocks: ['buttock pain', 'hip pain', 'sacrum pain'],
  anus: ['anal pain', 'rectal bleeding', 'hemorrhoids'],
};

export function getRegionSearchPhrases(bodyPartId: string): string[] {
  const norm = bodyPartId.toLowerCase().trim();
  return REGION_SEARCH_PHRASES[norm] || [norm];
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
