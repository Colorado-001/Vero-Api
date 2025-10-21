export type OtpType = "emailSignup" | "login";

export type EmailSignupOtpData = {
  email: string;
};

export type PageOptions = {
  page: number;
  size: number;
};

export interface PageResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
