-- Contacts Manager schema
-- Run:  mysql -u root -p < sql/schema.sql
-- WARNING: drops and recreates both tables. Run sql/seed.sql afterwards.

CREATE DATABASE IF NOT EXISTS lamp_project
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE lamp_project;

-- contacts references users, so drop it first
DROP TABLE IF EXISTS contacts;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id                   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username             VARCHAR(50)  NOT NULL,
  email                VARCHAR(255) NULL,              -- nullable so seeded admins don't need one; still unique when present
  full_name            VARCHAR(100) NOT NULL DEFAULT '',
  password_hash        VARCHAR(255) NOT NULL,          -- PHP password_hash() output (bcrypt, salt embedded)
  role                 ENUM('user','admin') NOT NULL DEFAULT 'user',
  is_disabled          TINYINT(1)   NOT NULL DEFAULT 0, -- users are disabled, never deleted
  must_change_password TINYINT(1)   NOT NULL DEFAULT 0, -- optional: force reset on first login (root)
  created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE contacts (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  name       VARCHAR(100) NOT NULL,
  phone      VARCHAR(30)  NULL,
  email      VARCHAR(255) NULL,
  address    VARCHAR(255) NULL,
  notes      TEXT         NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  -- every contact query filters by owner; (user_id, name) also serves ORDER BY name
  KEY idx_contacts_user_name (user_id, name),
  -- RESTRICT: a user who still owns contacts can't be deleted (we disable instead)
  CONSTRAINT fk_contacts_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;
