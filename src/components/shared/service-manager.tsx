"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Service {
  id: string;
  name: string;
  description: string | null;
  priceYen: number;
}

const yen = (n: number) => "¥" + Math.round(n).toLocaleString("ja-JP");

export default function ServiceManager({ initialServices }: { initialServices: Service[] }) {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>(initialServices);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function openNew() {
    setEditingId("new");
    setFormName("");
    setFormDesc("");
    setFormPrice(3000);
    setError(null);
  }

  function openEdit(s: Service) {
    setEditingId(s.id);
    setFormName(s.name);
    setFormDesc(s.description ?? "");
    setFormPrice(s.priceYen);
    setError(null);
  }

  async function save() {
    if (!formName.trim() || formPrice <= 0) {
      setError("サービス名と金額を入力してください");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const isNew = editingId === "new";
      const url = isNew ? "/api/services" : `/api/services/${editingId}`;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          description: formDesc || null,
          priceYen: formPrice,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error ?? "保存に失敗しました");
        setSaving(false);
        return;
      }
      const newSvc = j.service as Service;
      if (isNew) {
        setServices([...services, newSvc]);
      } else {
        setServices(services.map((s) => (s.id === newSvc.id ? newSvc : s)));
      }
      setEditingId(null);
      router.refresh();
    } catch {
      setError("通信エラー");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("このメニューを削除しますか?")) return;
    try {
      const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
      if (res.ok) {
        setServices(services.filter((s) => s.id !== id));
        router.refresh();
      } else {
        const j = await res.json();
        alert(j.error ?? "削除に失敗しました");
      }
    } catch {
      alert("通信エラー");
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>
          現在 {services.length} 件のメニューが登録されています
        </div>
        <button onClick={openNew} style={btnAccentStyle}>
          + 新規追加
        </button>
      </div>

      {editingId !== null && (
        <div style={editPanelStyle}>
          <div style={{ fontFamily: "'Shippori Mincho', serif", fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
            {editingId === "new" ? "サービスメニュー追加" : "サービスメニュー編集"}
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>サービス名</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              style={inputStyle}
              placeholder="例: 1時間パーソナルトレーニング"
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>説明</label>
            <textarea
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>金額(税込)</label>
            <input
              type="number"
              value={formPrice}
              onChange={(e) => setFormPrice(parseInt(e.target.value) || 0)}
              style={inputStyle}
              step={100}
              min={0}
            />
          </div>
          {error && <div style={errorStyle}>{error}</div>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
            <button onClick={() => setEditingId(null)} style={btnGhostStyle}>
              キャンセル
            </button>
            <button onClick={save} disabled={saving} style={btnAccentStyle}>
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      )}

      <div>
        {services.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--ink-mute)" }}>
            メニューが登録されていません
          </div>
        ) : (
          services.map((s) => (
            <div
              key={s.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto auto",
                gap: 16,
                alignItems: "center",
                padding: "16px 0",
                borderBottom: "1px solid var(--line)",
              }}
            >
              <div>
                <div style={{ fontWeight: 500 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: "var(--ink-mute)", marginTop: 2 }}>
                  {s.description ?? "(説明なし)"}
                </div>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 14 }}>
                {yen(s.priceYen)}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => openEdit(s)} style={btnGhostSmStyle}>
                  編集
                </button>
                <button onClick={() => remove(s.id)} style={btnGhostSmStyle}>
                  削除
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const fieldStyle: React.CSSProperties = { marginBottom: 14 };
const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
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
const btnGhostSmStyle: React.CSSProperties = {
  ...btnGhostStyle,
  padding: "5px 12px",
  fontSize: 12,
};
const errorStyle: React.CSSProperties = {
  background: "#fcebeb",
  border: "1px solid #f7c1c1",
  color: "#791f1f",
  padding: "10px 14px",
  fontSize: 12,
  marginTop: 8,
  borderRadius: 4,
};
