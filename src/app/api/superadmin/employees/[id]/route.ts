import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(50),
  email: z.string().email(),
  department: z.string().max(50).optional(),
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

  const existing = await prisma.employee.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "従業員が見つかりません" }, { status: 404 });
  }

  if (existing.email !== body.email) {
    const dup = await prisma.employee.findUnique({ where: { email: body.email } });
    if (dup) {
      return NextResponse.json({ error: "このメールは既に使われています" }, { status: 400 });
    }
  }

  const employee = await prisma.employee.update({
    where: { id: params.id },
    data: {
      name: body.name,
      email: body.email,
      department: body.department || null,
    },
  });

  return NextResponse.json({ success: true, employee });
}
