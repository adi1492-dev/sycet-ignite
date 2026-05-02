package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	_ "github.com/tursodatabase/libsql-client-go/libsql"
	"sync"
)

var (
	db       *sql.DB
	r        *gin.Engine
	initOnce sync.Once
)

func initApp() {
	initOnce.Do(func() {
		// Load .env file (ignored in production)
		godotenv.Load()

		var err error
	
	// Turso Connection (libSQL)
	dbURL := os.Getenv("TURSO_URL")
	dbToken := os.Getenv("TURSO_TOKEN")
	
	if dbURL == "" || dbToken == "" {
		log.Fatal("TURSO_URL and TURSO_TOKEN are required")
	}

	dbURL = dbURL + "?authToken=" + dbToken

	db, err = sql.Open("libsql", dbURL)
	if err != nil {
		log.Fatal(err)
	}

	// Configure connection pool
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	// Verify connection
	if err := db.Ping(); err != nil {
		log.Println("Database connection warning (check if offline):", err)
	}

	// Initialize tables
	initDB()
	seedProblemStatements(db)
	})
}

// Handler is the entry point for Vercel Serverless Functions
func Handler(w http.ResponseWriter, req *http.Request) {
	initApp()
	
	// Create the router if it doesn't exist
	if r == nil {
		r = gin.Default()

		// CORS Middleware
		r.Use(cors.New(cors.Config{
			AllowOrigins:     []string{"http://localhost:5173", "https://*.vercel.app"},
			AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
			AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
			ExposeHeaders:    []string{"Content-Length"},
			AllowCredentials: true,
			MaxAge:           12 * time.Hour,
		}))

		// Security Headers
		r.Use(func(c *gin.Context) {
			c.Header("X-Frame-Options", "DENY")
			c.Header("X-Content-Type-Options", "nosniff")
			c.Header("X-XSS-Protection", "1; mode=block")
			c.Header("Content-Security-Policy", "default-src 'self'")
			c.Next()
		})

		// Public routes
		r.GET("/api/landing", getLandingData)
		r.GET("/api/problem-statements", getProblemStatements)

		// Auth routes
		authGroup := r.Group("/api/auth")
		{
			authGroup.POST("/login", handleLogin)
			authGroup.POST("/register", handleRegister)
		}

		// Protected routes
		api := r.Group("/api")
		api.Use(authMiddleware())
		{
			api.GET("/team/dashboard", getTeamDashboard)
			api.POST("/team/checklist", updateChecklist)
			api.GET("/chat/messages", getChatMessages)
			api.POST("/chat/send", sendMessage)
			api.POST("/team/git-repo", submitGitRepo)
			api.GET("/kanban", getKanbanTasks)
			api.POST("/kanban/update", updateKanbanTask)
			api.POST("/kanban/delete", deleteKanbanTask)
		}

		// Admin routes
		admin := r.Group("/api/admin")
		admin.Use(authMiddleware(), adminMiddleware())
		{
			admin.GET("/stats", getAdminStats)
			admin.POST("/team/lock", lockTeam)
			admin.POST("/team/unlock", unlockTeam)
			admin.POST("/team/progress", setTeamProgress)
			admin.POST("/settings/update", updateSettings)
			admin.POST("/schedule/update", updateSchedule)

			admin.POST("/add", addAdmin)
			admin.POST("/team/create", createTeam)
			admin.POST("/team/assign-admin", assignAdmin)
			admin.GET("/teams", listTeams)
			admin.POST("/team/update", updateTeam)
			admin.POST("/team/delete", deleteTeam)
			admin.POST("/update", updateAdmin)
			admin.POST("/delete", deleteAdmin)
			admin.POST("/announcement", addAnnouncement)
			admin.POST("/resource/add", addResource)
			admin.POST("/resource/delete", deleteResource)
		}

		api.GET("/admins", listAdmins)
		api.POST("/team/select-admin", selectAdmin)
		api.GET("/announcements", getAnnouncements)
		api.GET("/leaderboard", getLeaderboard)
		api.GET("/resources", getResources)
		api.GET("/problem-statements", listProblemStatements)
	}

	r.ServeHTTP(w, req)
}



