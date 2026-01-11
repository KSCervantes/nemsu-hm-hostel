/*
  Warnings:

  - The values [PREPARING,READY] on the enum `Order_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `order` MODIFY `status` ENUM('PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING';
