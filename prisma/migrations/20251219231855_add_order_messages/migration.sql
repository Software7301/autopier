-- CreateTable
CREATE TABLE "order_messages" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_messages_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "order_messages" ADD CONSTRAINT "order_messages_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

