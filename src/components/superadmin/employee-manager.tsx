"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface Employee {
  id: string;
  displayId: string;
  name: string;
  email: string;
  department: string;
  isActive: boolean;
  companyId: string;
  companyName: string;
  companyDisplayId: string;
}

interface CompanyOption {
  id: string;
  displayId: string;
  name: string;
}

interface Props {
  companies: CompanyOption[];
  initialEmployees: Employee[];
}

export default function EmployeeManager({ companies, initialEmployees }: Props) {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState({
    companyId: companies[0]?.id ?? "",
    displayId: "",
    name: "",
    email: "",
    department: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetId, setResetId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSaving, setResetSaving] = useState(false);

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      if (filter !== "all" && e.companyId !== filter) return false;
      const q = search.trim().toLowerCase();
      if (q) {
        const hay = `${e.name} ${e.displayId} ${e.email} ${e.department}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [employees, filter, search]);

  function openReset(e: Employee) {
    setResetId(e.id);
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
      const target = employees.find((e) => e.id === resetId)!;
      const res = await fetch(`/api/superadmin/employees/${resetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: target.name,
          email: target.email,
          department: target.department,
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

  function openNew() {
    const targetCompanyId = filter !== "all" ? filter : companies[0]?.id ?? "";
    const companyEmps = employees.filter((e) => e.companyId === targetCompanyId);
    const nextId = nextDisplayId(companyEmps.map((e) => e.displayId));
    setForm({
      companyId: targetCompanyId,
      displayId: nextId,
      name: "",
      email: "",
      department: "",
      password: "demo1234",
    });
    setEditingId("new");
    setError(null);
  }

  function openEdit(e: Employee) {
    setForm({
      companyId: e.companyId,
      displayId: e.displayId,
      name: e.name,
      email: e.email,
      department: e.department,
      password: "",
    });
    setEditingId(e.id);
    setError(null);
  }

  async function save() {
    setError(null);
    if (!form.name.trim() || !form.email.trim() || !form.companyId) {
      setError("会社・氏名・メールは必須です");
      return;
    }
    if (editingId === "new" && (!form.password || form.password.length < 8)) {
      setError("初期パスワードは8文字以上で指定してください");
      return;
    }
    setSaving(true);
    try {
      const isNew = editingId === "new";
      const url = isNew ? "/api/superadmin/employees" : `/api/superadmin/employees/${editingId}`;
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
      if (j.employee) {
        const company = companies.find((c) => c.id === form.companyId);
        const newEmp: Employee = {
          id: j.employee.id,
          displayId: j.employee.displayId,
          name: j.employee.name,
          email: j.employee.email,
          department: j.employee.department ?? "",
          isActive: j.employee.isActive,
          companyId: j.employee.companyId,
          companyName: company?.name ?? "",
          companyDisplayId: company?.displayId ?? "",
        };
        if (isNew) {
          setEmployees([...employees, newEmp]);
        } else {
          setEmployees(employees.map((e) => (e.id === editingId ? newEmp : e)));
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
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={selectStyle}>
            <option value="all">全社 ({employees.length}名)</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.displayId} {c.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="氏名・ID・メールで検索"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...selectStyle, width: 240 }}
          />
        </div>
        <button onClick={openNew} style={btnAccentStyle}>
          + 新規追加
        </button>
      </div>

      {editingId !== null && (
        <div style={editPanelStyle}>
          <div style={{ fontFamily: "'Shippori Mincho', serif", fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
            {editingId === "new" ? "従業員を新規追加" : "従業員情報を編集"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <Field label="所属会社" required>
              <select
                value={form.companyId}
                onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                style={selectStyle}
                disabled={editingId !== "new"}
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayId} {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="従業員ID(E0001等)" required>
              <input
                type="text"
                value={form.displayId}
                onChange={(e) => setForm({ ...form, displayId: e.target.value.toUpperCase() })}
                style={inputStyle}
                placeholder="E0001"
                disabled={editingId !== "new"}
              />
            </Field>
            <Field label="氏名" required>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={inputStyle}
                placeholder="山田 太郎"
              />
            </Field>
            <Field label="メールアドレス" required>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={inputStyle}
                placeholder="taro@example.co.jp"
              />
            </Field>
            <Field label="部署">
              <input
                type="text"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                style={inputStyle}
                placeholder="営業部"
              />
            </Field>
            {editingId === "new" && (
              <Field label="初期パスワード(8文字以上)" required>
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  style={inputStyle}
                  placeholder="後で本人に変更してもらう"
                />
              </Field>
            )}
          </div>

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
            {employees.find((e) => e.id === resetId)?.name} — 新しいパスワードを設定します
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

      <div style={{ fontSize: 12, color: "var(--ink-mute)", marginBottom: 8 }}>
        表示中: {filtered.length}名
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            <th style={thStyle}>会社</th>
            <th style={thStyle}>従業員ID</th>
            <th style={thStyle}>氏名</th>
            <th style={thStyle}>メール</th>
            <th style={thStyle}>部署</th>
            <th style={thStyle}>状態</th>
            <th style={thStyle}></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((e) => (
            <tr key={e.id}>
              <td style={{ ...tdStyle, fontSize: 11 }}>
                <span style={{ fontFamily: "monospace", color: "var(--ink-mute)" }}>{e.companyDisplayId}</span>{" "}
                {e.companyName}
              </td>
              <td style={{ ...tdStyle, fontFamily: "monospace" }}>{e.displayId}</td>
              <td style={{ ...tdStyle, fontWeight: 500 }}>{e.name}</td>
              <td style={{ ...tdStyle, fontSize: 12, color: "var(--ink-soft)" }}>{e.email}</td>
              <td style={tdStyle}>{e.department}</td>
              <td style={tdStyle}>
                {e.isActive ? (
                  <span style={{ color: "var(--matcha)", fontSize: 11 }}>● 有効</span>
                ) : (
                  <span style={{ color: "var(--ink-mute)", fontSize: 11 }}>○ 無効</span>
                )}
              </td>
              <td style={{ ...tdStyle, display: "flex", gap: 6 }}>
                <button onClick={() => openEdit(e)} style={btnGhostSmStyle}>
                  編集
                </button>
                <button onClick={() => openReset(e)} style={{ ...btnGhostSmStyle, color: "var(--gold)", borderColor: "var(--gold)" }}>
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

function nextDisplayId(existing: string[]): string {
  const nums = existing
    .filter((id) => /^E\d+$/.test(id))
    .map((id) => parseInt(id.slice(1), 10));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `E${String(max + 1).padStart(4, "0")}`;
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
const selectStyle: React.CSSProperties = { ...inputStyle, padding: "8px 10px" };
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
  padding: "8px 16px",
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
  padding: "8px 16px",
  fontSize: 13,
  cursor: "pointer",
  borderRadius: 4,
  fontFamily: "inherit",
};
const btnGhostSmStyle: React.CSSProperties = { ...btnGhostStyle, padding: "4px 10px", fontSize: 11 };
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
  padding: "10px 12px",
  borderBottom: "1px solid var(--line)",
};
