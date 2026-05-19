"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { useToast } from "./Toast";

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
  const toast = useToast();

  async function choose() {
    setBusy(true);
    try {
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
      const data = (await res.json()) as {
        mode: "stripe" | "dev_mock" | "instant" | "contact_sales";
        url?: string;
        message?: string;
      };

      if (data.mode === "stripe" && data.url) {
        window.location.href = data.url;
        return;
      }
      if (data.mode === "contact_sales") {
        toast.push("info", "Enterprise", data.message ?? "Свяжитесь с нами.");
        return;
      }
      toast.push(
        "success",
        plan === "free" ? "Тариф снижен до Free" : `Тариф ${plan.toUpperCase()} активирован`,
        data.mode === "dev_mock"
          ? "Test-mode: без оплаты. Stripe включится при добавлении ключа."
          : undefined,
      );
      router.refresh();
    } catch (err) {
      toast.push(
        "error",
        "Не удалось переключить тариф",
        err instanceof Error ? err.message : "неизвестная ошибка",
      );
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
