import { clearAdminSessionVerification } from "@/lib/adminSessionClient";

export async function adminFetch(url, options = {}) {
  const headers = {
    ...(options.headers || {}),
  };

  if (options.body && !headers["Content-Type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "same-origin",
    cache: options.cache || "no-store",
  });

  if (response.status === 401 || response.status === 403) {
    clearAdminSessionVerification();
    if (typeof window !== "undefined") {
      window.location.assign("/admin/login");
    }
  }

  return response;
}
