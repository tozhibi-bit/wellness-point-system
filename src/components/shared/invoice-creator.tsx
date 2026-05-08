"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ContractStats {
  companyId: string;
  companyName: string;
  transactions: Array<{
    id: string;
    displayId: string;
    usedDate: string;
    employeeName: string;
    employeeDisplayId: string;
    serviceName: string;
    pointsUsed: number;
  }>;
  totalPoints: number;
  subtotal: number;
  tax: number;
  total: number;
  existingInvoiceId: string | null;
  existingInvoiceStatus: string | null;
}

interface Props {
  yearMonth: string;
  contracts: ContractStats[];
  merchantInfo: {
    name: string;
    address: string;
    invoiceRegNo: string;
  };
}

const yen = (n: number) => "¥" + Math.round(n).toLocaleString("ja-JP");

export default function InvoiceCreator({ yearMonth, contracts, merchantInfo }: Props) {
  const router = useRouter();
  const [issuing, setIssuing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function issue(companyId: string) {
    setIssuing(companyId);
    setError(null);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yearMonth, companyId }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error ?? "請求書発行に失敗しました");
        setIssuing(null);
        return;
      }
      router.refresh();
      const created = j.invoices?.[0];
      if (created?.invoice?.id) {
        window.open(`/api/invoices/${created.invoice.id}`, "_blank");
      }
    } catch {
      setError("通信エラー");
    } finally {
      setIssuing(null);
    }
  }

  if (contracts.length === 0) {
    return (
      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--line)", padding: 40, textAlign: "center" }}>
        契約中の会社がありません
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 20, padding: 14, background: "var(--bg-panel)", border: "1px solid var(--line)", fontSize: 13 }}>
        <div style={{ fontFamily: "'Shippori Mincho', serif", fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
          {merchantInfo.name}
        </div>
        <div style={{ color: "var(--ink-soft)", fontSize: 12 }}>{merchantInfo.address}</div>
        <div style={{ color: "var(--ink-soft)", fontSize: 12, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
          適格請求書登録番号: {merchantInfo.invoiceRegNo}
        </div>
      </div>

      {error && (
        <div style={{ background: "#fcebeb", border: "1px solid #f7c1c1", color: "#791f1f", padding: "10px 14px", fontSize: 12, marginBottom: 16, borderRadius: 4 }}>
          {error}
        </div>
      )}

      {contracts.map((c) => (
        <div
          key={c.companyId}
          style={{
            background: "var(--bg-panel)",
            border: "1px solid var(--line)",
            padding: 24,
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid var(--line)" }}>
            <div>
              <div style={{ fontFamily: "'Shippori Mincho', serif", fontSize: 18, fontWeight: 700 }}>
                {c.companyName}
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-mute)", marginTop: 2 }}>
                対象取引: {c.transactions.length}件
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "var(--ink-mute)" }}>請求金額(税込)</div>
              <div style={{ fontFamily: "'Shippori Mincho', serif", fontSize: 28, fontWeight: 700, color: "var(--accent)" }}>
                {yen(c.total)}
              </div>
            </div>
          </div>

          {c.transactions.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "var(--ink-mute)", fontSize: 13 }}>
              対象期間({yearMonth})に確定済みの取引がありません
            </div>
          ) : (
            <>
              <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", marginBottom: 16 }}>
                <thead>
                  <tr style={{ background: "var(--bg)" }}>
                    <th style={thStyle}>利用日</th>
                    <th style={thStyle}>従業員</th>
                    <th style={thStyle}>サービス</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>pt</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>金額</th>
                  </tr>
                </thead>
                <tbody>
                  {c.transactions.map((t) => (
                    <tr key={t.id}>
                      <td style={tdStyle}>{t.usedDate}</td>
                      <td style={tdStyle}>{t.employeeName} <span style={{ color: "var(--ink-mute)", fontSize: 10 }}>({t.employeeDisplayId})</span></td>
                      <td style={tdStyle}>{t.serviceName}</td>
                      <td style={{ ...tdStyle, textAlign: "right", fontFamily: "monospace" }}>{t.pointsUsed}</td>
                      <td style={{ ...tdStyle, textAlign: "right", fontFamily: "monospace" }}>{yen(t.pointsUsed * 1000)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>小計(10%対象)</td>
                    <td style={{ ...tdStyle, textAlign: "right", fontFamily: "monospace" }}>{c.totalPoints}</td>
                    <td style={{ ...tdStyle, textAlign: "right", fontFamily: "monospace" }}>{yen(c.subtotal)}</td>
                  </tr>
                  <tr>
                    <td colSpan={4} style={{ ...tdStyle, textAlign: "right" }}>消費税(10%)</td>
                    <td style={{ ...tdStyle, textAlign: "right", fontFamily: "monospace" }}>{yen(c.tax)}</td>
                  </tr>
                  <tr style={{ background: "var(--bg)", fontWeight: 700 }}>
                    <td colSpan={4} style={{ ...tdStyle, textAlign: "right" }}>合計(税込)</td>
                    <td style={{ ...tdStyle, textAlign: "right", fontFamily: "monospace" }}>{yen(c.total)}</td>
                  </tr>
                </tfoot>
              </table>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" }}>
                {c.existingInvoiceId && (
                  <span style={{ fontSize: 11, color: "var(--ink-mute)" }}>
                    既に発行済み({c.existingInvoiceStatus})
                  </span>
                )}
                {c.existingInvoiceId && (
                  <>
                    <a
                      href={`/api/invoices/${c.existingInvoiceId}?format=csv-detail`}
                      style={csvBtnStyle}
                      title="取引明細CSV(1行=1取引)"
                    >
                      📄 明細CSV
                    </a>
                    <a
                      href={`/api/invoices/${c.existingInvoiceId}?format=csv-summary`}
                      style={csvBtnStyle}
                      title="サマリCSV(1行=1請求書)"
                    >
                      📊 サマリCSV
                    </a>
                    <a
                      href={`/api/invoices/${c.existingInvoiceId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-block",
                        background: "transparent",
                        color: "var(--ink)",
                        border: "1px solid var(--line-strong)",
                        padding: "9px 18px",
                        fontSize: 13,
                        fontWeight: 500,
                        textDecoration: "none",
                        borderRadius: 4,
                      }}
                    >
                      プレビュー
                    </a>
                  </>
                )}
                <button
                  onClick={() => issue(c.companyId)}
                  disabled={issuing === c.companyId}
                  style={{
                    background: "var(--accent)",
                    color: "#fbfaf6",
                    border: "none",
                    padding: "9px 18px",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    borderRadius: 4,
                    fontFamily: "inherit",
                    opacity: issuing === c.companyId ? 0.7 : 1,
                  }}
                >
                  {issuing === c.companyId ? "発行中..." : c.existingInvoiceId ? "再発行 + ダウンロード" : "発行 + ダウンロード"}
                </button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

const csvBtnStyle: React.CSSProperties = {
  display: "inline-block",
  background: "var(--matcha)",
  color: "#fbfaf6",
  border: "none",
  padding: "9px 14px",
  fontSize: 12,
  fontWeight: 500,
  textDecoration: "none",
  borderRadius: 4,
  cursor: "pointer",
};

const thStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderBottom: "1px solid var(--line-strong)",
  fontSize: 10,
  letterSpacing: "0.05em",
  color: "var(--ink-mute)",
  textAlign: "left",
  fontWeight: 500,
};

const tdStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderBottom: "1px solid var(--line)",
  fontSize: 12,
};
