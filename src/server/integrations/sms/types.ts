// SMS adapter contract. Swapping the mock for a real BD provider
// (BulkSMSBD / Alpha) is a one-file change — see ./index.ts.

export type SmsTemplate =
  | "otp"
  | "order_confirmed"
  | "order_dispatched"
  | "order_delivered"
  | "restocked";

export interface SmsMessage {
  /** Recipient in +8801XXXXXXXXX form. */
  to: string;
  template: SmsTemplate;
  text: string;
}

export interface SmsResult {
  ok: boolean;
  providerMessageId?: string;
  error?: string;
}

export interface SmsAdapter {
  readonly name: string;
  send(message: SmsMessage): Promise<SmsResult>;
}
