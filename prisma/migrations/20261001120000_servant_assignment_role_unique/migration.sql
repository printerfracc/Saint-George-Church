-- Allow the same servant to hold more than one role in the same service and year.
DROP INDEX `ServantAssignment_servantId_khedmaId_year_key` ON `ServantAssignment`;

CREATE UNIQUE INDEX `ServantAssignment_servantId_khedmaId_year_roleId_key` ON `ServantAssignment`(`servantId`, `khedmaId`, `year`, `roleId`);
