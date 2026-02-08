package db

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"github.com/jmoiron/sqlx"
	"golang.org/x/crypto/bcrypt"
)

func Migrate(db *sqlx.DB, driver string) error {
	stmts, err := schemaStatements(driver)
	if err != nil {
		return err
	}

	for _, stmt := range stmts {
		if strings.TrimSpace(stmt) == "" {
			continue
		}
		if _, err := db.Exec(stmt); err != nil {
			return fmt.Errorf("gagal menjalankan migrasi: %w", err)
		}
	}

	if err := ensureAssetPhotoColumn(db, driver); err != nil {
		return err
	}
	if err := ensureAssetPhotoThumbColumn(db, driver); err != nil {
		return err
	}
	if err := ensureCompanyMediaColumns(db, driver); err != nil {
		return err
	}
	if err := ensureAssetCodePrefixColumn(db, driver); err != nil {
		return err
	}
	if err := ensureAssetTypeTables(db, driver); err != nil {
		return err
	}
	if err := ensureAssetTypeDescriptionColumn(db, driver); err != nil {
		return err
	}
	if err := ensureAssetSequenceColumn(db, driver); err != nil {
		return err
	}
	if err := ensureLoanHeaderTable(db, driver); err != nil {
		return err
	}
	if err := ensureLoanItemTable(db, driver); err != nil {
		return err
	}
	if err := ensureAuditLogTable(db, driver); err != nil {
		return err
	}

	return nil
}

