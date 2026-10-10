-- Run once in the selected nave database if users has no last_seen_at column.
ALTER TABLE users
  ADD COLUMN last_seen_at DATETIME NULL DEFAULT NULL AFTER is_active,
  ADD KEY ix_users_presence (is_active, last_seen_at);