import type { CSSProperties } from "react";

export const styles = {
  main: {
    maxWidth: 1400,
    margin: "0 auto",
    padding: 32,
  } as CSSProperties,

  pageHeader: {
    marginBottom: 28,
    paddingBottom: 20,
    borderBottom: "1px solid var(--line)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
  } as CSSProperties,

  pageTitle: {
    fontFamily: "'Shippori Mincho', serif",
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: "0.02em",
  } as CSSProperties,

  pageSub: {
    fontSize: 12,
    color: "var(--ink-mute)",
    letterSpacing: "0.1em",
    marginTop: 4,
  } as CSSProperties,

  periodLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
    color: "var(--ink-soft)",
    background: "var(--bg-panel)",
    padding: "6px 14px",
    border: "1px solid var(--line)",
  } as CSSProperties,

  card: {
    background: "var(--bg-panel)",
    border: "1px solid var(--line)",
    padding: 24,
    boxShadow: "0 1px 0 rgba(0,0,0,0.02), 0 20px 40px -20px rgba(60,40,20,0.08)",
  } as CSSProperties,

  cardTitle: {
    fontFamily: "'Shippori Mincho', serif",
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 16,
    paddingBottom: 10,
    borderBottom: "1px solid var(--line)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  } as CSSProperties,

  cardTitleSub: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: "var(--ink-mute)",
    letterSpacing: "0.1em",
    fontWeight: 400,
  } as CSSProperties,

  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: 13,
  } as CSSProperties,

  tableTh: {
    textAlign: "left" as const,
    padding: "10px 12px",
    fontSize: 11,
    letterSpacing: "0.1em",
    color: "var(--ink-mute)",
    textTransform: "uppercase" as const,
    borderBottom: "1px solid var(--line-strong)",
    fontWeight: 500,
  } as CSSProperties,

  tableTd: {
    padding: "14px 12px",
    borderBottom: "1px solid var(--line)",
  } as CSSProperties,

  amountCell: {
    textAlign: "right" as const,
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 500,
  } as CSSProperties,

  monoCell: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    color: "var(--ink-soft)",
  } as CSSProperties,

  btn: {
    display: "inline-flex" as const,
    alignItems: "center" as const,
    gap: 6,
    padding: "9px 18px",
    border: "none",
    background: "var(--sumi)",
    color: "#fbfaf6",
    fontFamily: "inherit",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    borderRadius: 4,
    textDecoration: "none",
  } as CSSProperties,

  btnAccent: {
    background: "var(--accent)",
  } as CSSProperties,

  btnGhost: {
    background: "transparent",
    color: "var(--ink)",
    border: "1px solid var(--line-strong)",
  } as CSSProperties,

  btnSm: {
    padding: "5px 12px",
    fontSize: 12,
  } as CSSProperties,

  empty: {
    padding: "40px 20px",
    textAlign: "center" as const,
    color: "var(--ink-mute)",
    fontSize: 13,
  } as CSSProperties,
};

export const badgeStyles: Record<string, CSSProperties> = {
  pending_usage: {
    display: "inline-block",
    padding: "2px 8px",
    fontSize: 10,
    letterSpacing: "0.1em",
    borderRadius: 2,
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 500,
    textTransform: "uppercase",
    background: "#fff5e0",
    color: "#8b6914",
    border: "1px solid #e8d59a",
  },
  pending_approval: {
    display: "inline-block",
    padding: "2px 8px",
    fontSize: 10,
    letterSpacing: "0.1em",
    borderRadius: 2,
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 500,
    textTransform: "uppercase",
    background: "#fff5e0",
    color: "#8b6914",
    border: "1px solid #e8d59a",
  },
  confirmed: {
    display: "inline-block",
    padding: "2px 8px",
    fontSize: 10,
    letterSpacing: "0.1em",
    borderRadius: 2,
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 500,
    textTransform: "uppercase",
    background: "#e8f0e3",
    color: "#3a5024",
    border: "1px solid #b8ceab",
  },
  invoiced: {
    display: "inline-block",
    padding: "2px 8px",
    fontSize: 10,
    letterSpacing: "0.1em",
    borderRadius: 2,
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 500,
    textTransform: "uppercase",
    background: "#f0e3e3",
    color: "#6b1a1a",
    border: "1px solid #d4aaaa",
  },
  cancelled: {
    display: "inline-block",
    padding: "2px 8px",
    fontSize: 10,
    letterSpacing: "0.1em",
    borderRadius: 2,
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 500,
    textTransform: "uppercase",
    background: "#eee",
    color: "#888",
    border: "1px solid #ccc",
  },
};

export const STATUS_LABELS: Record<string, string> = {
  pending_usage: "申請中",
  pending_approval: "確認待ち",
  confirmed: "確定",
  invoiced: "請求済",
  cancelled: "取消",
};
