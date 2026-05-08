import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { yen } from "@/lib/points";
import AppHeader from "@/components/shared/app-header";
import { styles } from "@/components/shared/styles";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  draft: "下書き",
  issued: "発行済",
  paid: "支払済",
  cancelled: "取消",
};

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  draft: { bg: "#eee", color: "#888", border: "#ccc" },
  issued: { bg: "#fff5e0", color: "#8b6914", border: "#e8d59a" },
  paid: { bg: "#e8f0e3", color: "#3a5024", border: "#b8ceab" },
  cancelled: { bg: "#eee", color: "#888", border: "#ccc" },
};

export default async function AdminInvoicesPage() {
  const session = await requireAdmin();

  const invoices = await prisma.invoice.findMany({
    where: { companyId: session.user.companyId },
    include: {
      merchant: {
        select: {
          displayId: true,
          name: true,
          category: true,
          invoiceRegNo: true,
        },
      },
      _count: { select: { transactions: true } },
    },
    orderBy: [{ yearMonth: "desc" }, { issuedAt: "desc" }],
  });

  const company = await prisma.company.findUniqueOrThrow({
    where: { id: session.user.companyId },
  });

  const grouped = new Map<string, typeof invoices>();
  for (const inv of invoices) {
    const key = inv.yearMonth;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(inv);
  }

  const totalIssued = invoices
    .filter((i) => i.status === "issued" || i.status === "paid")
    .reduce((s, i) => s + i.totalYen, 0);
  const totalUnpaid = invoices
    .filter((i) => i.status === "issued")
    .reduce((s, i) => s + i.totalYen, 0);

  return (
    <div style={{ minHeight: "100vh" }}>
      <AppHeader
        userName={session.user.name ?? "管理者"}
        subBrand="管理者ダッシュボード"
        userMeta={company.name}
      />
      <main style={styles.main}>
        <div style={styles.pageHeader}>
          <div>
            <div style={styles.pageTitle}>請求書一覧</div>
            <div style={styles.pageSub}>INVOICES · ALL MERCHANTS</div>
          </div>
          <Link href="/admin" style={{ ...styles.btn, ...styles.btnGhost }}>
            ← ダッシュボードへ
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <SummaryBox label="請求書総数" value={`${invoices.length}`} unit="件" />
          <SummaryBox label="発行済合計" value={yen(totalIssued)} accent="matcha" />
          <SummaryBox label="未払い合計" value={yen(totalUnpaid)} accent="accent" />
        </div>

        {invoices.length === 0 ? (
          <div style={styles.card}>
            <div style={styles.empty}>
              請求書はまだ発行されていません。
              <br />
              加盟店が月次請求書を発行すると、ここに表示されます。
            </div>
          </div>
        ) : (
          Array.from(grouped.entries()).map(([yearMonth, list]) => (
            <div key={yearMonth} style={{ ...styles.card, marginBottom: 20 }}>
              <div style={styles.cardTitle}>
                <span>{yearMonth} 期間</span>
                <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={styles.cardTitleSub}>
                    {list.length} INVOICES · {yen(list.reduce((s, i) => s + i.totalYen, 0))}
                  </span>
                  <a
                    href={`/api/invoices/export?format=csv-detail&yearMonth=${yearMonth}`}
                    style={{
                      ...styles.btn,
                      ...styles.btnSm,
                      background: "var(--matcha)",
                    }}
                    title="この月の取引明細をすべてCSVで一括ダウンロード"
                  >
                    📄 明細CSV
                  </a>
                  <a
                    href={`/api/invoices/export?format=csv-summary&yearMonth=${yearMonth}`}
                    style={{
                      ...styles.btn,
                      ...styles.btnSm,
                      background: "var(--matcha)",
                    }}
                    title="この月の請求書サマリをCSVで一括ダウンロード"
                  >
                    📊 サマリCSV
                  </a>
                </span>
              </div>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.tableTh}>請求番号</th>
                    <th style={styles.tableTh}>加盟店</th>
                    <th style={styles.tableTh}>登録番号</th>
                    <th style={{ ...styles.tableTh, textAlign: "right" }}>取引数</th>
                    <th style={{ ...styles.tableTh, textAlign: "right" }}>pt</th>
                    <th style={{ ...styles.tableTh, textAlign: "right" }}>合計(税込)</th>
                    <th style={styles.tableTh}>発行日</th>
                    <th style={styles.tableTh}>支払期限</th>
                    <th style={styles.tableTh}>状態</th>
                    <th style={styles.tableTh}></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((inv) => {
                    const sc = STATUS_COLORS[inv.status] ?? STATUS_COLORS.draft;
                    return (
                      <tr key={inv.id}>
                        <td style={{ ...styles.tableTd, ...styles.monoCell, fontWeight: 500 }}>
                          {inv.displayId}
                        </td>
                        <td style={{ ...styles.tableTd, fontSize: 12 }}>
                          <div style={{ fontWeight: 500 }}>{inv.merchant.name}</div>
                          <div style={{ fontSize: 10, color: "var(--ink-mute)" }}>
                            {inv.merchant.category}
                          </div>
                        </td>
                        <td style={{ ...styles.tableTd, ...styles.monoCell, fontSize: 11 }}>
                          {inv.merchant.invoiceRegNo}
                        </td>
                        <td style={{ ...styles.tableTd, ...styles.amountCell }}>
                          {inv._count.transactions}
                        </td>
                        <td style={{ ...styles.tableTd, ...styles.amountCell }}>
                          {inv.totalPoints}
                        </td>
                        <td
                          style={{
                            ...styles.tableTd,
                            ...styles.amountCell,
                            fontWeight: 700,
                          }}
                        >
                          {yen(inv.totalYen)}
                        </td>
                        <td style={{ ...styles.tableTd, ...styles.monoCell }}>
                          {inv.issuedAt ? inv.issuedAt.toISOString().slice(0, 10) : "-"}
                        </td>
                        <td style={{ ...styles.tableTd, ...styles.monoCell }}>
                          {inv.dueDate ? inv.dueDate.toISOString().slice(0, 10) : "-"}
                        </td>
                        <td style={styles.tableTd}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 8px",
                              fontSize: 10,
                              letterSpacing: "0.1em",
                              borderRadius: 2,
                              fontFamily: "'JetBrains Mono', monospace",
                              fontWeight: 500,
                              textTransform: "uppercase",
                              background: sc.bg,
                              color: sc.color,
                              border: `1px solid ${sc.border}`,
                            }}
                          >
                            {STATUS_LABELS[inv.status] ?? inv.status}
                          </span>
                        </td>
                        <td style={styles.tableTd}>
                          <div style={{ display: "flex", gap: 4 }}>
                            <a
                              href={`/api/invoices/${inv.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                ...styles.btn,
                                ...styles.btnGhost,
                                ...styles.btnSm,
                              }}
                              title="請求書プレビュー(PDF)"
                            >
                              PDF
                            </a>
                            <a
                              href={`/api/invoices/${inv.id}?format=csv-detail`}
                              style={{
                                ...styles.btn,
                                ...styles.btnGhost,
                                ...styles.btnSm,
                              }}
                              title="この請求書の取引明細をCSVで出力"
                            >
                              CSV
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))
        )}

        <div
          style={{
            marginTop: 20,
            padding: 14,
            background: "var(--bg)",
            border: "1px dashed var(--line-strong)",
            fontSize: 12,
            color: "var(--ink-soft)",
            lineHeight: 1.7,
          }}
        >
          ※ 「PDF」ボタンを押すとブラウザの印刷機能でPDF保存できます。
          <br />
          ※ 「CSV」ボタンで取引明細をExcel形式で出力できます(UTF-8 BOM付きでExcelでそのまま開けます)。
          <br />
          ※ 月別ヘッダーの「明細CSV / サマリCSV」で月単位の一括ダウンロードが可能です。
          <br />
          ※ 適格請求書発行事業者の登録番号を含む適格請求書(インボイス)です。
        </div>
      </main>
    </div>
  );
}

interface SummaryBoxProps {
  label: string;
  value: string;
  unit?: string;
  accent?: "accent" | "matcha" | "gold" | "sumi";
}

function SummaryBox({ label, value, unit, accent = "accent" }: SummaryBoxProps) {
  const accentColor = {
    accent: "var(--accent)",
    matcha: "var(--matcha)",
    gold: "var(--gold)",
    sumi: "var(--sumi)",
  }[accent];

  return (
    <div
      style={{
        background: "var(--bg-panel)",
        border: "1px solid var(--line)",
        padding: 20,
        borderLeft: `3px solid ${accentColor}`,
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.15em",
          color: "var(--ink-mute)",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'Shippori Mincho', serif",
          fontSize: 32,
          fontWeight: 700,
          lineHeight: 1.1,
        }}
      >
        {value}
        {unit && (
          <span
            style={{
              fontSize: 13,
              color: "var(--ink-mute)",
              marginLeft: 4,
              fontFamily: "'Zen Kaku Gothic New', sans-serif",
              fontWeight: 400,
            }}
          >
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
