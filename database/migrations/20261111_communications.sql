CREATE TABLE IF NOT EXISTS communication_messages (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
 conversation_key VARCHAR(128) NOT NULL,
 sender_id BIGINT UNSIGNED NOT NULL,
 recipient_id BIGINT UNSIGNED NULL,
 client_id VARCHAR(64) NOT NULL,
 body TEXT NOT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(id), UNIQUE KEY uq_communication_sender_client(sender_id,client_id),
 KEY ix_communication_conversation(conversation_key,id),
 KEY ix_communication_recipient(recipient_id,id), KEY ix_communication_rate(sender_id,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS communication_reads (
 conversation_key VARCHAR(128) NOT NULL, user_id BIGINT UNSIGNED NOT NULL,
 last_message_id BIGINT UNSIGNED NOT NULL DEFAULT 0,
 PRIMARY KEY(conversation_key,user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS communication_typing (
 conversation_key VARCHAR(128) NOT NULL, user_id BIGINT UNSIGNED NOT NULL,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(conversation_key,user_id), KEY ix_communication_typing(updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS communication_call_meta (
 call_id CHAR(36) NOT NULL, media_mode VARCHAR(8) NOT NULL DEFAULT 'voice',
 caller_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 callee_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(call_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
