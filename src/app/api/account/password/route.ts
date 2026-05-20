import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "新しいパスワードは8文字以上にしてください"),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  let body;
  try {
    body = schema.parse(await req.json());
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "入力値が不正です" }, { status: 400 });
  }

  const { id, role } = session.user;

  // 現在のパスワードハッシュを取得
  let currentHash: string | null = null;
  if (role === "superadmin") {
    const u = await prisma.superAdmin.findUnique({ where: { id } });
    currentHash = u?.passwordHash ?? null;
  } else if (role === "admin") {
    const u = await prisma.adminUser.findUnique({ where: { id } });
    currentHash = u?.passwordHash ?? null;
  } else if (role === "merchant") {
    const u = await prisma.merchant.findUnique({ where: { id } });
    currentHash = u?.passwordHash ?? null;
  } else if (role === "employee") {
    const u = await prisma.employee.findUnique({ where: { id } });
    currentHash = u?.passwordHash ?? null;
  }

  if (!currentHash) {
    return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  }

  const ok = await bcrypt.compare(body.currentPassword, currentHash);
  if (!ok) {
    return NextResponse.json({ error: "現在のパスワードが正しくありません" }, { status: 400 });
  }

  const newHash = await bcrypt.hash(body.newPassword, 12);

  if (role === "superadmin") {
    await prisma.superAdmin.update({ where: { id }, data: { passwordHash: newHash } });
  } else if (role === "admin") {
    await prisma.adminUser.update({ where: { id }, data: { passwordHash: newHash } });
  } else if (role === "merchant") {
    await prisma.merchant.update({ where: { id }, data: { passwordHash: newHash } });
  } else if (role === "employee") {
    await prisma.employee.update({ where: { id }, data: { passwordHash: newHash } });
  }

  return NextResponse.json({ success: true });
}
