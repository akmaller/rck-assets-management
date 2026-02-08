package config

import (
	"fmt"
	"os"
	"strings"
	"time"
)

// Config menyimpan konfigurasi runtime aplikasi.
type Config struct {
	AppName              string
	HTTPAddr             string
	DBDriver             string
	DBDSN                string
	JWTSecret            string
	TokenTTL             time.Duration
	DefaultAdminUsername string
	DefaultAdminPassword string
}

func Load() (Config, error) {
	cfg := Config{
		AppName:              envOrDefault("APP_NAME", "RCK-Assets"),
		HTTPAddr:             envOrDefault("HTTP_ADDR", ":8080"),
		DBDriver:             strings.ToLower(envOrDefault("DB_DRIVER", "sqlite")),
		DBDSN:                envOrDefault("DB_DSN", ""),
		JWTSecret:            envOrDefault("JWT_SECRET", "rck-assets-dev-secret"),
		DefaultAdminUsername: envOrDefault("DEFAULT_ADMIN_USERNAME", "admin"),
		DefaultAdminPassword: envOrDefault("DEFAULT_ADMIN_PASSWORD", "admin123"),
	}

	ttlRaw := envOrDefault("TOKEN_TTL", "12h")
	ttl, err := time.ParseDuration(ttlRaw)
	if err != nil {
		return cfg, fmt.Errorf("TOKEN_TTL tidak valid: %w", err)
	}
	cfg.TokenTTL = ttl

	switch cfg.DBDriver {
	case "sqlite":
		if strings.TrimSpace(cfg.DBDSN) == "" {
			cfg.DBDSN = "data/rck_assets.db"
		}
	case "postgres":
		if strings.TrimSpace(cfg.DBDSN) == "" {
			cfg.DBDSN = "postgres://postgres:postgres@localhost:5432/rck_assets?sslmode=disable"
		}
	case "mysql":
		if strings.TrimSpace(cfg.DBDSN) == "" {
			cfg.DBDSN = "root:password@tcp(localhost:3306)/rck_assets?parseTime=true"
		}
	default:
		return cfg, fmt.Errorf("DB_DRIVER tidak didukung: %s", cfg.DBDriver)
	}

	return cfg, nil
}

func envOrDefault(key, fallback string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return fallback
}
