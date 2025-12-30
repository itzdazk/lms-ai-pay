-- CreateTable
CREATE TABLE "refund_requests" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "progress_percentage" DECIMAL(5,2) NOT NULL,
    "admin_notes" TEXT,
    "processed_at" TIMESTAMPTZ,
    "processed_by" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "refund_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "refund_requests_order_id_idx" ON "refund_requests"("order_id");

-- CreateIndex
CREATE INDEX "refund_requests_student_id_idx" ON "refund_requests"("student_id");

-- CreateIndex
CREATE INDEX "refund_requests_status_idx" ON "refund_requests"("status");

-- CreateIndex
CREATE INDEX "refund_requests_created_at_idx" ON "refund_requests"("created_at");

-- AddForeignKey
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

