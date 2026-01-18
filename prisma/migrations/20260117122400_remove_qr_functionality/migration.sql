/*
  Warnings:

  - You are about to drop the column `qRCodeId` on the `attendances` table. All the data in the column will be lost.
  - You are about to drop the `qr_check_ins` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `qr_codes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "attendances" DROP CONSTRAINT "attendances_qRCodeId_fkey";

-- DropForeignKey
ALTER TABLE "qr_check_ins" DROP CONSTRAINT "qr_check_ins_qrCodeId_fkey";

-- DropForeignKey
ALTER TABLE "qr_check_ins" DROP CONSTRAINT "qr_check_ins_userId_fkey";

-- DropForeignKey
ALTER TABLE "qr_codes" DROP CONSTRAINT "qr_codes_courseId_fkey";

-- DropForeignKey
ALTER TABLE "qr_codes" DROP CONSTRAINT "qr_codes_teacherId_fkey";

-- AlterTable
ALTER TABLE "attendances" DROP COLUMN "qRCodeId";

-- DropTable
DROP TABLE "qr_check_ins";

-- DropTable
DROP TABLE "qr_codes";

-- RenameForeignKey
ALTER TABLE "courses" RENAME CONSTRAINT "course_teacher_fkey" TO "course_teacher_profile_fkey";

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "course_teacher_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
