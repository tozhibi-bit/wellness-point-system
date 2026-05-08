-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('owner', 'viewer');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('pending_usage', 'pending_approval', 'confirmed', 'invoiced', 'cancelled');

-- CreateEnum
CREATE TYPE "TransactionCreator" AS ENUM ('employee', 'merchant');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('draft', 'issued', 'paid');

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "display_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "monthly_points" INTEGER NOT NULL DEFAULT 5,
    "invoice_email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "display_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "department" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'viewer',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merchants" (
    "id" TEXT NOT NULL,
    "display_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "address" TEXT,
    "website_url" TEXT NOT NULL,
    "invoice_reg_no" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "merchants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merchant_contracts" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "merchant_id" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "merchant_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "merchant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price_yen" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_point_grants" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "year_month" TEXT NOT NULL,
    "granted_points" INTEGER NOT NULL,
    "used_points" INTEGER NOT NULL DEFAULT 0,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monthly_point_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "display_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "merchant_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "service_amount_yen" INTEGER NOT NULL,
    "points_used" INTEGER NOT NULL,
    "own_payment_yen" INTEGER NOT NULL,
    "used_date" DATE NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'pending_usage',
    "createdBy" "TransactionCreator" NOT NULL,
    "invoice_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "display_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "merchant_id" TEXT NOT NULL,
    "year_month" TEXT NOT NULL,
    "total_points" INTEGER NOT NULL,
    "subtotal_yen" INTEGER NOT NULL,
    "tax_yen" INTEGER NOT NULL,
    "total_yen" INTEGER NOT NULL,
    "pdf_url" TEXT,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'draft',
    "issued_at" TIMESTAMP(3),
    "due_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "actor_type" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT,
    "target_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_display_id_key" ON "companies"("display_id");

-- CreateIndex
CREATE INDEX "companies_deleted_at_idx" ON "companies"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE INDEX "employees_company_id_is_active_idx" ON "employees"("company_id", "is_active");

-- CreateIndex
CREATE INDEX "employees_email_idx" ON "employees"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employees_company_id_display_id_key" ON "employees"("company_id", "display_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE INDEX "admin_users_company_id_idx" ON "admin_users"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "merchants_display_id_key" ON "merchants"("display_id");

-- CreateIndex
CREATE UNIQUE INDEX "merchants_email_key" ON "merchants"("email");

-- CreateIndex
CREATE INDEX "merchants_is_active_deleted_at_idx" ON "merchants"("is_active", "deleted_at");

-- CreateIndex
CREATE INDEX "merchant_contracts_company_id_is_active_idx" ON "merchant_contracts"("company_id", "is_active");

-- CreateIndex
CREATE INDEX "merchant_contracts_merchant_id_is_active_idx" ON "merchant_contracts"("merchant_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "merchant_contracts_company_id_merchant_id_start_date_key" ON "merchant_contracts"("company_id", "merchant_id", "start_date");

-- CreateIndex
CREATE INDEX "services_merchant_id_is_active_idx" ON "services"("merchant_id", "is_active");

-- CreateIndex
CREATE INDEX "monthly_point_grants_company_id_year_month_idx" ON "monthly_point_grants"("company_id", "year_month");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_point_grants_employee_id_year_month_key" ON "monthly_point_grants"("employee_id", "year_month");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_display_id_key" ON "transactions"("display_id");

-- CreateIndex
CREATE INDEX "transactions_company_id_employee_id_used_date_idx" ON "transactions"("company_id", "employee_id", "used_date" DESC);

-- CreateIndex
CREATE INDEX "transactions_merchant_id_used_date_idx" ON "transactions"("merchant_id", "used_date" DESC);

-- CreateIndex
CREATE INDEX "transactions_company_id_status_idx" ON "transactions"("company_id", "status");

-- CreateIndex
CREATE INDEX "transactions_invoice_id_idx" ON "transactions"("invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_display_id_key" ON "invoices"("display_id");

-- CreateIndex
CREATE INDEX "invoices_company_id_status_idx" ON "invoices"("company_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_company_id_merchant_id_year_month_key" ON "invoices"("company_id", "merchant_id", "year_month");

-- CreateIndex
CREATE INDEX "audit_logs_company_id_created_at_idx" ON "audit_logs"("company_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_actor_type_actor_id_created_at_idx" ON "audit_logs"("actor_type", "actor_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_target_type_target_id_idx" ON "audit_logs"("target_type", "target_id");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchant_contracts" ADD CONSTRAINT "merchant_contracts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchant_contracts" ADD CONSTRAINT "merchant_contracts_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_point_grants" ADD CONSTRAINT "monthly_point_grants_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_point_grants" ADD CONSTRAINT "monthly_point_grants_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
