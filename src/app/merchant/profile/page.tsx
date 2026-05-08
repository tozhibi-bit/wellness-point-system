import { requireMerchant } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import AppHeader from "@/components/shared/app-header";
import { styles } from "@/components/shared/styles";
import ProfileForm from "@/components/shared/profile-form";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MerchantProfilePage() {
  const session = await requireMerchant();
  const merchant = await prisma.merchant.findUniqueOrThrow({
    where: { id: session.user.merchantId },
  });

  return (
    <div style={{ minHeight: "100vh" }}>
      <AppHeader userName={merchant.name} subBrand="加盟店ポータル" />
      <main style={{ ...styles.main, maxWidth: 720 }}>
        <div style={styles.pageHeader}>
          <div>
            <div style={styles.pageTitle}>店舗情報</div>
            <div style={styles.pageSub}>STORE PROFILE</div>
          </div>
          <Link href="/merchant" style={{ ...styles.btn, ...styles.btnGhost }}>
            ← ダッシュボードへ
          </Link>
        </div>

        <div style={styles.card}>
          <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--line)" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "var(--ink-mute)", textTransform: "uppercase", marginBottom: 6 }}>
              編集できない項目
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", rowGap: 8, fontSize: 13 }}>
              <div style={{ color: "var(--ink-mute)" }}>店舗ID</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>{merchant.displayId}</div>
              <div style={{ color: "var(--ink-mute)" }}>店舗名</div>
              <div>{merchant.name}</div>
              <div style={{ color: "var(--ink-mute)" }}>カテゴリ</div>
              <div>{merchant.category}</div>
              <div style={{ color: "var(--ink-mute)" }}>登録番号</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>{merchant.invoiceRegNo}</div>
              <div style={{ color: "var(--ink-mute)" }}>メール</div>
              <div>{merchant.email}</div>
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-mute)", marginTop: 10 }}>
              ※ 上記の項目を変更したい場合は管理者へお問い合わせください。
            </div>
          </div>

          <ProfileForm
            initialWebsiteUrl={merchant.websiteUrl}
            initialAddress={merchant.address ?? ""}
          />
        </div>
      </main>
    </div>
  );
}
