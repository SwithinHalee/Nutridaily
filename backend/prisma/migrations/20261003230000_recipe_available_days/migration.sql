-- AlterTable: menambah daftar hari eksplisit pada Recipe
ALTER TABLE "Recipe" ADD COLUMN "availableDays" TEXT[];
