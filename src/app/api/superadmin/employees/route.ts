import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const createSchema = z.object({
  companyId: z.string().min(1),
  displayId: z.string().regex(/^E\d{4,}$/, "従業員IDは E0001 形式"),
  name: z.string().min(1).max(50),
  email: z.string().email(),
  department: z.string().max(50).optional(),
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

  const company = await prisma.company.findUnique({ where: { id: body.companyId } });
  if (!company) {
    return NextResponse.json({ error: "会社が見つかりません" }, { status: 404 });
  }

  const dupId = await prisma.employee.findUnique({
    where: {
      companyId_displayId: {
        companyId: body.companyId,
        displayId: body.displayId,
      },
    },
  });
  if (dupId) {
    return NextResponse.json({ error: "この従業員IDは既に使われています" }, { status: 400 });
  }

  const dupEmail = await prisma.employee.findUnique({ where: { email: body.email } });
  if (dupEmail) {
    return NextResponse.json({ error: "このメールは既に使われています" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(body.password, 12);

  const employee = await prisma.employee.create({
    data: {
      companyId: body.companyId,
      displayId: body.displayId,
      name: body.name,
      email: body.email,
      department: body.department || null,
      passwordHash,
      isActive: true,
    },
  });

  return NextResponse.json({ success: true, employee });
}
