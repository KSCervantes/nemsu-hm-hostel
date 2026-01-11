/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `FoodItem` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `FoodItem_code_key` ON `FoodItem`(`code`);
