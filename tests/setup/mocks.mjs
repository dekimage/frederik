import { vi } from "vitest";

vi.mock("@/app/api/checkout-session/email", () => ({
  sendOrderPaidEmails: vi.fn(async () => undefined),
}));
