-- CreateTable
CREATE TABLE "ProfileChange" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "note" TEXT,
    "changes" TEXT NOT NULL,
    "goalBefore" INTEGER,
    "goalAfter" INTEGER NOT NULL,
    "maintenanceBefore" INTEGER,
    "maintenanceAfter" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProfileChange_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ProfileChange_profileId_createdAt_idx" ON "ProfileChange"("profileId", "createdAt");
