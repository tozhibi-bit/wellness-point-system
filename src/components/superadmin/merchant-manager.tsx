"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toDisplayableImageUrl } from "@/lib/image-url";

interface Merchant {
  id: string;
  displayId: string;
  name: string;
  email: string;
  category: string;
  address: string;
  phone: string;
  websiteUrl: string | null;
  photo1Url: string | null;
  photo2Url: string | null;
  accessNote: string | null;
  mapsUrl: string | null;
  closedDays: string | null;
  businessHours: string | null;
  invoiceRegNo: string;
  isActive: boolean;
  contractCount: number;
  serviceCount: number;
}

export default function MerchantManager({ initialMerchants }: { initialMerchants: Merchant[] }) {
  const router = useRouter();
  const [merchants, setMerchants] = useState<Merchant[]>(initialMerchants);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSaving, setResetSaving] = useState(false);
  const [form, setForm] = useState({
    displayId: "",
    name: "",
    email: "",
    category: "",
    address: "",
    phone: "",
    websiteUrl: "",
    photo1Url: "",
    photo2Url: "",
    accessNote: "",
    mapsUrl: "",
    closedDays: "",
    businessHours: "",
    invoiceRegNo: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function openNew() {
    const nextId = nextDisplayId(merchants.map((m) => m.displayId));
    setForm({
      displayId: nextId,
      name: "",
      email: "",
      category: "",
      address: "",
      phone: "",
      websiteUrl: "",
      photo1Url: "",
      photo2Url: "",
      accessNote: "",
      mapsUrl: "",
      closedDays: "",
      businessHours: "",
      invoiceRegNo: "",
      password: "",
    });
    setEditingId("new");
    setResetId(null);
    setError(null);
  }

  function openEdit(m: Merchant) {
    setForm({
      displayId: m.displayId,
      name: m.name,
      email: m.email,
      category: m.category,
      address: m.address,
      phone: m.phone,
      websiteUrl: m.websiteUrl ?? "",
      photo1Url: m.photo1Url ?? "",
      photo2Url: m.photo2Url ?? "",
      accessNote: m.accessNote ?? "",
      mapsUrl: m.mapsUrl ?? "",
      closedDays: m.closedDays ?? "",
      businessHours: m.businessHours ?? "",
      invoiceRegNo: m.invoiceRegNo,
      password: "",
    });
    setEditingId(m.id);
    setResetId(null);
    setError(null);
  }

  function openReset(m: Merchant) {
    setResetId(m.id);
    setResetPassword("");
    setResetError(null);
    setEditingId(null);
  }

  async function saveReset() {
    if (resetPassword.length < 8) {
      setResetError("パスワードは8文字以上で入力してください");
      return;
    }
    setResetSaving(true);
    setResetError(null);
    try {
      const res = await fetch(`/api/superadmin/merchants/${resetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...merchants.find((m) => m.id === resetId)!,
          newPassword: resetPassword,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setResetError(j.error ?? "リセットに失敗しました");
        return;
      }
      setResetId(null);
    } catch {
      setResetError("通信エラー");
    } finally {
      setResetSaving(false);
    }
  }

  async function save() {
    setError(null);
    if (!form.name.trim() || !form.email.trim() || !form.category.trim() || !form.invoiceRegNo.trim()) {
      setError("店舗名・メール・カテゴリ・登録番号は必須です");
      return;
    }
    if (editingId === "new" && form.password.length < 8) {
      setError("初期パスワードは8文字以上で指定してください");
      return;
    }
    setSaving(true);
    try {
      const isNew = editingId === "new";
      const url = isNew ? "/api/superadmin/merchants" : `/api/superadmin/merchants/${editingId}`;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error ?? "保存に失敗しました");
        return;
      }
      setEditingId(null);
      router.refresh();
      if (j.merchant) {
        const newMerchant: Merchant = {
          id: j.merchant.id,
          displayId: j.merchant.displayId,
          name: j.merchant.name,
          email: j.merchant.email,
          category: j.merchant.category,
          address: j.merchant.address ?? "",
          phone: j.merchant.phone ?? "",
          websiteUrl: j.merchant.websiteUrl ?? null,
          photo1Url: j.merchant.photo1Url ?? null,
          photo2Url: j.merchant.photo2Url ?? null,
          accessNote: j.merchant.accessNote ?? null,
          mapsUrl: j.merchant.mapsUrl ?? null,
          closedDays: j.merchant.closedDays ?? null,
          businessHours: j.merchant.businessHours ?? null,
          invoiceRegNo: j.merchant.invoiceRegNo,
          isActive: j.merchant.isActive,
          contractCount: isNew ? j.contractCount ?? 0 : merchants.find((m) => m.id === editingId)?.contractCount ?? 0,
          serviceCount: isNew ? 0 : merchants.find((m) => m.id === editingId)?.serviceCount ?? 0,
        };
        if (isNew) {
          setMerchants([...merchants, newMerchant]);
        } else {
          setMerchants(merchants.map((m) => (m.id === editingId ? newMerchant : m)));
        }
      }
    } catch {
      setError("通信エラー");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>
          現在 {merchants.length} 店舗が登録されています(全社共通)
        </div>
        <button onClick={openNew} style={btnAccentStyle}>
          + 新規加盟店を追加
        </button>
      </div>

      {/* 編集フォーム */}
      {editingId !== null && (
        <div style={editPanelStyle}>
          <div style={{ fontFamily: "'Shippori Mincho', serif", fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
            {editingId === "new" ? "加盟店を新規追加" : "加盟店情報を編集"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14 }}>
            <Field label="加盟店ID(M001等)" required>
              <input
                type="text"
                value={form.displayId}
                onChange={(e) => setForm({ ...form, displayId: e.target.value.toUpperCase() })}
                style={inputStyle}
                disabled={editingId !== "new"}
              />
            </Field>
            <Field label="店舗名" required>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={inputStyle}
                placeholder="◯◯フィットネス 大阪店"
              />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
            <Field label="メールアドレス(ログイン用)" required>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={inputStyle}
                placeholder="info@example.jp"
              />
            </Field>
            <Field label="カテゴリ" required>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                style={inputStyle}
                placeholder="ジム / マッサージ / 整体..."
              />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginTop: 14 }}>
            <Field label="住所">
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                style={inputStyle}
                placeholder="大阪市北区..."
              />
            </Field>
            <Field label="電話番号">
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                style={inputStyle}
                placeholder="06-1234-5678"
              />
            </Field>
            <Field label="適格請求書登録番号" required>
              <input
                type="text"
                value={form.invoiceRegNo}
                onChange={(e) => setForm({ ...form, invoiceRegNo: e.target.value })}
                style={inputStyle}
                placeholder="T1234567890123"
              />
            </Field>
          </div>

          {/* 店舗情報（従業員マイページ表示用） */}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px dashed var(--line-strong)" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--ink-mute)", textTransform: "uppercase", marginBottom: 12 }}>
              店舗情報（従業員マイページ表示）
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="店舗HP・予約サイトURL">
                <input
                  type="url"
                  value={form.websiteUrl}
                  onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                  style={inputStyle}
                  placeholder="https://..."
                />
              </Field>
              <Field label="GoogleマップURL">
                <input
                  type="url"
                  value={form.mapsUrl}
                  onChange={(e) => setForm({ ...form, mapsUrl: e.target.value })}
                  style={inputStyle}
                  placeholder="https://maps.google.com/..."
                />
              </Field>
              <Field label="最寄り駅・アクセス">
                <input
                  type="text"
                  value={form.accessNote}
                  onChange={(e) => setForm({ ...form, accessNote: e.target.value })}
                  style={inputStyle}
                  placeholder="天神駅徒歩3分"
                />
              </Field>
              <Field label="店休日">
                <input
                  type="text"
                  value={form.closedDays}
                  onChange={(e) => setForm({ ...form, closedDays: e.target.value })}
                  style={inputStyle}
                  placeholder="火・水曜定休"
                />
              </Field>
              <Field label="営業時間">
                <input
                  type="text"
                  value={form.businessHours}
                  onChange={(e) => setForm({ ...form, businessHours: e.target.value })}
                  style={inputStyle}
                  placeholder="10:00-20:00"
                />
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
              <Field label="写真① URL">
                <input
                  type="url"
                  value={form.photo1Url}
                  onChange={(e) => setForm({ ...form, photo1Url: e.target.value })}
                  style={inputStyle}
                  placeholder="https://..."
                />
                <PhotoPreview url={form.photo1Url} />
              </Field>
              <Field label="写真② URL">
                <input
                  type="url"
                  value={form.photo2Url}
                  onChange={(e) => setForm({ ...form, photo2Url: e.target.value })}
                  style={inputStyle}
                  placeholder="https://..."
                />
                <PhotoPreview url={form.photo2Url} />
              </Field>
            </div>
          </div>
          {editingId === "new" && (
            <div style={{ marginTop: 14 }}>
              <Field label="初期パスワード(8文字以上)" required>
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  style={inputStyle}
                />
              </Field>
              <div style={{ fontSize: 11, color: "var(--ink-mute)", marginTop: 6 }}>
                ※ 新規追加時、登録済みの全企業と自動的に契約を結びます。
              </div>
            </div>
          )}
          {error && <div style={errorStyle}>{error}</div>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}>
            <button onClick={() => setEditingId(null)} style={btnGhostStyle}>
              キャンセル
            </button>
            <button onClick={save} disabled={saving} style={btnAccentStyle}>
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      )}

      {/* パスワードリセットパネル */}
      {resetId !== null && (
        <div style={{ ...editPanelStyle, borderLeftColor: "var(--gold)" }}>
          <div style={{ fontFamily: "'Shippori Mincho', serif", fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
            パスワードをリセット
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-mute)", marginBottom: 14 }}>
            {merchants.find((m) => m.id === resetId)?.name} — 新しいパスワードを設定します
          </div>
          <Field label="新しいパスワード(8文字以上)" required>
            <input
              type="text"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              style={inputStyle}
              placeholder="新しいパスワード"
            />
          </Field>
          {resetError && <div style={errorStyle}>{resetError}</div>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}>
            <button onClick={() => setResetId(null)} style={btnGhostStyle}>
              キャンセル
            </button>
            <button onClick={saveReset} disabled={resetSaving} style={{ ...btnAccentStyle, background: "var(--gold)" }}>
              {resetSaving ? "リセット中..." : "リセット実行"}
            </button>
          </div>
        </div>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>店舗名</th>
            <th style={thStyle}>カテゴリ</th>
            <th style={thStyle}>電話</th>
            <th style={thStyle}>登録番号</th>
            <th style={{ ...thStyle, textAlign: "right" }}>契約社数</th>
            <th style={{ ...thStyle, textAlign: "right" }}>サービス数</th>
            <th style={thStyle}></th>
          </tr>
        </thead>
        <tbody>
          {merchants.map((m) => (
            <tr key={m.id}>
              <td style={{ ...tdStyle, fontFamily: "monospace" }}>{m.displayId}</td>
              <td style={{ ...tdStyle, fontWeight: 500 }}>{m.name}</td>
              <td style={tdStyle}>{m.category}</td>
              <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 11 }}>{m.phone || "—"}</td>
              <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 11 }}>{m.invoiceRegNo}</td>
              <td style={{ ...tdStyle, textAlign: "right", fontFamily: "monospace" }}>{m.contractCount}社</td>
              <td style={{ ...tdStyle, textAlign: "right", fontFamily: "monospace" }}>{m.serviceCount}件</td>
              <td style={{ ...tdStyle, display: "flex", gap: 6 }}>
                <button onClick={() => openEdit(m)} style={btnGhostSmStyle}>
                  編集
                </button>
                <button onClick={() => openReset(m)} style={{ ...btnGhostSmStyle, color: "var(--gold)", borderColor: "var(--gold)" }}>
                  PW
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, color: "var(--ink-soft)", marginBottom: 4, fontWeight: 500 }}>
        {label}
        {required && <span style={{ color: "var(--accent)", marginLeft: 4 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function PhotoPreview({ url }: { url: string }) {
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const trimmed = url.trim();

  useEffect(() => {
    setStatus("idle");
  }, [trimmed]);

  if (!trimmed) return null;

  return (
    <div
      style={{
        marginTop: 8,
        width: "100%",
        height: 110,
        border: "1px solid var(--line)",
        borderRadius: 4,
        overflow: "hidden",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={trimmed}
        src={toDisplayableImageUrl(trimmed)}
        alt="プレビュー"
        onLoad={() => setStatus("ok")}
        onError={() => setStatus("err")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: status === "err" ? "none" : "block",
        }}
      />
      {status === "err" && (
        <div style={{ fontSize: 11, color: "#791f1f", textAlign: "center", padding: "0 10px", lineHeight: 1.6 }}>
          画像を読み込めませんでした。<br />
          画像への直リンクか確認してください
        </div>
      )}
    </div>
  );
}

function nextDisplayId(existing: string[]): string {
  const nums = existing
    .filter((id) => /^M\d+$/.test(id))
    .map((id) => parseInt(id.slice(1), 10));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `M${String(max + 1).padStart(3, "0")}`;
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px",
  border: "1px solid var(--line-strong)",
  background: "#fff", fontFamily: "inherit", fontSize: 13, borderRadius: 4,
};
const editPanelStyle: React.CSSProperties = {
  background: "var(--bg)", border: "1px solid var(--line)",
  borderLeft: "3px solid var(--accent)",
  padding: 20, marginBottom: 20, borderRadius: 4,
};
const btnAccentStyle: React.CSSProperties = {
  background: "var(--accent)", color: "#fbfaf6", border: "none",
  padding: "8px 16px", fontSize: 13, fontWeight: 500,
  cursor: "pointer", borderRadius: 4, fontFamily: "inherit",
};
const btnGhostStyle: React.CSSProperties = {
  background: "transparent", color: "var(--ink)",
  border: "1px solid var(--line-strong)",
  padding: "8px 16px", fontSize: 13,
  cursor: "pointer", borderRadius: 4, fontFamily: "inherit",
};
const btnGhostSmStyle: React.CSSProperties = { ...btnGhostStyle, padding: "4px 10px", fontSize: 11 };
const errorStyle: React.CSSProperties = {
  background: "#fcebeb", border: "1px solid #f7c1c1",
  color: "#791f1f", padding: "10px 14px", fontSize: 12, marginTop: 12, borderRadius: 4,
};
const thStyle: React.CSSProperties = {
  textAlign: "left", padding: "10px 12px", fontSize: 11,
  letterSpacing: "0.1em", color: "var(--ink-mute)", textTransform: "uppercase",
  borderBottom: "1px solid var(--line-strong)", fontWeight: 500,
};
const tdStyle: React.CSSProperties = { padding: "10px 12px", borderBottom: "1px solid var(--line)" };
