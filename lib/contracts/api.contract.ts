export interface ApiSuccess<T> {
  success: true;
  data: T;
  requestId: string;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiFailure {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
  requestId: string;
}

export type ApiResponse<T> =
  | ApiSuccess<T>
  | ApiFailure;

export function apiSuccess<T>(
  data: T,
  requestId: string,
): ApiSuccess<T> {
  return {
    success: true,
    data,
    requestId,
  };
}

export function apiFailure(
  requestId: string,
  code: string,
  message: string,
  details?: ApiErrorDetail[],
): ApiFailure {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    requestId,
  };
}
