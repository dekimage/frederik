let verifiedForThisPageLoad = false;
let verificationPromise = null;

export function hasVerifiedAdminSession() {
  return typeof window !== "undefined" && verifiedForThisPageLoad;
}

export function markAdminSessionVerified() {
  if (typeof window !== "undefined") verifiedForThisPageLoad = true;
}

export function clearAdminSessionVerification() {
  verifiedForThisPageLoad = false;
  verificationPromise = null;
}

export function verifyAdminSessionOnce() {
  if (hasVerifiedAdminSession()) return Promise.resolve(true);
  if (verificationPromise) return verificationPromise;

  verificationPromise = fetch("/api/admin/auth/verify", {
    cache: "no-store",
    credentials: "same-origin",
  })
    .then((response) => {
      verifiedForThisPageLoad = response.ok;
      return response.ok;
    })
    .catch(() => false)
    .finally(() => {
      verificationPromise = null;
    });

  return verificationPromise;
}
