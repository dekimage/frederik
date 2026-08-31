import { auth } from "@/firebase";

export async function adminFetch(url, options = {}) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Not authenticated");
  }

  const token = await user.getIdToken();
  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  };

  if (options.body && !headers["Content-Type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
