export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export async function api<T>(
  callback: () => Promise<T>
): Promise<ApiResponse<T>> {
  try {
    const data = await callback();

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      data: null as T,
      message:
        error instanceof Error
          ? error.message
          : "Unknown Error",
    };
  }
}

export async function safeResponseJson<T = any>(
  response: Response
): Promise<T> {
  const text = await response.text();
  let payload: any;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    const statusInfo = response.status
      ? ` (Status ${response.status}${response.statusText ? `: ${response.statusText}` : ""})`
      : "";
    throw new Error(
      !response.ok
        ? `Server error${statusInfo}`
        : "Invalid JSON response from server"
    );
  }
  if (!response.ok || (payload && payload.success === false)) {
    throw new Error(
      payload?.error?.message ??
        payload?.message ??
        `Request failed (${response.status})`
    );
  }
  return payload;
}

export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, init);
  return safeResponseJson<T>(response);
}
