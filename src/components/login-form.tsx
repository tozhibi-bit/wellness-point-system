"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setError("メールアドレスまたはパスワードが正しくありません。");
        setLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("ログイン処理中にエラーが発生しました。");
      setLoading(false);
    }
  }

  return (
    <div style={loginCardStyle}>
      <div style={brandPillStyle} />
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={brandMarkStyle}>福</div>
        <div style={brandTitleStyle}>Wellness Point</div>
        <div style={brandSubStyle}>Employee Benefits System</div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={fieldStyle}>
          <label style={labelStyle}>メールアドレス</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.co.jp"
            style={inputStyle}
            required
            autoComplete="email"
            autoFocus
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>パスワード</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            required
            autoComplete="current-password"
          />
        </div>

        {error && <div style={errorStyle}>{error}</div>}

        <button type="submit" disabled={loading} style={submitButtonStyle}>
          {loading ? "ログイン中..." : "ログイン"}
        </button>
      </form>

    </div>
  );
}

const loginCardStyle: React.CSSProperties = {
  background: "var(--bg-panel)",
  padding: "48px 44px",
  maxWidth: 440,
  width: "100%",
  border: "1px solid var(--line)",
  boxShadow: "0 40px 80px -30px rgba(0,0,0,0.15)",
  position: "relative",
};

const brandPillStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: 4,
  background: "linear-gradient(90deg, var(--accent) 0%, var(--gold) 100%)",
};

const brandMarkStyle: React.CSSProperties = {
  width: 56,
  height: 56,
  background: "var(--accent)",
  color: "#fbfaf6",
  fontFamily: "'Shippori Mincho', serif",
  fontSize: 28,
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 14px",
};

const brandTitleStyle: React.CSSProperties = {
  fontFamily: "'Shippori Mincho', serif",
  fontSize: 22,
  fontWeight: 700,
  letterSpacing: "0.05em",
};

const brandSubStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--ink-mute)",
  letterSpacing: "0.15em",
  marginTop: 4,
  textTransform: "uppercase",
};

const fieldStyle: React.CSSProperties = { marginBottom: 16 };

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
  color: "var(--ink)",
  borderRadius: 4,
};

const errorStyle: React.CSSProperties = {
  background: "#fcebeb",
  border: "1px solid #f7c1c1",
  color: "#791f1f",
  padding: "10px 14px",
  fontSize: 12,
  marginBottom: 12,
  borderRadius: 4,
};

const submitButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 18px",
  background: "var(--accent)",
  color: "#fbfaf6",
  border: "none",
  fontFamily: "inherit",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  borderRadius: 4,
};

