import type { DefaultSession, DefaultUser } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";

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

  interface User extends DefaultUser {
    role: UserRole;
    companyId: string | null;
    merchantId: string | null;
    displayId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: UserRole;
    companyId: string | null;
    merchantId: string | null;
    displayId: string;
  }
}
