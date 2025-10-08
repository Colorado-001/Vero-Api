export type EmailSignupDto = {
  email: string;
};

export type VerifyEmailSignupDto = {
  code: string;
  token: string;
};
