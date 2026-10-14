export async function adminFetch(url, options = {}) {
  const headers = {
    ...(options.headers || {}),
  };

  if (options.body && !headers["Content-Type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: "same-origin",
    cache: options.cache || "no-store",
  });
}
