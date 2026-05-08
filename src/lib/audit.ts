import { prisma } from "@/lib/prisma";

type AuditActorType = "admin" | "employee" | "merchant" | "system";

export type AuditAction =
  | "login_success"
  | "login_failed"
  | "create_transaction"
  | "update_transaction"
  | "delete_transaction"
  | "confirm_transaction"
  | "create_service"
  | "update_service"
  | "delete_service"
  | "create_invoice"
  | "issue_invoice"
  | "mark_invoice_paid"
  | "create_employee"
  | "update_employee"
  | "deactivate_employee"
  | "create_merchant"
  | "update_merchant"
  | "deactivate_merchant"
  | "run_monthly_grant_batch"
  | "create_merchant_contract"
  | "end_merchant_contract";

interface AuditLogParams {
  companyId: string;
  actorType: AuditActorType;
  actorId: string;
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

export async function recordAudit(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        companyId: params.companyId,
        actorType: params.actorType,
        actorId: params.actorId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        metadata: params.metadata as never,
      },
    });
  } catch (e) {
    console.error("Failed to record audit log:", e);
  }
}
