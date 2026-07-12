"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Company {
  id: string;
  displayId: string;
  name: string;
  monthlyPoints: number;
  subsidyPct: number;
  invoiceEmail: string;
  employeeCount: number;
  adminCount: number;
}

export default function CompanyManager({ initialCompanies }: { initialCompanies: Company[] }) {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState({
    displayId: "",
    name: "",
    monthlyPoints: 5,
    subsidyPct: 50,
    invoiceEmail: "",
    adminEmail: "",
    adminName: "",
    adminPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function openNew() {
    const nextId = nextDisplayId(companies.map((c) => c.displayId));
    setForm({
      displayId: nextId,
      name: "",
      monthlyPoints: 5,
      subsidyPct: 50,
      invoiceEmail: "",
      adminEmail: "",
      adminName: "",
      adminPassword: "",
    });
    setEditingId("new");
    setError(null);
  }

  function openEdit(c: Company) {
    setForm({
      displayId: c.displayId,
      name: c.name,
      monthlyPoints: c.monthlyPoints,
      subsidyPct: c.subsidyPct,
      invoiceEmail: c.invoiceEmail,
      adminEmail: "",
      adminName: "",
      adminPassword: "",
    });
    setEditingId(c.id);
    setError(null);
  }

  async function save() {
    setError(null);
    if (!form.displayId.trim() || !form.name.trim()) {
      setError("会社IDと会社名は必須です");
      return;
    }
    if (form.monthlyPoints < 0) {
      setError("月次ポイントは0以上で指定してください");
      return;
    }
    if (editingId === "new") {
      if (!form.adminEmail.trim() || !form.adminName.trim() || !form.adminPassword) {
        setError("初期管理者の情報(メール・名前・パスワード)を入力してください");
        return;
      }
      if (form.adminPassword.length < 8) {
        setError("管理者パスワードは8文字以上で指定してください");
        return;
      }
    }

    setSaving(true);
    try {
      const isNew = editingId === "new";
      const url = isNew ? "/api/superadmin/companies" : `/api/superadmin/companies/${editingId}`;
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
      // 楽観的更新
      const newCompany: Company = {
        id: j.company.id,
        displayId: j.company.displayId,
        name: j.company.name,
        monthlyPoints: j.company.monthlyPoints,
        subsidyPct: j.company.subsidyPct ?? 50,
        invoiceEmail: j.company.invoiceEmail ?? "",
        employeeCount: 0,
        adminCount: isNew ? 1 : (companies.find((c) => c.id === editingId)?.adminCount ?? 0),
      };
      if (isNew) {
        setCompanies([...companies, newCompany]);
      } else {
        setCompanies(companies.map((c) => (c.id === editingId ? { ...c, ...newCompany, id: c.id } : c)));
      }
    } catch {
      setError("通信エラー");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>
          現在 {companies.length} 社が登録されています
        </div>
        <button onClick={openNew} style={btnAccentStyle}>
          + 新規企業を追加
        </button>
      </div>

      {editingId !== null && (
        <div style={editPanelStyle}>
          <div style={{ fontFamily: "'Shippori Mincho', serif", fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
            {editingId === "new" ? "企業を新規追加" : "企業情報を編集"}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="会社ID(C001等、ユニーク)" required>
              <input
                type="text"
                value={form.displayId}
                onChange={(e) => setForm({ ...form, displayId: e.target.value.toUpperCase() })}
                style={inputStyle}
                placeholder="C001"
                disabled={editingId !== "new"}
              />
            </Field>
            <Field label="会社名" required>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={inputStyle}
                placeholder="株式会社サンプル"
              />
            </Field>
            <Field label="月次付与ポイント / 人" required>
              <input
                type="number"
                value={form.monthlyPoints}
                onChange={(e) => setForm({ ...form, monthlyPoints: parseInt(e.target.value) || 0 })}
                style={inputStyle}
                min={0}
                max={200}
              />
            </Field>
            <Field label="補助率(%)" required>
              <input
                type="number"
                value={form.subsidyPct}
                onChange={(e) => setForm({ ...form, subsidyPct: Math.min(100, Math.max(1, parseInt(e.target.value) || 50)) })}
                style={inputStyle}
                min={1}
                max={100}
              />
            </Field>
            <Field label="請求書送付先メール">
              <input
                type="email"
                value={form.invoiceEmail}
                onChange={(e) => setForm({ ...form, invoiceEmail: e.target.value })}
                style={inputStyle}
                placeholder="billing@example.co.jp"
              />
            </Field>
          </div>

          {editingId === "new" && (
            <>
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", marginBottom: 10 }}>
                  初期管理者アカウント(必須)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                  <Field label="管理者メール" required>
                    <input
                      type="email"
                      value={form.adminEmail}
                      onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                      style={inputStyle}
                      placeholder="admin@example.co.jp"
                    />
                  </Field>
                  <Field label="管理者氏名" required>
                    <input
                      type="text"
                      value={form.adminName}
                      onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                      style={inputStyle}
                      placeholder="山田 太郎"
                    />
                  </Field>
                  <Field label="初期パスワード(8文字以上)" required>
                    <input
                      type="text"
                      value={form.adminPassword}
                      onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                      style={inputStyle}
                      placeholder="後で本人に変更してもらう"
                    />
                  </Field>
                </div>
              </div>
            </>
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

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            <th style={thStyle}>会社ID</th>
            <th style={thStyle}>会社名</th>
            <th style={{ ...thStyle, textAlign: "right" }}>月次pt</th>
            <th style={{ ...thStyle, textAlign: "right" }}>補助率</th>
            <th style={thStyle}>請求先メール</th>
            <th style={{ ...thStyle, textAlign: "right" }}>従業員</th>
            <th style={{ ...thStyle, textAlign: "right" }}>管理者</th>
            <th style={thStyle}></th>
          </tr>
        </thead>
        <tbody>
          {companies.map((c) => (
            <tr key={c.id}>
              <td style={{ ...tdStyle, fontFamily: "'JetBrains Mono', monospace" }}>{c.displayId}</td>
              <td style={{ ...tdStyle, fontWeight: 500 }}>{c.name}</td>
              <td style={{ ...tdStyle, textAlign: "right", fontFamily: "monospace" }}>{c.monthlyPoints}pt</td>
              <td style={{ ...tdStyle, textAlign: "right", fontFamily: "monospace" }}>{c.subsidyPct}%</td>
              <td style={{ ...tdStyle, fontSize: 11, color: "var(--ink-mute)" }}>{c.invoiceEmail || "-"}</td>
              <td style={{ ...tdStyle, textAlign: "right", fontFamily: "monospace" }}>{c.employeeCount}名</td>
              <td style={{ ...tdStyle, textAlign: "right", fontFamily: "monospace" }}>{c.adminCount}名</td>
              <td style={tdStyle}>
                <button onClick={() => openEdit(c)} style={btnGhostSmStyle}>
                  編集
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

function nextDisplayId(existing: string[]): string {
  const nums = existing
    .filter((id) => /^C\d+$/.test(id))
    .map((id) => parseInt(id.slice(1), 10));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `C${String(max + 1).padStart(3, "0")}`;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  border: "1px solid var(--line-strong)",
  background: "#fff",
  fontFamily: "inherit",
  fontSize: 13,
  borderRadius: 4,
};
const editPanelStyle: React.CSSProperties = {
  background: "var(--bg)",
  border: "1px solid var(--line)",
  borderLeft: "3px solid var(--accent)",
  padding: 20,
  marginBottom: 20,
  borderRadius: 4,
};
const btnAccentStyle: React.CSSProperties = {
  background: "var(--accent)",
  color: "#fbfaf6",
  border: "none",
  padding: "9px 18px",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  borderRadius: 4,
  fontFamily: "inherit",
};
const btnGhostStyle: React.CSSProperties = {
  background: "transparent",
  color: "var(--ink)",
  border: "1px solid var(--line-strong)",
  padding: "9px 18px",
  fontSize: 13,
  cursor: "pointer",
  borderRadius: 4,
  fontFamily: "inherit",
};
const btnGhostSmStyle: React.CSSProperties = { ...btnGhostStyle, padding: "5px 12px", fontSize: 12 };
const errorStyle: React.CSSProperties = {
  background: "#fcebeb",
  border: "1px solid #f7c1c1",
  color: "#791f1f",
  padding: "10px 14px",
  fontSize: 12,
  marginTop: 12,
  borderRadius: 4,
};
const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  fontSize: 11,
  letterSpacing: "0.1em",
  color: "var(--ink-mute)",
  textTransform: "uppercase",
  borderBottom: "1px solid var(--line-strong)",
  fontWeight: 500,
};
const tdStyle: React.CSSProperties = {
  padding: "12px",
  borderBottom: "1px solid var(--line)",
};
