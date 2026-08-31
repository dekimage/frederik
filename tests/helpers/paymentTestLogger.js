const PREFIX = "[payment-test]";

function isQuiet() {
  return process.env.PAYMENT_TEST_QUIET === "1" || process.env.PAYMENT_TEST_QUIET === "true";
}

function safeJson(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function logSection(title) {
  if (isQuiet()) return;
  console.log(`\n${PREFIX} ═══ ${title} ═══`);
}

export function logStep(message, details = null) {
  if (isQuiet()) return;
  console.log(`${PREFIX}   → ${message}`);
  if (details != null) {
    console.log(
      `${PREFIX}     ${safeJson(details).split("\n").join(`\n${PREFIX}     `)}`
    );
  }
}

export function logResult(label, value) {
  if (isQuiet()) return;
  if (value != null && typeof value === "object") {
    logStep(`result: ${label}`, value);
    return;
  }
  console.log(`${PREFIX}   ✓ ${label}: ${value}`);
}

export function logWarning(message) {
  if (isQuiet()) return;
  console.warn(`${PREFIX}   ⚠ ${message}`);
}

export function logTestStart(testName, { scenario, asserts, notTested = [] } = {}) {
  if (isQuiet()) return;
  logSection(`START: ${testName}`);
  if (scenario) logStep("scenario", scenario);
  if (asserts?.length) logStep("will assert", asserts);
  if (notTested?.length) {
    for (const note of notTested) {
      logWarning(`NOT covered by this test: ${note}`);
    }
  }
}

export function logTestEnd(testName) {
  if (isQuiet()) return;
  logSection(`PASSED: ${testName}`);
}
