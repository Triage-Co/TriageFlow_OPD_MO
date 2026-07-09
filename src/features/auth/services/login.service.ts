import {
  LoginCitizenRequest,
  LoginEmailRequest,
  LoginResponse,
  RefreshTokenResponse,
  UserProfile,
} from "@/features/auth/types/auth.types";
import apiClient from "@/shared/services/api-client";

/**
 * Giải mã JWT của Supabase để lấy thông tin user_metadata.
 * Trả về null nếu token không hợp lệ HOẶC role trong user_metadata !== "USER".
 * Điều này ngăn tài khoản staff/admin đăng nhập vào Patient App.
 */
export function decodeSupabaseJwt(token: string): UserProfile | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

    // Hàm giải mã base64 hỗ trợ môi trường React Native không có atob
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

    // ── Role guard ──────────────────────────────────────────────────────────
    // role thực sự của ứng dụng nằm trong user_metadata, không phải root role
    // Root payload.role luôn là "authenticated" (do Supabase set), nên ta đọc
    // user_metadata.role để phân biệt USER / STAFF / ADMIN, v.v.
    const metadata = payload.user_metadata || {};
    const appRole: string = (metadata.role || "").toUpperCase();

    if (appRole !== "USER") {
      // Tài khoản không phải USER (staff, admin, ...) không được vào Patient App
      console.warn("[Auth] Tài khoản không có quyền truy cập Patient App. Role:", appRole);
      return null;
    }

    return {
      id: payload.sub || "",
      full_name: metadata.full_name || metadata.user_name || metadata.username || payload.email?.split("@")[0] || "Bệnh nhân",
      email: payload.email || metadata.email,
      phone: metadata.phone || metadata.phone_number || "",
      citizen_id: metadata.citizen_id || "",
      // Ngày sinh trả về từ API dạng YYYY-MM-DDT00:00:00.000Z -> cần lấy phần ngày YYYY-MM-DD
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
  /**
   * Đăng nhập bằng Email + Mật khẩu
   * POST /api/auth/login
   */
  async loginWithEmail(data: LoginEmailRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>("/api/auth/login", data);
    return response.data;
  },

  /**
   * Đăng nhập bằng CCCD + Mật khẩu
   * POST /api/auth/login/citizen
   */
  async loginWithCitizen(data: LoginCitizenRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>("/api/auth/login/citizen", data);
    return response.data;
  },

  /**
   * Refresh Token
   * POST /api/auth/refresh
   */
  async refreshAccessToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const response = await apiClient.post<RefreshTokenResponse>("/api/auth/refresh", {
      refreshToken,
    });
    return response.data;
  },

  /**
   * Đăng xuất
   * POST /api/auth/logout hoặc /auth/logout
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post("/api/auth/logout");
    } catch {
      await apiClient.post("/auth/logout");
    }
  },
};
