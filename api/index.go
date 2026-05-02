package handler

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
	_ "github.com/tursodatabase/libsql-client-go/libsql"
	"golang.org/x/crypto/bcrypt"
)

var (
	db       *sql.DB
	r        *gin.Engine
	initOnce sync.Once
	jwtKey   = []byte("your_super_secret_key_change_this")
)

type Claims struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	TeamID   string `json:"team_id"`
	jwt.RegisteredClaims
}

type ProblemStatement struct {
	ID          string
	Title       string
	Technology  string
	Bucket      string
	Description string
}

var ProblemStatements = []ProblemStatement{
	{"sycet001e", "Distributed HighPerformance Web Scraper & Indexer", "Go, Redis, Networking", "Elite", "Build a concurrent web crawler that scales across multiple nodes to index open-source academic resources. The system must handle rate limiting, avoid duplicate crawling using efficient caching, and provide a fast search API for querying the indexed data."},
	{"sycet002e", "Scalable Real-Time Collaborative Code Editor", "WebSockets, TypeScript, React", "Elite", "Create a browser-based collaborative code editor where multiple users can type simultaneously. Implement Operational Transformation (OT) or CRDTs to handle concurrent edits without conflicts, and include a basic syntax highlighter."},
	{"sycet003e", "Local Network P2P File Transfer Utility", "C, Go, TCP/IP", "Elite", "Develop a fast, lightweight peer-to-peer file sharing application designed for college LANs. The software should discover peers via UDP broadcast and transfer large files concurrently over TCP, ensuring data integrity through checksums."},
	{"sycet004e", "AI-Powered Automated Proctoring System", "Python, Computer Vision", "Elite", "Build a webcam-based monitoring system for online exams. The software should use pre-trained models to detect multiple faces, head pose (looking away), and the absence of the candidate, logging suspicious events to a dashboard."},
	{"sycet005e", "Custom API Gateway with Load Balancing", "Go, System Design", "Elite", "Develop a lightweight API gateway from scratch that sits in front of multiple backend services. It must implement round-robin load balancing, IP-based rate limiting to prevent abuse, and basic request logging for analytics."},
	{"sycet006e", "Blockchain-Based Voting DApp for Student Councils", "Solidity, Web3.js", "Elite", "Design a decentralized application for college elections to ensure tamper-proof voting. Use smart contracts on a local testnet to register voters, cast votes anonymously, and publicly tally results without centralized control."},
	{"sycet007e", "Automated Code Evaluation Sandbox", "Docker, Backend API", "Elite", "Build a secure sandbox environment similar to competitive programming platforms. The system should accept user-submitted code, execute it inside an isolated Docker container, test it against hidden inputs, and return execution time and memory usage."},
	{"sycet008m", "Smart Canteen Pre-Ordering System", "Full-Stack Web App", "Standard", "Develop an application where students can pre-order and pay for meals from the college canteen to avoid long queues during breaks. Include a live queue status and estimated prep time for the kitchen staff."},
	{"sycet009m", "Campus Lost and Found Portal", "Web/Mobile App", "Standard", "Create a centralized platform for reporting lost or found items on campus. Implement a basic tagging system and keyword search to match descriptions of lost items with found inventory."},
	{"sycet010m", "Automated Timetable Generator", "Python, Algorithms", "Standard", "Build a software tool that takes faculty availability, subject credits, and room capacities as input, and outputs a collision-free weekly timetable using basic heuristic or constraint-satisfaction algorithms."},
	{"sycet011m", "Student Grievance Redressal Tracker", "Web App, Database", "Standard", "Design a ticketing system for students to report issues related to hostels, academics, or infrastructure. Implement role-based dashboards for administrators to update the status of tickets and notify students."},
	{"sycet012m", "Local Bus Tracking via Crowdsourcing", "Mobile App, GPS", "Standard", "Develop an app that allows students riding the college bus to share their live location. Other waiting students can view the bus's real-time position on a map without needing expensive GPS hardware on the bus itself."},
	{"sycet013m", "Peer-to-Peer Academic Resource Hub", "Web App, Cloud Storage", "Standard", "Create a portal for students to upload and share notes, previous year question papers, and reference books. Add a rating system so the most helpful materials surface at the top of search results."},
	{"sycet014m", "Alumni Mentorship Matchmaker", "Full-Stack Web App", "Standard", "Build a networking platform connecting current students with college alumni. Users can filter alumni by industry or company and send requests to schedule virtual mock interviews or career guidance sessions."},
	{"sycet015m", "Lab Equipment Inventory & Booking System", "Web App, QR Codes", "Standard", "Design an inventory management system for college laboratories. Each piece of equipment gets a generated QR code; scanning it reveals its manual and allows students to issue or return the item digitally."},
	{"sycet016m", "Interactive Campus Map & Navigator", "Web/Mobile, SVG/Canvas", "Standard", "Create an interactive map of the college campus highlighting important buildings, departments, and utility areas. Implement a simple pathfinding algorithm to show the shortest walking route between two blocks."},
	{"sycet017m", "Event Management and Ticketing Dashboard", "Web App, Email API", "Standard", "Develop a portal to manage college fests and idea-thons. Organizers can list events, and students can register to receive a unique QR code ticket via email. Include an admin scanner app to verify entry."},
	{"sycet018m", "Hostel Leave and Outpass Automation", "Web App, SMS/Email API", "Standard", "Build a digital outpass system for hostel residents. Students apply for leave online, wardens approve or reject it via their dashboard, and an automated SMS is sent to parents upon approval."},
	{"sycet019m", "Crop Disease Classifier for Local Farmers", "Mobile App, ML API", "Standard", "Create a mobile app where users can upload pictures of crop leaves. Use a pre-trained image classification API to identify common diseases and display localized treatment recommendations in regional languages."},
	{"sycet020m", "Personal Finance & Split Tracker for Roommates", "Mobile App, SQLite", "Standard", "Develop an app that helps hostel students track their monthly pocket money expenses. Include a feature to easily split grocery or utility bills among roommates and keep a running balance."},
	{"sycet021m", "Automated Resume ATS Parser", "Python, NLP", "Standard", "Build a tool that extracts text from uploaded PDF resumes and categorizes the information into skills, education, and experience. Calculate a basic match score against a provided job description."},
	{"sycet022m", "Gamified Typing Tutor for Programmers", "Web App, JavaScript", "Standard", "Create a typing speed application specifically tailored for writing code. Include snippets from popular languages and provide a leaderboard to rank students by Words Per Minute (WPM) and accuracy."},
	{"sycet023m", "Smart Parking Availability Display", "IoT Integration, Web App", "Standard", "Build a software interface that simulates input from sensors in a parking lot. Display the real-time availability of parking slots on a web dashboard to guide faculty and students."},
	{"sycet024m", "Study Group Chat with Integrated Markdown", "WebSockets, Web App", "Standard", "Develop a real-time messaging application for project teams that natively supports Markdown formatting and code block highlighting in the chat, allowing students to discuss technical topics easily."},
	{"sycet025m", "AI-Based Recipe Recommender", "Python, Data Processing", "Standard", "Create a web application where users input the ingredients they currently have in their fridge, and the system queries a recipe database to suggest the best possible meals they can cook, minimizing food waste."},
	{"sycet026m", "Automated Code Evaluation Sandbox", "Node.js/Python, PDF Libs", "Standard", "Build a batch-processing tool that takes a CSV file of participant names and a template image, automatically generates personalized PDF certificates for a workshop, and emails them to the participants."},
	{"sycet027m", "Crowdsourced Pothole Reporting Platform", "Web/Mobile App, Maps API", "Standard", "Design a simple application where users can take a photo of road damage, auto-tag the GPS location, and post it to a public map viewable by local authorities for repair prioritization."},
	{"sycet028m", "Faculty Feedback and Sentiment Analyzer", "Web App, NLP", "Standard", "Create a secure, anonymous feedback system for course evaluations. Use basic sentiment analysis to summarize the qualitative comments, providing the Head of Department with an overview of student satisfaction."},
	{"sycet029m", "College Carpooling Matcher", "Mobile App, Location Services", "Standard", "Develop an app for day-scholar students commuting from similar areas. Drivers can post their route and available seats, while riders can book a spot, reducing the carbon footprint and travel costs."},
	{"sycet030m", "Digital Notice Board with Role Access", "Full-Stack Web App", "Standard", "Build a centralized digital bulletin board to replace physical notices. Department heads can post targeted announcements to specific batches, triggering push notifications to the relevant students."},
	{"sycet031m", "Mental Health & Mood Journal", "Web/Mobile App", "Standard", "Create a private journaling application that allows users to log their daily mood and activities. Provide visual graphs showing mood trends over the month and offer links to campus counseling resources."},
	{"sycet032m", "E-Waste Collection Request Portal", "Web App", "Standard", "Develop a platform for students and faculty to schedule pickups for old electronics. The system should categorize the items and notify a registered recycling partner when a critical mass of e-waste is accumulated."},
	{"sycet033m", "Multi-Language Flashcard Quizzer", "Web App, Local Storage", "Standard", "Build an interactive study tool where students can create decks of digital flashcards. Implement a spaced repetition algorithm to test them more frequently on the cards they get wrong."},
	{"sycet034m", "Blood Donor Matchmaking Network", "Web App, SMS Gateway", "Standard", "Create a localized directory of voluntary blood donors on campus. During emergencies, users can broadcast a request for a specific blood type, which alerts registered donors via SMS."},
	{"sycet035m", "Gamified Fitness Challenge Tracker", "Mobile App", "Standard", "Design an application where college clubs can host step-count or workout challenges. Users log their daily activities, earn points, and compete on a campus-wide leaderboard."},
	{"sycet036m", "Freelance Skill Bartering Platform", "Web App", "Standard", "Build a marketplace where college students can trade skills instead of money (e.g., a computer science student builds a portfolio website for a design student in exchange for logo creation)."},
	{"sycet037m", "Daily Expense & Budget Forecaster", "Web App, Charting Libraries", "Standard", "Create a financial dashboard where users input their daily spending. Use simple linear regression to project if they will exceed their monthly budget and send an alert if spending is too high."},
	{"sycet038m", "Markdown-Based Collaborative Note-Taker", "Web App, CRDTs", "Standard", "Develop a lightweight, browser-based text editor that allows a small group of students to simultaneously edit a Markdown document, instantly rendering the preview side-by-side."},
	{"sycet039m", "Fake Review Detector Plugin", "Browser Extension, API", "Standard", "Build a browser extension for e-commerce sites that scrapes the text of product reviews and uses a basic machine learning model or rule-based heuristics to flag potentially fake or bot-generated comments."},
	{"sycet040m", "Hospital OPD Queue Manager", "Web App", "Standard", "Design a lightweight queue management system for local clinics. Patients book a slot online and receive a token number, while the dashboard estimates their waiting time based on the doctor's current pace."},
	{"sycet041m", "Automated Diet Planner App", "Mobile App", "Standard", "Create an application that calculates a user's basal metabolic rate based on their age, height, and weight. It should then generate a basic weekly meal plan that hits their specific calorie and macronutrient goals."},
	{"sycet042m", "Kanban Board for Hackathon Teams", "Web App, Drag-and-Drop", "Standard", "Build a project management tool tailored for 24-hour hackathons. Include real-time drag-and-drop task columns, timer countdowns, and quick repository integration links."},
	{"sycet043m", "Local Artisan Online Storefront", "E-commerce Web App", "Standard", "Develop a multi-vendor e-commerce platform designed for local craftsmen to sell their handmade goods. Include simple inventory management, order tracking, and a clean UI."},
	{"sycet044m", "Virtual Study Room with Pomodoro Timer", "Web App", "Standard", "Create a productivity web app where users can join virtual \"rooms\" with their friends. The room features a synced Pomodoro timer, forcing everyone to focus for 25 minutes before allowing chat during the break."},
	{"sycet045m", "Interactive History Timeline Builder", "Frontend Web App", "Standard", "Build a tool for students to create rich, interactive, and scrollable multimedia timelines. Users can add dates, events, images, and descriptions, and export the timeline as a shareable web link."},
	{"sycet046m", "NGO Volunteer Task Matcher", "Web App", "Standard", "Develop a platform that connects local NGOs with college students seeking volunteer hours. NGOs can post specific tasks, and students can claim them to earn digital certificates."},
	{"sycet047m", "Code Snippet Manager and Searcher", "Desktop/Web App", "Standard", "Create an application for developers to save, tag, and organize their frequently used code snippets. Implement a fast, fuzzy-search functionality so users can retrieve the right snippet instantly."},
	{"sycet048m", "Virtual Try-On for Eyeglasses", "Web App, FaceTracking API", "Standard", "Build a lightweight web application that accesses the user's webcam and overlays 2D images of different eyeglass frames onto their face, adjusting the position based on simple facial landmark tracking."},
	{"sycet049m", "Campus WiFi Login Automator", "Desktop Script/App", "Standard", "Develop a background utility that securely stores a student's captive portal credentials and automatically logs them into the college WiFi network whenever the connection drops, eliminating manual sign-ins."},
	{"sycet050m", "Disaster Alert Broadcast Dashboard", "Web App, Notifications", "Standard", "Design a one-way communication platform for campus security. In case of emergencies, security can trigger a loud push notification and SMS alert to all registered student devices simultaneously."},
	{"sycet000C", "OPEN INNOVATION", "General", "Open", "You are able to select any statement instead of this, but the problem statement is applicable to real world problem."},
}

