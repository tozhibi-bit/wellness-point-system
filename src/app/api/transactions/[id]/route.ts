import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { recordAudit } from "@/lib/audit";

const updateSchema = z.object({
  action: z.enum(["confirm", "cancel"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  let body;
  try {
    body = updateSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "入力値が不正です" }, { status: 400 });
  }

  const tx = await prisma.transaction.findUnique({
    where: { id: params.id },
  });
  if (!tx) {
    return NextResponse.json({ error: "取引が見つかりません" }, { status: 404 });
  }

  const role = session.user.role;
  if (role === "merchant" && tx.merchantId !== session.user.merchantId) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }
  if (role === "employee" && tx.employeeId !== session.user.id) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }
  if (role === "admin" && tx.companyId !== session.user.companyId) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  if (body.action === "confirm") {
    if (role !== "merchant") {
      return NextResponse.json(
        { error: "確定は加盟店のみ可能です" },
        { status: 403 }
      );
    }
    if (tx.status !== "pending_usage" && tx.status !== "pending_approval") {
      return NextResponse.json(
        { error: "この取引は既に確定済みです" },
        { status: 400 }
      );
    }
    const updated = await prisma.transaction.update({
      where: { id: tx.id },
      data: { status: "confirmed" },
    });
    await recordAudit({
      companyId: tx.companyId,
      actorType: role,
      actorId: session.user.id,
      action: "confirm_transaction",
      targetType: "transaction",
      targetId: tx.id,
    });
    return NextResponse.json({ success: true, transaction: updated });
  }

  if (body.action === "cancel") {
    if (tx.status === "invoiced") {
      return NextResponse.json(
        { error: "請求済の取引はキャンセルできません" },
        { status: 400 }
      );
    }
    const updated = await prisma.transaction.update({
      where: { id: tx.id },
      data: { status: "cancelled" },
    });
    await recordAudit({
      companyId: tx.companyId,
      actorType: role,
      actorId: session.user.id,
      action: "delete_transaction",
      targetType: "transaction",
      targetId: tx.id,
    });
    return NextResponse.json({ success: true, transaction: updated });
  }

  return NextResponse.json({ error: "不明なアクション" }, { status: 400 });
}
