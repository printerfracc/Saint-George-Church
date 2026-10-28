-- CreateTable
CREATE TABLE `BaptismRecord` (
    `id` VARCHAR(191) NOT NULL,
    `serialNumber` VARCHAR(191) NULL,
    `baptismDate` DATETIME(3) NULL,
    `birthName` VARCHAR(191) NULL,
    `baptismName` VARCHAR(191) NULL,
    `fatherName` VARCHAR(191) NULL,
    `fatherPhone` VARCHAR(191) NULL,
    `motherName` VARCHAR(191) NULL,
    `priest` VARCHAR(191) NULL,
    `receivedCertificate` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarriageRecord` (
    `id` VARCHAR(191) NOT NULL,
    `serialNumber` VARCHAR(191) NULL,
    `weddingDate` DATETIME(3) NULL,
    `weddingTime` VARCHAR(191) NULL,
    `husbandName` VARCHAR(191) NULL,
    `wifeName` VARCHAR(191) NULL,
    `husbandPhone` VARCHAR(191) NULL,
    `wifePhone` VARCHAR(191) NULL,
    `weddingChurch` VARCHAR(191) NULL,
    `priest` VARCHAR(191) NULL,
    `isHusbandServant` BOOLEAN NOT NULL DEFAULT false,
    `isWifeServant` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DepartedRecord` (
    `id` VARCHAR(191) NOT NULL,
    `serialNumber` VARCHAR(191) NULL,
    `departedName` VARCHAR(191) NULL,
    `ageAtDeath` VARCHAR(191) NULL,
    `familyAddress` TEXT NULL,
    `spouseName` VARCHAR(191) NULL,
    `childrenNames` TEXT NULL,
    `contactMobile` VARCHAR(191) NULL,
    `contactOwner` VARCHAR(191) NULL,
    `funeralDate` DATETIME(3) NULL,
    `funeralTime` VARCHAR(191) NULL,
    `funeralPlace` VARCHAR(191) NULL,
    `causeOfDeath` TEXT NULL,
    `burialPlace` VARCHAR(191) NULL,
    `priest` VARCHAR(191) NULL,
    `thirdDayPrayerTime` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `isServant` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
