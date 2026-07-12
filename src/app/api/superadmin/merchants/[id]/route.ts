import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const updateSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  category: z.string().min(1).max(50),
  address: z.string().max(200).optional(),
  phone: z.string().max(20).optional().nullable(),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  photo1Url: z.string().url().max(500).optional().or(z.literal("")),
  photo2Url: z.string().url().max(500).optional().or(z.literal("")),
  accessNote: z.string().max(200).optional().nullable(),
  mapsUrl: z.string().url().max(500).optional().or(z.literal("")),
  closedDays: z.string().max(100).optional().nullable(),
  businessHours: z.string().max(100).optional().nullable(),
  invoiceRegNo: z.string().regex(/^T\d{13}$/),
  newPassword: z.string().min(8).optional(),
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

  const updateData: Record<string, unknown> = {
    name: body.name,
    email: body.email,
    category: body.category,
    address: body.address || null,
    phone: body.phone || null,
    websiteUrl: body.websiteUrl || null,
    photo1Url: body.photo1Url || null,
    photo2Url: body.photo2Url || null,
    accessNote: body.accessNote ?? null,
    mapsUrl: body.mapsUrl || null,
    closedDays: body.closedDays ?? null,
    businessHours: body.businessHours ?? null,
    invoiceRegNo: body.invoiceRegNo,
  };
  if (body.newPassword) {
    updateData.passwordHash = await bcrypt.hash(body.newPassword, 12);
  }

  const merchant = await prisma.merchant.update({
    where: { id: params.id },
    data: updateData,
  });

  return NextResponse.json({ success: true, merchant });
}
