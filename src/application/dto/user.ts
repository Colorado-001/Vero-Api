export type UserDto = {
  id: string;
  email: string;
  username: string | null;
  address: string;
  enabled: boolean;
  deployed: boolean;
  implementation: string;
  pinSetup: boolean;
};

export type UpdateUserProfileDto = {
  username?: string | null;
};
