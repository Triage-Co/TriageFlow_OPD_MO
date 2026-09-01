import {
  LoginCitizenRequest,
  LoginEmailRequest,
  LoginResponse,
  RefreshTokenResponse,
  UserProfile,
} from "@/features/auth/types/auth.types";
import apiClient from "@/shared/services/api-client";

export function decodeSupabaseJwt(token: string): UserProfile | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const atobFunc = (str: string) => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
      let output = "";
      str = str.replace(/=+$/, "");
      for (let bc = 0, bs = 0, buffer, i = 0; i < str.length; i++) {
        const char = str.charAt(i);
        const idx = chars.indexOf(char);
        if (idx === -1) continue;
        buffer = bc % 4 ? (buffer ?? 0) * 64 + idx : idx;
        if (bc++ % 4) {
          output += String.fromCharCode(255 & (buffer >> ((-2 * bc) & 6)));
        }
      }
      return output;
    };

    const decodedStr = atobFunc(base64);
    const jsonPayload = decodeURIComponent(
      decodedStr
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    const metadata = payload.user_metadata || {};
    const appRole: string = (metadata.role || "").toUpperCase();

    if (appRole !== "USER") {
      console.warn("[Auth] Tài khoản không có quyền truy cập Patient App. Role:", appRole);
      return null;
    }

    return {
      id: payload.sub || "",
      avatar: metadata.avatar || "",
      full_name: metadata.full_name || metadata.user_name || metadata.username || payload.email?.split("@")[0] || "Bệnh nhân",
      email: payload.email || metadata.email,
      phone: metadata.phone || metadata.phone_number || "",
      citizen_id: metadata.citizen_id || "",
      dob: metadata.dob ? metadata.dob.split("T")[0] : "",
      gender: metadata.gender || undefined,
      role: appRole,
    };
  } catch (error) {
    console.error("Lỗi giải mã JWT:", error);
    return null;
  }
}

export const loginService = {

  async loginWithEmail(data: LoginEmailRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>("/api/auth/login", data);
    return response.data;
  },

  async loginWithCitizen(data: LoginCitizenRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>("/api/auth/login/citizen", data);
    return response.data;
  },

  async refreshAccessToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const response = await apiClient.post<RefreshTokenResponse>("/api/auth/refresh", {
      refreshToken,
    });
    return response.data;
  },

  async logout(token: string): Promise<void> {
    try {
      await apiClient.post("/api/auth/logout", { token });
    } catch {
      await apiClient.post("/auth/logout", { token });
    }
  },
};
