-- Add weight pricing columns to services table
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS price_per_kg NUMERIC(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS has_weight_pricing BOOLEAN DEFAULT FALSE;
