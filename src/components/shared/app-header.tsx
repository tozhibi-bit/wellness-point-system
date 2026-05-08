import LogoutButton from "@/components/logout-button";

interface AppHeaderProps {
  userName: string;
  subBrand: string;
  userMeta?: string;
}

export default function AppHeader({ userName, subBrand, userMeta }: AppHeaderProps) {
  return (
    <header
      style={{
        background: "var(--sumi)",
        color: "#fbfaf6",
        padding: "18px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "3px solid var(--accent)",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
        <span
          style={{
            fontFamily: "'Shippori Mincho', serif",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "0.05em",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 32,
              height: 32,
              lineHeight: "32px",
              textAlign: "center",
              background: "var(--accent)",
              color: "#fbfaf6",
              marginRight: 10,
              verticalAlign: "middle",
              fontSize: 18,
            }}
          >
            福
          </span>
          Wellness Point
        </span>
        <span style={{ fontSize: 11, color: "#a8a8a8", letterSpacing: "0.1em" }}>
          {subBrand}
        </span>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "#fbfaf6" }}>
          {userName}
          {userMeta && <span style={{ color: "#a8a8a8", marginLeft: 8, fontSize: 11 }}>{userMeta}</span>}
        </span>
        <LogoutButton />
      </div>
    </header>
  );
}
