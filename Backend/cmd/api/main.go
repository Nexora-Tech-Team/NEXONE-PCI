package main

import (
	"log"

	"github.com/cbqa/backend/internal/config"
	"github.com/cbqa/backend/internal/database"
	"github.com/cbqa/backend/internal/server"
)

func main() {
	cfg := config.Load()

	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	if err := database.Migrate(db); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	srv := server.New(cfg, db)
	log.Printf("Server starting on port %s", cfg.Port)
	if err := srv.Run(); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
