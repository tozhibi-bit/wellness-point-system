import { requireEmployee } from "@/lib/auth-helpers";
import {
  ensureMonthlyGrant,
  getActiveMerchantsForCompany,
  getEmployeeTransactions,
  getRemainingPoints,
} from "@/lib/server/queries";
import { prisma } from "@/lib/prisma";
import { yen, getCurrentYearMonth, getMaxPointsByPrice } from "@/lib/points";
import { toDisplayableImageUrl } from "@/lib/image-url";
import AppHeader from "@/components/shared/app-header";
import PasswordChangeForm from "@/components/shared/password-change-form";
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

  const subsidyPct = company.subsidyPct;
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
        <div style={pointHeroStyle} className="mb-5 p-6 sm:p-8">
          <div style={pointHeroLabelStyle}>今月の利用可能ポイント</div>
          <div style={pointValueStyle} className="text-[56px] sm:text-[72px]">
            <span>{points.remaining}</span>
            <span className="text-base sm:text-xl" style={{ color: "#a8a8a8" }}>/ {points.granted} 回</span>
          </div>
          <div style={pointMeterStyle}>
            <div style={{ ...pointMeterFillStyle, width: `${usagePct}%` }} />
          </div>
          <div style={pointExpiryStyle}>
            ※ ポイントは月末に失効します（あと{daysLeft}日）／ サービス額の{subsidyPct}%まで利用できます
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
            <div style={{ maxHeight: 600, overflowY: "auto" }}>
              {merchants.map((m) => {
                const reservationBtn = m.websiteUrl ? (
                  <a
                    href={m.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={reserveBtnStyle}
                  >
                    予約はこちら ↗
                  </a>
                ) : m.phone ? (
                  <a
                    href={`tel:${m.phone.replace(/[^\d+]/g, "")}`}
                    style={{ ...reserveBtnStyle, background: "var(--matcha)" }}
                  >
                    📞 {m.phone}
                  </a>
                ) : null;

                return (
                  <div key={m.id} style={merchantCardStyle}>
                    {/* ヘッダー: ジャンル名 + 予約ボタン */}
                    <div style={merchantCardHeaderStyle}>
                      <div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: "0.15em", marginBottom: 2 }}>
                          {m.name}
                        </div>
                        <div style={{ fontFamily: "'Shippori Mincho', serif", fontSize: 17, fontWeight: 700, color: "#fbfaf6" }}>
                          {m.category}
                        </div>
                      </div>
                      {reservationBtn}
                    </div>

                    {/* 店舗情報エリア */}
                    <div className={m.photo1Url ? "grid grid-cols-1 sm:grid-cols-[150px_1fr]" : "grid grid-cols-1"}>
                      {/* 写真① */}
                      {m.photo1Url && (
                        <div className="relative overflow-hidden h-40 sm:h-auto">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={toDisplayableImageUrl(m.photo1Url)}
                            alt={`${m.name} 写真1`}
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                        </div>
                      )}

                      {/* アクセス / 店休日 / 営業時間 */}
                      <div style={{ borderBottom: "1px solid var(--line)" }}>
                        {(m.accessNote || m.address) && (
                          <div style={infoRowStyle}>
                            <span style={infoIconStyle}>📍</span>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: 13 }}>{m.accessNote || m.address}</span>
                              {m.mapsUrl && (
                                <a
                                  href={m.mapsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ marginLeft: 8, fontSize: 11, color: "var(--matcha)", textDecoration: "none" }}
                                >
                                  地図を見る ↗
                                </a>
                              )}
                              {!m.mapsUrl && m.address && m.accessNote && (
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.address)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ marginLeft: 8, fontSize: 11, color: "var(--matcha)", textDecoration: "none" }}
                                >
                                  地図を見る ↗
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                        {m.closedDays && (
                          <div style={infoRowStyle}>
                            <span style={infoIconStyle}>🗓</span>
                            <span style={{ fontSize: 13 }}>{m.closedDays}</span>
                          </div>
                        )}
                        {m.businessHours && (
                          <div style={{ ...infoRowStyle, borderBottom: "none" }}>
                            <span style={infoIconStyle}>🕐</span>
                            <span style={{ fontSize: 13 }}>{m.businessHours}</span>
                          </div>
                        )}
                        {!m.accessNote && !m.address && !m.closedDays && !m.businessHours && (
                          <div style={{ padding: "10px 14px", fontSize: 12, color: "var(--ink-mute)" }}>
                            店舗情報は準備中です
                          </div>
                        )}
                      </div>
                    </div>

                    {/* サービス + 価格エリア */}
                    {m.services.length > 0 && (
                      <div className={m.photo2Url ? "grid grid-cols-1 sm:grid-cols-[150px_1fr]" : "grid grid-cols-1"}>
                        {/* 写真② */}
                        {m.photo2Url && (
                          <div className="overflow-hidden h-40 sm:h-auto">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={toDisplayableImageUrl(m.photo2Url)}
                              alt={`${m.name} 写真2`}
                              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            />
                          </div>
                        )}

                        {/* サービス価格一覧 */}
                        <div>
                          {m.services.map((s, idx) => {
                            const maxPt = getMaxPointsByPrice(s.priceYen, subsidyPct);
                            const subsidyYen = maxPt * 1000;
                            const preferentialYen = s.priceYen - subsidyYen;
                            return (
                              <div
                                key={s.id}
                                style={{
                                  padding: "10px 14px",
                                  borderBottom: idx < m.services.length - 1 ? "1px dashed var(--line)" : "none",
                                }}
                              >
                                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>{s.name}</div>
                                {s.description && (
                                  <div style={{ fontSize: 11, color: "var(--ink-mute)", marginBottom: 6 }}>{s.description}</div>
                                )}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                                  <div style={priceBoxStyle}>
                                    <div style={priceLabelStyle}>定価</div>
                                    <div style={priceValueStyle}>{yen(s.priceYen)}</div>
                                  </div>
                                  <div style={{ ...priceBoxStyle, background: "var(--matcha)", color: "#fbfaf6" }}>
                                    <div style={{ ...priceLabelStyle, color: "rgba(255,255,255,0.7)" }}>優待価格</div>
                                    <div style={{ ...priceValueStyle, color: "#fbfaf6" }}>{yen(preferentialYen)}</div>
                                  </div>
                                  <div style={{ ...priceBoxStyle, background: "var(--accent)", color: "#fbfaf6" }}>
                                    <div style={{ ...priceLabelStyle, color: "rgba(255,255,255,0.7)" }}>補助金額</div>
                                    <div style={{ ...priceValueStyle, color: "#fbfaf6" }}>
                                      {yen(subsidyYen)}
                                      <span style={{ fontSize: 9, marginLeft: 3, opacity: 0.8 }}>({maxPt}回)</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
              ① 「予約はこちら」または電話番号から各店舗へ予約 → ② 来店・サービス利用 → ③ 利用後、店舗側でポイントが登録され、利用履歴に反映されます
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
                      <th style={{ ...styles.tableTh, textAlign: "right" }}>回</th>
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

        {/* パスワード変更 */}
        <div style={{ ...styles.card, marginTop: 20 }}>
          <div style={styles.cardTitle}>
            <span>パスワード変更</span>
          </div>
          <div style={{ maxWidth: 400 }}>
            <PasswordChangeForm />
          </div>
        </div>

      </main>
    </div>
  );
}

const pointHeroStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, var(--sumi) 0%, #1a1a1a 100%)",
  color: "#fbfaf6",
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
  fontWeight: 700,
  lineHeight: 1,
  display: "flex",
  alignItems: "baseline",
  flexWrap: "wrap",
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
  marginTop: 14,
  fontSize: 13,
  color: "#d8d3c7",
  lineHeight: 1.7,
};

const merchantCardStyle: React.CSSProperties = {
  border: "1px solid var(--line)",
  marginBottom: 16,
  overflow: "hidden",
};

const merchantCardHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  padding: "10px 14px",
  background: "var(--sumi)",
};

const reserveBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  background: "var(--accent)",
  color: "#fbfaf6",
  padding: "5px 12px",
  fontSize: 12,
  fontWeight: 600,
  textDecoration: "none",
  borderRadius: 4,
  whiteSpace: "nowrap",
  flexShrink: 0,
};

const infoRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
  padding: "8px 14px",
  borderBottom: "1px solid var(--line)",
  color: "var(--ink)",
};

const infoIconStyle: React.CSSProperties = {
  fontSize: 14,
  flexShrink: 0,
  marginTop: 1,
};

const priceBoxStyle: React.CSSProperties = {
  background: "var(--bg)",
  border: "1px solid var(--line)",
  borderRadius: 4,
  padding: "6px 8px",
  textAlign: "center",
};

const priceLabelStyle: React.CSSProperties = {
  fontSize: 9,
  letterSpacing: "0.1em",
  color: "var(--ink-mute)",
  marginBottom: 3,
};

const priceValueStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 13,
  fontWeight: 700,
  color: "var(--ink)",
};
