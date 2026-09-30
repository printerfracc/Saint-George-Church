-- Existing rows are the live distribution, so they are published for 2026.
-- Identical repeats of the same servant and service are collapsed first,
-- otherwise the unique index cannot be created.

ALTER TABLE `ServantAssignment`
    ADD COLUMN `year` INTEGER NOT NULL DEFAULT 2026,
    ADD COLUMN `isDraft` BOOLEAN NOT NULL DEFAULT true;

UPDATE `ServantAssignment` SET `isDraft` = false;

DELETE a FROM `ServantAssignment` AS a
INNER JOIN `ServantAssignment` AS b
    ON a.`servantId` = b.`servantId`
    AND a.`khedmaId` = b.`khedmaId`
    AND a.`id` > b.`id`
WHERE a.`khedmaId` IS NOT NULL;

CREATE INDEX `ServantAssignment_year_idx` ON `ServantAssignment`(`year`);

CREATE UNIQUE INDEX `ServantAssignment_servantId_khedmaId_year_key` ON `ServantAssignment`(`servantId`, `khedmaId`, `year`);

ALTER TABLE `ServantAssignment` ALTER COLUMN `year` DROP DEFAULT;
