import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { BodyRegion } from "@/features/body-map/types";
import { useAuthContext } from "@/features/auth/context/AuthContext";
import { triageApiService } from "../services/triage-api.service";
import { triageCacheService } from "../services/triage-cache.service";
import { translationService } from "../services/translation.service";
import {
  Evidence,
  TranslatedSymptomSearchItem,
  DiagnosisQuestion,
  RecommendSpecialistResponse,
  PatientSex,
  DiagnosisSessionCache,
} from "../types/triage.types";

type TriageContextType = {
  selectedRegion: BodyRegion | null;
  symptoms: TranslatedSymptomSearchItem[];
  selectedSymptom: TranslatedSymptomSearchItem | null;
  currentQuestion: DiagnosisQuestion | null;
  evidence: Evidence[];
  interviewToken: string | undefined;
  recommendation: RecommendSpecialistResponse | null;
  isLoading: boolean;
  error: string | null;
  setSelectedRegion: (region: BodyRegion | null) => void;
  searchSymptomsByRegion: (params: { age: number; searchPhrase: string; fallbackSearchPhrases?: string[] }) => Promise<void>;
  startDiagnosis: (symptom: TranslatedSymptomSearchItem) => Promise<void>;
  answerQuestion: (selectedAnswers: Evidence[]) => Promise<void>;
  recommendSpecialist: () => Promise<void>;
  clearSession: () => Promise<void>;
};

const TriageContext = createContext<TriageContextType | undefined>(undefined);

