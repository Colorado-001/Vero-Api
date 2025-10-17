export type UserDto = {
  id: string;
  email: string;
  username: string | null;
  address: string;
  enabled: boolean;
  deployed: boolean;
  implementation: string;
  pinSetup: boolean;
  qr: string | null;
};

export type UpdateUserProfileDto = {
  username?: string | null;
};

export type UsernameAvailabilityResDto = {
  isAvailable: boolean;
  isYou: boolean;
};
