import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serviceInputSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "merchant") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const service = await prisma.service.findUnique({ where: { id: params.id } });
  if (!service || service.merchantId !== session.user.merchantId) {
    return NextResponse.json({ error: "サービスが見つかりません" }, { status: 404 });
  }

  let body;
  try {
    body = serviceInputSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "入力値が不正です" }, { status: 400 });
  }

  const updated = await prisma.service.update({
    where: { id: params.id },
    data: {
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
      action: "update_service",
      targetType: "service",
      targetId: updated.id,
      metadata: { name: body.name, priceYen: body.priceYen },
    });
  }

  return NextResponse.json({ success: true, service: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "merchant") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const service = await prisma.service.findUnique({ where: { id: params.id } });
  if (!service || service.merchantId !== session.user.merchantId) {
    return NextResponse.json({ error: "サービスが見つかりません" }, { status: 404 });
  }

  await prisma.service.update({
    where: { id: params.id },
    data: { deletedAt: new Date(), isActive: false },
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
      action: "delete_service",
      targetType: "service",
      targetId: service.id,
    });
  }

  return NextResponse.json({ success: true });
}
