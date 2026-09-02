export type ApiErrorBody = {
  error: string;
  details?: unknown;
};

export type ApiSuccess<T> = {
  data: T;
};
