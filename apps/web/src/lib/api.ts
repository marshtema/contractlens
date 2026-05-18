import type { DocumentDetail, DocumentSummary } from "@contractlens/shared";

const API_BASE =
  typeof window === "undefined"
    ? process.env.API_ORIGIN ?? "http://localhost:3001"
    : "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `API ${res.status} ${res.statusText}${body ? `: ${body}` : ""}`,
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
    const body = await res.text().catch(() => "");
    throw new Error(
      `Upload failed: ${res.status} ${res.statusText}${body ? ` — ${body}` : ""}`,
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
