import { requireMerchant } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import AppHeader from "@/components/shared/app-header";
import { styles } from "@/components/shared/styles";
import ServiceManager from "@/components/shared/service-manager";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MerchantServicesPage() {
  const session = await requireMerchant();
  const merchant = await prisma.merchant.findUniqueOrThrow({
    where: { id: session.user.merchantId },
  });
  const services = await prisma.service.findMany({
    where: { merchantId: merchant.id, deletedAt: null },
    orderBy: { priceYen: "asc" },
  });

  return (
    <div style={{ minHeight: "100vh" }}>
      <AppHeader userName={merchant.name} subBrand="加盟店ポータル" />
      <main style={{ ...styles.main, maxWidth: 900 }}>
        <div style={styles.pageHeader}>
          <div>
            <div style={styles.pageTitle}>サービスメニュー管理</div>
            <div style={styles.pageSub}>SERVICE MENU</div>
          </div>
          <Link href="/merchant" style={{ ...styles.btn, ...styles.btnGhost }}>
            ← ダッシュボードへ
          </Link>
        </div>

        <div style={styles.card}>
          <ServiceManager
            initialServices={services.map((s) => ({
              id: s.id,
              name: s.name,
              description: s.description,
              priceYen: s.priceYen,
            }))}
          />
        </div>
      </main>
    </div>
  );
}
