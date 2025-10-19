export type WebhookConfig<T extends object> = {
  id: string;
  method: "POST";
  url: string;
  headers: {
    "Content-Type": "application/json";
    "X-Api-Key": string;
  };
  body: T;
  timeout: number;
};

export type TriggerSaveWebhook = {
  savingsId: string;
};
