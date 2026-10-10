-- Execute uma vez no banco nave se estas tabelas ainda nao existirem.
CREATE TABLE IF NOT EXISTS friend_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  requester_id BIGINT UNSIGNED NOT NULL,
  recipient_id BIGINT UNSIGNED NOT NULL,
  status ENUM('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_friend_request_pair (requester_id, recipient_id),
  KEY ix_friend_requests_recipient (recipient_id, status),
  KEY ix_friend_requests_requester (requester_id, status),
  CONSTRAINT fk_friend_request_sender FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_friend_request_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_friend_request_not_self CHECK (requester_id <> recipient_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS voice_calls (
  call_id CHAR(36) NOT NULL,
  caller_id BIGINT UNSIGNED NOT NULL,
  callee_id BIGINT UNSIGNED NOT NULL,
  status ENUM('ringing','accepted','declined','ended','missed') NOT NULL DEFAULT 'ringing',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (call_id),
  KEY ix_voice_calls_caller_status (caller_id, status, updated_at),
  KEY ix_voice_calls_callee_status (callee_id, status, updated_at),
  CONSTRAINT fk_voice_call_caller FOREIGN KEY (caller_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_voice_call_callee FOREIGN KEY (callee_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_voice_call_not_self CHECK (caller_id <> callee_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS call_signals (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  call_id CHAR(36) NOT NULL,
  sender_id BIGINT UNSIGNED NOT NULL,
  recipient_id BIGINT UNSIGNED NOT NULL,
  signal_type ENUM('offer','answer','ice') NOT NULL,
  payload JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY ix_call_signals_recipient (call_id, recipient_id, read_at, id),
  CONSTRAINT fk_call_signal_call FOREIGN KEY (call_id) REFERENCES voice_calls(call_id) ON DELETE CASCADE,
  CONSTRAINT fk_call_signal_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_call_signal_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS voice_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sender_id BIGINT UNSIGNED NOT NULL,
  recipient_id BIGINT UNSIGNED NOT NULL,
  mime_type VARCHAR(80) NOT NULL,
  duration_ms SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  storage_path VARCHAR(255) NOT NULL,
  status ENUM('pending','listened','dismissed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_voice_messages_recipient (recipient_id,status,created_at),
  CONSTRAINT fk_voice_message_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_voice_message_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_voice_message_not_self CHECK (sender_id <> recipient_id)
) ENGINE=InnoDB;

