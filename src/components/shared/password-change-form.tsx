"use client";

import { useState } from "react";

export default function PasswordChangeForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (next !== confirm) {
      setMessage({ type: "err", text: "新しいパスワードが一致しません" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const j = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: j.error ?? "変更に失敗しました" });
        return;
      }
      setMessage({ type: "ok", text: "パスワードを変更しました" });
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch {
      setMessage({ type: "err", text: "通信エラーが発生しました" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={fieldStyle}>
        <label style={labelStyle}>現在のパスワード</label>
        <input
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          style={inputStyle}
          required
          autoComplete="current-password"
        />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>新しいパスワード <span style={{ color: "var(--ink-mute)", fontWeight: 400 }}>(8文字以上)</span></label>
        <input
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          style={inputStyle}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>新しいパスワード（確認）</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          style={inputStyle}
          required
          autoComplete="new-password"
        />
      </div>

      {message && (
        <div style={{ ...messageBase, ...(message.type === "ok" ? okStyle : errStyle) }}>
          {message.text}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
        <button type="submit" disabled={saving} style={btnStyle}>
          {saving ? "変更中..." : "パスワードを変更"}
        </button>
      </div>
    </form>
  );
}

const fieldStyle: React.CSSProperties = { marginBottom: 14 };
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, letterSpacing: "0.05em",
  color: "var(--ink-soft)", marginBottom: 6, fontWeight: 500,
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px",
  border: "1px solid var(--line-strong)",
  background: "#fff", fontFamily: "inherit", fontSize: 14, borderRadius: 4,
};
const messageBase: React.CSSProperties = { padding: "10px 14px", fontSize: 12, borderRadius: 4, marginBottom: 8 };
const okStyle: React.CSSProperties = { background: "#e8f0e3", color: "#3a5024", border: "1px solid #b8ceab" };
const errStyle: React.CSSProperties = { background: "#fcebeb", border: "1px solid #f7c1c1", color: "#791f1f" };
const btnStyle: React.CSSProperties = {
  background: "var(--sumi)", color: "#fbfaf6", border: "none",
  padding: "9px 22px", fontSize: 13, fontWeight: 500,
  cursor: "pointer", borderRadius: 4, fontFamily: "inherit",
};