func EnsureDefaultAdmin(db *sqlx.DB, username, password string) error {
	if strings.TrimSpace(username) == "" || strings.TrimSpace(password) == "" {
		return errors.New("default admin username/password tidak boleh kosong")
	}

	var userID int64
	checkQuery := db.Rebind(`SELECT id FROM users WHERE username = ? LIMIT 1`)
	err := db.Get(&userID, checkQuery, username)
	if err == nil {
		return nil
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return err
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	insertQuery := db.Rebind(`
		INSERT INTO users (username, full_name, password_hash, role, is_active)
		VALUES (?, ?, ?, ?, ?)
	`)
	_, err = db.Exec(insertQuery, username, "Administrator", string(hash), "admin", true)
	return err
}

func schemaStatements(driver string) ([]string, error) {
	switch driver {
	case "sqlite":
		return []string{
			`CREATE TABLE IF NOT EXISTS company_settings (
				id INTEGER PRIMARY KEY,
				company_name TEXT NOT NULL DEFAULT '',
				address TEXT NOT NULL DEFAULT '',
				email TEXT NOT NULL DEFAULT '',
				phone TEXT NOT NULL DEFAULT '',
				website TEXT NOT NULL DEFAULT '',
				asset_code_prefix TEXT NOT NULL DEFAULT 'RCK',
				logo_path TEXT NOT NULL DEFAULT '',
				favicon_path TEXT NOT NULL DEFAULT '',
				updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
			);`,
			`INSERT OR IGNORE INTO company_settings (id, company_name, address, email, phone, website)
			 VALUES (1, '', '', '', '', '');`,
			`CREATE TABLE IF NOT EXISTS users (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				username TEXT NOT NULL UNIQUE,
				full_name TEXT NOT NULL,
				password_hash TEXT NOT NULL,
				role TEXT NOT NULL DEFAULT 'staff',
				is_active INTEGER NOT NULL DEFAULT 1,
				created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
			);`,
			`CREATE TABLE IF NOT EXISTS assets (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				asset_code TEXT NOT NULL UNIQUE,
				name TEXT NOT NULL,
				purchase_date TEXT NOT NULL,
				asset_condition TEXT NOT NULL,
				asset_type_id INTEGER NOT NULL DEFAULT 0,
				asset_sequence INTEGER NOT NULL DEFAULT 0,
				barcode TEXT NOT NULL UNIQUE,
				photo_path TEXT NOT NULL DEFAULT '',
				photo_thumb_path TEXT NOT NULL DEFAULT '',
				created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
			);`,
			`CREATE TABLE IF NOT EXISTS asset_types (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT NOT NULL UNIQUE,
				description TEXT NOT NULL DEFAULT '',
				created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
			);`,
			`INSERT OR IGNORE INTO asset_types (id, name) VALUES (1, 'Umum');`,
			`CREATE TABLE IF NOT EXISTS loan_headers (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				borrower_name TEXT NOT NULL,
				borrower_contact TEXT NOT NULL DEFAULT '',
				borrow_date TEXT NOT NULL,
				notes TEXT NOT NULL DEFAULT '',
				created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
			);`,
			`CREATE TABLE IF NOT EXISTS loan_items (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				loan_id INTEGER NOT NULL,
				asset_id INTEGER NOT NULL,
				return_date TEXT NOT NULL DEFAULT '',
				created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
			);`,
		}, nil
	case "postgres":
		return []string{
			`CREATE TABLE IF NOT EXISTS company_settings (
				id BIGINT PRIMARY KEY,
				company_name TEXT NOT NULL DEFAULT '',
				address TEXT NOT NULL DEFAULT '',
				email TEXT NOT NULL DEFAULT '',
				phone TEXT NOT NULL DEFAULT '',
				website TEXT NOT NULL DEFAULT '',
				asset_code_prefix TEXT NOT NULL DEFAULT 'RCK',
				logo_path TEXT NOT NULL DEFAULT '',
				favicon_path TEXT NOT NULL DEFAULT '',
				updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
			);`,
			`INSERT INTO company_settings (id, company_name, address, email, phone, website)
			 VALUES (1, '', '', '', '', '')
			 ON CONFLICT (id) DO NOTHING;`,
			`CREATE TABLE IF NOT EXISTS users (
				id BIGSERIAL PRIMARY KEY,
				username TEXT NOT NULL UNIQUE,
				full_name TEXT NOT NULL,
				password_hash TEXT NOT NULL,
				role TEXT NOT NULL DEFAULT 'staff',
				is_active BOOLEAN NOT NULL DEFAULT TRUE,
				created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
			);`,
			`CREATE TABLE IF NOT EXISTS assets (
				id BIGSERIAL PRIMARY KEY,
				asset_code TEXT NOT NULL UNIQUE,
				name TEXT NOT NULL,
				purchase_date TEXT NOT NULL,
				asset_condition TEXT NOT NULL,
				asset_type_id BIGINT NOT NULL DEFAULT 0,
				asset_sequence BIGINT NOT NULL DEFAULT 0,
				barcode TEXT NOT NULL UNIQUE,
				photo_path TEXT NOT NULL DEFAULT '',
				photo_thumb_path TEXT NOT NULL DEFAULT '',
				created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
			);`,
			`CREATE TABLE IF NOT EXISTS asset_types (
				id BIGSERIAL PRIMARY KEY,
				name TEXT NOT NULL UNIQUE,
				description TEXT NOT NULL DEFAULT '',
				created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
			);`,
			`INSERT INTO asset_types (id, name) VALUES (1, 'Umum') ON CONFLICT (id) DO NOTHING;`,
			`CREATE TABLE IF NOT EXISTS loan_headers (
				id BIGSERIAL PRIMARY KEY,
				borrower_name TEXT NOT NULL,
				borrower_contact TEXT NOT NULL DEFAULT '',
				borrow_date TEXT NOT NULL,
				notes TEXT NOT NULL DEFAULT '',
				created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
			);`,
			`CREATE TABLE IF NOT EXISTS loan_items (
				id BIGSERIAL PRIMARY KEY,
				loan_id BIGINT NOT NULL,
				asset_id BIGINT NOT NULL,
				return_date TEXT NOT NULL DEFAULT '',
				created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
			);`,
		}, nil
	case "mysql":
		return []string{
			`CREATE TABLE IF NOT EXISTS company_settings (
				id BIGINT PRIMARY KEY,
				company_name VARCHAR(255) NOT NULL DEFAULT '',
				address TEXT NOT NULL,
				email VARCHAR(255) NOT NULL DEFAULT '',
				phone VARCHAR(100) NOT NULL DEFAULT '',
				website VARCHAR(255) NOT NULL DEFAULT '',
				asset_code_prefix VARCHAR(20) NOT NULL DEFAULT 'RCK',
				logo_path VARCHAR(255) NOT NULL DEFAULT '',
				favicon_path VARCHAR(255) NOT NULL DEFAULT '',
				updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
			);`,
			`INSERT INTO company_settings (id, company_name, address, email, phone, website)
			 VALUES (1, '', '', '', '', '')
			 ON DUPLICATE KEY UPDATE id = id;`,
			`CREATE TABLE IF NOT EXISTS users (
				id BIGINT AUTO_INCREMENT PRIMARY KEY,
				username VARCHAR(100) NOT NULL UNIQUE,
				full_name VARCHAR(255) NOT NULL,
				password_hash VARCHAR(255) NOT NULL,
				role VARCHAR(50) NOT NULL DEFAULT 'staff',
				is_active BOOLEAN NOT NULL DEFAULT TRUE,
				created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
			);`,
			`CREATE TABLE IF NOT EXISTS assets (
				id BIGINT AUTO_INCREMENT PRIMARY KEY,
				asset_code VARCHAR(120) NOT NULL UNIQUE,
				name VARCHAR(255) NOT NULL,
				purchase_date VARCHAR(20) NOT NULL,
				asset_condition VARCHAR(100) NOT NULL,
				asset_type_id BIGINT NOT NULL DEFAULT 0,
				asset_sequence BIGINT NOT NULL DEFAULT 0,
				barcode VARCHAR(120) NOT NULL UNIQUE,
				photo_path VARCHAR(255) NOT NULL DEFAULT '',
				photo_thumb_path VARCHAR(255) NOT NULL DEFAULT '',
				created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
			);`,
			`CREATE TABLE IF NOT EXISTS asset_types (
				id BIGINT AUTO_INCREMENT PRIMARY KEY,
				name VARCHAR(120) NOT NULL UNIQUE,
				description VARCHAR(255) NOT NULL DEFAULT '',
				created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
			);`,
			`INSERT INTO asset_types (id, name) VALUES (1, 'Umum') ON DUPLICATE KEY UPDATE id = id;`,
			`CREATE TABLE IF NOT EXISTS loan_headers (
				id BIGINT AUTO_INCREMENT PRIMARY KEY,
				borrower_name VARCHAR(255) NOT NULL,
				borrower_contact VARCHAR(255) NOT NULL DEFAULT '',
				borrow_date VARCHAR(20) NOT NULL,
				notes TEXT NOT NULL,
				created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
			);`,
			`CREATE TABLE IF NOT EXISTS loan_items (
				id BIGINT AUTO_INCREMENT PRIMARY KEY,
				loan_id BIGINT NOT NULL,
				asset_id BIGINT NOT NULL,
				return_date VARCHAR(20) NOT NULL DEFAULT '',
				created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
			);`,
		}, nil
	default:
		return nil, fmt.Errorf("driver tidak didukung: %s", driver)
	}
}

func ensureAssetPhotoColumn(db *sqlx.DB, driver string) error {
	var stmt string
	switch driver {
	case "sqlite":
		stmt = `ALTER TABLE assets ADD COLUMN photo_path TEXT NOT NULL DEFAULT ''`
	case "postgres":
		stmt = `ALTER TABLE assets ADD COLUMN photo_path TEXT NOT NULL DEFAULT ''`
	case "mysql":
		stmt = `ALTER TABLE assets ADD COLUMN photo_path VARCHAR(255) NOT NULL DEFAULT ''`
	default:
		return fmt.Errorf("driver tidak didukung: %s", driver)
	}

	if _, err := db.Exec(stmt); err != nil {
		if isDuplicateColumnError(err) {
			return nil
		}
		return err
	}
	return nil
}

func ensureAssetPhotoThumbColumn(db *sqlx.DB, driver string) error {
	var stmt string
	switch driver {
	case "sqlite":
		stmt = `ALTER TABLE assets ADD COLUMN photo_thumb_path TEXT NOT NULL DEFAULT ''`
	case "postgres":
		stmt = `ALTER TABLE assets ADD COLUMN photo_thumb_path TEXT NOT NULL DEFAULT ''`
	case "mysql":
		stmt = `ALTER TABLE assets ADD COLUMN photo_thumb_path VARCHAR(255) NOT NULL DEFAULT ''`
	default:
		return fmt.Errorf("driver tidak didukung: %s", driver)
	}

	if _, err := db.Exec(stmt); err != nil {
		if isDuplicateColumnError(err) {
			return nil
		}
		return err
	}
	return nil
}

func ensureCompanyMediaColumns(db *sqlx.DB, driver string) error {
	var stmts []string
	switch driver {
	case "sqlite":
		stmts = []string{
			`ALTER TABLE company_settings ADD COLUMN logo_path TEXT NOT NULL DEFAULT ''`,
			`ALTER TABLE company_settings ADD COLUMN favicon_path TEXT NOT NULL DEFAULT ''`,
		}
	case "postgres":
		stmts = []string{
			`ALTER TABLE company_settings ADD COLUMN logo_path TEXT NOT NULL DEFAULT ''`,
			`ALTER TABLE company_settings ADD COLUMN favicon_path TEXT NOT NULL DEFAULT ''`,
		}
	case "mysql":
		stmts = []string{
			`ALTER TABLE company_settings ADD COLUMN logo_path VARCHAR(255) NOT NULL DEFAULT ''`,
			`ALTER TABLE company_settings ADD COLUMN favicon_path VARCHAR(255) NOT NULL DEFAULT ''`,
		}
	default:
		return fmt.Errorf("driver tidak didukung: %s", driver)
	}

	for _, stmt := range stmts {
		if _, err := db.Exec(stmt); err != nil {
			if isDuplicateColumnError(err) {
				continue
			}
			return err
		}
	}
	return nil
}

func ensureAssetCodePrefixColumn(db *sqlx.DB, driver string) error {
	var stmt string
	switch driver {
	case "sqlite":
		stmt = `ALTER TABLE company_settings ADD COLUMN asset_code_prefix TEXT NOT NULL DEFAULT 'RCK'`
	case "postgres":
		stmt = `ALTER TABLE company_settings ADD COLUMN asset_code_prefix TEXT NOT NULL DEFAULT 'RCK'`
	case "mysql":
		stmt = `ALTER TABLE company_settings ADD COLUMN asset_code_prefix VARCHAR(20) NOT NULL DEFAULT 'RCK'`
	default:
		return fmt.Errorf("driver tidak didukung: %s", driver)
	}

	if _, err := db.Exec(stmt); err != nil {
		if isDuplicateColumnError(err) {
			return nil
		}
		return err
	}
	return nil
}

func ensureAssetTypeTables(db *sqlx.DB, driver string) error {
	var stmts []string
	switch driver {
	case "sqlite":
		stmts = []string{
			`ALTER TABLE assets ADD COLUMN asset_type_id INTEGER NOT NULL DEFAULT 0`,
			`CREATE TABLE IF NOT EXISTS asset_types (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT NOT NULL UNIQUE,
				description TEXT NOT NULL DEFAULT '',
				created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
			);`,
			`INSERT OR IGNORE INTO asset_types (id, name) VALUES (1, 'Umum');`,
		}
	case "postgres":
		stmts = []string{
			`ALTER TABLE assets ADD COLUMN asset_type_id BIGINT NOT NULL DEFAULT 0`,
			`CREATE TABLE IF NOT EXISTS asset_types (
				id BIGSERIAL PRIMARY KEY,
				name TEXT NOT NULL UNIQUE,
				description TEXT NOT NULL DEFAULT '',
				created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
			);`,
			`INSERT INTO asset_types (id, name) VALUES (1, 'Umum') ON CONFLICT (id) DO NOTHING;`,
		}
	case "mysql":
		stmts = []string{
			`ALTER TABLE assets ADD COLUMN asset_type_id BIGINT NOT NULL DEFAULT 0`,
			`CREATE TABLE IF NOT EXISTS asset_types (
				id BIGINT AUTO_INCREMENT PRIMARY KEY,
				name VARCHAR(120) NOT NULL UNIQUE,
				description VARCHAR(255) NOT NULL DEFAULT '',
				created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
			);`,
			`INSERT INTO asset_types (id, name) VALUES (1, 'Umum') ON DUPLICATE KEY UPDATE id = id;`,
		}
	default:
		return fmt.Errorf("driver tidak didukung: %s", driver)
	}

	for _, stmt := range stmts {
		if _, err := db.Exec(stmt); err != nil {
			if isDuplicateColumnError(err) {
				continue
			}
			if strings.Contains(strings.ToLower(err.Error()), "already exists") {
				continue
			}
			return err
		}
	}
	return nil
}

func ensureAssetSequenceColumn(db *sqlx.DB, driver string) error {
	var stmt string
	switch driver {
	case "sqlite":
		stmt = `ALTER TABLE assets ADD COLUMN asset_sequence INTEGER NOT NULL DEFAULT 0`
	case "postgres":
		stmt = `ALTER TABLE assets ADD COLUMN asset_sequence BIGINT NOT NULL DEFAULT 0`
	case "mysql":
		stmt = `ALTER TABLE assets ADD COLUMN asset_sequence BIGINT NOT NULL DEFAULT 0`
	default:
		return fmt.Errorf("driver tidak didukung: %s", driver)
	}

	if _, err := db.Exec(stmt); err != nil {
		if isDuplicateColumnError(err) {
			return nil
		}
		return err
	}
	return nil
}

func ensureAssetTypeDescriptionColumn(db *sqlx.DB, driver string) error {
	var stmt string
	switch driver {
	case "sqlite":
		stmt = `ALTER TABLE asset_types ADD COLUMN description TEXT NOT NULL DEFAULT ''`
	case "postgres":
		stmt = `ALTER TABLE asset_types ADD COLUMN description TEXT NOT NULL DEFAULT ''`
	case "mysql":
		stmt = `ALTER TABLE asset_types ADD COLUMN description VARCHAR(255) NOT NULL DEFAULT ''`
	default:
		return fmt.Errorf("driver tidak didukung: %s", driver)
	}

	if _, err := db.Exec(stmt); err != nil {
		if isDuplicateColumnError(err) {
			return nil
		}
		return err
	}
	return nil
}

func ensureLoanHeaderTable(db *sqlx.DB, driver string) error {
	var stmt string
	switch driver {
	case "sqlite":
		stmt = `CREATE TABLE IF NOT EXISTS loan_headers (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			borrower_name TEXT NOT NULL,
			borrower_contact TEXT NOT NULL DEFAULT '',
			borrow_date TEXT NOT NULL,
			notes TEXT NOT NULL DEFAULT '',
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		);`
	case "postgres":
		stmt = `CREATE TABLE IF NOT EXISTS loan_headers (
			id BIGSERIAL PRIMARY KEY,
			borrower_name TEXT NOT NULL,
			borrower_contact TEXT NOT NULL DEFAULT '',
			borrow_date TEXT NOT NULL,
			notes TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
		);`
	case "mysql":
		stmt = `CREATE TABLE IF NOT EXISTS loan_headers (
			id BIGINT AUTO_INCREMENT PRIMARY KEY,
			borrower_name VARCHAR(255) NOT NULL,
			borrower_contact VARCHAR(255) NOT NULL DEFAULT '',
			borrow_date VARCHAR(20) NOT NULL,
			notes TEXT NOT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		);`
	default:
		return fmt.Errorf("driver tidak didukung: %s", driver)
	}

	if _, err := db.Exec(stmt); err != nil {
		return err
	}
	return nil
}

func ensureLoanItemTable(db *sqlx.DB, driver string) error {
	var stmt string
	switch driver {
	case "sqlite":
		stmt = `CREATE TABLE IF NOT EXISTS loan_items (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			loan_id INTEGER NOT NULL,
			asset_id INTEGER NOT NULL,
			return_date TEXT NOT NULL DEFAULT '',
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		);`
	case "postgres":
		stmt = `CREATE TABLE IF NOT EXISTS loan_items (
			id BIGSERIAL PRIMARY KEY,
			loan_id BIGINT NOT NULL,
			asset_id BIGINT NOT NULL,
			return_date TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
		);`
	case "mysql":
		stmt = `CREATE TABLE IF NOT EXISTS loan_items (
			id BIGINT AUTO_INCREMENT PRIMARY KEY,
			loan_id BIGINT NOT NULL,
			asset_id BIGINT NOT NULL,
			return_date VARCHAR(20) NOT NULL DEFAULT '',
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		);`
	default:
		return fmt.Errorf("driver tidak didukung: %s", driver)
	}

	if _, err := db.Exec(stmt); err != nil {
		return err
	}
	return nil
}

func ensureAuditLogTable(db *sqlx.DB, driver string) error {
	var stmt string
	switch driver {
	case "sqlite":
		stmt = `CREATE TABLE IF NOT EXISTS audit_logs (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL DEFAULT 0,
			username TEXT NOT NULL DEFAULT '',
			role TEXT NOT NULL DEFAULT '',
			action TEXT NOT NULL,
			entity TEXT NOT NULL DEFAULT '',
			entity_id INTEGER NOT NULL DEFAULT 0,
			detail TEXT NOT NULL DEFAULT '',
			ip TEXT NOT NULL DEFAULT '',
			user_agent TEXT NOT NULL DEFAULT '',
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		);`
	case "postgres":
		stmt = `CREATE TABLE IF NOT EXISTS audit_logs (
			id BIGSERIAL PRIMARY KEY,
			user_id BIGINT NOT NULL DEFAULT 0,
			username TEXT NOT NULL DEFAULT '',
			role TEXT NOT NULL DEFAULT '',
			action TEXT NOT NULL,
			entity TEXT NOT NULL DEFAULT '',
			entity_id BIGINT NOT NULL DEFAULT 0,
			detail TEXT NOT NULL DEFAULT '',
			ip TEXT NOT NULL DEFAULT '',
			user_agent TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
		);`
	case "mysql":
		stmt = `CREATE TABLE IF NOT EXISTS audit_logs (
			id BIGINT AUTO_INCREMENT PRIMARY KEY,
			user_id BIGINT NOT NULL DEFAULT 0,
			username VARCHAR(100) NOT NULL DEFAULT '',
			role VARCHAR(50) NOT NULL DEFAULT '',
			action VARCHAR(100) NOT NULL,
			entity VARCHAR(120) NOT NULL DEFAULT '',
			entity_id BIGINT NOT NULL DEFAULT 0,
			detail TEXT NOT NULL,
			ip VARCHAR(80) NOT NULL DEFAULT '',
			user_agent TEXT NOT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		);`
	default:
		return fmt.Errorf("driver tidak didukung: %s", driver)
	}

	if _, err := db.Exec(stmt); err != nil {
		return err
	}
	return nil
}

func isDuplicateColumnError(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "duplicate column") ||
		strings.Contains(msg, "already exists") ||
		strings.Contains(msg, "duplicate column name")
}
