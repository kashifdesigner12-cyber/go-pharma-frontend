const RAW_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const CLEAN_API_URL = String(RAW_API_URL)
  .trim()
  .replace(/\/+$/, "");

const API_URL = CLEAN_API_URL.endsWith("/api")
  ? CLEAN_API_URL
  : `${CLEAN_API_URL}/api`;

/**
 * Parse API response
 */
async function parseResponse(response) {
  let data = null;
  let rawText = "";

  try {
    rawText = await response.text();

    if (rawText) {
      try {
        data = JSON.parse(rawText);
      } catch {
        data = rawText;
      }
    }
  } catch (error) {
    console.error("Response parsing error:", error);
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    if (data && typeof data === "object") {
      if (
        typeof data.message === "string" &&
        data.message.trim()
      ) {
        message = data.message;
      } else if (
        typeof data.error === "string" &&
        data.error.trim()
      ) {
        message = data.error;
      } else if (
        Array.isArray(data.errors) &&
        data.errors.length > 0
      ) {
        message = data.errors
          .map((item) => {
            if (typeof item === "string") {
              return item;
            }

            if (item?.message) {
              return item.message;
            }

            if (item?.msg) {
              return item.msg;
            }

            return JSON.stringify(item);
          })
          .join(", ");
      }
    } else if (
      typeof data === "string" &&
      data.trim()
    ) {
      message = data.trim();
    }

    console.error("========== API ERROR ==========");
    console.error("STATUS:", response.status);
    console.error("STATUS TEXT:", response.statusText);
    console.error("URL:", response.url);
    console.error("RESPONSE:", data);
    console.error("MESSAGE:", message);
    console.error("================================");

    throw new Error(message);
  }

  return data;
}

/**
 * Login
 */
export async function loginUser(email, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email: String(email || "").trim(),
      password,
    }),
  });

  return parseResponse(response);
}

/**
 * Generic API request
 */
export async function apiRequest(endpoint, options = {}) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  let cleanEndpoint = String(endpoint || "").trim();

  if (!cleanEndpoint) {
    throw new Error("API endpoint is required.");
  }

  // Make sure endpoint starts with /
  if (!cleanEndpoint.startsWith("/")) {
    cleanEndpoint = `/${cleanEndpoint}`;
  }

  // Prevent /api/api/...
  if (
    cleanEndpoint === "/api" ||
    cleanEndpoint.startsWith("/api/")
  ) {
    cleanEndpoint = cleanEndpoint.substring(4);

    if (!cleanEndpoint.startsWith("/")) {
      cleanEndpoint = `/${cleanEndpoint}`;
    }
  }

  const url = `${API_URL}${cleanEndpoint}`;

  const headers = {
    Accept: "application/json",
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
    ...(options.headers || {}),
  };

  const isFormData =
    typeof FormData !== "undefined" &&
    options.body instanceof FormData;

  const requestOptions = {
    ...options,
    headers,
  };

  /**
   * Convert normal JavaScript objects to JSON.
   *
   * Example:
   * body: {
   *   quantity: 10
   * }
   *
   * becomes:
   * {"quantity":10}
   */
  if (
    options.body !== undefined &&
    options.body !== null &&
    !isFormData
  ) {
    const isPlainObject =
      typeof options.body === "object" &&
      !(options.body instanceof Blob) &&
      !(options.body instanceof ArrayBuffer);

    if (isPlainObject) {
      if (!headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
      }

      requestOptions.body = JSON.stringify(options.body);
    }
  }

  console.log("========== API REQUEST ==========");
  console.log(
    "METHOD:",
    requestOptions.method || "GET"
  );
  console.log("URL:", url);
  console.log("HAS TOKEN:", Boolean(token));

  if (requestOptions.body) {
    console.log("BODY:", requestOptions.body);
  }

  console.log("=================================");

  try {
    const response = await fetch(url, requestOptions);

    return await parseResponse(response);
  } catch (error) {
    console.error("========== FETCH ERROR ==========");
    console.error("URL:", url);
    console.error("ERROR:", error);
    console.error("MESSAGE:", error?.message);
    console.error("=================================");

    throw error;
  }
}

export { API_URL };