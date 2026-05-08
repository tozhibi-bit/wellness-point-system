import { requireSuperAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import AppHeader from "@/components/shared/app-header";
import { styles } from "@/components/shared/styles";
import Link from "next/link";
import EmployeeManager from "@/components/superadmin/employee-manager";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  await requireSuperAdmin();
  const [companies, employees] = await Promise.all([
    prisma.company.findMany({
      where: { deletedAt: null },
      orderBy: { displayId: "asc" },
    }),
    prisma.employee.findMany({
      where: { deletedAt: null },
      include: { company: { select: { name: true, displayId: true } } },
      orderBy: [{ companyId: "asc" }, { displayId: "asc" }],
    }),
  ]);

  return (
    <div style={{ minHeight: "100vh" }}>
      <AppHeader userName="スーパー管理者" subBrand="従業員管理" />
      <main style={styles.main}>
        <div style={styles.pageHeader}>
          <div>
            <div style={styles.pageTitle}>従業員管理</div>
            <div style={styles.pageSub}>EMPLOYEES MANAGEMENT</div>
          </div>
          <Link href="/superadmin" style={{ ...styles.btn, ...styles.btnGhost }}>
            ← ダッシュボードへ
          </Link>
        </div>

        <div style={styles.card}>
          <EmployeeManager
            companies={companies.map((c) => ({ id: c.id, displayId: c.displayId, name: c.name }))}
            initialEmployees={employees.map((e) => ({
              id: e.id,
              displayId: e.displayId,
              name: e.name,
              email: e.email,
              department: e.department ?? "",
              isActive: e.isActive,
              companyId: e.companyId,
              companyName: e.company.name,
              companyDisplayId: e.company.displayId,
            }))}
          />
        </div>
      </main>
    </div>
  );
}