func initApp() {
	initOnce.Do(func() {
		godotenv.Load()
		dbURL := os.Getenv("TURSO_URL")
		dbToken := os.Getenv("TURSO_TOKEN")
		if dbURL == "" || dbToken == "" {
			log.Fatal("TURSO_URL and TURSO_TOKEN are required")
		}
		dbURL = dbURL + "?authToken=" + dbToken
		var err error
		db, err = sql.Open("libsql", dbURL)
		if err != nil {
			log.Fatal(err)
		}
		db.SetMaxOpenConns(25)
		db.SetMaxIdleConns(5)
		db.SetConnMaxLifetime(5 * time.Minute)
		if err := db.Ping(); err != nil {
			log.Println("Database connection warning:", err)
		}
		initDB()
		seedProblemStatements(db)
	})
}

func Handler(w http.ResponseWriter, req *http.Request) {
	initApp()
	if r == nil {
		r = gin.Default()
		r.Use(cors.New(cors.Config{
			AllowOrigins:     []string{"http://localhost:5173", "https://*.vercel.app"},
			AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
			AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
			ExposeHeaders:    []string{"Content-Length"},
			AllowCredentials: true,
			MaxAge:           12 * time.Hour,
		}))
		r.GET("/api/landing", getLandingData)
		r.GET("/api/problem-statements", getProblemStatements)
		auth := r.Group("/api/auth")
		{
			auth.POST("/login", handleLogin)
			auth.POST("/register", handleRegister)
		}
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
			api.GET("/admins", listAdmins)
			api.POST("/team/select-admin", selectAdmin)
			api.GET("/announcements", getAnnouncements)
			api.GET("/leaderboard", getLeaderboard)
			api.GET("/resources", getResources)
			api.GET("/problem-statements", listProblemStatements)
		}
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
	}
	r.ServeHTTP(w, req)
}

