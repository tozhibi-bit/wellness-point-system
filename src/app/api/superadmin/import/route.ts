import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "superadmin") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string | null;
  const companyId = formData.get("companyId") as string | null;
  const defaultPassword = (formData.get("defaultPassword") as string) || "demo1234";

  if (!file || !type) {
    return NextResponse.json({ error: "ファイルとタイプを指定してください" }, { status: 400 });
  }

  // ファイルサイズ制限(5MB)
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `ファイルサイズが大きすぎます(最大 ${MAX_FILE_SIZE / 1024 / 1024}MB)` },
      { status: 400 }
    );
  }

  // ファイルタイプ検証(CSV/プレーンテキストのみ)
  const allowedMimeTypes = ["text/csv", "text/plain", "application/vnd.ms-excel", "application/csv", ""];
  if (file.type && !allowedMimeTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "CSVファイル(.csv)を指定してください" },
      { status: 400 }
    );
  }
  if (!file.name.toLowerCase().endsWith(".csv")) {
    return NextResponse.json(
      { error: "拡張子が.csvのファイルを指定してください" },
      { status: 400 }
    );
  }

  // インポート対象タイプ検証
  if (!["companies", "employees", "merchants"].includes(type)) {
    return NextResponse.json({ error: "不明なタイプ" }, { status: 400 });
  }

  if (defaultPassword.length < 8) {
    return NextResponse.json({ error: "初期パスワードは8文字以上" }, { status: 400 });
  }

  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length < 2) {
    return NextResponse.json({ error: "CSVに内容がありません(ヘッダー+データ行が必要)" }, { status: 400 });
  }

  // 行数制限(1万行)
  const MAX_ROWS = 10000;
  if (rows.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `CSVの行数が多すぎます(最大 ${MAX_ROWS}行)` },
      { status: 400 }
    );
  }

  const headers = rows[0].map((h) => h.trim());
  const dataRows = rows.slice(1).filter((r) => r.some((c) => c.trim()));

  let created = 0;
  const errors: string[] = [];
  const passwordHash = await bcrypt.hash(defaultPassword, 12);

  if (type === "companies") {
    const required = ["displayId", "name", "monthlyPoints", "adminEmail", "adminName"];
    const missing = required.filter((r) => !headers.includes(r));
    if (missing.length > 0) {
      return NextResponse.json({ error: `必須列がありません: ${missing.join(", ")}` }, { status: 400 });
    }
    for (let i = 0; i < dataRows.length; i++) {
      const row = headerObj(headers, dataRows[i]);
      try {
        if (!/^C\d{3,}$/.test(row.displayId)) throw new Error("displayId は C001 形式");
        if (!row.name) throw new Error("name 必須");
        const monthlyPoints = parseInt(row.monthlyPoints, 10);
        if (isNaN(monthlyPoints) || monthlyPoints < 0) throw new Error("monthlyPoints は 0以上の整数");
        if (!row.adminEmail || !row.adminEmail.includes("@")) throw new Error("adminEmail 必須");
        if (!row.adminName) throw new Error("adminName 必須");

        const dup = await prisma.company.findUnique({ where: { displayId: row.displayId } });
        if (dup) throw new Error(`displayId 重複: ${row.displayId}`);
        const dupAdmin = await prisma.adminUser.findUnique({ where: { email: row.adminEmail } });
        if (dupAdmin) throw new Error(`adminEmail 重複: ${row.adminEmail}`);

        const company = await prisma.company.create({
          data: {
            displayId: row.displayId,
            name: row.name,
            monthlyPoints,
            invoiceEmail: row.invoiceEmail || null,
          },
        });
        await prisma.adminUser.create({
          data: {
            companyId: company.id,
            email: row.adminEmail,
            name: row.adminName,
            passwordHash,
            role: "owner",
          },
        });
        // 全加盟店との契約
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
        created++;
      } catch (e) {
        errors.push(`行${i + 2}: ${e instanceof Error ? e.message : "不明なエラー"}`);
      }
    }
  } else if (type === "employees") {
    if (!companyId) {
      return NextResponse.json({ error: "所属会社を指定してください" }, { status: 400 });
    }
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return NextResponse.json({ error: "会社が見つかりません" }, { status: 404 });
    }
    const required = ["displayId", "name", "email"];
    const missing = required.filter((r) => !headers.includes(r));
    if (missing.length > 0) {
      return NextResponse.json({ error: `必須列がありません: ${missing.join(", ")}` }, { status: 400 });
    }
    for (let i = 0; i < dataRows.length; i++) {
      const row = headerObj(headers, dataRows[i]);
      try {
        if (!/^E\d{4,}$/.test(row.displayId)) throw new Error("displayId は E0001 形式");
        if (!row.name) throw new Error("name 必須");
        if (!row.email || !row.email.includes("@")) throw new Error("email 必須");

        const dupId = await prisma.employee.findUnique({
          where: { companyId_displayId: { companyId, displayId: row.displayId } },
        });
        if (dupId) throw new Error(`displayId 重複: ${row.displayId}`);
        const dupEmail = await prisma.employee.findUnique({ where: { email: row.email } });
        if (dupEmail) throw new Error(`email 重複: ${row.email}`);

        await prisma.employee.create({
          data: {
            companyId,
            displayId: row.displayId,
            name: row.name,
            email: row.email,
            department: row.department || null,
            passwordHash,
            isActive: true,
          },
        });
        created++;
      } catch (e) {
        errors.push(`行${i + 2}: ${e instanceof Error ? e.message : "不明なエラー"}`);
      }
    }
  } else if (type === "merchants") {
    const required = ["displayId", "name", "email", "category", "websiteUrl", "invoiceRegNo"];
    const missing = required.filter((r) => !headers.includes(r));
    if (missing.length > 0) {
      return NextResponse.json({ error: `必須列がありません: ${missing.join(", ")}` }, { status: 400 });
    }
    const companies = await prisma.company.findMany({
      where: { deletedAt: null },
      select: { id: true },
    });
    for (let i = 0; i < dataRows.length; i++) {
      const row = headerObj(headers, dataRows[i]);
      try {
        if (!/^M\d{3,}$/.test(row.displayId)) throw new Error("displayId は M001 形式");
        if (!row.name) throw new Error("name 必須");
        if (!row.email || !row.email.includes("@")) throw new Error("email 必須");
        if (!row.category) throw new Error("category 必須");
        try {
          new URL(row.websiteUrl);
        } catch {
          throw new Error("websiteUrl が不正なURL");
        }
        if (!/^T\d{13}$/.test(row.invoiceRegNo)) throw new Error("invoiceRegNo は T+13桁");

        const dupId = await prisma.merchant.findUnique({ where: { displayId: row.displayId } });
        if (dupId) throw new Error(`displayId 重複: ${row.displayId}`);
        const dupEmail = await prisma.merchant.findUnique({ where: { email: row.email } });
        if (dupEmail) throw new Error(`email 重複: ${row.email}`);

        const merchant = await prisma.merchant.create({
          data: {
            displayId: row.displayId,
            name: row.name,
            email: row.email,
            category: row.category,
            address: row.address || null,
            websiteUrl: row.websiteUrl,
            invoiceRegNo: row.invoiceRegNo,
            passwordHash,
            isActive: true,
          },
        });
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
        created++;
      } catch (e) {
        errors.push(`行${i + 2}: ${e instanceof Error ? e.message : "不明なエラー"}`);
      }
    }
  } else {
    return NextResponse.json({ error: "不明なtype" }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    created,
    failed: errors.length,
    errors: errors.slice(0, 50),
  });
}

function parseCsv(text: string): string[][] {
  // BOM除去
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        cur.push(field);
        field = "";
      } else if (c === "\r") {
        // skip \r
      } else if (c === "\n") {
        cur.push(field);
        rows.push(cur);
        cur = [];
        field = "";
      } else {
        field += c;
      }
    }
  }
  if (field !== "" || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }
  return rows;
}

function headerObj(headers: string[], row: string[]): Record<string, string> {
  const obj: Record<string, string> = {};
  headers.forEach((h, i) => {
    obj[h] = (row[i] ?? "").trim();
  });
  return obj;
}
