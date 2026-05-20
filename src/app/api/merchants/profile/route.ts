import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { recordAudit } from "@/lib/audit";

const updateSchema = z.object({
  websiteUrl: z.string().url("有効なURLを入力してください").max(500).optional().nullable().or(z.literal("")),
  address: z.string().max(200).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "merchant") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  let body;
  try {
    body = updateSchema.parse(await req.json());
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "入力値が不正です" }, { status: 400 });
  }

  const merchantId = session.user.merchantId!;
  const updated = await prisma.merchant.update({
    where: { id: merchantId },
    data: {
      websiteUrl: body.websiteUrl || null,
      address: body.address ?? null,
      phone: body.phone ?? null,
    },
  });

  const contracts = await prisma.merchantContract.findMany({
    where: { merchantId, isActive: true },
    select: { companyId: true },
  });
  for (const c of contracts) {
    await recordAudit({
      companyId: c.companyId,
      actorType: "merchant",
      actorId: session.user.id,
      action: "update_merchant",
      targetType: "merchant",
      targetId: merchantId,
      metadata: { websiteUrl: body.websiteUrl },
    });
  }

  return NextResponse.json({ success: true, merchant: updated });
}
