-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('sale', 'purchase')),
    date DATE NOT NULL,
    invoice_no VARCHAR(100) NOT NULL,
    party VARCHAR(255) NOT NULL,
    gst_number VARCHAR(15),
    basic_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    is_cancelled BOOLEAN NOT NULL DEFAULT FALSE,
    cancelled_at TIMESTAMP,
    cancelled_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(type, invoice_no)
);

-- Create invoice_items table for tax items
CREATE TABLE IF NOT EXISTS invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_type VARCHAR(20) NOT NULL CHECK (tax_type IN ('CGST_SGST', 'IGST')),
    tax_rate INTEGER NOT NULL CHECK (tax_rate IN (28, 18, 12, 5, 3)),
    inclusive BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create gst_breakup table for detailed GST calculations
CREATE TABLE IF NOT EXISTS gst_breakup (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
    cgst_14 DECIMAL(15,2) NOT NULL DEFAULT 0,
    sgst_14 DECIMAL(15,2) NOT NULL DEFAULT 0,
    cgst_9 DECIMAL(15,2) NOT NULL DEFAULT 0,
    sgst_9 DECIMAL(15,2) NOT NULL DEFAULT 0,
    cgst_6 DECIMAL(15,2) NOT NULL DEFAULT 0,
    sgst_6 DECIMAL(15,2) NOT NULL DEFAULT 0,
    cgst_2_5 DECIMAL(15,2) NOT NULL DEFAULT 0,
    sgst_2_5 DECIMAL(15,2) NOT NULL DEFAULT 0,
    cgst_1_5 DECIMAL(15,2) NOT NULL DEFAULT 0,
    sgst_1_5 DECIMAL(15,2) NOT NULL DEFAULT 0,
    igst_28 DECIMAL(15,2) NOT NULL DEFAULT 0,
    igst_18 DECIMAL(15,2) NOT NULL DEFAULT 0,
    igst_12 DECIMAL(15,2) NOT NULL DEFAULT 0,
    igst_5 DECIMAL(15,2) NOT NULL DEFAULT 0,
    igst_3 DECIMAL(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices(type);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_no ON invoices(invoice_no);
CREATE INDEX IF NOT EXISTS idx_invoices_cancelled ON invoices(is_cancelled);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_gst_breakup_invoice_id ON gst_breakup(invoice_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for invoices table
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
