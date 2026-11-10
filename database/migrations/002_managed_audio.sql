ALTER TABLE tracks
  ADD COLUMN IF NOT EXISTS audio_file_path TEXT,
  ADD COLUMN IF NOT EXISTS audio_mime_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS audio_file_size BIGINT;

ALTER TABLE tracks
  ADD CONSTRAINT tracks_audio_file_size_nonnegative
  CHECK (audio_file_size IS NULL OR audio_file_size >= 0);

CREATE INDEX IF NOT EXISTS idx_tracks_company_active_audio
  ON tracks(company_id, is_active)
  WHERE audio_file_path IS NOT NULL;
