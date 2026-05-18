import type { DocumentDetail, DocumentSummary } from "@contractlens/shared";

const SERVER_API_BASE = process.env.API_ORIGIN ?? "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: unknown,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isServer = typeof window === "undefined";
  let url: string;
  const headers: Record<string, string> = {
    ...((init?.headers as Record<string, string>) ?? {}),
  };

  if (isServer) {
    url = `${SERVER_API_BASE}/api${path}`;
    try {
      const { headers: nextHeaders } = await import("next/headers");
      const cookie = nextHeaders().get("cookie");
      if (cookie) headers.cookie = cookie;
    } catch {
      /* not in request scope */
    }
  } else {
    url = `/api${path}`;
  }

  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    let body: unknown = await res.text().catch(() => "");
    try {
      body = JSON.parse(body as string);
    } catch {
      /* keep text */
    }
    throw new ApiError(
      typeof body === "object" && body && "message" in body
        ? String((body as { message: unknown }).message)
        : `API ${res.status}`,
      res.status,
      body,
    );
  }
  return res.json() as Promise<T>;
}

export async function uploadDocument(file: File): Promise<DocumentSummary> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`/api/documents/upload`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    let body: unknown = await res.text().catch(() => "");
    try {
      body = JSON.parse(body as string);
    } catch {
      /* keep text */
    }
    throw new ApiError(
      typeof body === "object" && body && "message" in body
        ? String((body as { message: unknown }).message)
        : `Upload failed: ${res.status}`,
      res.status,
      body,
    );
  }
  return res.json();
}

export function listDocuments(): Promise<DocumentSummary[]> {
  return request<DocumentSummary[]>("/documents", { cache: "no-store" });
}

export function getDocument(id: string): Promise<DocumentDetail> {
  return request<DocumentDetail>(`/documents/${id}`, { cache: "no-store" });
}
