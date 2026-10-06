-- AlterTable: menambah jendela ketersediaan dan biaya bahan pada Recipe
ALTER TABLE "Recipe" ADD COLUMN "availableFrom" TIMESTAMP(3);
ALTER TABLE "Recipe" ADD COLUMN "availableUntil" TIMESTAMP(3);
ALTER TABLE "Recipe" ADD COLUMN "ingredientCostRp" DOUBLE PRECISION;
