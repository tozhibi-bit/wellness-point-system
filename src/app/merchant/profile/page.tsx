import { requireMerchant } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import AppHeader from "@/components/shared/app-header";
import { styles } from "@/components/shared/styles";
import ProfileForm from "@/components/shared/profile-form";
import PasswordChangeForm from "@/components/shared/password-change-form";
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

        {/* 基本情報（読み取り専用） */}
        <div style={{ ...styles.card, marginBottom: 20 }}>
          <div style={styles.cardTitle}>
            <span>店舗基本情報</span>
            <span style={styles.cardTitleSub}>READ ONLY</span>
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

        {/* 編集可能な店舗情報 */}
        <div style={{ ...styles.card, marginBottom: 20 }}>
          <div style={styles.cardTitle}>
            <span>連絡先・URL</span>
          </div>
          <ProfileForm
            initialWebsiteUrl={merchant.websiteUrl}
            initialAddress={merchant.address ?? ""}
            initialPhone={merchant.phone ?? ""}
          />
        </div>

        {/* パスワード変更 */}
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
