/*
  # Add is_available column to services table

  1. Changes
    - Add `is_available` boolean column (default true)

  2. Notes
    - This is used to hide/show products in the store ("غير متوفر/متوفر").
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'is_available'
  ) THEN
    ALTER TABLE services ADD COLUMN is_available boolean DEFAULT true;
  END IF;
END $$;
