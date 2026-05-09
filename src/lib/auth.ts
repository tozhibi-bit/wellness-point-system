import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types/auth";

const credentialsSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

type AuthorizedUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string | null;
  merchantId: string | null;
  displayId: string;
};

// タイミング攻撃対策用のダミーハッシュ(bcrypt cost=12 の任意のハッシュ)
const DUMMY_HASH = "$2a$12$abcdefghijklmnopqrstuvCYTUuPxbN9eGgaJOM8hMjMlH3Yp7Wlp6";

async function authorizeUser(credentials: unknown): Promise<AuthorizedUser | null> {
  const parsed = credentialsSchema.safeParse(credentials);
  if (!parsed.success) {
    // 形式不正でもダミー比較してタイミングを揃える
    await bcrypt.compare("dummy", DUMMY_HASH);
    return null;
  }

  const email = parsed.data.email.toLowerCase().trim();
  const password = parsed.data.password;

  // Order: superadmin → admin → merchant → employee
  const superadmin = await prisma.superAdmin.findUnique({ where: { email } });
  if (superadmin && superadmin.deletedAt === null) {
    const ok = await bcrypt.compare(password, superadmin.passwordHash);
    if (!ok) return null;
    return {
      id: superadmin.id,
      email: superadmin.email,
      name: superadmin.name,
      role: "superadmin",
      companyId: null,
      merchantId: null,
      displayId: superadmin.id,
    };
  }

  const admin = await prisma.adminUser.findUnique({
    where: { email },
    include: { company: true },
  });
  if (admin && admin.company.deletedAt === null) {
    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) return null;
    await logLogin("admin", admin.id, admin.companyId, true);
    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: "admin",
      companyId: admin.companyId,
      merchantId: null,
      displayId: admin.id,
    };
  }

  const merchant = await prisma.merchant.findUnique({ where: { email } });
  if (merchant && merchant.isActive && merchant.deletedAt === null) {
    const ok = await bcrypt.compare(password, merchant.passwordHash);
    if (!ok) return null;
    return {
      id: merchant.id,
      email: merchant.email,
      name: merchant.name,
      role: "merchant",
      companyId: null,
      merchantId: merchant.id,
      displayId: merchant.displayId,
    };
  }

  const employee = await prisma.employee.findUnique({
    where: { email },
    include: { company: true },
  });
  if (
    employee &&
    employee.isActive &&
    employee.deletedAt === null &&
    employee.company.deletedAt === null
  ) {
    const ok = await bcrypt.compare(password, employee.passwordHash);
    if (!ok) return null;
    await logLogin("employee", employee.id, employee.companyId, true);
    return {
      id: employee.id,
      email: employee.email,
      name: employee.name,
      role: "employee",
      companyId: employee.companyId,
      merchantId: null,
      displayId: employee.displayId,
    };
  }

  // どのテーブルにも該当ユーザーが存在しなかった場合、
  // ダミーのbcrypt比較を行ってレスポンス時間を揃える(ユーザー列挙攻撃対策)
  await bcrypt.compare(password, DUMMY_HASH);
  return null;
}

async function logLogin(
  actorType: string,
  actorId: string,
  companyId: string | null,
  success: boolean
) {
  if (!companyId) return;
  try {
    await prisma.auditLog.create({
      data: {
        companyId,
        actorType,
        actorId,
        action: success ? "login_success" : "login_failed",
      },
    });
  } catch (e) {
    console.error("Failed to write audit log:", e);
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: authorizeUser,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as typeof user & {
          id: string;
          role: "employee" | "merchant" | "admin" | "superadmin";
          companyId: string | null;
          merchantId: string | null;
          displayId: string;
        };
        token.id = u.id;
        token.role = u.role;
        token.companyId = u.companyId;
        token.merchantId = u.merchantId;
        token.displayId = u.displayId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.companyId = token.companyId;
        session.user.merchantId = token.merchantId;
        session.user.displayId = token.displayId;
      }
      return session;
    },
  },
});
