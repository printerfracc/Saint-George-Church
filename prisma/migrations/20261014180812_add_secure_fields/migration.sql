-- AlterTable
ALTER TABLE `Servant` ADD COLUMN `encryptedNationalId` VARCHAR(191) NULL,
    ADD COLUMN `encryptedPhone` VARCHAR(191) NULL,
    ADD COLUMN `nationalIdHash` VARCHAR(191) NULL,
    ADD COLUMN `phoneHash` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Servant_phoneHash_idx` ON `Servant`(`phoneHash`);

-- CreateIndex
CREATE INDEX `Servant_nationalIdHash_idx` ON `Servant`(`nationalIdHash`);