func initDB() {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			username TEXT UNIQUE,
			password TEXT,
			role TEXT,
			team_id TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS teams (
			id TEXT PRIMARY KEY,
			name TEXT UNIQUE,
			locked BOOLEAN DEFAULT 0,
			progress INTEGER DEFAULT 0,
			git_repo TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS progress_logs (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			team_id TEXT,
			content TEXT,
			sentiment REAL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS messages (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			team_id TEXT,
			user_id TEXT,
			username TEXT,
			content TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS kanban_tasks (
			id TEXT PRIMARY KEY,
			team_id TEXT,
			content TEXT,
			col TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS event_settings (
			key TEXT PRIMARY KEY,
			value TEXT
		)`,
		`CREATE TABLE IF NOT EXISTS schedule (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			time TEXT,
			label TEXT,
			order_index INTEGER
		)`,
		`CREATE TABLE IF NOT EXISTS problem_statements (
			id TEXT PRIMARY KEY,
			title TEXT,
			technology TEXT,
			bucket TEXT,
			description TEXT
		)`,
		`CREATE TABLE IF NOT EXISTS announcements (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			content TEXT,
			type TEXT DEFAULT 'info',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS resources (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT,
			url TEXT,
			description TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
	}

	for _, q := range queries {
		_, err := db.Exec(q)
		if err != nil {
			log.Fatal("Database init failed:", err)
		}
	}

	// Migrations
	addColumnIfNotExists("teams", "email", "TEXT")
	addColumnIfNotExists("teams", "password", "TEXT")
	addColumnIfNotExists("teams", "admin_id", "TEXT")
	addColumnIfNotExists("teams", "problem_id", "TEXT")
	addColumnIfNotExists("teams", "innovation_name", "TEXT")
	addColumnIfNotExists("teams", "completed_steps", "TEXT")
	addColumnIfNotExists("users", "email", "TEXT")
	addColumnIfNotExists("users", "mobile", "TEXT")
	addColumnIfNotExists("users", "is_mentor", "BOOLEAN DEFAULT 1")
	addColumnIfNotExists("messages", "role", "TEXT")

	// Default values
	db.Exec("INSERT OR IGNORE INTO event_settings (key, value) VALUES ('prize_pool', '₹2L')")
	// Seed schedule if empty
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM schedule").Scan(&count)
	if err != nil {
		log.Println("Error checking schedule count:", err)
	}
	if count == 0 {
		seeds := []struct{ t, l string }{
			{"Day 1 — 09:00 AM", "Registration & Kickoff"},
			{"Day 1 — 11:00 AM", "Hacking Begins"},
			{"Day 2 — 10:00 AM", "Final Submissions"},
		}
		for i, s := range seeds {
			db.Exec("INSERT INTO schedule (time, label, order_index) VALUES (?, ?, ?)", s.t, s.l, i)
		}
	}

	// Default Admin (Username: admin123, Password: m28shjzacb)
	db.Exec("DELETE FROM users WHERE username = 'admin123'")
	db.Exec("INSERT INTO users (id, username, password, role) VALUES ('admin-uuid', 'admin123', '$2a$10$aAIppDaVg.hUkDVmRQje8eR05YDcpuVRSs0CB4XAMfAgAuytxnhkK', 'admin')")
}

func addColumnIfNotExists(table, column, colType string) {
	rows, err := db.Query("PRAGMA table_info(" + table + ")")
	if err != nil {
		log.Println("Error checking table info:", err)
		return
	}
	defer rows.Close()

	exists := false
	for rows.Next() {
		var cid int
		var name, dtype string
		var notnull, pk int
		var dflt_value interface{}
		if err := rows.Scan(&cid, &name, &dtype, &notnull, &dflt_value, &pk); err != nil {
			log.Println("Error scanning table info:", err)
			continue
		}
		if name == column {
			exists = true
			break
		}
	}

	if !exists {
		log.Printf("Adding column %s to table %s\n", column, table)
		if _, err := db.Exec("ALTER TABLE " + table + " ADD COLUMN " + column + " " + colType); err != nil {
			log.Printf("Error adding column %s: %v\n", column, err)
		}
	}
}
