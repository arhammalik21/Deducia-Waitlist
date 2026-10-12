-- CreateEnum
CREATE TYPE "MailNotificationKind" AS ENUM ('APPLY_ASSIST', 'MATCH_DIGEST');

-- CreateEnum
CREATE TYPE "MailNotificationStatus" AS ENUM ('SENT', 'FAILED', 'LOCAL');

-- CreateTable
CREATE TABLE "application_assists" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "cover_letter" TEXT NOT NULL,
    "talking_points" TEXT NOT NULL,
    "email_subject" TEXT NOT NULL,
    "email_body" TEXT NOT NULL,
    "ai_run_id" TEXT,
    "emailed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_assists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kind" "MailNotificationKind" NOT NULL,
    "to_email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "MailNotificationStatus" NOT NULL,
    "provider" TEXT NOT NULL,
    "payload" JSONB,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mail_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "application_assists_user_id_job_id_idx" ON "application_assists"("user_id", "job_id");

-- CreateIndex
CREATE INDEX "application_assists_user_id_created_at_idx" ON "application_assists"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "mail_notifications_user_id_kind_created_at_idx" ON "mail_notifications"("user_id", "kind", "created_at");

-- CreateIndex
CREATE INDEX "mail_notifications_created_at_idx" ON "mail_notifications"("created_at");

-- AddForeignKey
ALTER TABLE "application_assists" ADD CONSTRAINT "application_assists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_assists" ADD CONSTRAINT "application_assists_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_notifications" ADD CONSTRAINT "mail_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
