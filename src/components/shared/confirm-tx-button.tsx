"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ConfirmTxButton({ transactionId }: { transactionId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      const res = await fetch(`/api/transactions/${transactionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm" }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const j = await res.json();
        alert(j.error ?? "確定に失敗しました");
        setLoading(false);
      }
    } catch {
      alert("通信エラー");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleConfirm}
      disabled={loading}
      style={{
        background: "var(--accent)",
        color: "#fff",
        border: "none",
        padding: "3px 8px",
        fontSize: 10,
        fontFamily: "inherit",
        cursor: "pointer",
        borderRadius: 2,
        opacity: loading ? 0.5 : 1,
      }}
    >
      {loading ? "..." : "確定"}
    </button>
  );
}
