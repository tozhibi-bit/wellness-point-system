import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { UserRole } from "@/types/auth";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

export async function requireRole(role: UserRole) {
  const session = await requireAuth();
  if (session.user.role !== role) {
    redirect("/login");
  }
  return session;
}

export async function requireEmployee() {
  const session = await requireRole("employee");
  if (!session.user.companyId) {
    redirect("/login");
  }
  return {
    ...session,
    user: { ...session.user, companyId: session.user.companyId as string },
  };
}

export async function requireMerchant() {
  const session = await requireRole("merchant");
  if (!session.user.merchantId) {
    redirect("/login");
  }
  return {
    ...session,
    user: { ...session.user, merchantId: session.user.merchantId as string },
  };
}

export async function requireAdmin() {
  const session = await requireRole("admin");
  if (!session.user.companyId) {
    redirect("/login");
  }
  return {
    ...session,
    user: { ...session.user, companyId: session.user.companyId as string },
  };
}

export async function requireSuperAdmin() {
  const session = await requireRole("superadmin");
  return session;
}

export async function getDashboardPath(role: UserRole): Promise<string> {
  switch (role) {
    case "employee":
      return "/employee";
    case "merchant":
      return "/merchant";
    case "admin":
      return "/admin";
    case "superadmin":
      return "/superadmin";
    default:
      return "/login";
  }
}
