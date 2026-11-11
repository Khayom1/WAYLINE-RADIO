ALTER TABLE tracks
  ADD COLUMN IF NOT EXISTS audio_file_path TEXT,
  ADD COLUMN IF NOT EXISTS audio_mime_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS audio_file_size BIGINT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tracks_audio_file_size_nonnegative'
      AND conrelid = 'tracks'::regclass
  ) THEN
    ALTER TABLE tracks
      ADD CONSTRAINT tracks_audio_file_size_nonnegative
      CHECK (audio_file_size IS NULL OR audio_file_size >= 0);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_tracks_company_active_audio
  ON tracks(company_id, is_active)
  WHERE audio_file_path IS NOT NULL;
