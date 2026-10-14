/*
  Warnings:

  - You are about to drop the column `nationalId` on the `Servant` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Servant` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[phoneHash]` on the table `Servant` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nationalIdHash]` on the table `Servant` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `Servant_nationalIdHash_idx` ON `Servant`;

-- DropIndex
DROP INDEX `Servant_nationalId_key` ON `Servant`;

-- DropIndex
DROP INDEX `Servant_phoneHash_idx` ON `Servant`;

-- DropIndex
DROP INDEX `Servant_phone_key` ON `Servant`;

-- AlterTable
ALTER TABLE `Servant` DROP COLUMN `nationalId`,
    DROP COLUMN `phone`;

-- CreateIndex
CREATE UNIQUE INDEX `Servant_phoneHash_key` ON `Servant`(`phoneHash`);

-- CreateIndex
CREATE UNIQUE INDEX `Servant_nationalIdHash_key` ON `Servant`(`nationalIdHash`);
