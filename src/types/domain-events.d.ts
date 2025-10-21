export type AllowanceWithdrawnPayloadType = {
  withdrawnBy: string;
  allocationName: string;
  amount: string;
  ownerUserId: string;
};

export type SendVerifyOtpPayloadType = {
  userId: string;
  code: string;
  identifier: string;
  identifierType: "phone" | "email";
  action: "signup" | "login";
};

export type DomainEventSubscription = {
  id: string;
  eventName: string;
  unsubscribe(): void;
};