// Helpers & Handlers (Consolidated)

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func GenerateToken(userID, username, role, teamID string) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		UserID:   userID,
		Username: username,
		Role:     role,
		TeamID:   teamID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtKey)
}

func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := c.GetHeader("Authorization")
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}
		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return jwtKey, nil
		})
		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}
		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("role", claims.Role)
		c.Set("team_id", claims.TeamID)
		c.Next()
	}
}

func adminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, _ := c.Get("role")
		if role != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
			c.Abort()
			return
		}
		c.Next()
	}
}

func AnalyzeSentiment(text string) int {
	text = strings.ToLower(text)
	positive := []string{"finished", "completed", "working", "solved", "implemented", "fixed", "done", "success", "progress", "milestone", "added"}
	negative := []string{"stuck", "failed", "error", "bug", "broken", "issue", "problem", "difficult", "stopped", "slow", "nothing"}
	score := 0
	if len(text) > 100 { score += 2 }
	if len(text) > 300 { score += 2 }
	for _, w := range positive { if strings.Contains(text, w) { score += 2 } }
	for _, w := range negative { if strings.Contains(text, w) { score -= 3 } }
	if score > 10 { score = 10 }
	if score < -10 { score = -10 }
	return score
}

func seedProblemStatements(db *sql.DB) {
	for _, ps := range ProblemStatements {
		db.Exec("INSERT OR REPLACE INTO problem_statements (id, title, technology, bucket, description) VALUES (?, ?, ?, ?, ?)",
			ps.ID, ps.Title, ps.Technology, ps.Bucket, ps.Description)
	}
}

