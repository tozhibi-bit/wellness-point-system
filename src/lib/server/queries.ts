import { prisma } from "@/lib/prisma";
import { getCurrentYearMonth } from "@/lib/points";
import type { TransactionStatus } from "@prisma/client";

const ACTIVE_STATUSES: TransactionStatus[] = [
  "pending_usage",
  "pending_approval",
  "confirmed",
  "invoiced",
];

export async function getRemainingPoints(
  employeeId: string,
  yearMonth: string = getCurrentYearMonth()
): Promise<{ granted: number; used: number; remaining: number }> {
  const [grant, usedSum] = await Promise.all([
    prisma.monthlyPointGrant.findUnique({
      where: {
        employeeId_yearMonth: {
          employeeId,
          yearMonth,
        },
      },
    }),
    prisma.transaction.aggregate({
      where: {
        employeeId,
        usedDate: {
          gte: new Date(`${yearMonth}-01`),
          lt: monthAfter(yearMonth),
        },
        status: { in: ACTIVE_STATUSES },
      },
      _sum: { pointsUsed: true },
    }),
  ]);

  const granted = grant?.grantedPoints ?? 0;
  const used = usedSum._sum.pointsUsed ?? 0;
  return {
    granted,
    used,
    remaining: granted - used,
  };
}

function monthAfter(yearMonth: string): Date {
  const [year, month] = yearMonth.split("-").map(Number);
  return new Date(year, month, 1);
}

export async function ensureMonthlyGrant(
  employeeId: string,
  companyId: string,
  yearMonth: string = getCurrentYearMonth()
): Promise<void> {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) return;

  await prisma.monthlyPointGrant.upsert({
    where: {
      employeeId_yearMonth: {
        employeeId,
        yearMonth,
      },
    },
    update: {},
    create: {
      employeeId,
      companyId,
      yearMonth,
      grantedPoints: company.monthlyPoints,
    },
  });
}

export async function getEmployeeTransactions(
  employeeId: string,
  companyId: string,
  limit?: number
) {
  return await prisma.transaction.findMany({
    where: {
      employeeId,
      companyId,
    },
    include: {
      merchant: true,
      service: true,
    },
    orderBy: [{ usedDate: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
}

export async function getActiveMerchantsForCompany(companyId: string) {
  const today = new Date();
  return await prisma.merchant.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      contracts: {
        some: {
          companyId,
          isActive: true,
          startDate: { lte: today },
          OR: [{ endDate: null }, { endDate: { gte: today } }],
        },
      },
    },
    include: {
      services: {
        where: {
          isActive: true,
          deletedAt: null,
        },
        orderBy: { priceYen: "asc" },
      },
    },
    orderBy: { displayId: "asc" },
  });
}

export async function getMerchantTransactions(
  merchantId: string,
  yearMonth?: string,
  limit?: number
) {
  const where: {
    merchantId: string;
    usedDate?: { gte: Date; lt: Date };
  } = { merchantId };

  if (yearMonth) {
    where.usedDate = {
      gte: new Date(`${yearMonth}-01`),
      lt: monthAfter(yearMonth),
    };
  }

  return await prisma.transaction.findMany({
    where,
    include: {
      employee: {
        select: {
          id: true,
          displayId: true,
          name: true,
        },
      },
      service: true,
    },
    orderBy: [{ usedDate: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
}

export async function getMerchantEmployeesForLookup(
  merchantId: string,
  yearMonth: string = getCurrentYearMonth()
) {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    include: {
      contracts: {
        where: { isActive: true },
        select: { companyId: true },
      },
    },
  });

  if (!merchant) return [];

  const companyIds = merchant.contracts.map((c) => c.companyId);

  const employees = await prisma.employee.findMany({
    where: {
      companyId: { in: companyIds },
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      displayId: true,
      name: true,
      department: true,
      companyId: true,
      company: {
        select: { name: true, monthlyPoints: true },
      },
    },
    orderBy: { displayId: "asc" },
  });

  const employeeIds = employees.map((e) => e.id);
  const grants = await prisma.monthlyPointGrant.findMany({
    where: {
      employeeId: { in: employeeIds },
      yearMonth,
    },
  });
  const grantMap = new Map(grants.map((g) => [g.employeeId, g.grantedPoints]));

  const used = await prisma.transaction.groupBy({
    by: ["employeeId"],
    where: {
      employeeId: { in: employeeIds },
      usedDate: {
        gte: new Date(`${yearMonth}-01`),
        lt: monthAfter(yearMonth),
      },
      status: { in: ACTIVE_STATUSES },
    },
    _sum: { pointsUsed: true },
  });
  const usedMap = new Map(used.map((u) => [u.employeeId, u._sum.pointsUsed ?? 0]));

  const recentTxs = await prisma.transaction.findMany({
    where: {
      merchantId,
      employeeId: { in: employeeIds },
      usedDate: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      status: { in: ["confirmed", "invoiced"] },
    },
    select: { employeeId: true, usedDate: true },
    orderBy: { usedDate: "desc" },
  });
  const recentSet = new Set(recentTxs.map((t) => t.employeeId));

  return employees.map((e) => {
    const granted = grantMap.get(e.id) ?? e.company.monthlyPoints;
    const usedPt = usedMap.get(e.id) ?? 0;
    return {
      id: e.id,
      displayId: e.displayId,
      name: e.name,
      department: e.department,
      companyId: e.companyId,
      companyName: e.company.name,
      grantedPoints: granted,
      remainingPoints: granted - usedPt,
      isRecent: recentSet.has(e.id),
    };
  });
}

export async function getCompanyEmployees(companyId: string) {
  return await prisma.employee.findMany({
    where: {
      companyId,
      deletedAt: null,
    },
    orderBy: { displayId: "asc" },
  });
}

export async function getCompanyTransactionsByMonth(
  companyId: string,
  yearMonth: string
) {
  return await prisma.transaction.findMany({
    where: {
      companyId,
      usedDate: {
        gte: new Date(`${yearMonth}-01`),
        lt: monthAfter(yearMonth),
      },
      status: { in: ["confirmed", "invoiced"] },
    },
    include: {
      employee: { select: { id: true, displayId: true, name: true, department: true } },
      merchant: { select: { id: true, displayId: true, name: true, category: true } },
      service: true,
    },
    orderBy: [{ usedDate: "desc" }, { createdAt: "desc" }],
  });
}

export { monthAfter, ACTIVE_STATUSES };
