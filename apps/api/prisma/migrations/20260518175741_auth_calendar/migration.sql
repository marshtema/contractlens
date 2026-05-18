-- AlterTable
ALTER TABLE "Document" ADD COLUMN "renewalDate" DATETIME;

-- CreateTable
CREATE TABLE "LoginToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LoginToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "subscriptionTier" TEXT NOT NULL DEFAULT 'free',
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'active',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "documentsUsedThisMonth" INTEGER NOT NULL DEFAULT 0,
    "documentsLimit" INTEGER NOT NULL DEFAULT 3,
    "pagesLimit" INTEGER NOT NULL DEFAULT 5,
    "usageResetAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("avatarUrl", "createdAt", "documentsLimit", "documentsUsedThisMonth", "email", "id", "name", "pagesLimit", "stripeCustomerId", "stripeSubscriptionId", "subscriptionStatus", "subscriptionTier", "updatedAt") SELECT "avatarUrl", "createdAt", "documentsLimit", "documentsUsedThisMonth", "email", "id", "name", "pagesLimit", "stripeCustomerId", "stripeSubscriptionId", "subscriptionStatus", "subscriptionTier", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "LoginToken_token_key" ON "LoginToken"("token");

-- CreateIndex
CREATE INDEX "LoginToken_userId_idx" ON "LoginToken"("userId");

-- CreateIndex
CREATE INDEX "LoginToken_token_idx" ON "LoginToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
