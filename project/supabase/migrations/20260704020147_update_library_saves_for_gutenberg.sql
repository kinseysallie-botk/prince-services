/*
# Update library_saves for Gutenberg books

## Summary
Drop the foreign key constraint on library_saves.resource_id (it referenced
library_resources.id which was uuid). The new Gutenberg-powered Library saves
books with string IDs (e.g. "g-1342") that don't exist in library_resources.
Add title, author, cover_image, resource_url, category columns so saved books
display in the user's private space without re-fetching from the API.

## Security Changes
- Dropped FK constraint library_saves_resource_id_fkey
- resource_id changed from uuid to text
- Added display columns (title, author, cover_image, resource_url, category)
- RLS already enabled and scoped by user_id

## Notes
1. resource_id is now text to support "g-{gutenberg_id}" format
2. The old library_resources table is no longer used — books come from Gutenberg
3. All new columns are nullable to allow flexible saves
*/

ALTER TABLE library_saves DROP CONSTRAINT IF EXISTS library_saves_resource_id_fkey;
ALTER TABLE library_saves ALTER COLUMN resource_id TYPE text;
ALTER TABLE library_saves ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE library_saves ADD COLUMN IF NOT EXISTS author text;
ALTER TABLE library_saves ADD COLUMN IF NOT EXISTS cover_image text;
ALTER TABLE library_saves ADD COLUMN IF NOT EXISTS resource_url text;
ALTER TABLE library_saves ADD COLUMN IF NOT EXISTS category text;
