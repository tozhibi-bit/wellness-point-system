import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { POINT_TO_YEN, generateInvoiceDisplayId } from "@/lib/points";
import { recordAudit } from "@/lib/audit";

const createSchema = z.object({
  yearMonth: z.string().regex(/^\d{4}-\d{2}$/),
  companyId: z.string().min(1).optional(),
});

const TAX_RATE = 0.1;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "merchant") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  let body;
  try {
    body = createSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "入力値が不正です" }, { status: 400 });
  }

  const merchantId = session.user.merchantId!;
  const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
  if (!merchant) {
    return NextResponse.json({ error: "加盟店情報が見つかりません" }, { status: 404 });
  }

  const [year, month] = body.yearMonth.split("-").map(Number);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);

  const contracts = await prisma.merchantContract.findMany({
    where: { merchantId, isActive: true },
    include: { company: true },
  });

  const targetCompanies = body.companyId
    ? contracts.filter((c) => c.companyId === body.companyId)
    : contracts;

  const results = [];
  for (const contract of targetCompanies) {
    const txs = await prisma.transaction.findMany({
      where: {
        merchantId,
        companyId: contract.companyId,
        usedDate: { gte: monthStart, lt: monthEnd },
        status: "confirmed",
      },
    });
    if (txs.length === 0) continue;

    const totalPoints = txs.reduce((s, t) => s + t.pointsUsed, 0);
    const subtotal = totalPoints * POINT_TO_YEN;
    const tax = Math.round(subtotal * TAX_RATE);
    const total = subtotal + tax;

    const displayId = generateInvoiceDisplayId(body.yearMonth, merchant.displayId);
    const dueDate = new Date(year, month, 0);
    dueDate.setMonth(dueDate.getMonth() + 1);

    const existing = await prisma.invoice.findUnique({
      where: {
        companyId_merchantId_yearMonth: {
          companyId: contract.companyId,
          merchantId,
          yearMonth: body.yearMonth,
        },
      },
    });

    let invoice;
    if (existing) {
      invoice = await prisma.invoice.update({
        where: { id: existing.id },
        data: {
          totalPoints,
          subtotalYen: subtotal,
          taxYen: tax,
          totalYen: total,
          status: "issued",
          issuedAt: new Date(),
          dueDate,
        },
      });
    } else {
      invoice = await prisma.invoice.create({
        data: {
          displayId,
          companyId: contract.companyId,
          merchantId,
          yearMonth: body.yearMonth,
          totalPoints,
          subtotalYen: subtotal,
          taxYen: tax,
          totalYen: total,
          status: "issued",
          issuedAt: new Date(),
          dueDate,
        },
      });
    }

    await prisma.transaction.updateMany({
      where: {
        id: { in: txs.map((t) => t.id) },
      },
      data: {
        status: "invoiced",
        invoiceId: invoice.id,
      },
    });

    await recordAudit({
      companyId: contract.companyId,
      actorType: "merchant",
      actorId: session.user.id,
      action: "issue_invoice",
      targetType: "invoice",
      targetId: invoice.id,
      metadata: {
        yearMonth: body.yearMonth,
        totalPoints,
        totalYen: total,
        transactionCount: txs.length,
      },
    });

    results.push({
      companyName: contract.company.name,
      invoice,
      transactionCount: txs.length,
    });
  }

  return NextResponse.json({ success: true, invoices: results });
}
