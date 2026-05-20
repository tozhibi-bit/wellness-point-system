import { requireEmployee } from "@/lib/auth-helpers";
import {
  ensureMonthlyGrant,
  getActiveMerchantsForCompany,
  getEmployeeTransactions,
  getRemainingPoints,
} from "@/lib/server/queries";
import { prisma } from "@/lib/prisma";
import { yen, getCurrentYearMonth, getMaxPointsByPrice } from "@/lib/points";
import AppHeader from "@/components/shared/app-header";
import { styles, badgeStyles, STATUS_LABELS } from "@/components/shared/styles";

export const dynamic = "force-dynamic";

export default async function EmployeePage() {
  const session = await requireEmployee();
  const yearMonth = getCurrentYearMonth();

  await ensureMonthlyGrant(session.user.id, session.user.companyId, yearMonth);

  const [company, points, transactions, merchants] = await Promise.all([
    prisma.company.findUniqueOrThrow({ where: { id: session.user.companyId } }),
    getRemainingPoints(session.user.id, yearMonth),
    getEmployeeTransactions(session.user.id, session.user.companyId, 20),
    getActiveMerchantsForCompany(session.user.companyId),
  ]);

  const usagePct = (points.used / Math.max(1, points.granted)) * 100;

  const today = new Date();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const daysLeft = Math.max(
    0,
    Math.ceil((lastDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  );

  return (
    <div style={{ minHeight: "100vh" }}>
      <AppHeader
        userName={`${session.user.name} さん`}
        subBrand="従業員ポータル"
        userMeta={`${company.name} / ${session.user.displayId}`}
      />

      <main className="max-w-[1400px] mx-auto px-4 py-6 sm:px-8 sm:py-8">

        {/* ページヘッダー */}
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6 pb-5 border-b border-[var(--line)]">
          <div>
            <div style={styles.pageTitle}>マイページ</div>
            <div style={styles.pageSub}>{company.name}</div>
          </div>
          <div style={styles.periodLabel}>{yearMonth} 期間</div>
        </div>

        {/* ポイントヒーロー（全幅） */}
        <div style={pointHeroStyle} className="mb-5">
          <div style={pointHeroLabelStyle}>今月の利用可能ポイント</div>
          <div style={pointValueStyle}>
            <span>{points.remaining}</span>
            <span style={{ fontSize: 20, color: "#a8a8a8" }}>/ {points.granted} pt</span>
          </div>
          <div style={pointMeterStyle}>
            <div style={{ ...pointMeterFillStyle, width: `${usagePct}%` }} />
          </div>
          <div style={pointExpiryStyle}>
            ※ ポイントは月末に失効 — あと{daysLeft}日 / 1pt = 1,000円 / サービス額の50%まで利用可
          </div>
        </div>

        {/* 提携店舗 + 利用履歴 */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">

          {/* 提携店舗メニュー */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>
              <span>提携店舗メニュー</span>
              <span style={styles.cardTitleSub}>
                {merchants.length} SHOPS · {merchants.reduce((s, m) => s + m.services.length, 0)} SERVICES
              </span>
            </div>
            <div style={{ maxHeight: 480, overflowY: "auto" }}>
              {merchants.map((m) => (
                <div key={m.id} style={{ marginBottom: 20 }}>
                  {/* 店舗ヘッダー */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span
                      style={{
                        width: 36,
                        height: 36,
                        background: "var(--bg)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "'Shippori Mincho', serif",
                        fontSize: 16,
                        color: "var(--accent)",
                        border: "1px solid var(--line)",
                        flexShrink: 0,
                      }}
                    >
                      {m.name.charAt(0)}
                    </span>
                    <div>
                      <div style={{ fontWeight: 500 }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: "var(--ink-mute)" }}>
                        {m.category} · {m.address}
                      </div>
                    </div>
                  </div>

                  {/* サービス行 */}
                  {m.services.map((s) => (
                    <div
                      key={s.id}
                      className="flex flex-col sm:grid sm:grid-cols-[1fr_auto_auto_auto] gap-2 sm:gap-[14px] sm:pl-[46px] py-3 border-b border-dashed border-[var(--line)]"
                    >
                      <div>
                        <div style={{ fontWeight: 500 }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: "var(--ink-mute)", marginTop: 2 }}>
                          {s.description}
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:contents gap-3">
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
                          {yen(s.priceYen)}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: "var(--ink-mute)",
                            fontFamily: "'JetBrains Mono', monospace",
                            minWidth: 60,
                            textAlign: "right",
                          }}
                        >
                          最大 {getMaxPointsByPrice(s.priceYen)} pt
                        </div>
                        <a
                          href={m.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            background: "var(--sumi)",
                            color: "#fbfaf6",
                            padding: "6px 12px",
                            fontSize: 11,
                            fontWeight: 500,
                            textDecoration: "none",
                            borderRadius: 4,
                            whiteSpace: "nowrap",
                          }}
                        >
                          店舗HPへ ↗
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 16,
                padding: "12px 14px",
                background: "var(--bg)",
                border: "1px dashed var(--line-strong)",
                fontSize: 11,
                color: "var(--ink-soft)",
                lineHeight: 1.7,
                borderRadius: 4,
              }}
            >
              <strong style={{ color: "var(--accent)" }}>ご利用の流れ</strong>
              <br />
              ① 上記の「店舗HPへ」から各店舗の予約サイトへ移動 → ② 来店・サービス利用 → ③ 利用後、店舗側でポイントが登録され、利用履歴に反映されます
            </div>
          </div>

          {/* 利用履歴 */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>
              <span>利用履歴</span>
              <span style={styles.cardTitleSub}>HISTORY</span>
            </div>
            {transactions.length === 0 ? (
              <div style={styles.empty}>利用履歴はまだありません</div>
            ) : (
              <div className="overflow-x-auto">
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.tableTh}>日付</th>
                      <th style={styles.tableTh}>店舗 / サービス</th>
                      <th style={{ ...styles.tableTh, textAlign: "right" }}>pt</th>
                      <th style={styles.tableTh}>状態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 10).map((t) => (
                      <tr key={t.id}>
                        <td style={{ ...styles.tableTd, ...styles.monoCell }}>
                          {t.usedDate.toISOString().slice(5, 10)}
                        </td>
                        <td style={styles.tableTd}>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{t.merchant.name}</div>
                          <div style={{ fontSize: 11, color: "var(--ink-mute)" }}>{t.service.name}</div>
                        </td>
                        <td style={{ ...styles.tableTd, ...styles.amountCell }}>{t.pointsUsed}</td>
                        <td style={styles.tableTd}>
                          <span style={badgeStyles[t.status]}>{STATUS_LABELS[t.status]}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

const pointHeroStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, var(--sumi) 0%, #1a1a1a 100%)",
  color: "#fbfaf6",
  padding: 32,
  position: "relative",
  overflow: "hidden",
  border: "1px solid var(--sumi)",
};

const pointHeroLabelStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.2em",
  color: "#999",
  marginBottom: 12,
  textTransform: "uppercase",
};

const pointValueStyle: React.CSSProperties = {
  fontFamily: "'Shippori Mincho', serif",
  fontSize: 72,
  fontWeight: 700,
  lineHeight: 1,
  display: "flex",
  alignItems: "baseline",
  gap: 8,
};

const pointMeterStyle: React.CSSProperties = {
  marginTop: 20,
  background: "rgba(255,255,255,0.08)",
  height: 4,
  position: "relative",
  overflow: "hidden",
};

const pointMeterFillStyle: React.CSSProperties = {
  height: "100%",
  background: "var(--accent-soft)",
  transition: "width 0.5s",
};

const pointExpiryStyle: React.CSSProperties = {
  marginTop: 12,
  fontSize: 11,
  color: "#888",
  fontFamily: "'JetBrains Mono', monospace",
};
