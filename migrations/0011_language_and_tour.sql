-- The person's interface language and their first-login walkthrough (Design Guide D-043).
--
-- The language is saved once in HiFive ID, like appearance (D-030); this is Inventory's own copy,
-- used when HiFive ID has none (and until HiFive ID stores languages at all). 'en' or 'ml'; NULL
-- means never chosen, and the phone's language decides.
-- tour_done_at is set when the person finishes or skips the walkthrough with "don't show again".

ALTER TABLE staff ADD COLUMN lang TEXT CHECK (lang IS NULL OR lang IN ('en','ml'));
ALTER TABLE staff ADD COLUMN tour_done_at TEXT;
