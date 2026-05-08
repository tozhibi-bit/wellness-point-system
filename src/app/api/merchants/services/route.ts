import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "merchant") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const services = await prisma.service.findMany({
    where: {
      merchantId: session.user.merchantId!,
      isActive: true,
      deletedAt: null,
    },
    orderBy: { priceYen: "asc" },
  });

  return NextResponse.json({ services });
}
