const assert = require("node:assert/strict");
const { generateKeyPairSync } = require("node:crypto");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

// Vercel's module loader rejects require(ESM), even on Node 24. Exercise the
// built API routes with that feature disabled. Use generated test credentials;
// these requests must return before making any authenticated database calls.
const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const env = {
  ...process.env,
  FIREBASE_PROJECT_ID: "demo-runtime-check",
  FIREBASE_CLIENT_EMAIL:
    "runtime-check@demo-runtime-check.iam.gserviceaccount.com",
  FIREBASE_PRIVATE_KEY: privateKey.export({ type: "pkcs8", format: "pem" }),
};
const checks = [
  { route: "api/admin/orders", method: "GET", expected: 401 },
  {
    route: "api/checkout-session",
    method: "POST",
    expected: 400,
    body: { cartItems: [] },
  },
];
for (const { route, method, expected, body } of checks) {
  const file = path.resolve(".next/server/app", route, "route.js");
  const requestOptions = {
    method,
    ...(body
      ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
  };
  const script = `
    (async () => {
      const mod = require(${JSON.stringify(file)});
      await mod.routeModule.ensureUserland();
      const response = await mod.routeModule.userland.${method}(
        new Request("http://localhost/${route}", ${JSON.stringify(requestOptions)})
      );
      if (response.status !== ${expected}) throw new Error("Unexpected status: " + response.status);
      console.log("PASS ${route}: ${expected}");
    })().catch(error => { console.error(error.stack); process.exitCode = 1; });
  `;
  const result = spawnSync(
    process.execPath,
    ["--no-experimental-require-module", "-e", script],
    { env, encoding: "utf8" },
  );
  process.stdout.write(result.stdout || "");
  process.stderr.write(result.stderr || "");
  assert.equal(result.status, 0, `${route} failed its runtime startup check`);
}
