import { requireSuperAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import AppHeader from "@/components/shared/app-header";
import { styles } from "@/components/shared/styles";
import Link from "next/link";
import MerchantManager from "@/components/superadmin/merchant-manager";

export const dynamic = "force-dynamic";

export default async function MerchantsPage() {
  await requireSuperAdmin();
  const merchants = await prisma.merchant.findMany({
    where: { deletedAt: null },
    include: {
      _count: {
        select: {
          contracts: { where: { isActive: true } },
          services: { where: { isActive: true, deletedAt: null } },
        },
      },
    },
    orderBy: { displayId: "asc" },
  });

  return (
    <div style={{ minHeight: "100vh" }}>
      <AppHeader userName="スーパー管理者" subBrand="加盟店管理" />
      <main style={{ ...styles.main, maxWidth: 1100 }}>
        <div style={styles.pageHeader}>
          <div>
            <div style={styles.pageTitle}>加盟店管理</div>
            <div style={styles.pageSub}>MERCHANTS MANAGEMENT</div>
          </div>
          <Link href="/superadmin" style={{ ...styles.btn, ...styles.btnGhost }}>
            ← ダッシュボードへ
          </Link>
        </div>

        <div style={styles.card}>
          <MerchantManager
            initialMerchants={merchants.map((m) => ({
              id: m.id,
              displayId: m.displayId,
              name: m.name,
              email: m.email,
              category: m.category,
              address: m.address ?? "",
              phone: m.phone ?? "",
              websiteUrl: m.websiteUrl ?? null,
              invoiceRegNo: m.invoiceRegNo,
              isActive: m.isActive,
              contractCount: m._count.contracts,
              serviceCount: m._count.services,
            }))}
          />
        </div>
      </main>
    </div>
  );
}
