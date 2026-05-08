import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  category: z.string().min(1).max(50),
  address: z.string().max(200).optional(),
  websiteUrl: z.string().url(),
  invoiceRegNo: z.string().regex(/^T\d{13}$/),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "superadmin") {
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

  const existing = await prisma.merchant.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "加盟店が見つかりません" }, { status: 404 });

  if (existing.email !== body.email) {
    const dup = await prisma.merchant.findUnique({ where: { email: body.email } });
    if (dup) return NextResponse.json({ error: "このメールは既に使われています" }, { status: 400 });
  }

  const merchant = await prisma.merchant.update({
    where: { id: params.id },
    data: {
      name: body.name,
      email: body.email,
      category: body.category,
      address: body.address || null,
      websiteUrl: body.websiteUrl,
      invoiceRegNo: body.invoiceRegNo,
    },
  });

  return NextResponse.json({ success: true, merchant });
}
