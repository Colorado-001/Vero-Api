import { TimeBasedSaving } from "../domain/entities";

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

type BaseSavingExecutionEvent = {
  saving: TimeBasedSaving;
};

type SavingExecutionSuccessfulEvent = {
  type: "success";
} & BaseSavingExecutionEvent;

type SavingExecutionFailedEvent = {
  type: "failed";
  error: unknown;
} & BaseSavingExecutionEvent;

export type SavingExecutionEventPayloadType =
  | SavingExecutionSuccessfulEvent
  | SavingExecutionFailedEvent;
