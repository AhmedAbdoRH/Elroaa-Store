/*
  # Fix legacy store_settings branding

  Replaces old template values (furniture / perfume demo) that caused the browser tab
  to show correct title from index.html then switch to wrong store name after hydration.
*/

UPDATE public.store_settings
SET
  store_name = CASE
    WHEN COALESCE(store_name, '') ILIKE '%السماح%'
      OR COALESCE(store_name, '') ILIKE '%مفروشات%'
      OR TRIM(COALESCE(store_name, '')) = 'متجر العطور'
    THEN 'شركة الرؤى للتجارة والتوريدات والعطارة'
    ELSE store_name
  END,
  meta_title = CASE
    WHEN COALESCE(meta_title, '') ILIKE '%السماح%'
      OR COALESCE(meta_title, '') ILIKE '%مفروشات%'
      OR COALESCE(meta_title, '') ILIKE '%متجر العطور%'
    THEN 'شركة الرؤى للتجارة والتوريدات والعطارة'
    ELSE meta_title
  END,
  store_description = CASE
    WHEN COALESCE(store_description, '') ILIKE '%السماح%'
      OR COALESCE(store_description, '') ILIKE '%مفروشات%'
      OR COALESCE(store_description, '') ILIKE '%متجر العطور%'
      OR COALESCE(store_description, '') ILIKE '%عطور والمنتجات العالمية%'
    THEN 'أفضل أنواع الأعشاب الطبيعية، التوابل، والزيوت العطرية'
    ELSE store_description
  END,
  meta_description = CASE
    WHEN COALESCE(meta_description, '') ILIKE '%السماح%'
      OR COALESCE(meta_description, '') ILIKE '%مفروشات%'
      OR COALESCE(meta_description, '') ILIKE '%متجر العطور%'
    THEN 'نقدم أفضل أنواع الأعشاب الطبيعية، التوابل، والزيوت العطرية بأسعار تنافسية وجودة عالية'
    ELSE meta_description
  END
WHERE id IS NOT NULL
  AND (
    COALESCE(store_name, '') ILIKE '%السماح%'
    OR COALESCE(store_name, '') ILIKE '%مفروشات%'
    OR TRIM(COALESCE(store_name, '')) = 'متجر العطور'
    OR COALESCE(meta_title, '') ILIKE '%السماح%'
    OR COALESCE(meta_title, '') ILIKE '%مفروشات%'
    OR COALESCE(meta_title, '') ILIKE '%متجر العطور%'
    OR COALESCE(store_description, '') ILIKE '%السماح%'
    OR COALESCE(store_description, '') ILIKE '%مفروشات%'
    OR COALESCE(store_description, '') ILIKE '%متجر العطور%'
    OR COALESCE(store_description, '') ILIKE '%عطور والمنتجات العالمية%'
    OR COALESCE(meta_description, '') ILIKE '%السماح%'
    OR COALESCE(meta_description, '') ILIKE '%مفروشات%'
    OR COALESCE(meta_description, '') ILIKE '%متجر العطور%'
  );
