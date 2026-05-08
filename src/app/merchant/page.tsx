import { requireMerchant } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getCurrentYearMonth, yen } from "@/lib/points";
import { getMerchantTransactions } from "@/lib/server/queries";
import AppHeader from "@/components/shared/app-header";
import { styles, badgeStyles, STATUS_LABELS } from "@/components/shared/styles";
import Link from "next/link";
import UsageRegisterButton from "@/components/shared/usage-register-button";
import ConfirmTxButton from "@/components/shared/confirm-tx-button";

export const dynamic = "force-dynamic";

export default async function MerchantPage() {
  const session = await requireMerchant();
  const merchantId = session.user.merchantId;
  const yearMonth = getCurrentYearMonth();

  const [merchant, services, allTx, monthTx] = await Promise.all([
    prisma.merchant.findUniqueOrThrow({ where: { id: merchantId } }),
    prisma.service.findMany({
      where: { merchantId, deletedAt: null },
      orderBy: { priceYen: "asc" },
    }),
    getMerchantTransactions(merchantId, undefined, 30),
    getMerchantTransactions(merchantId, yearMonth),
  ]);

  const monthConfirmed = monthTx.filter(
    (t) => t.status === "confirmed" || t.status === "invoiced"
  );
  const monthPoints = monthConfirmed.reduce((s, t) => s + t.pointsUsed, 0);
  const monthRevenue = monthPoints * 1000;
  const pendingCount = monthTx.filter((t) => t.status === "pending_usage").length;

  return (
    <div style={{ minHeight: "100vh" }}>
      <AppHeader
        userName={merchant.name}
        subBrand="加盟店ポータル"
        userMeta={`${merchant.displayId} / ${merchant.category}`}
      />
      <main style={styles.main}>
        <div style={styles.pageHeader}>
          <div>
            <div style={styles.pageTitle}>{merchant.name}</div>
            <div style={styles.pageSub}>
              {merchant.address} · 登録番号 {merchant.invoiceRegNo}
            </div>
          </div>
          <div style={styles.periodLabel}>{yearMonth} 期間</div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <SummaryBox label="今月の利用ポイント" value={`${monthPoints}`} unit="pt" />
          <SummaryBox label="ポイント換算売上" value={yen(monthRevenue)} accent="matcha" />
          <SummaryBox label="利用件数" value={`${monthConfirmed.length}`} unit="件" accent="gold" />
          <SummaryBox
            label="未確定の取引"
            value={`${pendingCount}`}
            unit="件"
            accent="sumi"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>
              <span>利用実績</span>
              <UsageRegisterButton />
            </div>
            {allTx.length === 0 ? (
              <div style={styles.empty}>利用実績はまだありません</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.tableTh}>日付</th>
                    <th style={styles.tableTh}>従業員</th>
                    <th style={styles.tableTh}>サービス</th>
                    <th style={{ ...styles.tableTh, textAlign: "right" }}>pt</th>
                    <th style={styles.tableTh}>状態</th>
                  </tr>
                </thead>
                <tbody>
                  {allTx.map((t) => (
                    <tr key={t.id}>
                      <td style={{ ...styles.tableTd, ...styles.monoCell }}>
                        {t.usedDate.toISOString().slice(5, 10)}
                      </td>
                      <td style={{ ...styles.tableTd, fontSize: 12 }}>
                        {t.employee.name}
                        <br />
                        <span style={{ color: "var(--ink-mute)", fontSize: 10 }}>
                          {t.employee.displayId}
                        </span>
                      </td>
                      <td style={{ ...styles.tableTd, fontSize: 12 }}>{t.service.name}</td>
                      <td style={{ ...styles.tableTd, ...styles.amountCell }}>{t.pointsUsed}</td>
                      <td style={styles.tableTd}>
                        <span style={badgeStyles[t.status]}>{STATUS_LABELS[t.status]}</span>
                        {t.status === "pending_usage" && (
                          <div style={{ marginTop: 4 }}>
                            <ConfirmTxButton transactionId={t.id} />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div
              style={{
                marginTop: 28,
                paddingTop: 20,
                borderTop: "1px solid var(--line)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>月次締処理</span>
              <div style={{ display: "flex", gap: 8 }}>
                <a
                  href={`/api/invoices/export?format=csv-detail&yearMonth=${yearMonth}`}
                  style={{
                    ...styles.btn,
                    background: "var(--matcha)",
                    fontSize: 12,
                    padding: "7px 14px",
                  }}
                  title="今月の請求書明細をCSVで一括ダウンロード"
                >
                  📄 今月の明細CSV
                </a>
                <Link href="/merchant/invoice" style={{ ...styles.btn }}>
                  {yearMonth} 請求書を作成
                </Link>
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>
              <span>サービスメニュー</span>
              <Link
                href="/merchant/services"
                style={{ ...styles.btn, ...styles.btnAccent, ...styles.btnSm }}
              >
                + 管理
              </Link>
            </div>
            {services.length === 0 ? (
              <div style={styles.empty}>メニュー未登録</div>
            ) : (
              services.map((s) => (
                <div
                  key={s.id}
                  style={{
                    padding: "14px 0",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-mute)", marginTop: 2 }}>
                    {s.description}
                  </div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      fontSize: 14,
                      marginTop: 4,
                    }}
                  >
                    {yen(s.priceYen)}
                  </div>
                </div>
              ))
            )}

            <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
              <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "var(--ink-mute)", textTransform: "uppercase", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>店舗HP・予約サイト</span>
                <Link
                  href="/merchant/profile"
                  style={{ ...styles.btn, ...styles.btnGhost, ...styles.btnSm }}
                >
                  編集
                </Link>
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: "var(--ink-soft)",
                  wordBreak: "break-all",
                  background: "var(--bg)",
                  padding: "8px 10px",
                  border: "1px solid var(--line)",
                  borderRadius: 4,
                }}
              >
                {merchant.websiteUrl}
              </div>
              <div style={{ fontSize: 10, color: "var(--ink-mute)", marginTop: 6, lineHeight: 1.5 }}>
                ※ 従業員のマイページから「店舗HPへ」ボタンで開かれます
              </div>
            </div>
          </div>
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
          fontSize: 36,
          fontWeight: 700,
          lineHeight: 1.1,
        }}
      >
        {value}
        {unit && (
          <span
            style={{
              fontSize: 14,
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
