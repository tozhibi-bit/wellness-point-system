import type { DefaultSession } from "next-auth";

export type UserRole = "employee" | "merchant" | "admin" | "superadmin";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      companyId: string | null;
      merchantId: string | null;
      displayId: string;
    } & DefaultSession["user"];
  }

  interface JWT {
    id: string;
    role: UserRole;
    companyId: string | null;
    merchantId: string | null;
    displayId: string;
  }
}