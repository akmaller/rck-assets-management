package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"rck-assets/internal/auth"
	"rck-assets/internal/config"
	"rck-assets/internal/db"
	apphttp "rck-assets/internal/http"
	"rck-assets/internal/store"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("load config: %v", err)
	}

	database, err := db.Open(cfg.DBDriver, cfg.DBDSN)
	if err != nil {
		log.Fatalf("connect database: %v", err)
	}
	defer database.Close()

	if err := db.Migrate(database, cfg.DBDriver); err != nil {
		log.Fatalf("migrate database: %v", err)
	}

	if err := db.EnsureDefaultAdmin(database, cfg.DefaultAdminUsername, cfg.DefaultAdminPassword); err != nil {
		log.Fatalf("seed default admin: %v", err)
	}

	if err := os.MkdirAll("data/uploads", 0o755); err != nil {
		log.Fatalf("prepare upload folder: %v", err)
	}

	appStore := store.New(database)
	tokenManager := auth.NewJWTManager(cfg.JWTSecret, cfg.TokenTTL)

	handler, err := apphttp.NewHandler(cfg, appStore, tokenManager)
	if err != nil {
		log.Fatalf("prepare http handler: %v", err)
	}

	router := apphttp.NewRouter(handler)

	server := &http.Server{
		Addr:              cfg.HTTPAddr,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      0,
		IdleTimeout:       60 * time.Second,
	}

	log.Printf("%s berjalan di %s (db=%s)", cfg.AppName, cfg.HTTPAddr, cfg.DBDriver)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server error: %v", err)
	}
}
