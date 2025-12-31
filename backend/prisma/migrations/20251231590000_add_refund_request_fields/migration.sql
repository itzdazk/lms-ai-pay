-- AlterTable
ALTER TABLE "refund_requests" ADD COLUMN "reason_type" VARCHAR(50);
ALTER TABLE "refund_requests" ADD COLUMN "refund_type" VARCHAR(20);
ALTER TABLE "refund_requests" ADD COLUMN "suggested_refund_amount" DECIMAL(10,2);
ALTER TABLE "refund_requests" ADD COLUMN "requested_refund_amount" DECIMAL(10,2);
ALTER TABLE "refund_requests" ADD COLUMN "offer_expires_at" TIMESTAMPTZ;
ALTER TABLE "refund_requests" ADD COLUMN "student_accepted_offer" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "refund_requests" ADD COLUMN "student_rejected_offer" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "refund_requests_refund_type_idx" ON "refund_requests"("refund_type");

