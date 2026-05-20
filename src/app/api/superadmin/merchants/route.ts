import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const createSchema = z.object({
  displayId: z.string().regex(/^M\d{3,}$/, "加盟店IDは M001 形式"),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  category: z.string().min(1).max(50),
  address: z.string().max(200).optional(),
  phone: z.string().max(20).optional(),
  websiteUrl: z.string().url(),
  invoiceRegNo: z.string().regex(/^T\d{13}$/, "登録番号はT+13桁の数字"),
  password: z.string().min(8),
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

  const dupId = await prisma.merchant.findUnique({ where: { displayId: body.displayId } });
  if (dupId) return NextResponse.json({ error: "この加盟店IDは既に使われています" }, { status: 400 });

  const dupEmail = await prisma.merchant.findUnique({ where: { email: body.email } });
  if (dupEmail) return NextResponse.json({ error: "このメールは既に使われています" }, { status: 400 });

  const passwordHash = await bcrypt.hash(body.password, 12);

  const merchant = await prisma.merchant.create({
    data: {
      displayId: body.displayId,
      name: body.name,
      email: body.email,
      category: body.category,
      address: body.address || null,
      phone: body.phone || null,
      websiteUrl: body.websiteUrl,
      invoiceRegNo: body.invoiceRegNo,
      passwordHash,
      isActive: true,
    },
  });

  // 全企業との契約を自動作成
  const companies = await prisma.company.findMany({ where: { deletedAt: null } });
  for (const c of companies) {
    await prisma.merchantContract.create({
      data: {
        companyId: c.id,
        merchantId: merchant.id,
        startDate: new Date(),
        isActive: true,
      },
    });
  }

  return NextResponse.json({ success: true, merchant, contractCount: companies.length });
}
