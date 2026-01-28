DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'items' AND column_name = 'status'
    ) THEN
        ALTER TABLE "items" ADD COLUMN "status" "item_status" DEFAULT 'PENDING' NOT NULL;
    END IF;
END $$;