func handleLogin(c *gin.Context) {
	var input struct { Username string; Password string }
	if err := c.ShouldBindJSON(&input); err != nil { c.JSON(400, gin.H{"error": "Invalid input"}); return }
	var u struct { ID string; Password string; Role string; TeamID sql.NullString }
	err := db.QueryRow("SELECT id, password, role, team_id FROM users WHERE username = ?", input.Username).Scan(&u.ID, &u.Password, &u.Role, &u.TeamID)
	if err != nil || !CheckPasswordHash(input.Password, u.Password) {
		c.JSON(401, gin.H{"error": "Invalid credentials"})
		return
	}
	token, _ := GenerateToken(u.ID, input.Username, u.Role, u.TeamID.String)
	c.JSON(200, gin.H{"token": token, "user": gin.H{"id": u.ID, "username": input.Username, "role": u.Role, "team_id": u.TeamID.String}})
}

func handleRegister(c *gin.Context) {
	var input struct { Username string; Password string; TeamName string }
	if err := c.ShouldBindJSON(&input); err != nil { c.JSON(400, gin.H{"error": "Invalid input"}); return }
	hashed, _ := HashPassword(input.Password)
	uid, tid := uuid.New().String(), uuid.New().String()
	tx, _ := db.Begin()
	tx.Exec("INSERT INTO teams (id, name) VALUES (?, ?)", tid, input.TeamName)
	_, err := tx.Exec("INSERT INTO users (id, username, password, role, team_id) VALUES (?, ?, ?, ?, ?)", uid, input.Username, hashed, "student", tid)
	if err != nil { tx.Rollback(); c.JSON(500, gin.H{"error": "Registration failed"}); return }
	tx.Commit()
	c.JSON(201, gin.H{"message": "Registered"})
}

