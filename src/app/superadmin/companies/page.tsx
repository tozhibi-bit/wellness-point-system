import { requireSuperAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import AppHeader from "@/components/shared/app-header";
import { styles } from "@/components/shared/styles";
import Link from "next/link";
import CompanyManager from "@/components/superadmin/company-manager";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  await requireSuperAdmin();
  const companies = await prisma.company.findMany({
    where: { deletedAt: null },
    include: {
      _count: {
        select: {
          employees: { where: { isActive: true, deletedAt: null } },
          adminUsers: true,
        },
      },
    },
    orderBy: { displayId: "asc" },
  });

  return (
    <div style={{ minHeight: "100vh" }}>
      <AppHeader userName="スーパー管理者" subBrand="企業管理" />
      <main style={{ ...styles.main, maxWidth: 1100 }}>
        <div style={styles.pageHeader}>
          <div>
            <div style={styles.pageTitle}>企業管理</div>
            <div style={styles.pageSub}>COMPANIES MANAGEMENT</div>
          </div>
          <Link href="/superadmin" style={{ ...styles.btn, ...styles.btnGhost }}>
            ← ダッシュボードへ
          </Link>
        </div>

        <div style={styles.card}>
          <CompanyManager
            initialCompanies={companies.map((c) => ({
              id: c.id,
              displayId: c.displayId,
              name: c.name,
              monthlyPoints: c.monthlyPoints,
              invoiceEmail: c.invoiceEmail ?? "",
              employeeCount: c._count.employees,
              adminCount: c._count.adminUsers,
            }))}
          />
        </div>
      </main>
    </div>
  );
}
