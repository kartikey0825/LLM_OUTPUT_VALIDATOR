import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000",
  timeout: 30000
});

function friendlyError(error: unknown): Error {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message || error.message || "API request failed";
    return new Error(message);
  }
  return error instanceof Error ? error : new Error("Unexpected error");
}

export async function getSchemas() {
  try {
    const { data } = await api.get("/api/schemas");
    return data.schemas;
  } catch (error) {
    throw friendlyError(error);
  }
}

export async function createSchema(payload: unknown) {
  try {
    const { data } = await api.post("/api/schemas", payload);
    return data.schema;
  } catch (error) {
    throw friendlyError(error);
  }
}

export async function deleteSchema(name: string) {
  try {
    const { data } = await api.delete(`/api/schemas/${name}`);
    return data;
  } catch (error) {
    throw friendlyError(error);
  }
}

export async function runValidatedCall(payload: unknown) {
  try {
    const { data, status } = await api.post("/api/call", payload, { validateStatus: () => true });

    // A 422 from /api/call can be a legitimate validation failure result.
    // Request-shape errors, missing schemas, provider failures, and server errors should be shown as UI errors.
    if (status >= 400 && !data?.attempts) {
      throw new Error(data?.message || data?.error || "Validation request failed");
    }

    return data;
  } catch (error) {
    throw friendlyError(error);
  }
}

export async function getMetrics() {
  try {
    const { data } = await api.get("/api/metrics");
    return data;
  } catch (error) {
    throw friendlyError(error);
  }
}

export async function getFailures() {
  try {
    const { data } = await api.get("/api/failures");
    return data;
  } catch (error) {
    throw friendlyError(error);
  }
}
