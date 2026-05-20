import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import AppHeader from "@/components/shared/app-header";
import PasswordChangeForm from "@/components/shared/password-change-form";
import { styles } from "@/components/shared/styles";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await requireAdmin();
  const company = await prisma.company.findUniqueOrThrow({ where: { id: session.user.companyId } });

  return (
    <div style={{ minHeight: "100vh" }}>
      <AppHeader
        userName={session.user.name ?? "管理者"}
        subBrand="管理者ダッシュボード"
        userMeta={company.name}
      />
      <main style={{ ...styles.main, maxWidth: 560 }}>
        <div style={styles.pageHeader}>
          <div>
            <div style={styles.pageTitle}>アカウント設定</div>
            <div style={styles.pageSub}>ACCOUNT SETTINGS</div>
          </div>
          <Link href="/admin" style={{ ...styles.btn, ...styles.btnGhost }}>
            ← ダッシュボードへ
          </Link>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>
            <span>パスワード変更</span>
          </div>
          <PasswordChangeForm />
        </div>
      </main>
    </div>
  );
}
