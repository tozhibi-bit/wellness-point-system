import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMerchantEmployeesForLookup } from "@/lib/server/queries";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "merchant") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const employees = await getMerchantEmployeesForLookup(session.user.merchantId!);
  return NextResponse.json({ employees });
}
