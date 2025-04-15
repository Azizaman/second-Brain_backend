-- DropForeignKey
ALTER TABLE "notes" DROP CONSTRAINT "notes_googleId_fkey";

-- DropIndex
DROP INDEX "notes_googleId_key";

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_googleId_fkey" FOREIGN KEY ("googleId") REFERENCES "User"("googleId") ON DELETE CASCADE ON UPDATE CASCADE;
