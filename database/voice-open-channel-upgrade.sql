-- Add support for proximity-based open-channel voice broadcasts.
ALTER TABLE voice_messages
  ADD COLUMN channel_type ENUM('private','open') NOT NULL DEFAULT 'private' AFTER recipient_id;
