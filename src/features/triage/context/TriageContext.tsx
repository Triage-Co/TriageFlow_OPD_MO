import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { BodyRegion } from "@/features/body-map/types";
import { useAuthContext } from "@/features/auth/context/AuthContext";
import { triageApiService } from "../services/triage-api.service";
import { triageCacheService } from "../services/triage-cache.service";
import { translationService } from "../services/translation.service";
import { calculateAgeFromDob } from "@/shared/utils/date.utils";
import { profileService } from "@/features/profile/services/profile.service";
import {
  Evidence,
  TranslatedSymptomSearchItem,
  DiagnosisQuestion,
  RecommendSpecialistResponse,
  PatientSex,
  DiagnosisSessionCache,
  SelectedSymptomsMap,
} from "../types/triage.types";

type TriageContextType = {
  selectedRegion: BodyRegion | null;
  symptoms: TranslatedSymptomSearchItem[];
  selectedSymptom: TranslatedSymptomSearchItem | null;
  selectedSymptomsMap: SelectedSymptomsMap;
  currentQuestion: DiagnosisQuestion | null;
  evidence: Evidence[];
  interviewToken: string | undefined;
  recommendation: RecommendSpecialistResponse | null;
  shouldStop: boolean;
  isLoading: boolean;
  error: string | null;
  setSelectedRegion: (region: BodyRegion | null) => void;
  searchSymptomsByRegion: (params: { age: number; searchPhrase: string; fallbackSearchPhrases?: string[] }) => Promise<void>;
  startDiagnosisSession: () => Promise<void>;
  answerQuestion: (selectedAnswers: Evidence[]) => Promise<void>;
  triggerRecommendation: () => Promise<void>;
  clearSession: (clearSelectedSymptomsMap?: boolean) => Promise<void>;
  toggleSymptom: (regionId: string, symptom: TranslatedSymptomSearchItem) => void;
  getAllSelectedSymptoms: () => TranslatedSymptomSearchItem[];
};

const TriageContext = createContext<TriageContextType | undefined>(undefined);