export const TriageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const { user } = useAuthContext();

  const [selectedRegion, setSelectedRegionState] = useState<BodyRegion | null>(null);
  const [symptoms, setSymptoms] = useState<TranslatedSymptomSearchItem[]>([]);
  const [selectedSymptom, setSelectedSymptom] = useState<TranslatedSymptomSearchItem | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<DiagnosisQuestion | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [interviewToken, setInterviewToken] = useState<string | undefined>(undefined);
  const [recommendation, setRecommendation] = useState<RecommendSpecialistResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Khôi phục session chẩn đoán (nếu có) khi provider mount lần đầu
  useEffect(() => {
    const loadSession = async () => {
      try {
        const session = await triageCacheService.getDiagnosisSession();
        if (session) {
          setEvidence(session.evidence);
          setInterviewToken(session.interviewToken);
          setCurrentQuestion(session.currentQuestion || null);
          setSelectedSymptom(session.selectedSymptom || null);
          setRecommendation(session.recommendation || null);
        }
      } catch (err) {
        console.error("Lỗi phục hồi session chẩn đoán:", err);
      }
    };
    loadSession();
  }, []);

  const setSelectedRegion = (region: BodyRegion | null) => {
    setSelectedRegionState(region);
  };

  const searchSymptomsByRegion = async (params: {
    age: number;
    searchPhrase: string;
    fallbackSearchPhrases?: string[];
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const phrasesToTry = [
        params.searchPhrase,
        ...(params.fallbackSearchPhrases ?? []),
      ];

      console.log("[Triage] Search phrases to try:", phrasesToTry);

      // Thử tìm trong cache trước cho toàn bộ danh sách phrases
      for (const phrase of phrasesToTry) {
        const cached = await triageCacheService.getCachedSymptoms(params.age, phrase);
        if (cached && cached.length > 0) {
          console.log(`[Triage] Found cached symptoms for phrase "${phrase}"`);
          setSymptoms(cached);
          setIsLoading(false);
          return;
        }
      }

      // Nếu không có cache, bắt đầu gọi API theo thứ tự thử các phrases
      let finalResults: any[] = [];
      let successfulPhrase = "";

      for (const phrase of phrasesToTry) {
        console.log(`[Triage] Calling API search for phrase "${phrase}"`);
        const results = await triageApiService.searchSymptoms({
          age: params.age,
          phrase: phrase,
        });

        if (Array.isArray(results) && results.length > 0) {
          finalResults = results;
          successfulPhrase = phrase;
          break; // Tìm thấy triệu chứng, dừng thử
        }
      }

      if (finalResults.length > 0) {
        const translated = await translationService.translateSymptomItems(finalResults);
        // Chỉ cache với phrase nào thực sự trả về data
        await triageCacheService.setCachedSymptoms(params.age, successfulPhrase, translated);
        setSymptoms(translated);
      } else {
        setSymptoms([]);
      }
    } catch (err: any) {
      console.error("Lỗi khi tìm triệu chứng:", err);
      setError(err?.message || "Không thể tìm kiếm triệu chứng. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const startDiagnosis = async (symptom: TranslatedSymptomSearchItem) => {
    setIsLoading(true);
    setError(null);
    setSelectedSymptom(symptom);

    try {
      // Clear session cũ
      await clearSession();
      setSelectedSymptom(symptom);

      // TODO: Ưu tiên lấy giới tính thực tế từ tài khoản người dùng đã đăng nhập.
      // Hiện tại lấy trường 'gender' từ auth context (MALE/FEMALE).
      let sex: PatientSex = "male";
      if (user?.gender) {
        sex = user.gender.toLowerCase() === "female" ? "female" : "male";
      }

      // TODO: Tuổi tạm thời hardcode là 30 theo đặc tả, sau này lấy từ thông tin ngày sinh (user.dob)
      const age = 30;

      const initialEvidence: Evidence[] = [{ id: symptom.id, choice_id: "present" }];
      setEvidence(initialEvidence);

      const response = await triageApiService.diagnose({
        request: {
          sex,
          age,
          evidence: initialEvidence,
        },
      });

      const translatedQuestion = await translationService.translateQuestion(response.question);
      setCurrentQuestion(translatedQuestion);
      setInterviewToken(response.interview_token);

      // Lưu cache phiên hỏi bệnh lần đầu
      const newSession: DiagnosisSessionCache = {
        sex,
        age,
        selectedSymptom: symptom,
        evidence: initialEvidence,
        currentQuestion: translatedQuestion,
        interviewToken: response.interview_token,
        shouldStop: response.should_stop,
        updatedAt: new Date().toISOString(),
      };
      await triageCacheService.saveDiagnosisSession(newSession);

      if (response.should_stop) {
        // Nếu dừng ngay từ lần đầu thì chuyển sang recommend
        await performRecommendSpecialist(sex, age, initialEvidence);
      } else {
        router.push("/(patient)/visit/interview");
      }
    } catch (err: any) {
      console.error("Lỗi khi khởi chạy chẩn đoán:", err);
      setError(err?.message || "Không thể bắt đầu quá trình chẩn đoán.");
    } finally {
      setIsLoading(false);
    }
  };

  const answerQuestion = async (selectedAnswers: Evidence[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const session = await triageCacheService.getDiagnosisSession();
      if (!session) {
        throw new Error("Không tìm thấy phiên làm việc hiện tại. Vui lòng thử lại.");
      }

      // Hợp nhất evidence hiện tại và câu trả lời mới (upsert theo id)
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

      const response = await triageApiService.diagnose({
        request: {
          sex: session.sex,
          age: session.age,
          evidence: updatedEvidence,
        },
        interviewToken: session.interviewToken,
      });

      const translatedQuestion = await translationService.translateQuestion(response.question);
      setCurrentQuestion(translatedQuestion);
      setInterviewToken(response.interview_token);

      const updatedSession: DiagnosisSessionCache = {
        ...session,
        evidence: updatedEvidence,
        currentQuestion: translatedQuestion,
        interviewToken: response.interview_token,
        shouldStop: response.should_stop,
        updatedAt: new Date().toISOString(),
      };
      await triageCacheService.saveDiagnosisSession(updatedSession);

      if (response.should_stop) {
        // Thực hiện lấy đề xuất chuyên khoa và chuyển sang màn recommendation
        await performRecommendSpecialist(session.sex, session.age, updatedEvidence);
      }
    } catch (err: any) {
      console.error("Lỗi khi trả lời câu hỏi:", err);
      setError(err?.message || "Gặp lỗi trong quá trình xử lý câu hỏi.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper thực tế gọi API đề xuất chuyên khoa
  const performRecommendSpecialist = async (
    sex: PatientSex,
    age: number,
    finalEvidence: Evidence[]
  ) => {
    try {
      const response = await triageApiService.recommendSpecialist({
        sex,
        age,
        evidence: finalEvidence,
      });

      const translatedRec = await translationService.translateRecommendation(response);
      setRecommendation(translatedRec);

      // Cập nhật lại session cache có kèm recommendation
      const session = await triageCacheService.getDiagnosisSession();
      if (session) {
        await triageCacheService.saveDiagnosisSession({
          ...session,
          shouldStop: true,
          recommendation: translatedRec,
          updatedAt: new Date().toISOString(),
        });
      }

      router.push("/(patient)/visit/recommendation");
    } catch (err: any) {
      console.error("Lỗi khi lấy đề xuất chuyên khoa:", err);
      setError(err?.message || "Không thể lấy đề xuất chuyên khoa khám.");
    }
  };

  const recommendSpecialist = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await triageCacheService.getDiagnosisSession();
      if (!session) {
        throw new Error("Không tìm thấy phiên làm việc hiện tại.");
      }
      await performRecommendSpecialist(session.sex, session.age, evidence);
    } catch (err: any) {
      setError(err?.message || "Gặp lỗi khi lấy đề xuất chuyên khoa.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearSession = async () => {
    setSymptoms([]);
    setSelectedSymptom(null);
    setCurrentQuestion(null);
    setEvidence([]);
    setInterviewToken(undefined);
    setRecommendation(null);
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
        currentQuestion,
        evidence,
        interviewToken,
        recommendation,
        isLoading,
        error,
        setSelectedRegion,
        searchSymptomsByRegion,
        startDiagnosis,
        answerQuestion,
        recommendSpecialist,
        clearSession,
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
