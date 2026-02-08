package db

import (
	"context"
	"fmt"
	"time"

	_ "github.com/go-sql-driver/mysql"
	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/jmoiron/sqlx"
	_ "modernc.org/sqlite"
)

func Open(driver, dsn string) (*sqlx.DB, error) {
	sqlDriver := ""
	switch driver {
	case "sqlite":
		sqlDriver = "sqlite"
	case "postgres":
		sqlDriver = "pgx"
	case "mysql":
		sqlDriver = "mysql"
	default:
		return nil, fmt.Errorf("driver tidak didukung: %s", driver)
	}

	db, err := sqlx.Open(sqlDriver, dsn)
	if err != nil {
		return nil, err
	}

	db.SetMaxOpenConns(20)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(30 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		_ = db.Close()
		return nil, err
	}

	return db, nil
}