func getTeamDashboard(c *gin.Context) {
	teamID, _ := c.Get("team_id")
	var t struct { Name string; Progress int; Locked bool; GitRepo, AdminID, ProblemID, InnovationName, CompletedSteps sql.NullString }
	err := db.QueryRow("SELECT name, progress, locked, git_repo, admin_id, problem_id, innovation_name, completed_steps FROM teams WHERE id = ?", teamID).
		Scan(&t.Name, &t.Progress, &t.Locked, &t.GitRepo, &t.AdminID, &t.ProblemID, &t.InnovationName, &t.CompletedSteps)
	if err != nil { c.JSON(404, gin.H{"error": "Team not found"}); return }
	rows, _ := db.Query("SELECT id, username, role FROM users WHERE team_id = ?", teamID)
	defer rows.Close()
	var members []gin.H
	for rows.Next() {
		var mid, mname, mrole string
		rows.Scan(&mid, &mname, &mrole)
		members = append(members, gin.H{"id": mid, "name": mname, "role": mrole})
	}
	c.JSON(200, gin.H{
		"name": t.Name, "progress": t.Progress, "locked": t.Locked, "git_repo": t.GitRepo.String,
		"admin_id": t.AdminID.String, "problem_id": t.ProblemID.String, "innovation_name": t.InnovationName.String,
		"completed_steps": t.CompletedSteps.String, "members": members,
	})
}

func updateChecklist(c *gin.Context) {
	var input struct { CompletedSteps string; Progress int }
	if err := c.ShouldBindJSON(&input); err != nil { c.JSON(400, gin.H{"error": "Invalid input"}); return }
	teamID, _ := c.Get("team_id")
	db.Exec("UPDATE teams SET completed_steps = ?, progress = ? WHERE id = ?", input.CompletedSteps, input.Progress, teamID)
	c.JSON(200, gin.H{"message": "Updated"})
}

func getChatMessages(c *gin.Context) {
	teamID, _ := c.Get("team_id")
	role, _ := c.Get("role")
	if role == "admin" { if tid := c.Query("team_id"); tid != "" { teamID = tid } }
	db.Exec("DELETE FROM messages WHERE created_at < datetime('now', '-1 day')")
	rows, _ := db.Query("SELECT username, COALESCE(role, 'student'), content, created_at FROM messages WHERE team_id = ? ORDER BY created_at ASC LIMIT 100", teamID)
	defer rows.Close()
	var msgs []gin.H
	for rows.Next() {
		var u, r, cnt, t string
		rows.Scan(&u, &r, &cnt, &t)
		msgs = append(msgs, gin.H{"username": u, "role": r, "content": cnt, "time": t})
	}
	c.JSON(200, msgs)
}

func sendMessage(c *gin.Context) {
	var input struct { Content string; TeamID string }
	c.ShouldBindJSON(&input)
	teamID, _ := c.Get("team_id")
	userID, _ := c.Get("user_id")
	username, _ := c.Get("username")
	role, _ := c.Get("role")
	if role == "admin" && input.TeamID != "" { teamID = input.TeamID }
	db.Exec("INSERT INTO messages (team_id, user_id, username, role, content) VALUES (?, ?, ?, ?, ?)", teamID, userID, username, role, input.Content)
	c.JSON(200, gin.H{"message": "Sent"})
}

func submitGitRepo(c *gin.Context) {
	var input struct { RepoURL string }
	c.ShouldBindJSON(&input)
	teamID, _ := c.Get("team_id")
	db.Exec("UPDATE teams SET git_repo = ? WHERE id = ?", input.RepoURL, teamID)
	c.JSON(200, gin.H{"message": "Submitted"})
}

func getKanbanTasks(c *gin.Context) {
	teamID, _ := c.Get("team_id")
	rows, _ := db.Query("SELECT id, content, col FROM kanban_tasks WHERE team_id = ?", teamID)
	defer rows.Close()
	var tasks []gin.H
	for rows.Next() {
		var id, cnt, col string
		rows.Scan(&id, &cnt, &col)
		tasks = append(tasks, gin.H{"id": id, "content": cnt, "col": col})
	}
	c.JSON(200, tasks)
}

func updateKanbanTask(c *gin.Context) {
	var input struct { ID, Content, Col string }
	c.ShouldBindJSON(&input)
	teamID, _ := c.Get("team_id")
	db.Exec("INSERT OR REPLACE INTO kanban_tasks (id, team_id, content, col) VALUES (?, ?, ?, ?)", input.ID, teamID, input.Content, input.Col)
	c.JSON(200, gin.H{"message": "Updated"})
}

