import LogoutButton from "@/components/logout-button";

interface AppHeaderProps {
  userName: string;
  subBrand: string;
  userMeta?: string;
}

export default function AppHeader({ userName, subBrand, userMeta }: AppHeaderProps) {
  return (
    <header
      className="flex items-center justify-between gap-3 flex-wrap"
      style={{
        background: "var(--sumi)",
        color: "#fbfaf6",
        padding: "14px 20px",
        borderBottom: "3px solid var(--accent)",
      }}
    >
      {/* ロゴ */}
      <div className="flex items-baseline gap-3 min-w-0">
        <span
          style={{
            fontFamily: "'Shippori Mincho', serif",
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "0.05em",
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 30,
              height: 30,
              lineHeight: "30px",
              textAlign: "center",
              background: "var(--accent)",
              color: "#fbfaf6",
              marginRight: 8,
              verticalAlign: "middle",
              fontSize: 16,
            }}
          >
            福
          </span>
          Wellness Point
        </span>
        <span className="hidden sm:inline" style={{ fontSize: 11, color: "#a8a8a8", letterSpacing: "0.1em" }}>
          {subBrand}
        </span>
      </div>

      {/* ユーザー情報 */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-right min-w-0" style={{ fontSize: 13, color: "#fbfaf6" }}>
          <span className="hidden sm:inline">{userName}</span>
          {userMeta && (
            <span className="hidden sm:inline" style={{ color: "#a8a8a8", marginLeft: 8, fontSize: 11 }}>
              {userMeta}
            </span>
          )}
        </span>
        <LogoutButton />
      </div>
    </header>
  );
}
