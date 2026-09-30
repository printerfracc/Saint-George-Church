-- CreateTable
CREATE TABLE `ChurchActivity` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `order` INTEGER NOT NULL DEFAULT 0,
    `link` VARCHAR(191) NULL,

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DynamicContent` (
    `id` VARCHAR(191) NOT NULL,
    `sectionKey` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DynamicContent_sectionKey_key`(`sectionKey` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InviteToken` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `used` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `role` ENUM('SUPER_ADMIN', 'ADMIN', 'TAWZE3A_ADMIN') NOT NULL DEFAULT 'ADMIN',

    INDEX `InviteToken_createdBy_idx`(`createdBy` ASC),
    INDEX `InviteToken_email_idx`(`email` ASC),
    UNIQUE INDEX `InviteToken_token_key`(`token` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Khedma` (
    `id` VARCHAR(191) NOT NULL,
    `tawze3aId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,

    INDEX `Khedma_tawze3aId_idx`(`tawze3aId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KhedmaCategory` (
    `id` VARCHAR(191) NOT NULL,
    `khedmaId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `roleId` VARCHAR(191) NOT NULL,

    INDEX `KhedmaCategory_khedmaId_idx`(`khedmaId` ASC),
    INDEX `KhedmaCategory_roleId_idx`(`roleId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LiturgyEntry` (
    `id` VARCHAR(191) NOT NULL,
    `section` ENUM('SCHEDULE', 'LIVE', 'RITES', 'CALENDAR') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `detail` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `order` INTEGER NOT NULL DEFAULT 0,

    INDEX `LiturgyEntry_section_idx`(`section` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MediaCollection` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `imageUrl` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `order` INTEGER NOT NULL DEFAULT 0,
    `imageDisplayMode` VARCHAR(191) NOT NULL DEFAULT 'NORMAL',
    `slug` VARCHAR(191) NULL,
    `category` ENUM('SERMONS', 'BOOKS', 'IMAGES') NOT NULL DEFAULT 'SERMONS',

    UNIQUE INDEX `MediaCollection_slug_key`(`slug` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MediaItem` (
    `id` VARCHAR(191) NOT NULL,
    `collectionId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL DEFAULT '',
    `fileUrl` TEXT NULL,
    `fileName` VARCHAR(191) NULL,
    `fileType` VARCHAR(191) NOT NULL DEFAULT 'link',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `thumbnail` TEXT NULL,
    `link` TEXT NULL,
    `linkLabel` VARCHAR(191) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `imageDisplayMode` VARCHAR(191) NOT NULL DEFAULT 'NORMAL',

    INDEX `MediaItem_collectionId_idx`(`collectionId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NewsEvent` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PrayerRequest` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Priest` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `cloudinaryImageUrl` VARCHAR(191) NULL,
    `ordinationDate` DATETIME(3) NOT NULL,
    `confessionSchedule` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `bio` TEXT NULL,
    `contactNumbers` TEXT NULL,
    `qommosiyaDegree` VARCHAR(191) NULL,
    `deathDate` DATETIME(3) NULL,
    `ordinationDateText` VARCHAR(32) NULL,
    `deathDateText` VARCHAR(32) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Relic` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `order` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Sermon` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `mediaUrl` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `priestId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Sermon_priestId_idx`(`priestId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Servant` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `nationalId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NULL,
    `newUser` BOOLEAN NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Servant_nationalId_key`(`nationalId` ASC),
    UNIQUE INDEX `Servant_phone_key`(`phone` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServantAssignment` (
    `id` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NULL,
    `servantId` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `khedmaId` VARCHAR(191) NULL,

    INDEX `ServantAssignment_categoryId_idx`(`categoryId` ASC),
    INDEX `ServantAssignment_khedmaId_idx`(`khedmaId` ASC),
    INDEX `ServantAssignment_roleId_idx`(`roleId` ASC),
    INDEX `ServantAssignment_servantId_idx`(`servantId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServantRole` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `ServantRole_name_key`(`name` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Service` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `schedule` VARCHAR(191) NOT NULL,
    `type` ENUM('MEDICAL', 'SUNDAY_SCHOOL', 'YOUTH', 'CHOIR', 'VISITATION', 'CHARITY', 'OTHER') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `parentId` VARCHAR(191) NULL,
    `imageDisplayMode` VARCHAR(191) NOT NULL DEFAULT 'NORMAL',
    `slug` VARCHAR(191) NULL,
    `serviceTime` TEXT NULL,
    `amenPhone` VARCHAR(191) NULL,
    `imageUrls` TEXT NULL,

    INDEX `Service_parentId_idx`(`parentId` ASC),
    UNIQUE INDEX `Service_slug_key`(`slug` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tawze3a` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'ADMIN', 'TAWZE3A_ADMIN') NOT NULL DEFAULT 'ADMIN',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `InviteToken` ADD CONSTRAINT `InviteToken_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Khedma` ADD CONSTRAINT `Khedma_tawze3aId_fkey` FOREIGN KEY (`tawze3aId`) REFERENCES `Tawze3a`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KhedmaCategory` ADD CONSTRAINT `KhedmaCategory_khedmaId_fkey` FOREIGN KEY (`khedmaId`) REFERENCES `Khedma`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KhedmaCategory` ADD CONSTRAINT `KhedmaCategory_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `ServantRole`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MediaItem` ADD CONSTRAINT `MediaItem_collectionId_fkey` FOREIGN KEY (`collectionId`) REFERENCES `MediaCollection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Sermon` ADD CONSTRAINT `Sermon_priestId_fkey` FOREIGN KEY (`priestId`) REFERENCES `Priest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServantAssignment` ADD CONSTRAINT `ServantAssignment_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `KhedmaCategory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServantAssignment` ADD CONSTRAINT `ServantAssignment_khedmaId_fkey` FOREIGN KEY (`khedmaId`) REFERENCES `Khedma`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServantAssignment` ADD CONSTRAINT `ServantAssignment_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `ServantRole`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServantAssignment` ADD CONSTRAINT `ServantAssignment_servantId_fkey` FOREIGN KEY (`servantId`) REFERENCES `Servant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Service` ADD CONSTRAINT `Service_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Service`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
