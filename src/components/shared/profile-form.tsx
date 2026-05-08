"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  initialWebsiteUrl: string;
  initialAddress: string;
}

export default function ProfileForm({ initialWebsiteUrl, initialAddress }: Props) {
  const router = useRouter();
  const [websiteUrl, setWebsiteUrl] = useState(initialWebsiteUrl);
  const [address, setAddress] = useState(initialAddress);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/merchants/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteUrl: websiteUrl.trim(),
          address: address.trim() || null,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: j.error ?? "保存に失敗しました" });
        return;
      }
      setMessage({ type: "ok", text: "保存しました" });
      router.refresh();
    } catch {
      setMessage({ type: "err", text: "通信エラー" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save}>
      <div style={fieldStyle}>
        <label style={labelStyle}>
          店舗HP・予約サイトURL <span style={{ color: "var(--accent)" }}>必須</span>
        </label>
        <input
          type="url"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://example.com/booking"
          style={inputStyle}
          required
        />
        <div style={hintStyle}>
          従業員のマイページから各サービスの「店舗HPへ」ボタンで開かれます。<br />
          予約ページや詳細ページのURLを設定してください。
        </div>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>住所</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="例: 大阪市北区梅田1-1-1"
          style={inputStyle}
        />
      </div>

      {message && (
        <div
          style={{
            ...messageStyle,
            ...(message.type === "ok" ? okStyle : errStyle),
          }}
        >
          {message.text}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
        <button type="submit" disabled={saving} style={btnAccentStyle}>
          {saving ? "保存中..." : "保存"}
        </button>
      </div>
    </form>
  );
}

const fieldStyle: React.CSSProperties = { marginBottom: 18 };
const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  letterSpacing: "0.05em",
  color: "var(--ink-soft)",
  marginBottom: 6,
  fontWeight: 500,
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid var(--line-strong)",
  background: "#fff",
  fontFamily: "inherit",
  fontSize: 14,
  borderRadius: 4,
};
const hintStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--ink-mute)",
  marginTop: 6,
  lineHeight: 1.6,
};
const btnAccentStyle: React.CSSProperties = {
  background: "var(--accent)",
  color: "#fbfaf6",
  border: "none",
  padding: "9px 22px",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  borderRadius: 4,
  fontFamily: "inherit",
};
const messageStyle: React.CSSProperties = {
  padding: "10px 14px",
  fontSize: 12,
  borderRadius: 4,
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
