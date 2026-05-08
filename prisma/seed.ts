import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function getCurrentYearMonth(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("demo1234", 12);

  // ============================================================
  // Super Admin (service provider)
  // ============================================================
  await prisma.superAdmin.upsert({
    where: { email: "super@wellness.example.jp" },
    update: {},
    create: {
      email: "super@wellness.example.jp",
      name: "ウェルネス サポート",
      passwordHash,
    },
  });
  console.log("SuperAdmin: super@wellness.example.jp");

  // ============================================================
  // Company 1 — 株式会社アクメ商事
  // ============================================================
  const acme = await prisma.company.upsert({
    where: { displayId: "C001" },
    update: {},
    create: {
      displayId: "C001",
      name: "株式会社アクメ商事",
      monthlyPoints: 5,
      invoiceEmail: "billing@acme.co.jp",
    },
  });
  console.log("Company 1:", acme.name);

  const acmeEmployees = [
    { displayId: "E0001", name: "田中 太郎", email: "tanaka@acme.co.jp", department: "営業部" },
    { displayId: "E0002", name: "佐藤 花子", email: "sato@acme.co.jp", department: "人事部" },
    { displayId: "E0003", name: "鈴木 健一", email: "suzuki@acme.co.jp", department: "開発部" },
    { displayId: "E0004", name: "山本 美咲", email: "yamamoto@acme.co.jp", department: "経理部" },
    { displayId: "E0005", name: "高橋 翔", email: "takahashi@acme.co.jp", department: "営業部" },
    { displayId: "E0006", name: "渡辺 優子", email: "watanabe@acme.co.jp", department: "開発部" },
    { displayId: "E0007", name: "中村 大輔", email: "nakamura@acme.co.jp", department: "営業部" },
    { displayId: "E0008", name: "小林 裕美", email: "kobayashi@acme.co.jp", department: "人事部" },
    { displayId: "E0009", name: "加藤 俊介", email: "kato@acme.co.jp", department: "開発部" },
    { displayId: "E0010", name: "吉田 明日香", email: "yoshida@acme.co.jp", department: "経理部" },
    { displayId: "E0011", name: "斎藤 直樹", email: "saito@acme.co.jp", department: "営業部" },
    { displayId: "E0012", name: "松本 由美", email: "matsumoto@acme.co.jp", department: "開発部" },
  ];
  const acmeEmployeeRecords = [];
  for (const emp of acmeEmployees) {
    const e = await prisma.employee.upsert({
      where: { email: emp.email },
      update: {},
      create: { ...emp, companyId: acme.id, passwordHash, isActive: true },
    });
    acmeEmployeeRecords.push(e);
  }
  console.log(`  Employees: ${acmeEmployees.length} records`);

  await prisma.adminUser.upsert({
    where: { email: "admin@acme.co.jp" },
    update: {},
    create: {
      companyId: acme.id,
      email: "admin@acme.co.jp",
      name: "アクメ管理者",
      passwordHash,
      role: "owner",
    },
  });
  console.log("  Admin: admin@acme.co.jp");

  // ============================================================
  // Company 2 — グローブテック株式会社
  // ============================================================
  const globe = await prisma.company.upsert({
    where: { displayId: "C002" },
    update: {},
    create: {
      displayId: "C002",
      name: "グローブテック株式会社",
      monthlyPoints: 8, // 月8ptと多めの設定
      invoiceEmail: "billing@globe-tech.co.jp",
    },
  });
  console.log("Company 2:", globe.name);

  const globeEmployees = [
    { displayId: "E0001", name: "井上 信一", email: "inoue@globe-tech.co.jp", department: "技術部" },
    { displayId: "E0002", name: "木村 春香", email: "kimura@globe-tech.co.jp", department: "営業部" },
    { displayId: "E0003", name: "林 達也", email: "hayashi@globe-tech.co.jp", department: "総務部" },
    { displayId: "E0004", name: "清水 麻里", email: "shimizu@globe-tech.co.jp", department: "技術部" },
    { displayId: "E0005", name: "山田 拓也", email: "yamada@globe-tech.co.jp", department: "営業部" },
    { displayId: "E0006", name: "森 久美子", email: "mori@globe-tech.co.jp", department: "総務部" },
  ];
  const globeEmployeeRecords = [];
  for (const emp of globeEmployees) {
    const e = await prisma.employee.upsert({
      where: { email: emp.email },
      update: {},
      create: { ...emp, companyId: globe.id, passwordHash, isActive: true },
    });
    globeEmployeeRecords.push(e);
  }
  console.log(`  Employees: ${globeEmployees.length} records`);

  await prisma.adminUser.upsert({
    where: { email: "admin@globe-tech.co.jp" },
    update: {},
    create: {
      companyId: globe.id,
      email: "admin@globe-tech.co.jp",
      name: "グローブテック管理者",
      passwordHash,
      role: "owner",
    },
  });
  console.log("  Admin: admin@globe-tech.co.jp");

  // ============================================================
  // Merchants (shared by all companies)
  // ============================================================
  const merchantSeeds = [
    {
      displayId: "M001",
      name: "FIT OSAKA 梅田本店",
      email: "gym@fit-osaka.jp",
      category: "ジム",
      address: "大阪市北区梅田1-1-1",
      websiteUrl: "https://fit-osaka.example.jp/umeda/reserve",
      invoiceRegNo: "T1234567890123",
      services: [
        { name: "1日利用パス", description: "1日中ジム使い放題", priceYen: 3000 },
        { name: "1時間パーソナル", description: "プロトレーナーがつきっきり", priceYen: 8000 },
        { name: "月会費", description: "1ヶ月間使い放題プラン", priceYen: 12000 },
      ],
    },
    {
      displayId: "M002",
      name: "ゴルフスタジオ心斎橋",
      email: "info@golf-ss.jp",
      category: "ゴルフ練習場",
      address: "大阪市中央区心斎橋2-3-4",
      websiteUrl: "https://golf-ss.example.jp/booking",
      invoiceRegNo: "T2345678901234",
      services: [
        { name: "1時間打ちっぱなし", description: "屋内シミュレーター込み", priceYen: 4000 },
        { name: "レッスン60分", description: "プロコーチによる個別指導", priceYen: 9000 },
      ],
    },
    {
      displayId: "M003",
      name: "和み整体院",
      email: "info@nagomi.jp",
      category: "マッサージ",
      address: "大阪市天王寺区1-2-3",
      websiteUrl: "https://nagomi.example.jp/reservation",
      invoiceRegNo: "T3456789012345",
      services: [
        { name: "60分全身マッサージ", description: "肩こり腰痛改善コース", priceYen: 6000 },
        { name: "90分リフレッシュ", description: "全身指圧+ストレッチ", priceYen: 9000 },
        { name: "30分肩・首集中", description: "デスクワーク疲労ケア", priceYen: 3500 },
      ],
    },
  ];

  const merchantRecords = [];
  for (const m of merchantSeeds) {
    const merchant = await prisma.merchant.upsert({
      where: { email: m.email },
      update: { websiteUrl: m.websiteUrl },
      create: {
        displayId: m.displayId,
        name: m.name,
        email: m.email,
        category: m.category,
        address: m.address,
        websiteUrl: m.websiteUrl,
        invoiceRegNo: m.invoiceRegNo,
        passwordHash,
        isActive: true,
      },
    });

    // 全社共通: 加盟店は両方の会社と契約
    for (const company of [acme, globe]) {
      await prisma.merchantContract.upsert({
        where: {
          companyId_merchantId_startDate: {
            companyId: company.id,
            merchantId: merchant.id,
            startDate: new Date("2026-01-01"),
          },
        },
        update: {},
        create: {
          companyId: company.id,
          merchantId: merchant.id,
          startDate: new Date("2026-01-01"),
          isActive: true,
        },
      });
    }

    const services = [];
    for (const s of m.services) {
      const existing = await prisma.service.findFirst({
        where: { merchantId: merchant.id, name: s.name, deletedAt: null },
      });
      if (existing) {
        services.push(existing);
      } else {
        const svc = await prisma.service.create({
          data: {
            merchantId: merchant.id,
            name: s.name,
            description: s.description,
            priceYen: s.priceYen,
            isActive: true,
          },
        });
        services.push(svc);
      }
    }
    merchantRecords.push({ merchant, services });
  }
  console.log(`Merchants: ${merchantSeeds.length} records (linked to both companies)`);

  // ============================================================
  // Monthly grants (this month for all employees)
  // ============================================================
  const yearMonth = getCurrentYearMonth();
  for (const company of [acme, globe]) {
    const employees = company.id === acme.id ? acmeEmployeeRecords : globeEmployeeRecords;
    for (const e of employees) {
      await prisma.monthlyPointGrant.upsert({
        where: {
          employeeId_yearMonth: {
            employeeId: e.id,
            yearMonth,
          },
        },
        update: {},
        create: {
          employeeId: e.id,
          companyId: company.id,
          yearMonth,
          grantedPoints: company.monthlyPoints,
        },
      });
    }
  }
  console.log(`Monthly grants: ${yearMonth} - ${acmeEmployeeRecords.length + globeEmployeeRecords.length}名`);

  // ============================================================
  // Sample transactions (only on first run)
  // ============================================================
  const existingTxCount = await prisma.transaction.count();
  if (existingTxCount === 0) {
    const today = new Date();
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const txSeeds = [
      // Acme employees
      { company: acme.id, empIdx: 0, mIdx: 0, sIdx: 0, points: 1, daysAgo: 2, employees: acmeEmployeeRecords },
      { company: acme.id, empIdx: 0, mIdx: 2, sIdx: 0, points: 2, daysAgo: 5, employees: acmeEmployeeRecords },
      { company: acme.id, empIdx: 1, mIdx: 0, sIdx: 1, points: 2, daysAgo: 1, employees: acmeEmployeeRecords },
      { company: acme.id, empIdx: 2, mIdx: 1, sIdx: 0, points: 1, daysAgo: 3, employees: acmeEmployeeRecords },
      { company: acme.id, empIdx: 2, mIdx: 0, sIdx: 0, points: 1, daysAgo: 7, employees: acmeEmployeeRecords },
      { company: acme.id, empIdx: 3, mIdx: 2, sIdx: 1, points: 3, daysAgo: 4, employees: acmeEmployeeRecords },
      { company: acme.id, empIdx: 4, mIdx: 1, sIdx: 1, points: 2, daysAgo: 6, employees: acmeEmployeeRecords },
      { company: acme.id, empIdx: 5, mIdx: 0, sIdx: 2, points: 5, daysAgo: 8, employees: acmeEmployeeRecords },
      // Globe employees
      { company: globe.id, empIdx: 0, mIdx: 0, sIdx: 0, points: 2, daysAgo: 1, employees: globeEmployeeRecords },
      { company: globe.id, empIdx: 1, mIdx: 1, sIdx: 0, points: 3, daysAgo: 4, employees: globeEmployeeRecords },
      { company: globe.id, empIdx: 2, mIdx: 2, sIdx: 0, points: 2, daysAgo: 7, employees: globeEmployeeRecords },
      { company: globe.id, empIdx: 3, mIdx: 0, sIdx: 1, points: 4, daysAgo: 3, employees: globeEmployeeRecords },
    ];

    let seq = 1;
    for (const t of txSeeds) {
      const employee = t.employees[t.empIdx];
      const { merchant, services } = merchantRecords[t.mIdx];
      const service = services[t.sIdx];
      if (!employee || !merchant || !service) continue;

      let usedDate = new Date(today);
      usedDate.setDate(usedDate.getDate() - t.daysAgo);
      if (usedDate < thisMonthStart) usedDate = new Date(thisMonthStart);

      const ownPayment = service.priceYen - t.points * 1000;
      const displayId = `T${String(seq).padStart(5, "0")}`;
      seq++;

      await prisma.transaction.create({
        data: {
          displayId,
          companyId: t.company,
          employeeId: employee.id,
          merchantId: merchant.id,
          serviceId: service.id,
          serviceAmountYen: service.priceYen,
          pointsUsed: t.points,
          ownPaymentYen: ownPayment,
          usedDate,
          status: "confirmed",
          createdBy: "merchant",
        },
      });
    }
    console.log(`Transactions: ${txSeeds.length} records`);
  } else {
    console.log(`Transactions: skip (already ${existingTxCount} records)`);
  }

  console.log("\n✅ Seed completed.");
  console.log("\n--- Login accounts (password: demo1234) ---");
  console.log("Super Admin:  super@wellness.example.jp");
  console.log("Acme Admin:   admin@acme.co.jp");
  console.log("Acme Emp:     tanaka@acme.co.jp");
  console.log("Globe Admin:  admin@globe-tech.co.jp");
  console.log("Globe Emp:    inoue@globe-tech.co.jp");
  console.log("Merchant:     gym@fit-osaka.jp");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