export const TriageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const { user } = useAuthContext();

  const [selectedRegion, setSelectedRegionState] = useState<BodyRegion | null>(null);
  const [symptoms, setSymptoms] = useState<TranslatedSymptomSearchItem[]>([]);
  const [selectedSymptom, setSelectedSymptom] = useState<TranslatedSymptomSearchItem | null>(null);
  const [selectedSymptomsMap, setSelectedSymptomsMap] = useState<SelectedSymptomsMap>({});
  const [currentQuestion, setCurrentQuestion] = useState<DiagnosisQuestion | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [interviewToken, setInterviewToken] = useState<string | undefined>(undefined);
  const [recommendation, setRecommendation] = useState<RecommendSpecialistResponse | null>(null);
  const [shouldStop, setShouldStop] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Khôi phục session khi mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const session = await triageCacheService.getDiagnosisSession();
        if (session) {
          setEvidence(session.evidence);
          setInterviewToken(session.interviewToken);
          setCurrentQuestion(session.currentQuestion || null);
          setShouldStop(session.shouldStop || false);
          setRecommendation(session.recommendation || null);
          if (session.selectedSymptoms) {
            setSelectedSymptomsMap(session.selectedSymptoms);
            const allSelected = Object.values(session.selectedSymptoms).flat();
            if (allSelected.length > 0) setSelectedSymptom(allSelected[0]);
          }
        }
      } catch (err) {
        console.error("[TriageContext] Lỗi phục hồi session:", err);
      }
    };
    loadSession();
  }, []);

  const setSelectedRegion = (region: BodyRegion | null) => {
    setSelectedRegionState(region);
  };

  const toggleSymptom = (regionId: string, symptom: TranslatedSymptomSearchItem) => {
    setSelectedSymptomsMap((prev) => {
      const regionSymptoms = prev[regionId] || [];
      const exists = regionSymptoms.some((s) => s.id === symptom.id);

      let updatedRegionSymptoms: TranslatedSymptomSearchItem[];
      if (exists) {
        updatedRegionSymptoms = regionSymptoms.filter((s) => s.id !== symptom.id);
      } else {
        updatedRegionSymptoms = [...regionSymptoms, symptom];
      }

      const updatedMap = { ...prev, [regionId]: updatedRegionSymptoms };
      if (updatedRegionSymptoms.length === 0) {
        delete updatedMap[regionId];
      }

      return updatedMap;
    });
  };

  const getAllSelectedSymptoms = (): TranslatedSymptomSearchItem[] => {
    return Object.values(selectedSymptomsMap).flat();
  };

  // Giữ nguyên để tương thích với các màn cũ
  const searchSymptomsByRegion = async (params: {
    age: number;
    searchPhrase: string;
    fallbackSearchPhrases?: string[];
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const phrasesToTry = [params.searchPhrase, ...(params.fallbackSearchPhrases ?? [])];

      for (const phrase of phrasesToTry) {
        const cached = await triageCacheService.getCachedSymptoms(params.age, phrase);
        if (cached && cached.length > 0) {
          setSymptoms(cached);
          return;
        }
      }

      let finalResults: any[] = [];
      let successfulPhrase = "";

      for (const phrase of phrasesToTry) {
        const results = await triageApiService.searchSymptoms({ age: params.age, phrase });
        if (Array.isArray(results) && results.length > 0) {
          finalResults = results;
          successfulPhrase = phrase;
          break;
        }
      }

      if (finalResults.length > 0) {
        const translated = await translationService.translateSymptomItems(finalResults);
        await triageCacheService.setCachedSymptoms(params.age, successfulPhrase, translated);
        setSymptoms(translated);
      } else {
        setSymptoms([]);
      }
    } catch (err: any) {
      console.error("[TriageContext] Lỗi khi tìm triệu chứng:", err);
      setError(err?.message || "Không thể tìm kiếm triệu chứng. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Bắt đầu phiên chẩn đoán mới từ các triệu chứng đã chọn trên Body Map.
   * Gọi diagnose API lần đầu (không có interview_token), lưu session và navigate sang interview.
   */
  const startDiagnosisSession = async () => {
    const allSelected = getAllSelectedSymptoms();
    if (allSelected.length === 0) {
      setError("Vui lòng chọn ít nhất một triệu chứng.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let citizenId = user?.citizen_id;
      let genderVal = user?.gender;
      let dobVal = user?.dob;

      // Nếu thiếu thông tin cần thiết trong token metadata, gọi Profile API để lấy đầy đủ
      if (!citizenId || !genderVal || !dobVal) {
        console.log("[Triage] Thiếu thông tin trong JWT, đang tải từ Profile API...");
        const profileRes = await profileService.getProfile();
        if (profileRes?.data) {
          citizenId = profileRes.data.citizen_id || citizenId;
          genderVal = profileRes.data.gender || genderVal;
          dobVal = profileRes.data.dob || dobVal;
        }
      }

      if (!citizenId) {
        setError("Không tìm thấy thông tin CCCD (Citizen ID). Vui lòng cập nhật hồ sơ hoặc đăng nhập lại.");
        setIsLoading(false);
        return;
      }

      const currentMap = { ...selectedSymptomsMap };
      await clearSession(false);

      let sex: PatientSex = "male";
      if (genderVal) {
        sex = genderVal.toLowerCase() === "female" ? "female" : "male";
      }
      const age = dobVal ? calculateAgeFromDob(dobVal) : 30;

      const initialEvidence: Evidence[] = allSelected.map((s) => ({
        id: s.id,
        choice_id: "present",
      }));

      console.log(`[Triage] Bắt đầu phiên chẩn đoán: ${allSelected.length} triệu chứng, age=${age}, sex=${sex}`);

      const response = await triageApiService.diagnose({
        citizenId,
        request: { sex, age, evidence: initialEvidence },
      });

      const translatedQuestion = await translationService.translateQuestion(response.question);
      setCurrentQuestion(translatedQuestion);
      setInterviewToken(response.interview_token);
      setEvidence(initialEvidence);
      setShouldStop(response.should_stop);
      if (allSelected.length > 0) setSelectedSymptom(allSelected[0]);

      // Phục hồi lại selectedSymptomsMap cho UI body-map
      setSelectedSymptomsMap(currentMap);

      const newSession: DiagnosisSessionCache = {
        sex,
        age,
        citizenId,
        questionCount: 1,
        selectedSymptoms: currentMap,
        evidence: initialEvidence,
        currentQuestion: translatedQuestion,
        interviewToken: response.interview_token,
        shouldStop: response.should_stop,
        updatedAt: new Date().toISOString(),
      };
      await triageCacheService.saveDiagnosisSession(newSession);

      console.log(`[Triage] Lần 1 hoàn tất, should_stop=${response.should_stop}, token=${response.interview_token}`);

      if (response.should_stop) {
        setShouldStop(true);
      }

      router.push("/(patient)/visit/interview");
    } catch (err: any) {
      console.error("[TriageContext] Lỗi khi bắt đầu chẩn đoán:", err);
      setError(err?.message || "Không thể bắt đầu quá trình chẩn đoán.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Trả lời câu hỏi trong phiên hỏi bệnh (lần 2 trở đi).
   * Evidence được tích lũy dần theo từng lần trả lời.
   */
  const answerQuestion = async (selectedAnswers: Evidence[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const session = await triageCacheService.getDiagnosisSession();
      if (!session) throw new Error("Không tìm thấy phiên làm việc hiện tại. Vui lòng thử lại.");

      // Sử dụng citizenId đã lưu từ bước 1 trong session, fallback về user
      const citizenId = session.citizenId || user?.citizen_id;
      if (!citizenId) throw new Error("Không tìm thấy thông tin CCCD. Vui lòng đăng nhập lại.");

      // Tích lũy evidence: cập nhật nếu đã có id, thêm mới nếu chưa có
      const updatedEvidence = [...session.evidence];
      selectedAnswers.forEach((ans) => {
        const index = updatedEvidence.findIndex((e) => e.id === ans.id);
        if (index > -1) {
          updatedEvidence[index].choice_id = ans.choice_id;
        } else {
          updatedEvidence.push(ans);
        }
      });

      setEvidence(updatedEvidence);

      // Đếm số lần hỏi
      const nextCount = (session.questionCount || 1) + 1;
      console.log(`[Triage] Câu hỏi số ${nextCount}. Gọi diagnose lần ${updatedEvidence.length} evidence, token=${session.interviewToken}`);

      const response = await triageApiService.diagnose({
        citizenId,
        request: { sex: session.sex, age: session.age, evidence: updatedEvidence },
        interviewToken: session.interviewToken,
      });

      // Nếu đã hỏi đủ 5 câu hoặc API tự động dừng
      const isForcedStop = nextCount >= 5 || response.should_stop;

      const translatedQuestion = isForcedStop ? null : await translationService.translateQuestion(response.question);
      setCurrentQuestion(translatedQuestion);
      setInterviewToken(response.interview_token);
      setShouldStop(isForcedStop);

      const updatedSession: DiagnosisSessionCache = {
        ...session,
        evidence: updatedEvidence,
        currentQuestion: translatedQuestion,
        interviewToken: response.interview_token,
        shouldStop: isForcedStop,
        questionCount: nextCount,
        updatedAt: new Date().toISOString(),
      };
      await triageCacheService.saveDiagnosisSession(updatedSession);

      console.log(`[Triage] Kết quả lần này: nextCount=${nextCount}, should_stop=${isForcedStop}, token=${response.interview_token}`);
    } catch (err: any) {
      console.error("[TriageContext] Lỗi khi trả lời câu hỏi:", err);
      setError(err?.message || "Gặp lỗi trong quá trình xử lý câu hỏi.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Gọi API đề xuất chuyên khoa sau khi hoàn tất hỏi bệnh (should_stop = true).
   */
  const triggerRecommendation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await triageCacheService.getDiagnosisSession();
      if (!session) throw new Error("Không tìm thấy phiên làm việc hiện tại.");

      console.log(`[Triage] Gọi recommend_specialist với ${session.evidence.length} evidence`);

      const response = await triageApiService.recommendSpecialist({
        sex: session.sex,
        age: session.age,
        evidence: session.evidence,
      });

      const translatedRec = await translationService.translateRecommendation(response);
      setRecommendation(translatedRec);

      await triageCacheService.saveDiagnosisSession({
        ...session,
        recommendation: translatedRec,
        shouldStop: true,
        updatedAt: new Date().toISOString(),
      });

      console.log("[Triage] Đề xuất chuyên khoa:", translatedRec.recommended_specialist?.nameVi);

      router.push("/(patient)/visit/recommendation");
    } catch (err: any) {
      console.error("[TriageContext] Lỗi khi lấy đề xuất chuyên khoa:", err);
      setError(err?.message || "Không thể lấy đề xuất chuyên khoa khám.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearSession = async (clearSelectedSymptomsMap = true) => {
    setSymptoms([]);
    setSelectedSymptom(null);
    if (clearSelectedSymptomsMap) {
      setSelectedSymptomsMap({});
    }
    setCurrentQuestion(null);
    setEvidence([]);
    setInterviewToken(undefined);
    setRecommendation(null);
    setShouldStop(false);
    setError(null);
    await triageCacheService.clearDiagnosisSession();
    await triageCacheService.clearRecommendationResult();
  };

  return (
    <TriageContext.Provider
      value={{
        selectedRegion,
        symptoms,
        selectedSymptom,
        selectedSymptomsMap,
        currentQuestion,
        evidence,
        interviewToken,
        recommendation,
        shouldStop,
        isLoading,
        error,
        setSelectedRegion,
        searchSymptomsByRegion,
        startDiagnosisSession,
        answerQuestion,
        triggerRecommendation,
        clearSession,
        toggleSymptom,
        getAllSelectedSymptoms,
      }}
    >
      {children}
    </TriageContext.Provider>
  );
};

export const useTriageContext = () => {
  const context = useContext(TriageContext);
  if (!context) {
    throw new Error("useTriageContext phải được sử dụng trong TriageProvider");
  }
  return context;
};
