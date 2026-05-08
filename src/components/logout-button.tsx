"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      style={{
        background: "transparent",
        color: "#fbfaf6",
        border: "1px solid rgba(255,255,255,0.3)",
        padding: "5px 12px",
        fontSize: 12,
        cursor: "pointer",
        borderRadius: 4,
        fontFamily: "inherit",
      }}
    >
      ログアウト
    </button>
  );
}
