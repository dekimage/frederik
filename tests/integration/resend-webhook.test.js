import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";

const state = vi.hoisted(() => ({ delivery: {} }));
vi.mock("@/app/firebaseAdmin", () => {
  const ref = { id: "order-1" };
  return {
    firestore: {
      collection: () => ({
        doc: () => ref,
        where: (key) => ({
          limit: () => ({
            get: async () => ({
              docs: key.includes("customer") ? [{ ref }] : [],
            }),
          }),
        }),
      }),
      runTransaction: async (callback) =>
        callback({
          get: async () => ({
            exists: true,
            data: () => ({ emailDelivery: structuredClone(state.delivery) }),
          }),
          update: (_ref, fields) => {
            for (const [key, value] of Object.entries(fields))
              state.delivery[key.split(".")[1]] = value;
          },
        }),
    },
  };
});
const { POST } = await import("@/app/api/resend/webhook/route");
const secret = Buffer.from("local-webhook-test-secret");
function request(type = "email.delivered", date = new Date(), valid = true) {
  const body = JSON.stringify({
    type,
    created_at: date.toISOString(),
    data: { email_id: "email-1" },
  });
  const id = "msg_test";
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHmac("sha256", secret)
    .update(`${id}.${timestamp}.${body}`)
    .digest("base64");
  return new Request("http://localhost/api/resend/webhook", {
    method: "POST",
    body,
    headers: {
      "svix-id": id,
      "svix-timestamp": timestamp,
      "svix-signature": valid ? `v1,${signature}` : "v1,invalid",
    },
  });
}
beforeEach(() => {
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.stubEnv("RESEND_WEBHOOK_SECRET", `whsec_${secret.toString("base64")}`);
  state.delivery = { customer: { id: "email-1", status: "accepted" } };
});
describe("Resend signed delivery events", () => {
  it("records delivery only for an authenticated webhook", async () => {
    expect((await POST(request())).status).toBe(200);
    expect(state.delivery.customer.status).toBe("delivered");
    expect(state.delivery.customer.id).toBe("email-1");
  });
  it("rejects invalid signatures", async () => {
    expect(
      (await POST(request("email.delivered", new Date(), false))).status,
    ).toBe(400);
    expect(state.delivery.customer.status).toBe("accepted");
  });
  it("does not let older events overwrite a newer state", async () => {
    const now = new Date();
    await POST(request("email.delivered", now));
    await POST(request("email.sent", new Date(now.getTime() - 1000)));
    expect(state.delivery.customer.status).toBe("delivered");
  });
  it("records bounced messages independently of the original API acceptance", async () => {
    await POST(request("email.bounced"));
    expect(state.delivery.customer.status).toBe("bounced");
  });
});
