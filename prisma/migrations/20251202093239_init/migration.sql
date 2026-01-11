-- AlterTable
ALTER TABLE `order` ADD COLUMN `address` VARCHAR(191) NULL,
    ADD COLUMN `contactNumber` VARCHAR(191) NULL,
    ADD COLUMN `desiredAt` DATETIME(3) NULL,
    ADD COLUMN `email` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `orderitem` ADD COLUMN `notes` VARCHAR(191) NULL;
