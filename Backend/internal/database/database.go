package database

import (
	"fmt"

	"github.com/cbqa/backend/internal/config"
	"github.com/cbqa/backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect(cfg *config.Config) (*gorm.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable TimeZone=Asia/Jakarta",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBName,
	)

	logLevel := logger.Silent
	if cfg.Env == "development" {
		logLevel = logger.Info
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)

	return db, nil
}

func Migrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&models.User{},
		&models.Client{},
		&models.Contact{},
		&models.Project{},
		&models.Task{},
		&models.Lead{},
		&models.Invoice{},
		&models.InvoiceItem{},
		&models.Payment{},
		&models.Contract{},
		&models.Item{},
		&models.Order{},
		&models.Event{},
		&models.Note{},
		&models.Expense{},
		&models.Leave{},
		&models.Announcement{},
		&models.TimeCard{},
		&models.File{},
		&models.Todo{},
		&models.Label{},
		&models.AuditLog{},
		&models.AppRole{},
		&models.RolePermission{},
	)
}
