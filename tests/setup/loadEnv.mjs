import fs from "node:fs";
import path from "node:path";
import { config as loadEnv } from "dotenv";

const root = process.cwd();
const envLocal = path.join(root, ".env.local");
const envFile = path.join(root, ".env");

if (fs.existsSync(envLocal)) {
  loadEnv({ path: envLocal });
} else if (fs.existsSync(envFile)) {
  loadEnv({ path: envFile });
}

if (!process.env.NEXT_PUBLIC_URL) {
  process.env.NEXT_PUBLIC_URL = "http://localhost:3000";
}

const required = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
];

for (const key of required) {
  if (!process.env[key]) {
    console.warn(`[payment tests] Missing env var: ${key}`);
  }
}

if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith("sk_test_")) {
  throw new Error(
    "Payment integration tests require Stripe TEST keys (sk_test_...). Aborting."
  );
}
