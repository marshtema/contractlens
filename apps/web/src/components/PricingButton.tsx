"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export function PricingButton({
  plan,
  featured,
  children,
}: {
  plan: "free" | "pro" | "business" | "enterprise";
  featured: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function choose() {
    setBusy(true);
    try {
      // Проверяем авторизацию
      const me = await fetch("/api/auth/me", { cache: "no-store" })
        .then((r) => r.json())
        .catch(() => ({ user: null }));
      if (!me.user) {
        router.push("/login");
        return;
      }

      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push("/documents");
      router.refresh();
    } catch (err) {
      alert(`Не удалось переключить тариф: ${err instanceof Error ? err.message : err}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={choose}
      disabled={busy}
      className={cn(
        "mt-6 w-full",
        featured ? "btn-primary" : "btn-ghost",
        busy && "opacity-60",
      )}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </button>
  );
}
