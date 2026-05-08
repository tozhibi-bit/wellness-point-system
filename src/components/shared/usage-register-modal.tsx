"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";

interface Employee {
  id: string;
  displayId: string;
  name: string;
  department: string | null;
  companyName: string;
  companyId: string;
  grantedPoints: number;
  remainingPoints: number;
  isRecent: boolean;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  priceYen: number;
}

interface Props {
  onClose: () => void;
}

const yen = (n: number) => "¥" + Math.round(n).toLocaleString("ja-JP");

export default function UsageRegisterModal({ onClose }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all"); // "all" or companyId
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [points, setPoints] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/merchants/employees")
      .then((r) => r.json())
      .then((j) => setEmployees(j.employees ?? []))
      .catch(() => setError("従業員一覧の取得に失敗しました"));

    fetch("/api/merchants/services")
      .then((r) => r.json())
      .then((j) => setServices(j.services ?? []))
      .catch(() => {});
  }, []);

  const companyOptions = useMemo(() => {
    const map = new Map<string, string>();
    employees.forEach((e) => map.set(e.companyId, e.companyName));
    return [{ id: "all", name: "全企業" }, ...Array.from(map.entries()).map(([id, name]) => ({ id, name }))];
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => {
      if (deptFilter !== "all" && e.companyId !== deptFilter) return false;
      if (q) {
        const hay = `${e.name} ${e.displayId} ${e.companyName} ${e.department ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [employees, search, deptFilter]);

  const recentEmps = filteredEmployees.filter((e) => e.isRecent);
  const otherEmps = filteredEmployees.filter((e) => !e.isRecent);
  const showRecentSection = !search.trim() && deptFilter === "all" && recentEmps.length > 0;

  const currentService = services.find((s) => s.id === serviceId);
  const maxByPrice = currentService ? Math.floor((currentService.priceYen * 0.5) / 1000) : 0;
  const remaining = selectedEmp?.remainingPoints ?? 0;
  const maxAllowed = Math.min(maxByPrice, remaining);
  const safePoints = Math.max(0, Math.min(points, maxAllowed));
  const ownPayment = currentService ? currentService.priceYen - safePoints * 1000 : 0;

  function selectEmployee(emp: Employee) {
    if (emp.remainingPoints === 0) return;
    setSelectedEmp(emp);
    if (services.length > 0 && !serviceId) {
      setServiceId(services[0].id);
    }
    setPoints(0);
    setStep(2);
    setError(null);
  }

  async function handleSubmit() {
    if (!selectedEmp || !currentService) return;
    if (points > maxByPrice) {
      setError(`最大${maxByPrice}ポイントまで`);
      return;
    }
    if (points > remaining) {
      setError(`従業員の残ポイント不足(残${remaining}pt)`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          pointsUsed: points,
          usedDate: date,
          employeeId: selectedEmp.id,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error ?? "登録に失敗しました");
        setSubmitting(false);
        return;
      }
      router.refresh();
      onClose();
    } catch {
      setError("通信エラー");
      setSubmitting(false);
    }
  }

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <div>
            <div style={modalTitleStyle}>利用実績の登録</div>
            <div style={modalSubStyle}>REGISTER USAGE</div>
          </div>
          <button onClick={onClose} style={closeBtnStyle}>
            ×
          </button>
        </div>

        <div style={{ padding: "24px 28px" }}>
          <div style={stepIndicatorStyle}>
            <div style={{ ...stepStyle, ...(step === 1 ? activeStepStyle : doneStepStyle) }}>
              <span style={stepNumStyle}>{step >= 2 ? "✓" : "1"}</span>
              <span style={stepLabelStyle}>従業員選択</span>
            </div>
            <div style={stepLineStyle} />
            <div style={{ ...stepStyle, ...(step === 2 ? activeStepStyle : {}) }}>
              <span style={stepNumStyle}>2</span>
              <span style={stepLabelStyle}>サービス・ポイント</span>
            </div>
          </div>

          {step === 1 && (
            <div>
              <div style={{ position: "relative", marginBottom: 14 }}>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="氏名・社員IDで検索..."
                  style={searchInputStyle}
                />
              </div>

              <div style={chipsStyle}>
                {companyOptions.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setDeptFilter(c.id)}
                    style={{
                      ...chipStyle,
                      ...(deptFilter === c.id ? activeChipStyle : {}),
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {showRecentSection && (
                <div style={{ marginBottom: 18 }}>
                  <div style={listHeaderStyle}>最近利用した従業員</div>
                  <div style={cardsGridStyle}>
                    {recentEmps.map((e) => (
                      <EmpCard key={e.id} emp={e} onSelect={selectEmployee} />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div style={listHeaderStyle}>
                  {search.trim() || deptFilter !== "all"
                    ? `${filteredEmployees.length}件の検索結果`
                    : showRecentSection
                    ? `その他の従業員 (${otherEmps.length}名)`
                    : `全従業員 (${filteredEmployees.length}名)`}
                </div>
                <div style={cardsGridStyle}>
                  {(showRecentSection ? otherEmps : filteredEmployees).map((e) => (
                    <EmpCard key={e.id} emp={e} onSelect={selectEmployee} />
                  ))}
                </div>
                {filteredEmployees.length === 0 && (
                  <div style={{ padding: 40, textAlign: "center", color: "var(--ink-mute)", fontSize: 13 }}>
                    該当する従業員が見つかりません
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && selectedEmp && (
            <div>
              <div style={selectedBannerStyle}>
                <div style={avatarStyle}>{selectedEmp.name.charAt(0)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{selectedEmp.name}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-mute)", marginTop: 2 }}>
                    {selectedEmp.displayId} · {selectedEmp.companyName} · 残{" "}
                    {selectedEmp.remainingPoints} pt
                  </div>
                </div>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    background: "transparent",
                    color: "var(--ink)",
                    border: "1px solid var(--line-strong)",
                    padding: "5px 12px",
                    fontSize: 12,
                    cursor: "pointer",
                    borderRadius: 4,
                  }}
                >
                  変更
                </button>
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>サービス</label>
                <select
                  value={serviceId}
                  onChange={(e) => {
                    setServiceId(e.target.value);
                    setPoints(0);
                  }}
                  style={inputStyle}
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {yen(s.priceYen)}
                    </option>
                  ))}
                </select>
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>利用日</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>利用ポイント</label>
                <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 44px auto", gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setPoints(Math.max(0, points - 1))}
                    style={stepperBtnStyle}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={maxAllowed}
                    value={points}
                    onChange={(e) => setPoints(Math.max(0, parseInt(e.target.value) || 0))}
                    style={{ ...inputStyle, textAlign: "center", fontSize: 18, fontWeight: 700 }}
                  />
                  <button
                    type="button"
                    onClick={() => setPoints(Math.min(maxAllowed, points + 1))}
                    style={stepperBtnStyle}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => setPoints(maxAllowed)}
                    style={{
                      ...stepperBtnStyle,
                      background: "var(--accent)",
                      color: "#fff",
                      border: "1px solid var(--accent)",
                      padding: "0 14px",
                      fontSize: 11,
                    }}
                  >
                    上限
                  </button>
                </div>
              </div>

              <div style={calcStyle}>
                <div style={calcRowStyle}>
                  <span>サービス額</span>
                  <span>{currentService ? yen(currentService.priceYen) : "-"}</span>
                </div>
                <div style={calcRowStyle}>
                  <span>上限ポイント(50%)</span>
                  <span>{maxByPrice} pt</span>
                </div>
                <div style={calcRowStyle}>
                  <span>従業員の残ポイント</span>
                  <span>{remaining} pt</span>
                </div>
                <div
                  style={{
                    ...calcRowStyle,
                    borderTop: "1px solid var(--line)",
                    marginTop: 6,
                    paddingTop: 6,
                  }}
                >
                  <span>自己負担額</span>
                  <strong style={{ color: "var(--accent)", fontSize: 15 }}>{yen(ownPayment)}</strong>
                </div>
              </div>

              {error && (
                <div
                  style={{
                    background: "#fcebeb",
                    border: "1px solid #f7c1c1",
                    color: "#791f1f",
                    padding: "10px 14px",
                    fontSize: 12,
                    marginTop: 12,
                    borderRadius: 4,
                  }}
                >
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={modalFooterStyle}>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              color: "var(--ink)",
              border: "1px solid var(--line-strong)",
              padding: "9px 18px",
              fontSize: 13,
              cursor: "pointer",
              borderRadius: 4,
              fontFamily: "inherit",
            }}
          >
            キャンセル
          </button>
          {step === 2 && (
            <button
              onClick={handleSubmit}
              disabled={!selectedEmp || submitting}
              style={{
                background: "var(--accent)",
                color: "#fbfaf6",
                border: "none",
                padding: "9px 18px",
                fontSize: 13,
                fontWeight: 500,
                cursor: submitting ? "wait" : "pointer",
                borderRadius: 4,
                fontFamily: "inherit",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? "送信中..." : "登録を確定"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function EmpCard({ emp, onSelect }: { emp: Employee; onSelect: (e: Employee) => void }) {
  const disabled = emp.remainingPoints === 0;
  const ptColor =
    emp.remainingPoints === 0
      ? "var(--ink-mute)"
      : emp.remainingPoints <= 1
      ? "var(--gold)"
      : "var(--matcha)";

  return (
    <div
      onClick={() => !disabled && onSelect(emp)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        border: "1px solid var(--line)",
        background: "#fff",
        borderRadius: 4,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div style={avatarStyle}>{emp.name.charAt(0)}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{emp.name}</div>
        <div style={{ fontSize: 10, color: "var(--ink-mute)", fontFamily: "'JetBrains Mono', monospace" }}>
          {emp.displayId} · {emp.companyName}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: ptColor }}>
          {emp.remainingPoints}
          <span style={{ fontSize: 9, fontWeight: 400 }}>/{emp.grantedPoints}</span>
        </div>
        <div style={{ fontSize: 9, color: "var(--ink-mute)" }}>残pt</div>
      </div>
    </div>
  );
}

const backdropStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 100,
  padding: 20,
};
const modalStyle: React.CSSProperties = {
  background: "var(--bg-panel)",
  border: "1px solid var(--line)",
  maxWidth: 640,
  width: "100%",
  maxHeight: "90vh",
  overflowY: "auto",
  borderTop: "3px solid var(--accent)",
  display: "flex",
  flexDirection: "column",
};
const modalHeaderStyle: React.CSSProperties = {
  padding: "24px 28px 16px",
  borderBottom: "1px solid var(--line)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
};
const modalTitleStyle: React.CSSProperties = {
  fontFamily: "'Shippori Mincho', serif",
  fontSize: 20,
  fontWeight: 700,
};
const modalSubStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10,
  color: "var(--ink-mute)",
  letterSpacing: "0.1em",
  marginTop: 4,
};
const closeBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  fontSize: 22,
  color: "var(--ink-mute)",
  cursor: "pointer",
  lineHeight: 1,
};
const modalFooterStyle: React.CSSProperties = {
  padding: "16px 28px 24px",
  borderTop: "1px solid var(--line)",
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
};
const stepIndicatorStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  marginBottom: 24,
  paddingBottom: 20,
  borderBottom: "1px solid var(--line)",
};
const stepStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexShrink: 0,
};
const activeStepStyle: React.CSSProperties = { color: "var(--ink)" };
const doneStepStyle: React.CSSProperties = {};
const stepNumStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: "50%",
  background: "var(--accent)",
  color: "#fbfaf6",
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 13,
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const stepLabelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 500 };
const stepLineStyle: React.CSSProperties = {
  flex: 1,
  height: 1,
  background: "var(--line)",
  margin: "0 12px",
};
const searchInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  border: "1px solid var(--line-strong)",
  background: "#fff",
  fontFamily: "inherit",
  fontSize: 14,
  borderRadius: 4,
};
const chipsStyle: React.CSSProperties = {
  display: "flex",
  gap: 6,
  marginBottom: 18,
  flexWrap: "wrap",
};
const chipStyle: React.CSSProperties = {
  background: "var(--bg)",
  border: "1px solid var(--line)",
  padding: "5px 12px",
  fontSize: 11,
  color: "var(--ink-soft)",
  borderRadius: 999,
  cursor: "pointer",
  fontFamily: "inherit",
};
const activeChipStyle: React.CSSProperties = {
  background: "var(--sumi)",
  color: "#fbfaf6",
  borderColor: "var(--sumi)",
};
const listHeaderStyle: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: "0.15em",
  color: "var(--ink-mute)",
  textTransform: "uppercase",
  fontWeight: 500,
  marginBottom: 8,
};
const cardsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: 8,
  maxHeight: 280,
  overflowY: "auto",
};
const avatarStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  background: "linear-gradient(135deg, var(--gold), var(--accent))",
  color: "#fff",
  fontFamily: "'Shippori Mincho', serif",
  fontWeight: 700,
  fontSize: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};
const selectedBannerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  background: "var(--bg)",
  border: "1px solid var(--line)",
  borderLeft: "3px solid var(--accent)",
  padding: "14px 16px",
  marginBottom: 20,
  borderRadius: 4,
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
  borderRadius: 4,
};
const stepperBtnStyle: React.CSSProperties = {
  background: "var(--bg)",
  border: "1px solid var(--line-strong)",
  fontSize: 18,
  fontWeight: 700,
  color: "var(--ink-soft)",
  cursor: "pointer",
  fontFamily: "inherit",
  borderRadius: 4,
};
const calcStyle: React.CSSProperties = {
  background: "var(--bg)",
  border: "1px dashed var(--line-strong)",
  padding: "12px 16px",
  marginTop: 12,
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 13,
  color: "var(--ink-soft)",
};
const calcRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "3px 0",
};
