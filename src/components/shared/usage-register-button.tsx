"use client";

import { useState, useEffect } from "react";
import UsageRegisterModal from "@/components/shared/usage-register-modal";

export default function UsageRegisterButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          background: "var(--accent)",
          color: "#fbfaf6",
          border: "none",
          padding: "5px 12px",
          fontSize: 12,
          fontFamily: "inherit",
          fontWeight: 500,
          cursor: "pointer",
          borderRadius: 4,
        }}
      >
        + 実績を登録
      </button>
      {open && <UsageRegisterModal onClose={() => setOpen(false)} />}
    </>
  );
}