func deleteKanbanTask(c *gin.Context) {
	var input struct { ID string }
	c.ShouldBindJSON(&input)
	teamID, _ := c.Get("team_id")
	db.Exec("DELETE FROM kanban_tasks WHERE id = ? AND team_id = ?", input.ID, teamID)
	c.JSON(200, gin.H{"message": "Deleted"})
}

func getLandingData(c *gin.Context) {
	var d struct { Participants, Teams int; PrizePool string; Schedule []gin.H }
	db.QueryRow("SELECT COUNT(*) FROM users WHERE role = 'student'").Scan(&d.Participants)
	db.QueryRow("SELECT COUNT(*) FROM teams").Scan(&d.Teams)
	db.QueryRow("SELECT value FROM event_settings WHERE key = 'prize_pool'").Scan(&d.PrizePool)
	rows, _ := db.Query("SELECT time, label FROM schedule ORDER BY order_index ASC")
	defer rows.Close()
	for rows.Next() {
		var t, l string
		rows.Scan(&t, &l)
		d.Schedule = append(d.Schedule, gin.H{"time": t, "label": l})
	}
	c.JSON(200, d)
}

func getAdminStats(c *gin.Context) {
	var s struct { TotalTeams, AvgProgress, SubmittedCount int }
	db.QueryRow("SELECT COUNT(*) FROM teams").Scan(&s.TotalTeams)
	db.QueryRow("SELECT AVG(progress) FROM teams").Scan(&s.AvgProgress)
	db.QueryRow("SELECT COUNT(*) FROM teams WHERE git_repo IS NOT NULL").Scan(&s.SubmittedCount)
	c.JSON(200, s)
}

func listTeams(c *gin.Context) {
	rows, _ := db.Query("SELECT id, name, locked, progress, git_repo, admin_id, problem_id, innovation_name FROM teams")
	defer rows.Close()
	var teams []gin.H
	for rows.Next() {
		var id, name, git, adm, prob, inn sql.NullString
		var l bool; var p int
		rows.Scan(&id, &name, &l, &p, &git, &adm, &prob, &inn)
		mRows, _ := db.Query("SELECT id, username FROM users WHERE team_id = ?", id.String)
		var members []gin.H
		for mRows.Next() {
			var mid, mun string; mRows.Scan(&mid, &mun)
			members = append(members, gin.H{"id": mid, "username": mun})
		}
		mRows.Close()
		teams = append(teams, gin.H{"id": id.String, "name": name.String, "locked": l, "progress": p, "git_repo": git.String, "admin_id": adm.String, "problem_id": prob.String, "innovation_name": inn.String, "members": members})
	}
	c.JSON(200, teams)
}

func updateTeam(c *gin.Context) {
	var input struct { ID, Name, Password, GitRepo, ProblemID, InnovationName string; Members []struct{ ID, Username string } }
	c.ShouldBindJSON(&input)
	var currPass string
	db.QueryRow("SELECT password FROM teams WHERE id = ?", input.ID).Scan(&currPass)
	finalPass := currPass
	if input.Password != "" { finalPass, _ = HashPassword(input.Password) }
	tx, _ := db.Begin()
	tx.Exec("UPDATE teams SET name = ?, password = ?, git_repo = ?, problem_id = ?, innovation_name = ? WHERE id = ?", input.Name, finalPass, input.GitRepo, input.ProblemID, input.InnovationName, input.ID)
	for _, m := range input.Members {
		if m.ID == "" {
			tx.Exec("INSERT INTO users (id, username, password, role, team_id) VALUES (?, ?, ?, ?, ?)", uuid.New().String(), m.Username, finalPass, "student", input.ID)
		} else {
			if input.Password != "" { tx.Exec("UPDATE users SET username = ?, password = ? WHERE id = ?", m.Username, finalPass, m.ID) } else { tx.Exec("UPDATE users SET username = ? WHERE id = ?", m.Username, m.ID) }
		}
	}
	tx.Commit()
	c.JSON(200, gin.H{"message": "Updated"})
}

func deleteTeam(c *gin.Context) {
	var input struct { ID string }
	c.ShouldBindJSON(&input)
	tx, _ := db.Begin()
	tx.Exec("DELETE FROM users WHERE team_id = ?", input.ID)
	tx.Exec("DELETE FROM kanban_tasks WHERE team_id = ?", input.ID)
	tx.Exec("DELETE FROM messages WHERE team_id = ?", input.ID)
	tx.Exec("DELETE FROM teams WHERE id = ?", input.ID)
	tx.Commit()
	c.JSON(200, gin.H{"message": "Deleted"})
}

func lockTeam(c *gin.Context) {
	var input struct { TeamID string }
	c.ShouldBindJSON(&input)
	db.Exec("UPDATE teams SET locked = 1 WHERE id = ?", input.TeamID)
	c.JSON(200, gin.H{"message": "Locked"})
}

