-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "applied_coupon_code" VARCHAR(50),
ADD COLUMN     "coupon_discount" DECIMAL(10,2);
