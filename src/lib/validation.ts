import { z } from "zod";

export const loginEmailSchema = z.object({
  loginType: z.literal("email"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
});

export const loginIdSchema = z.object({
  loginType: z.literal("id"),
  companyDisplayId: z.string().min(1, "会社IDを入力してください"),
  userDisplayId: z.string().min(1, "従業員ID/加盟店IDを入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
});

export const loginSchema = z.discriminatedUnion("loginType", [
  loginEmailSchema,
  loginIdSchema,
]);

export const transactionInputSchema = z.object({
  employeeId: z.string().min(1),
  serviceId: z.string().min(1),
  pointsUsed: z.number().int().min(0, "ポイントは0以上"),
  usedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD形式"),
});

export const serviceInputSchema = z.object({
  name: z.string().min(1, "サービス名を入力してください").max(100),
  description: z.string().max(500).optional().nullable(),
  priceYen: z.number().int().positive("金額は1円以上"),
});
