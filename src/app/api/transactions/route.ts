import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  calculateOwnPayment,
  getCurrentYearMonth,
  validatePoints,
} from "@/lib/points";
import {
  ensureMonthlyGrant,
  getRemainingPoints,
} from "@/lib/server/queries";
import { recordAudit } from "@/lib/audit";

const createTransactionSchema = z.object({
  serviceId: z.string().min(1),
  pointsUsed: z.number().int().min(0).max(1000),
  usedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  employeeId: z.string().min(1).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  let body;
  try {
    body = createTransactionSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "入力値が不正です" }, { status: 400 });
  }

  const role = session.user.role;
  if (role !== "merchant") {
    return NextResponse.json(
      { error: "ポイント利用の登録は加盟店のみ可能です" },
      { status: 403 }
    );
  }

  if (!body.employeeId) {
    return NextResponse.json({ error: "従業員IDが必要です" }, { status: 400 });
  }
  const employeeId = body.employeeId;
  const createdBy = "merchant" as const;
  const status = "confirmed" as const;
  const merchantId = session.user.merchantId!;

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { company: true },
  });
  if (!employee || !employee.isActive || employee.deletedAt) {
    return NextResponse.json({ error: "従業員が見つかりません" }, { status: 404 });
  }

  const service = await prisma.service.findUnique({
    where: { id: body.serviceId },
    include: { merchant: true },
  });
  if (!service || !service.isActive || service.deletedAt) {
    return NextResponse.json({ error: "サービスが見つかりません" }, { status: 404 });
  }

  if (service.merchantId !== merchantId) {
    return NextResponse.json(
      { error: "他店舗のサービスは登録できません" },
      { status: 403 }
    );
  }

  const today = new Date();
  const contract = await prisma.merchantContract.findFirst({
    where: {
      companyId: employee.companyId,
      merchantId,
      isActive: true,
      startDate: { lte: today },
      OR: [{ endDate: null }, { endDate: { gte: today } }],
    },
  });
  if (!contract) {
    return NextResponse.json(
      { error: "この加盟店は貴社と契約していません" },
      { status: 403 }
    );
  }

  await ensureMonthlyGrant(employeeId, employee.companyId);
  const { remaining } = await getRemainingPoints(employeeId);

  const validation = validatePoints(body.pointsUsed, service.priceYen, remaining);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.reason }, { status: 400 });
  }

  const ownPayment = calculateOwnPayment(service.priceYen, body.pointsUsed);

  // トランザクション内でID採番と作成を行い、レースコンディションを防ぐ
  const tx = await prisma.$transaction(async (tx) => {
    const lastTx = await tx.transaction.findFirst({
      orderBy: { displayId: "desc" },
      select: { displayId: true },
    });
    const nextSeq = lastTx
      ? parseInt(lastTx.displayId.replace("T", "")) + 1
      : 1;
    const displayId = `T${String(nextSeq).padStart(5, "0")}`;

    return await tx.transaction.create({
      data: {
        displayId,
        companyId: employee.companyId,
        employeeId,
        merchantId,
        serviceId: service.id,
        serviceAmountYen: service.priceYen,
        pointsUsed: body.pointsUsed,
        ownPaymentYen: ownPayment,
        usedDate: new Date(body.usedDate),
        status,
        createdBy,
      },
    });
  });

  await recordAudit({
    companyId: employee.companyId,
    actorType: role,
    actorId: session.user.id,
    action: "create_transaction",
    targetType: "transaction",
    targetId: tx.id,
    metadata: {
      pointsUsed: body.pointsUsed,
      serviceAmountYen: service.priceYen,
      employeeDisplayId: employee.displayId,
      merchantDisplayId: service.merchant.displayId,
    },
  });

  return NextResponse.json({ success: true, transaction: tx });
}
