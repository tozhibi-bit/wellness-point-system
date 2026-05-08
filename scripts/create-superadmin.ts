/**
 * 本番環境のスーパー管理者を作成・更新するスクリプト
 *
 * 使い方:
 *   npm run create-superadmin -- --email=admin@example.com --name="管理者" --password='RandomPass123!'
 *
 * またはインタラクティブ:
 *   npm run create-superadmin
 *   (環境変数 SUPERADMIN_EMAIL, SUPERADMIN_NAME, SUPERADMIN_PASSWORD で渡すことも可能)
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function parseArgs(): { email?: string; name?: string; password?: string } {
  const args: Record<string, string> = {};
  for (const arg of process.argv.slice(2)) {
    const m = arg.match(/^--(\w+)=(.+)$/);
    if (m) args[m[1]] = m[2];
  }
  return {
    email: args.email || process.env.SUPERADMIN_EMAIL,
    name: args.name || process.env.SUPERADMIN_NAME,
    password: args.password || process.env.SUPERADMIN_PASSWORD,
  };
}

function validatePassword(pw: string): string | null {
  if (pw.length < 12) return "パスワードは12文字以上にしてください";
  if (!/[a-z]/.test(pw)) return "小文字を含めてください";
  if (!/[A-Z]/.test(pw)) return "大文字を含めてください";
  if (!/\d/.test(pw)) return "数字を含めてください";
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)) return "記号を含めてください";
  return null;
}

async function main() {
  const { email, name, password } = parseArgs();

  if (!email || !name || !password) {
    console.error("❌ 引数が不足しています。");
    console.error("使い方:");
    console.error('  npm run create-superadmin -- --email=admin@example.com --name="管理者" --password=\'RandomPass123!\'');
    console.error("");
    console.error("または環境変数で:");
    console.error("  SUPERADMIN_EMAIL=admin@example.com SUPERADMIN_NAME=管理者 SUPERADMIN_PASSWORD=RandomPass123! npm run create-superadmin");
    process.exit(1);
  }

  // メール形式の簡易チェック
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error(`❌ メール形式が不正です: ${email}`);
    process.exit(1);
  }

  // パスワード強度チェック
  const pwError = validatePassword(password);
  if (pwError) {
    console.error(`❌ ${pwError}`);
    console.error("(本番運用では12文字以上、大小英字・数字・記号を含めてください)");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await prisma.superAdmin.findUnique({ where: { email } });

  if (existing) {
    if (existing.deletedAt) {
      // 論理削除されているなら復活させる
      const updated = await prisma.superAdmin.update({
        where: { email },
        data: { name, passwordHash, deletedAt: null },
      });
      console.log(`✅ 削除済みのスーパー管理者を復活+更新しました: ${updated.email}`);
    } else {
      const updated = await prisma.superAdmin.update({
        where: { email },
        data: { name, passwordHash },
      });
      console.log(`✅ 既存のスーパー管理者のパスワード/名前を更新しました: ${updated.email}`);
    }
  } else {
    const created = await prisma.superAdmin.create({
      data: { email, name, passwordHash },
    });
    console.log(`✅ 新規スーパー管理者を作成しました: ${created.email}`);
  }

  console.log("");
  console.log("ログイン情報:");
  console.log(`  メール  : ${email}`);
  console.log(`  パスワード: (入力値・このログには記録されません)`);
}

main()
  .catch((e) => {
    console.error("❌ エラー:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
