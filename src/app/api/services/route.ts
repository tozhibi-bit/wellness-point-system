import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serviceInputSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "merchant") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  let body;
  try {
    body = serviceInputSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "入力値が不正です" }, { status: 400 });
  }

  const service = await prisma.service.create({
    data: {
      merchantId: session.user.merchantId!,
      name: body.name,
      description: body.description ?? null,
      priceYen: body.priceYen,
    },
  });

  const contracts = await prisma.merchantContract.findMany({
    where: { merchantId: session.user.merchantId!, isActive: true },
    select: { companyId: true },
  });
  for (const c of contracts) {
    await recordAudit({
      companyId: c.companyId,
      actorType: "merchant",
      actorId: session.user.id,
      action: "create_service",
      targetType: "service",
      targetId: service.id,
      metadata: { name: body.name, priceYen: body.priceYen },
    });
  }

  return NextResponse.json({ success: true, service });
}
