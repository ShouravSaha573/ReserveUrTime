const API_URL =
  (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function apiFetch(
  path,
  {
    method = "GET",
    body,
    signal,
    timeoutMs = 10000,
    retryGet = true
  } = {}
) {
  const upperMethod = method.toUpperCase();
  const attempts =
    upperMethod === "GET" && retryGet ? 2 : 1;

  let lastError;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(
      () => timeoutController.abort(),
      timeoutMs
    );

    const forwardAbort = () => timeoutController.abort();
    signal?.addEventListener("abort", forwardAbort, {
      once: true
    });

    try {
      const response = await fetch(`${API_URL}${path}`, {
        method: upperMethod,
        credentials: "include",
        headers: {
          ...(body ? { "Content-Type": "application/json" } : {}),
          ...(["POST", "PUT", "PATCH", "DELETE"].includes(upperMethod)
            ? { "X-ReserveUrTime-Request": "1" }
            : {})
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: timeoutController.signal
      });

      clearTimeout(timeoutId);

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new ApiError(
          data.message || "Request failed.",
          response.status,
          data
        );
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;

      if (error instanceof ApiError) {
        throw error;
      }

      if (signal?.aborted) {
        throw error;
      }

      if (attempt < attempts - 1) {
        await sleep(400);
        continue;
      }
    } finally {
      signal?.removeEventListener(
        "abort",
        forwardAbort
      );
    }
  }

  if (!navigator.onLine) {
    throw new ApiError(
      "You appear to be offline. Your safe form data is preserved."
    );
  }

  throw new ApiError(
    lastError?.name === "AbortError"
      ? "The request took too long. Please try again."
      : "Cannot reach the server. Check your connection and try again."
  );
}

export async function apiUpload(
  path,
  file,
  {
    fieldName = "image",
    signal,
    timeoutMs = 20000
  } = {}
) {
  if (!(file instanceof File)) {
    throw new ApiError("Choose an image file first.", 400);
  }

  const formData = new FormData();
  formData.append(fieldName, file);

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);
  const forwardAbort = () => timeoutController.abort();
  signal?.addEventListener("abort", forwardAbort, { once: true });

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "X-ReserveUrTime-Request": "1"
      },
      body: formData,
      signal: timeoutController.signal
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new ApiError(data.message || "Upload failed.", response.status, data);
    }
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (signal?.aborted) throw error;
    throw new ApiError(
      error?.name === "AbortError"
        ? "The image upload took too long. Please try again."
        : "Could not upload the image. Check the connection and try again."
    );
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener("abort", forwardAbort);
  }
}
