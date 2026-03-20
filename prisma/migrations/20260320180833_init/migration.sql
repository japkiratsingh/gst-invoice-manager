-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "party" TEXT NOT NULL,
    "gstNumber" TEXT,
    "basicAmount" REAL NOT NULL,
    "totalAmount" REAL NOT NULL,
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" DATETIME,
    "cancelledReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TaxItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "taxType" TEXT NOT NULL,
    "taxRate" INTEGER NOT NULL,
    "inclusive" BOOLEAN NOT NULL,
    CONSTRAINT "TaxItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GSTBreakup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "cgst_14" REAL NOT NULL DEFAULT 0,
    "sgst_14" REAL NOT NULL DEFAULT 0,
    "cgst_9" REAL NOT NULL DEFAULT 0,
    "sgst_9" REAL NOT NULL DEFAULT 0,
    "cgst_6" REAL NOT NULL DEFAULT 0,
    "sgst_6" REAL NOT NULL DEFAULT 0,
    "cgst_2_5" REAL NOT NULL DEFAULT 0,
    "sgst_2_5" REAL NOT NULL DEFAULT 0,
    "cgst_1_5" REAL NOT NULL DEFAULT 0,
    "sgst_1_5" REAL NOT NULL DEFAULT 0,
    "igst_28" REAL NOT NULL DEFAULT 0,
    "igst_18" REAL NOT NULL DEFAULT 0,
    "igst_12" REAL NOT NULL DEFAULT 0,
    "igst_5" REAL NOT NULL DEFAULT 0,
    "igst_3" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "GSTBreakup_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Invoice_type_month_year_idx" ON "Invoice"("type", "month", "year");

-- CreateIndex
CREATE INDEX "Invoice_type_idx" ON "Invoice"("type");

-- CreateIndex
CREATE INDEX "Invoice_month_year_idx" ON "Invoice"("month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNo_type_key" ON "Invoice"("invoiceNo", "type");

-- CreateIndex
CREATE INDEX "TaxItem_invoiceId_idx" ON "TaxItem"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "GSTBreakup_invoiceId_key" ON "GSTBreakup"("invoiceId");
