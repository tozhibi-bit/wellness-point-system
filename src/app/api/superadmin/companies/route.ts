import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const createSchema = z.object({
  displayId: z.string().regex(/^C\d{3,}$/, "会社IDは C001 形式で入力してください"),
  name: z.string().min(1).max(100),
  monthlyPoints: z.number().int().min(0).max(200),
  subsidyPct: z.number().int().min(1).max(100).optional().default(50),
  invoiceEmail: z.string().email().optional().or(z.literal("")),
  adminEmail: z.string().email("有効なメールを入力してください"),
  adminName: z.string().min(1).max(50),
  adminPassword: z.string().min(8, "パスワードは8文字以上"),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "superadmin") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  let body;
  try {
    body = createSchema.parse(await req.json());
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "入力値が不正です" }, { status: 400 });
  }

  const existing = await prisma.company.findUnique({
    where: { displayId: body.displayId },
  });
  if (existing) {
    return NextResponse.json({ error: "この会社IDは既に使われています" }, { status: 400 });
  }

  const adminConflict = await prisma.adminUser.findUnique({ where: { email: body.adminEmail } });
  if (adminConflict) {
    return NextResponse.json({ error: "この管理者メールは既に使われています" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(body.adminPassword, 12);

  const company = await prisma.company.create({
    data: {
      displayId: body.displayId,
      name: body.name,
      monthlyPoints: body.monthlyPoints,
      subsidyPct: body.subsidyPct,
      invoiceEmail: body.invoiceEmail || null,
    },
  });

  await prisma.adminUser.create({
    data: {
      companyId: company.id,
      email: body.adminEmail,
      name: body.adminName,
      passwordHash,
      role: "owner",
    },
  });

  // 全加盟店との契約を自動的に作成(全社共通モデル)
  const merchants = await prisma.merchant.findMany({
    where: { isActive: true, deletedAt: null },
    select: { id: true },
  });
  for (const m of merchants) {
    await prisma.merchantContract.create({
      data: {
        companyId: company.id,
        merchantId: m.id,
        startDate: new Date(),
        isActive: true,
      },
    });
  }

  return NextResponse.json({ success: true, company });
}
