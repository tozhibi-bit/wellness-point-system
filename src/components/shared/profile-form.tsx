"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  initialWebsiteUrl: string | null;
  initialAddress: string;
  initialPhone: string;
  initialPhoto1Url?: string | null;
  initialPhoto2Url?: string | null;
  initialAccessNote?: string | null;
  initialMapsUrl?: string | null;
  initialClosedDays?: string | null;
  initialBusinessHours?: string | null;
}

export default function ProfileForm({
  initialWebsiteUrl,
  initialAddress,
  initialPhone,
  initialPhoto1Url,
  initialPhoto2Url,
  initialAccessNote,
  initialMapsUrl,
  initialClosedDays,
  initialBusinessHours,
}: Props) {
  const router = useRouter();
  const [websiteUrl, setWebsiteUrl] = useState(initialWebsiteUrl ?? "");
  const [address, setAddress] = useState(initialAddress);
  const [phone, setPhone] = useState(initialPhone);
  const [photo1Url, setPhoto1Url] = useState(initialPhoto1Url ?? "");
  const [photo2Url, setPhoto2Url] = useState(initialPhoto2Url ?? "");
  const [accessNote, setAccessNote] = useState(initialAccessNote ?? "");
  const [mapsUrl, setMapsUrl] = useState(initialMapsUrl ?? "");
  const [closedDays, setClosedDays] = useState(initialClosedDays ?? "");
  const [businessHours, setBusinessHours] = useState(initialBusinessHours ?? "");
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
          websiteUrl: websiteUrl.trim() || null,
          address: address.trim() || null,
          phone: phone.trim() || null,
          photo1Url: photo1Url.trim() || null,
          photo2Url: photo2Url.trim() || null,
          accessNote: accessNote.trim() || null,
          mapsUrl: mapsUrl.trim() || null,
          closedDays: closedDays.trim() || null,
          businessHours: businessHours.trim() || null,
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
      <SectionLabel>基本情報</SectionLabel>

      <div style={fieldStyle}>
        <label style={labelStyle}>店舗HP・予約サイトURL</label>
        <input
          type="url"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://example.com/booking"
          style={inputStyle}
        />
        <div style={hintStyle}>
          URLを設定すると、従業員のマイページに「予約はこちら」ボタンが表示されます。
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>電話番号</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="例: 06-1234-5678"
            style={inputStyle}
          />
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
      </div>

      <SectionLabel>アクセス情報</SectionLabel>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>最寄り駅・アクセス</label>
          <input
            type="text"
            value={accessNote}
            onChange={(e) => setAccessNote(e.target.value)}
            placeholder="例: 天神駅徒歩3分"
            style={inputStyle}
          />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>GoogleマップURL</label>
          <input
            type="url"
            value={mapsUrl}
            onChange={(e) => setMapsUrl(e.target.value)}
            placeholder="https://maps.google.com/..."
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>店休日</label>
          <input
            type="text"
            value={closedDays}
            onChange={(e) => setClosedDays(e.target.value)}
            placeholder="例: 火・水曜定休"
            style={inputStyle}
          />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>営業時間</label>
          <input
            type="text"
            value={businessHours}
            onChange={(e) => setBusinessHours(e.target.value)}
            placeholder="例: 10:00-20:00"
            style={inputStyle}
          />
        </div>
      </div>

      <SectionLabel>写真URL</SectionLabel>
      <div style={hintStyle} className="mb-3">
        画像のURLを入力してください（例: Googleドライブの公開リンク、Imgur等）
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>写真① URL</label>
          <input
            type="url"
            value={photo1Url}
            onChange={(e) => setPhoto1Url(e.target.value)}
            placeholder="https://..."
            style={inputStyle}
          />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>写真② URL</label>
          <input
            type="url"
            value={photo2Url}
            onChange={(e) => setPhoto2Url(e.target.value)}
            placeholder="https://..."
            style={inputStyle}
          />
        </div>
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        letterSpacing: "0.15em",
        color: "var(--ink-mute)",
        textTransform: "uppercase",
        fontWeight: 600,
        marginBottom: 10,
        marginTop: 20,
        paddingBottom: 6,
        borderBottom: "1px solid var(--line)",
      }}
    >
      {children}
    </div>
  );
}

const fieldStyle: React.CSSProperties = { marginBottom: 14 };
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
  marginTop: 12,
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
