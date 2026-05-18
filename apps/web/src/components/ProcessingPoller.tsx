"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function ProcessingPoller({ id }: { id: string }) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/documents/${id}`, { cache: "no-store" });
        if (!res.ok) return;
        const doc = await res.json();
        if (doc.status !== "processing") {
          router.refresh();
        }
      } catch {
        // network blip — keep polling
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [id, router]);

  return (
    <div className="mt-8 rounded-md border border-neutral-200 bg-white p-6 text-center">
      <div className="text-base font-medium text-neutral-900">
        Анализируем документ…
      </div>
      <div className="mt-1 text-sm text-neutral-500">
        Обычно занимает 10–30 секунд. Страница обновится сама.
      </div>
    </div>
  );
}
