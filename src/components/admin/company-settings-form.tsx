"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  initialSubsidyPct: number;
  initialMonthlyPoints: number;
}

export default function CompanySettingsForm({ initialSubsidyPct, initialMonthlyPoints }: Props) {
  const router = useRouter();
  const [subsidyPct, setSubsidyPct] = useState(initialSubsidyPct);
  const [monthlyPoints, setMonthlyPoints] = useState(initialMonthlyPoints);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subsidyPct, monthlyPoints }),
      });
      const j = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: j.error ?? "保存に失敗しました" });
        return;
      }
      setMessage({ type: "ok", text: "設定を保存しました" });
      router.refresh();
    } catch {
      setMessage({ type: "err", text: "通信エラー" });
    } finally {
      setSaving(false);
    }
  }

  const examplePrice = 10000;
  const subsidyYen = Math.floor(examplePrice * (subsidyPct / 100));
  const employeeYen = examplePrice - subsidyYen;
  const subsidyPt = Math.floor(subsidyYen / 1000);
  const monthlyBudgetYen = monthlyPoints * 1000;

  return (
    <form onSubmit={save}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
        <div>
          <label style={labelStyle}>
            補助率 <span style={{ color: "var(--accent)" }}>*</span>
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="number"
              min={1}
              max={100}
              value={subsidyPct}
              onChange={(e) => setSubsidyPct(Math.min(100, Math.max(1, Number(e.target.value))))}
              style={{ ...inputStyle, width: 80 }}
            />
            <span style={{ fontSize: 16, fontWeight: 600 }}>%</span>
          </div>
          <div style={hintStyle}>
            サービス料金に対して会社が補助する割合 (1〜100%)
          </div>
        </div>

        <div>
          <label style={labelStyle}>
            月次付与ポイント / 人 <span style={{ color: "var(--accent)" }}>*</span>
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="number"
              min={0}
              max={200}
              value={monthlyPoints}
              onChange={(e) => setMonthlyPoints(Math.min(200, Math.max(0, Number(e.target.value))))}
              style={{ ...inputStyle, width: 80 }}
            />
            <span style={{ fontSize: 16, fontWeight: 600 }}>pt</span>
          </div>
          <div style={hintStyle}>
            1pt = 1,000円 / 月初に全従業員へ自動付与
          </div>
        </div>
      </div>

      {/* シミュレーション */}
      <div
        style={{
          background: "var(--bg)",
          border: "1px solid var(--line)",
          borderLeft: "3px solid var(--matcha)",
          padding: "14px 16px",
          marginBottom: 16,
          fontSize: 12,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 8, color: "var(--matcha)" }}>
          設定プレビュー（¥10,000のサービスを利用した場合）
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <div style={previewBoxStyle}>
            <div style={previewLabelStyle}>定価</div>
            <div style={previewValueStyle}>¥{examplePrice.toLocaleString()}</div>
          </div>
          <div style={{ ...previewBoxStyle, background: "var(--matcha)", color: "#fbfaf6" }}>
            <div style={{ ...previewLabelStyle, color: "rgba(255,255,255,0.7)" }}>従業員負担</div>
            <div style={{ ...previewValueStyle, color: "#fbfaf6" }}>¥{employeeYen.toLocaleString()}</div>
          </div>
          <div style={{ ...previewBoxStyle, background: "var(--accent)", color: "#fbfaf6" }}>
            <div style={{ ...previewLabelStyle, color: "rgba(255,255,255,0.7)" }}>会社補助 ({subsidyPt}pt)</div>
            <div style={{ ...previewValueStyle, color: "#fbfaf6" }}>¥{subsidyYen.toLocaleString()}</div>
          </div>
        </div>
        <div style={{ marginTop: 10, color: "var(--ink-mute)" }}>
          月次予算上限: 1人あたり <strong>{monthlyPoints}pt = ¥{monthlyBudgetYen.toLocaleString()}</strong> まで補助
        </div>
      </div>

      {message && (
        <div style={{ ...msgStyle, ...(message.type === "ok" ? okStyle : errStyle) }}>
          {message.text}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="submit" disabled={saving} style={btnStyle}>
          {saving ? "保存中..." : "設定を保存"}
        </button>
      </div>
    </form>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  letterSpacing: "0.05em",
  color: "var(--ink-soft)",
  marginBottom: 8,
  fontWeight: 500,
};
const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  border: "1px solid var(--line-strong)",
  background: "#fff",
  fontFamily: "inherit",
  fontSize: 18,
  fontWeight: 700,
  borderRadius: 4,
  textAlign: "center" as const,
};
const hintStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--ink-mute)",
  marginTop: 6,
  lineHeight: 1.6,
};
const previewBoxStyle: React.CSSProperties = {
  background: "var(--bg-panel)",
  border: "1px solid var(--line)",
  borderRadius: 4,
  padding: "8px 10px",
  textAlign: "center" as const,
};
const previewLabelStyle: React.CSSProperties = {
  fontSize: 10,
  color: "var(--ink-mute)",
  marginBottom: 4,
};
const previewValueStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 16,
  fontWeight: 700,
};
const msgStyle: React.CSSProperties = {
  padding: "10px 14px",
  fontSize: 12,
  borderRadius: 4,
  marginBottom: 12,
};
const okStyle: React.CSSProperties = {
  background: "#e8f0e3",
  color: "#3a5024",
  border: "1px solid #b8ceab",
};
const errStyle: React.CSSProperties = {
  background: "#fcebeb",
  border: "1px solid #f7c1c1",
  color: "#791f1f",
};
const btnStyle: React.CSSProperties = {
  background: "var(--accent)",
  color: "#fbfaf6",
  border: "none",
  padding: "10px 24px",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  borderRadius: 4,
  fontFamily: "inherit",
};
