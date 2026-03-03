-- Add image fields to questions table for Leonardo.ai generated images
ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_option_a TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_option_b TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_option_c TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_option_d TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_results TEXT;
