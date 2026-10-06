-- AlterTable
ALTER TABLE "KDSTicket" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "LoginAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "ipAddress" VARCHAR(64),
    "userAgent" VARCHAR(256),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoginAuditLog_userId_createdAt_idx" ON "LoginAuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "LoginAuditLog_email_createdAt_idx" ON "LoginAuditLog"("email", "createdAt");

-- CreateIndex
CREATE INDEX "LoginAuditLog_createdAt_idx" ON "LoginAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "KDSTicket_isArchived_idx" ON "KDSTicket"("isArchived");

-- AddForeignKey
ALTER TABLE "LoginAuditLog" ADD CONSTRAINT "LoginAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
