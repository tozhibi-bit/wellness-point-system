import Link from "next/link";

interface MonthNavProps {
  yearMonth: string;        // 表示中の月 "2026-05"
  basePath: string;         // "/merchant" | "/admin"
  currentYearMonth: string; // 当月（未来ナビを無効化するため）
}

function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function MonthNav({ yearMonth, basePath, currentYearMonth }: MonthNavProps) {
  const isCurrentMonth = yearMonth >= currentYearMonth;
  const prev = shiftMonth(yearMonth, -1);
  const next = shiftMonth(yearMonth, +1);

  const navBtnBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 30,
    height: 30,
    border: "1px solid var(--line-strong)",
    background: "var(--bg-panel)",
    color: "var(--ink-soft)",
    fontSize: 16,
    textDecoration: "none",
    cursor: "pointer",
    userSelect: "none",
    lineHeight: 1,
  };

  const disabledStyle: React.CSSProperties = {
    ...navBtnBase,
    color: "var(--line-strong)",
    cursor: "not-allowed",
    pointerEvents: "none",
  };

  const periodLabel: React.CSSProperties = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
    color: "var(--ink-soft)",
    background: "var(--bg-panel)",
    padding: "6px 14px",
    border: "1px solid var(--line)",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <Link href={`${basePath}?ym=${prev}`} style={navBtnBase} title="前月">
        ‹
      </Link>
      <div style={periodLabel}>{yearMonth} 期間</div>
      {isCurrentMonth ? (
        <span style={disabledStyle} title="当月以降は表示できません">
          ›
        </span>
      ) : (
        <Link href={`${basePath}?ym=${next}`} style={navBtnBase} title="次月">
          ›
        </Link>
      )}
    </div>
  );
}
