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