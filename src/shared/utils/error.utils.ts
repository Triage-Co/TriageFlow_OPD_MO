import axios from "axios";

export function getErrorMessage(
  error: unknown,
  fallback = "Đã có lỗi xảy ra. Vui lòng thử lại."
): string {
  if (!error) return fallback;

  if (axios.isAxiosError(error)) {
    const serverMsg = error.response?.data?.message;
    if (typeof serverMsg === "string" && serverMsg.trim()) {
      return serverMsg;
    }
  }

  if (error instanceof Error && error.message?.trim()) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const anyErr = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    if (
      typeof anyErr.response?.data?.message === "string" &&
      anyErr.response.data.message.trim()
    ) {
      return anyErr.response.data.message;
    }
    if (typeof anyErr.message === "string" && anyErr.message.trim()) {
      return anyErr.message;
    }
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return fallback;
}
