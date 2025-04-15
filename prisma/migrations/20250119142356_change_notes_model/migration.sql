/*
  Warnings:

  - You are about to drop the column `userId` on the `notes` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[googleId]` on the table `notes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `googleId` to the `notes` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "notes" DROP CONSTRAINT "notes_userId_fkey";

-- AlterTable
ALTER TABLE "notes" DROP COLUMN "userId",
ADD COLUMN     "googleId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "notes_googleId_key" ON "notes"("googleId");

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_googleId_fkey" FOREIGN KEY ("googleId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