func unlockTeam(c *gin.Context) {
	var input struct { TeamID string }
	c.ShouldBindJSON(&input)
	db.Exec("UPDATE teams SET locked = 0 WHERE id = ?", input.TeamID)
	c.JSON(200, gin.H{"message": "Unlocked"})
}

func setTeamProgress(c *gin.Context) {
	var input struct { TeamID string; Progress int }
	c.ShouldBindJSON(&input)
	db.Exec("UPDATE teams SET progress = ? WHERE id = ?", input.Progress, input.TeamID)
	c.JSON(200, gin.H{"message": "Updated"})
}

func listAdmins(c *gin.Context) {
	rows, _ := db.Query("SELECT id, username, created_at, COALESCE(email, ''), COALESCE(mobile, ''), is_mentor FROM users WHERE role = 'admin'")
	defer rows.Close()
	var admins []gin.H
	for rows.Next() {
		var id, un, ca, em, mo string; var isM bool
		rows.Scan(&id, &un, &ca, &em, &mo, &isM)
		admins = append(admins, gin.H{"id": id, "username": un, "created_at": ca, "email": em, "mobile": mo, "is_mentor": isM})
	}
	c.JSON(200, admins)
}

func addAdmin(c *gin.Context) {
	var input struct { Username, Password, Email, Mobile string; IsMentor bool }
	c.ShouldBindJSON(&input)
	hashed, _ := HashPassword(input.Password)
	db.Exec("INSERT INTO users (id, username, password, role, email, mobile, is_mentor) VALUES (?, ?, ?, ?, ?, ?, ?)", uuid.New().String(), input.Username, hashed, "admin", input.Email, input.Mobile, input.IsMentor)
	c.JSON(201, gin.H{"message": "Created"})
}

func updateAdmin(c *gin.Context) {
	var input struct { ID, Username, Password, Email, Mobile string; IsMentor bool }
	c.ShouldBindJSON(&input)
	if input.Password != "" {
		h, _ := HashPassword(input.Password)
		db.Exec("UPDATE users SET username = ?, password = ?, email = ?, mobile = ?, is_mentor = ? WHERE id = ?", input.Username, h, input.Email, input.Mobile, input.IsMentor, input.ID)
	} else {
		db.Exec("UPDATE users SET username = ?, email = ?, mobile = ?, is_mentor = ? WHERE id = ?", input.Username, input.Email, input.Mobile, input.IsMentor, input.ID)
	}
	c.JSON(200, gin.H{"message": "Updated"})
}

func deleteAdmin(c *gin.Context) {
	var input struct { ID string }
	c.ShouldBindJSON(&input)
	db.Exec("DELETE FROM users WHERE id = ? AND role = 'admin'", input.ID)
	c.JSON(200, gin.H{"message": "Deleted"})
}

func createTeam(c *gin.Context) {
	var input struct { Name, Password, AdminID, ProblemID, InnovationName string; Members []struct{ Name, Email string } }
	c.ShouldBindJSON(&input)
	tid := uuid.New().String(); hashed, _ := HashPassword(input.Password)
	tx, _ := db.Begin()
	tx.Exec("INSERT INTO teams (id, name, password, admin_id, problem_id, innovation_name) VALUES (?, ?, ?, ?, ?, ?)", tid, input.Name, hashed, input.AdminID, input.ProblemID, input.InnovationName)
	for _, m := range input.Members { tx.Exec("INSERT INTO users (id, username, password, role, team_id) VALUES (?, ?, ?, ?, ?)", uuid.New().String(), m.Email, hashed, "student", tid) }
	tx.Commit()
	c.JSON(201, gin.H{"message": "Created"})
}

func assignAdmin(c *gin.Context) {
	var input struct { TeamID, AdminID string }; c.ShouldBindJSON(&input)
	db.Exec("UPDATE teams SET admin_id = ? WHERE id = ?", input.AdminID, input.TeamID)
	c.JSON(200, gin.H{"message": "Assigned"})
}

func selectAdmin(c *gin.Context) {
	var input struct { AdminID string }; c.ShouldBindJSON(&input)
	teamID, _ := c.Get("team_id")
	db.Exec("UPDATE teams SET admin_id = ? WHERE id = ?", input.AdminID, teamID)
	c.JSON(200, gin.H{"message": "Selected"})
}

func getLeaderboard(c *gin.Context) {
	rows, _ := db.Query("SELECT name, progress, problem_id, innovation_name FROM teams ORDER BY progress DESC, name ASC")
	defer rows.Close()
	var lb []gin.H
	for rows.Next() {
		var n, p, i sql.NullString; var pr int; rows.Scan(&n, &pr, &p, &i)
		lb = append(lb, gin.H{"name": n.String, "progress": pr, "problem_id": p.String, "innovation_name": i.String})
	}
	c.JSON(200, lb)
}

