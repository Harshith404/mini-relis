-- CreateTable
CREATE TABLE "ReviewSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "topic" TEXT NOT NULL,
    "inclusionCriteria" TEXT NOT NULL,
    "exclusionCriteria" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewSettings_pkey" PRIMARY KEY ("id")
);
