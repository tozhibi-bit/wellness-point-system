import { requireSuperAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import AppHeader from "@/components/shared/app-header";
import { styles } from "@/components/shared/styles";
import Link from "next/link";
import CsvImporter from "@/components/superadmin/csv-importer";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  await requireSuperAdmin();
  const companies = await prisma.company.findMany({
    where: { deletedAt: null },
    orderBy: { displayId: "asc" },
  });

  return (
    <div style={{ minHeight: "100vh" }}>
      <AppHeader userName="スーパー管理者" subBrand="一括インポート" />
      <main style={{ ...styles.main, maxWidth: 900 }}>
        <div style={styles.pageHeader}>
          <div>
            <div style={styles.pageTitle}>CSV 一括インポート</div>
            <div style={styles.pageSub}>BULK IMPORT</div>
          </div>
          <Link href="/superadmin" style={{ ...styles.btn, ...styles.btnGhost }}>
            ← ダッシュボードへ
          </Link>
        </div>

        <CsvImporter
          companies={companies.map((c) => ({ id: c.id, displayId: c.displayId, name: c.name }))}
        />
      </main>
    </div>
  );
}
