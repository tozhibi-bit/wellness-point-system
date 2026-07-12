import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  subsidyPct: z.number().int().min(1).max(100),
  monthlyPoints: z.number().int().min(0).max(200),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
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

  if (!session.user.companyId) {
    return NextResponse.json({ error: "会社情報が見つかりません" }, { status: 400 });
  }

  const company = await prisma.company.update({
    where: { id: session.user.companyId },
    data: {
      subsidyPct: body.subsidyPct,
      monthlyPoints: body.monthlyPoints,
    },
  });

  return NextResponse.json({ success: true, company });
}