func addAnnouncement(c *gin.Context) {
	var input struct { Content, Type string }; c.ShouldBindJSON(&input)
	db.Exec("INSERT INTO announcements (content, type) VALUES (?, ?)", input.Content, input.Type)
	c.JSON(200, gin.H{"message": "Posted"})
}

func getAnnouncements(c *gin.Context) {
	rows, _ := db.Query("SELECT content, type, created_at FROM announcements ORDER BY created_at DESC LIMIT 5")
	defer rows.Close()
	var items []gin.H
	for rows.Next() {
		var cnt, tp, ca string; rows.Scan(&cnt, &tp, &ca); items = append(items, gin.H{"content": cnt, "type": tp, "created_at": ca})
	}
	c.JSON(200, items)
}

func listProblemStatements(c *gin.Context) {
	rows, _ := db.Query("SELECT id, title, technology, bucket, description FROM problem_statements")
	defer rows.Close()
	var list []gin.H
	for rows.Next() {
		var id, t, te, b, d string; rows.Scan(&id, &t, &te, &b, &d)
		list = append(list, gin.H{"id": id, "title": t, "technology": te, "bucket": b, "description": d})
	}
	c.JSON(200, list)
}

func getResources(c *gin.Context) {
	rows, _ := db.Query("SELECT id, title, url, description FROM resources ORDER BY created_at DESC")
	defer rows.Close()
	var items []gin.H
	for rows.Next() {
		var id int; var t, u, d string; rows.Scan(&id, &t, &u, &d); items = append(items, gin.H{"id": id, "title": t, "url": u, "description": d})
	}
	c.JSON(200, items)
}

func addResource(c *gin.Context) {
	var input struct { Title, URL, Description string }; c.ShouldBindJSON(&input)
	db.Exec("INSERT INTO resources (title, url, description) VALUES (?, ?, ?)", input.Title, input.URL, input.Description)
	c.JSON(200, gin.H{"message": "Added"})
}

func deleteResource(c *gin.Context) {
	var input struct { ID int }; c.ShouldBindJSON(&input)
	db.Exec("DELETE FROM resources WHERE id = ?", input.ID)
	c.JSON(200, gin.H{"message": "Deleted"})
}

func updateSettings(c *gin.Context) {
	var input struct { PrizePool string }; c.ShouldBindJSON(&input)
	db.Exec("INSERT OR REPLACE INTO event_settings (key, value) VALUES ('prize_pool', ?)", input.PrizePool)
	c.JSON(200, gin.H{"message": "Updated"})
}

func updateSchedule(c *gin.Context) {
	var input []struct { Time, Label string }; c.ShouldBindJSON(&input)
	tx, _ := db.Begin()
	tx.Exec("DELETE FROM schedule")
	for i, s := range input { tx.Exec("INSERT INTO schedule (time, label, order_index) VALUES (?, ?, ?)", s.Time, s.Label, i) }
	tx.Commit()
	c.JSON(200, gin.H{"message": "Updated"})
}

func initDB() {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE, password TEXT, role TEXT, team_id TEXT, email TEXT, mobile TEXT, is_mentor BOOLEAN DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
		`CREATE TABLE IF NOT EXISTS teams (id TEXT PRIMARY KEY, name TEXT UNIQUE, password TEXT, admin_id TEXT, problem_id TEXT, innovation_name TEXT, completed_steps TEXT, locked BOOLEAN DEFAULT 0, progress INTEGER DEFAULT 0, git_repo TEXT)`,
		`CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, team_id TEXT, user_id TEXT, username TEXT, role TEXT, content TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
		`CREATE TABLE IF NOT EXISTS kanban_tasks (id TEXT PRIMARY KEY, team_id TEXT, content TEXT, col TEXT)`,
		`CREATE TABLE IF NOT EXISTS problem_statements (id TEXT PRIMARY KEY, title TEXT, technology TEXT, bucket TEXT, description TEXT)`,
		`CREATE TABLE IF NOT EXISTS announcements (id INTEGER PRIMARY KEY AUTOINCREMENT, content TEXT, type TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
		`CREATE TABLE IF NOT EXISTS resources (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, url TEXT, description TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
		`CREATE TABLE IF NOT EXISTS event_settings (key TEXT PRIMARY KEY, value TEXT)`,
		`CREATE TABLE IF NOT EXISTS schedule (time TEXT, label TEXT, order_index INTEGER)`,
	}
	for _, q := range queries { db.Exec(q) }
	db.Exec("INSERT OR IGNORE INTO event_settings (key, value) VALUES ('prize_pool', '₹2L')")
}
