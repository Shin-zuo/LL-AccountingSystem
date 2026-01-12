CREATE TABLE "cash_disbursement_lines" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "cash_disbursement_lines_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"cash_disbursement_id" integer NOT NULL,
	"account_id" integer NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "cash_disbursements" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "cash_disbursements_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"company_id" integer NOT NULL,
	"cdn" varchar(50) NOT NULL,
	"voucher_date" date NOT NULL,
	"supplier_invoice_number" varchar(100),
	"supplier_invoice_date" date,
	"payee_name" varchar(255) NOT NULL,
	"particulars" text,
	"cash_amount" numeric(18, 2) NOT NULL,
	"has_input_vat" boolean DEFAULT false,
	"vat_amount" numeric(18, 2) DEFAULT '0',
	"net_amount" numeric(18, 2),
	"status" varchar DEFAULT 'draft' NOT NULL,
	"prepared_by_id" varchar,
	"approved_by_id" varchar,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cash_receipt_lines" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "cash_receipt_lines_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"cash_receipt_id" integer NOT NULL,
	"account_id" integer NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "cash_receipts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "cash_receipts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"company_id" integer NOT NULL,
	"crn" varchar(50) NOT NULL,
	"voucher_date" date NOT NULL,
	"invoice_number" varchar(100),
	"invoice_date" date,
	"payor_name" varchar(255) NOT NULL,
	"particulars" text,
	"cash_amount" numeric(18, 2) NOT NULL,
	"is_vatable" boolean DEFAULT false,
	"vat_amount" numeric(18, 2) DEFAULT '0',
	"net_amount" numeric(18, 2),
	"status" varchar DEFAULT 'draft' NOT NULL,
	"prepared_by_id" varchar,
	"approved_by_id" varchar,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chart_of_accounts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "chart_of_accounts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"company_id" integer NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"account_type" varchar NOT NULL,
	"category" varchar,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "companies_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"address" text,
	"tin" varchar(50),
	"subscription_status" varchar DEFAULT 'trial' NOT NULL,
	"subscription_start_date" date,
	"subscription_end_date" date,
	"stripe_customer_id" varchar,
	"stripe_subscription_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "employees_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"company_id" integer NOT NULL,
	"employee_code" varchar(50) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"middle_name" varchar(100),
	"tin" varchar(50),
	"sss_number" varchar(50),
	"philhealth_number" varchar(50),
	"hdmf_number" varchar(50),
	"position" varchar(100),
	"department" varchar(100),
	"employment_status" varchar DEFAULT 'regular',
	"is_minimum_wage_earner" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "final_withholding_incomes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "final_withholding_incomes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"company_id" integer NOT NULL,
	"tax_year" integer NOT NULL,
	"quarter" integer,
	"income_type" text NOT NULL,
	"description" text,
	"gross_amount" numeric(18, 2) NOT NULL,
	"tax_withheld" numeric(18, 2) NOT NULL,
	"certificate_number" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mcit_credits" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mcit_credits_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"company_id" integer NOT NULL,
	"tax_year" integer NOT NULL,
	"excess_amount" numeric(18, 2) NOT NULL,
	"used_amount" numeric(18, 2) DEFAULT '0',
	"remaining_amount" numeric(18, 2) NOT NULL,
	"expiry_year" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "nolco_entries" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "nolco_entries_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"company_id" integer NOT NULL,
	"loss_year" integer NOT NULL,
	"original_amount" numeric(18, 2) NOT NULL,
	"used_amount" numeric(18, 2) DEFAULT '0',
	"remaining_amount" numeric(18, 2) NOT NULL,
	"expiry_year" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payroll_periods" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payroll_periods_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"company_id" integer NOT NULL,
	"period_name" varchar(100) NOT NULL,
	"period_type" varchar DEFAULT 'monthly',
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"pay_date" date,
	"status" varchar DEFAULT 'draft',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payroll_records" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payroll_records_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"payroll_period_id" integer NOT NULL,
	"employee_id" integer NOT NULL,
	"basic_salary" numeric(18, 2) DEFAULT '0',
	"overtime_pay" numeric(18, 2) DEFAULT '0',
	"holiday_pay" numeric(18, 2) DEFAULT '0',
	"night_differential" numeric(18, 2) DEFAULT '0',
	"allowances" numeric(18, 2) DEFAULT '0',
	"thirteenth_month_pay" numeric(18, 2) DEFAULT '0',
	"other_taxable_income" numeric(18, 2) DEFAULT '0',
	"deminimis" numeric(18, 2) DEFAULT '0',
	"gross_compensation" numeric(18, 2) DEFAULT '0',
	"sss_employee" numeric(18, 2) DEFAULT '0',
	"philhealth_employee" numeric(18, 2) DEFAULT '0',
	"hdmf_employee" numeric(18, 2) DEFAULT '0',
	"withholding_tax" numeric(18, 2) DEFAULT '0',
	"other_deductions" numeric(18, 2) DEFAULT '0',
	"total_deductions" numeric(18, 2) DEFAULT '0',
	"sss_employer" numeric(18, 2) DEFAULT '0',
	"philhealth_employer" numeric(18, 2) DEFAULT '0',
	"hdmf_employer" numeric(18, 2) DEFAULT '0',
	"ec_contribution" numeric(18, 2) DEFAULT '0',
	"net_pay" numeric(18, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subscriptions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"company_id" integer NOT NULL,
	"payment_method" varchar,
	"payment_reference" varchar,
	"amount_paid" numeric(18, 2),
	"payment_date" timestamp,
	"period_start" date,
	"period_end" date,
	"status" varchar DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tax_settings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tax_settings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"company_id" integer NOT NULL,
	"tax_year" integer NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '25',
	"mcit_rate" numeric(5, 2) DEFAULT '2',
	"is_mcit_applicable" boolean DEFAULT false,
	"credits_available" numeric(18, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"password" varchar NOT NULL,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"role" varchar DEFAULT 'accountant' NOT NULL,
	"company_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "cash_disbursement_lines" ADD CONSTRAINT "cash_disbursement_lines_cash_disbursement_id_cash_disbursements_id_fk" FOREIGN KEY ("cash_disbursement_id") REFERENCES "public"."cash_disbursements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_disbursement_lines" ADD CONSTRAINT "cash_disbursement_lines_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_disbursements" ADD CONSTRAINT "cash_disbursements_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_disbursements" ADD CONSTRAINT "cash_disbursements_prepared_by_id_users_id_fk" FOREIGN KEY ("prepared_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_disbursements" ADD CONSTRAINT "cash_disbursements_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_receipt_lines" ADD CONSTRAINT "cash_receipt_lines_cash_receipt_id_cash_receipts_id_fk" FOREIGN KEY ("cash_receipt_id") REFERENCES "public"."cash_receipts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_receipt_lines" ADD CONSTRAINT "cash_receipt_lines_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_receipts" ADD CONSTRAINT "cash_receipts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_receipts" ADD CONSTRAINT "cash_receipts_prepared_by_id_users_id_fk" FOREIGN KEY ("prepared_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_receipts" ADD CONSTRAINT "cash_receipts_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "final_withholding_incomes" ADD CONSTRAINT "final_withholding_incomes_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcit_credits" ADD CONSTRAINT "mcit_credits_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nolco_entries" ADD CONSTRAINT "nolco_entries_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_records" ADD CONSTRAINT "payroll_records_payroll_period_id_payroll_periods_id_fk" FOREIGN KEY ("payroll_period_id") REFERENCES "public"."payroll_periods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_records" ADD CONSTRAINT "payroll_records_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_settings" ADD CONSTRAINT "tax_settings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");