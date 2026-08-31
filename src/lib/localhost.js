const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

export function isLocalhostHostname(hostname = "") {
  const value = (hostname || "").toLowerCase().split(":")[0];
  return LOCAL_HOSTNAMES.has(value);
}

export function isLocalhostRequest(request) {
  const host = request.headers.get("host") || "";
  const hostname = host.split(":")[0];
  return isLocalhostHostname(hostname);
}
