package handler

import (
	"database/sql"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func submitGitRepo(c *gin.Context) {
	var input struct {
		RepoURL string `json:"repo_url"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	teamID, _ := c.Get("team_id")
	_, err := db.Exec("UPDATE teams SET git_repo = ? WHERE id = ?", input.RepoURL, teamID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit repository"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Repository submitted successfully"})
}

func unlockTeam(c *gin.Context) {
	var input struct {
		TeamID string `json:"team_id"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid team ID"})
		return
	}

	_, err := db.Exec("UPDATE teams SET locked = 0 WHERE id = ?", input.TeamID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unlock team"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Team unlocked"})
}

func setTeamProgress(c *gin.Context) {
	var input struct {
		TeamID   string `json:"team_id"`
		Progress int    `json:"progress"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	_, err := db.Exec("UPDATE teams SET progress = ? WHERE id = ?", input.Progress, input.TeamID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set progress"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Progress updated"})
}

func getAdminStats(c *gin.Context) {
	var stats struct {
		TotalTeams     int `json:"total_teams"`
		AvgProgress    int `json:"avg_progress"`
		SubmittedCount int `json:"submitted_count"`
	}

	db.QueryRow("SELECT COUNT(*) FROM teams").Scan(&stats.TotalTeams)
	db.QueryRow("SELECT AVG(progress) FROM teams").Scan(&stats.AvgProgress)
	db.QueryRow("SELECT COUNT(*) FROM teams WHERE git_repo IS NOT NULL").Scan(&stats.SubmittedCount)

	c.JSON(http.StatusOK, stats)
}

func lockTeam(c *gin.Context) {
	var input struct {
		TeamID string `json:"team_id"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid team ID"})
		return
	}

	_, err := db.Exec("UPDATE teams SET locked = 1 WHERE id = ?", input.TeamID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to lock team"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Team locked"})
}

func getChatMessages(c *gin.Context) {
	teamID, _ := c.Get("team_id")
	role, _ := c.Get("role")

	// Admins can specify which team's chat to view
	if role == "admin" {
		if tid := c.Query("team_id"); tid != "" {
			teamID = tid
		}
	}

	if teamID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Team ID required"})
		return
	}
	log.Printf("Fetching chat for team: %v (role: %v)\n", teamID, role)

	// Cleanup old messages (older than 24h)
	db.Exec("DELETE FROM messages WHERE created_at < datetime('now', '-1 day')")

	rows, err := db.Query("SELECT username, COALESCE(role, 'student'), content, created_at FROM messages WHERE team_id = ? ORDER BY created_at ASC LIMIT 100", teamID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch messages"})
		return
	}
	defer rows.Close()

	var messages = []gin.H{}
	for rows.Next() {
		var user, role, content, time string
		rows.Scan(&user, &role, &content, &time)
		messages = append(messages, gin.H{
			"username": user,
			"role":     role,
			"content":  content,
			"time":     time,
		})
	}

	c.JSON(http.StatusOK, messages)
}

func sendMessage(c *gin.Context) {
	var input struct {
		Content string `json:"content"`
		TeamID  string `json:"team_id"` // Optional for admins
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	teamID, _ := c.Get("team_id")
	userID, _ := c.Get("user_id")
	username, _ := c.Get("username")
	role, _ := c.Get("role")

	// Admins can send messages to a specific team
	if role == "admin" && input.TeamID != "" {
		teamID = input.TeamID
	}

	if teamID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Team ID required"})
		return
	}
	log.Printf("Sending message to team: %v from user: %s (role: %v)\n", teamID, username, role)

	_, err := db.Exec("INSERT INTO messages (team_id, user_id, username, role, content) VALUES (?, ?, ?, ?, ?)", 
		teamID, userID, username, role, input.Content)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send message"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Sent"})
}

func getLandingData(c *gin.Context) {
	var data struct {
		Participants int    `json:"participants"`
		PrizePool    string `json:"prize_pool"`
		Teams        int    `json:"teams"`
		Schedule     []gin.H `json:"schedule"`
	}

	// Dynamic counts
	db.QueryRow("SELECT COUNT(*) FROM users WHERE role = 'student'").Scan(&data.Participants)
	db.QueryRow("SELECT COUNT(*) FROM teams").Scan(&data.Teams)
	
	// Prize Pool from settings
	db.QueryRow("SELECT value FROM event_settings WHERE key = 'prize_pool'").Scan(&data.PrizePool)

	// Schedule
	rows, _ := db.Query("SELECT time, label FROM schedule ORDER BY order_index ASC")
	defer rows.Close()
	for rows.Next() {
		var t, l string
		rows.Scan(&t, &l)
		data.Schedule = append(data.Schedule, gin.H{"time": t, "label": l})
	}

	c.JSON(http.StatusOK, data)
}

func updateSettings(c *gin.Context) {
	var input struct {
		PrizePool string `json:"prize_pool"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	_, err := db.Exec("INSERT OR REPLACE INTO event_settings (key, value) VALUES ('prize_pool', ?)", input.PrizePool)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Update failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Settings updated"})
}

func updateSchedule(c *gin.Context) {
	var input []struct {
		Time  string `json:"time"`
		Label string `json:"label"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	tx, _ := db.Begin()
	tx.Exec("DELETE FROM schedule")
	for i, s := range input {
		tx.Exec("INSERT INTO schedule (time, label, order_index) VALUES (?, ?, ?)", s.Time, s.Label, i)
	}
	tx.Commit()

	c.JSON(http.StatusOK, gin.H{"message": "Schedule updated"})
}

func handleLogin(c *gin.Context) {
	var input struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		log.Println("Login bind error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	log.Printf("Login attempt for user: %s\n", input.Username)

	var user struct {
		ID       string
		Password string
		Role     string
		TeamID   sql.NullString
	}

	err := db.QueryRow("SELECT id, password, role, team_id FROM users WHERE username = ?", input.Username).
		Scan(&user.ID, &user.Password, &user.Role, &user.TeamID)

	if err != nil {
		log.Println("Login query error:", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if !CheckPasswordHash(input.Password, user.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	token, _ := GenerateToken(user.ID, input.Username, user.Role, user.TeamID.String)
	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id":      user.ID,
			"username": input.Username,
			"role":    user.Role,
			"team_id": user.TeamID.String,
		},
	})
}

func handleRegister(c *gin.Context) {
	var input struct {
		Username string `json:"username"`
		Password string `json:"password"`
		TeamName string `json:"team_name"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hashedPassword, _ := HashPassword(input.Password)
	userID := uuid.New().String()
	teamID := uuid.New().String()

	tx, _ := db.Begin()

	_, err := tx.Exec("INSERT INTO teams (id, name) VALUES (?, ?)", teamID, input.TeamName)
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create team"})
		return
	}

	_, err = tx.Exec("INSERT INTO users (id, username, password, role, team_id) VALUES (?, ?, ?, ?, ?)",
		userID, input.Username, hashedPassword, "student", teamID)
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	tx.Commit()
	c.JSON(http.StatusCreated, gin.H{"message": "Registration successful"})
}

func getTeamDashboard(c *gin.Context) {
	teamID, _ := c.Get("team_id")

	var team struct {
		Name     string `json:"name"`
		Progress int    `json:"progress"`
		Locked   bool   `json:"locked"`
		GitRepo  sql.NullString `json:"git_repo"`
		AdminID  sql.NullString `json:"admin_id"`
		ProblemID sql.NullString `json:"problem_id"`
		InnovationName sql.NullString `json:"innovation_name"`
		CompletedSteps sql.NullString `json:"completed_steps"`
	}

	err := db.QueryRow("SELECT name, progress, locked, git_repo, admin_id, problem_id, innovation_name, completed_steps FROM teams WHERE id = ?", teamID).
		Scan(&team.Name, &team.Progress, &team.Locked, &team.GitRepo, &team.AdminID, &team.ProblemID, &team.InnovationName, &team.CompletedSteps)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Team not found"})
		return
	}

	rows, _ := db.Query("SELECT id, username, role FROM users WHERE team_id = ?", teamID)
	defer rows.Close()
	var members = []gin.H{}
	for rows.Next() {
		var mid, mname, mrole string
		rows.Scan(&mid, &mname, &mrole)
		members = append(members, gin.H{"id": mid, "name": mname, "role": mrole})
	}

	c.JSON(http.StatusOK, gin.H{
		"name":     team.Name,
		"progress": team.Progress,
		"locked":   team.Locked,
		"git_repo": team.GitRepo.String,
		"admin_id": team.AdminID.String,
		"problem_id": team.ProblemID.String,
		"innovation_name": team.InnovationName.String,
		"completed_steps": team.CompletedSteps.String,
		"members":  members,
	})
}

func getProblemStatements(c *gin.Context) {
	rows, err := db.Query("SELECT id, title, technology, bucket, description FROM problem_statements")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch problem statements"})
		return
	}
	defer rows.Close()

	var statements = []gin.H{}
	for rows.Next() {
		var id, title, tech, bucket, desc string
		rows.Scan(&id, &title, &tech, &bucket, &desc)
		statements = append(statements, gin.H{
			"id":         id,
			"title":      title,
			"technology": tech,
			"bucket":     bucket,
			"description": desc,
		})
	}
	c.JSON(http.StatusOK, statements)
}

func updateChecklist(c *gin.Context) {
	var input struct {
		CompletedSteps string `json:"completed_steps"` // JSON array string
		Progress       int    `json:"progress"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	teamID, _ := c.Get("team_id")
	
	_, err := db.Exec("UPDATE teams SET completed_steps = ?, progress = ? WHERE id = ?", input.CompletedSteps, input.Progress, teamID)
	if err != nil {
		log.Println("Checklist update error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update checklist"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Checklist updated",
		"progress": input.Progress,
	})
}

func updateTeam(c *gin.Context) {
	type Member struct {
		ID       string `json:"id"`
		Username string `json:"username"`
	}
	var input struct {
		ID       string   `json:"id"`
		Name     string   `json:"name"`
		Password string   `json:"password"` // New optional password
		GitRepo  string   `json:"git_repo"`
		ProblemID string  `json:"problem_id"`
		InnovationName string `json:"innovation_name"`
		Members  []Member `json:"members"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Get current team password if not changing
	var currentPass string
	err := db.QueryRow("SELECT password FROM teams WHERE id = ?", input.ID).Scan(&currentPass)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Team not found or database error"})
		return
	}
	
	finalPass := currentPass
	var hashedPassword string
	if input.Password != "" {
		hashedPassword, _ = HashPassword(input.Password)
		finalPass = hashedPassword
	} else {
		hashedPassword = currentPass // already hashed from DB
	}

	tx, _ := db.Begin()

	_, err = tx.Exec("UPDATE teams SET name = ?, password = ?, git_repo = ?, problem_id = ?, innovation_name = ? WHERE id = ?",
		input.Name, finalPass, input.GitRepo, input.ProblemID, input.InnovationName, input.ID)
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update team"})
		return
	}

	for _, m := range input.Members {
		if m.ID == "" {
			// New member - use the team's password
			newID := uuid.New().String()
			_, err = tx.Exec("INSERT INTO users (id, username, password, role, team_id) VALUES (?, ?, ?, ?, ?)",
				newID, m.Username, hashedPassword, "student", input.ID)
		} else {
			// Existing member - only update password if it was changed
			if input.Password != "" {
				_, err = tx.Exec("UPDATE users SET username = ?, password = ? WHERE id = ? AND team_id = ?",
					m.Username, hashedPassword, m.ID, input.ID)
			} else {
				_, err = tx.Exec("UPDATE users SET username = ? WHERE id = ? AND team_id = ?",
					m.Username, m.ID, input.ID)
			}
		}
		
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update/add member " + m.Username})
			return
		}
	}

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "Team and members updated successfully"})
}

func deleteTeam(c *gin.Context) {
	var input struct {
		ID string `json:"id"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	tx, _ := db.Begin()
	// Delete users (students) in the team
	tx.Exec("DELETE FROM users WHERE team_id = ?", input.ID)
	// Delete kanban tasks
	tx.Exec("DELETE FROM kanban_tasks WHERE team_id = ?", input.ID)
	// Delete progress logs
	tx.Exec("DELETE FROM progress_logs WHERE team_id = ?", input.ID)
	// Delete messages
	tx.Exec("DELETE FROM messages WHERE team_id = ?", input.ID)
	// Delete the team itself
	_, err := tx.Exec("DELETE FROM teams WHERE id = ?", input.ID)
	
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete team"})
		return
	}

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "Team deleted successfully"})
}

func listAdmins(c *gin.Context) {
	rows, err := db.Query("SELECT id, username, created_at, COALESCE(email, ''), COALESCE(mobile, ''), is_mentor FROM users WHERE role = 'admin'")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch admins"})
		return
	}
	defer rows.Close()

	var admins = []gin.H{}
	for rows.Next() {
		var id, username, createdAt, email, mobile string
		var isMentor bool
		rows.Scan(&id, &username, &createdAt, &email, &mobile, &isMentor)
		admins = append(admins, gin.H{
			"id":         id,
			"username":   username,
			"created_at": createdAt,
			"email":      email,
			"mobile":     mobile,
			"is_mentor":  isMentor,
		})
	}
	c.JSON(http.StatusOK, admins)
}

func addAdmin(c *gin.Context) {
	var input struct {
		Username string `json:"username"`
		Password string `json:"password"`
		Email    string `json:"email"`
		Mobile   string `json:"mobile"`
		IsMentor bool   `json:"is_mentor"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	hashedPassword, _ := HashPassword(input.Password)
	userID := uuid.New().String()

	_, err := db.Exec("INSERT INTO users (id, username, password, role, email, mobile, is_mentor) VALUES (?, ?, ?, ?, ?, ?, ?)",
		userID, input.Username, hashedPassword, "admin", input.Email, input.Mobile, input.IsMentor)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create admin user"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Admin user created successfully"})
}

func updateAdmin(c *gin.Context) {
	var input struct {
		ID       string `json:"id"`
		Username string `json:"username"`
		Password string `json:"password"` // optional
		Email    string `json:"email"`
		Mobile   string `json:"mobile"`
		IsMentor bool   `json:"is_mentor"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	if input.Password != "" {
		hashedPassword, _ := HashPassword(input.Password)
		_, err := db.Exec("UPDATE users SET username = ?, password = ?, email = ?, mobile = ?, is_mentor = ? WHERE id = ?",
			input.Username, hashedPassword, input.Email, input.Mobile, input.IsMentor, input.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Update failed"})
			return
		}
	} else {
		_, err := db.Exec("UPDATE users SET username = ?, email = ?, mobile = ?, is_mentor = ? WHERE id = ?",
			input.Username, input.Email, input.Mobile, input.IsMentor, input.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Update failed"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Admin updated successfully"})
}

func deleteAdmin(c *gin.Context) {
	var input struct {
		ID string `json:"id"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Prevent deleting the last admin if necessary, but here we just allow it
	_, err := db.Exec("DELETE FROM users WHERE id = ? AND role = 'admin'", input.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete admin"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Admin deleted successfully"})
}

func createTeam(c *gin.Context) {
	type Member struct {
		Name  string `json:"name"`
		Email string `json:"email"`
	}
	var input struct {
		Name     string   `json:"name"`
		Password string   `json:"password"`
		AdminID  string   `json:"admin_id"`
		ProblemID string  `json:"problem_id"`
		InnovationName string `json:"innovation_name"`
		Members  []Member `json:"members"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	teamID := uuid.New().String()
	hashedPassword, _ := HashPassword(input.Password)

	tx, _ := db.Begin()

	_, err := tx.Exec("INSERT INTO teams (id, name, password, admin_id, problem_id, innovation_name) VALUES (?, ?, ?, ?, ?, ?)",
		teamID, input.Name, hashedPassword, input.AdminID, input.ProblemID, input.InnovationName)
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create team: " + err.Error()})
		return
	}

	for _, m := range input.Members {
		userID := uuid.New().String()
		_, err = tx.Exec("INSERT INTO users (id, username, password, role, team_id) VALUES (?, ?, ?, ?, ?)",
			userID, m.Email, hashedPassword, "student", teamID)
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create account for " + m.Email})
			return
		}
	}

	tx.Commit()
	c.JSON(http.StatusCreated, gin.H{"message": "Team and participant accounts created successfully"})
}

func assignAdmin(c *gin.Context) {
	var input struct {
		TeamID  string `json:"team_id"`
		AdminID string `json:"admin_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Optional: Verify admin exists
	if input.AdminID != "" {
		var exists int
		db.QueryRow("SELECT COUNT(*) FROM users WHERE id = ? AND role = 'admin'", input.AdminID).Scan(&exists)
		if exists == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Admin not found or invalid role"})
			return
		}
	}

	res, err := db.Exec("UPDATE teams SET admin_id = ? WHERE id = ?", input.AdminID, input.TeamID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign admin: " + err.Error()})
		return
	}

	rows, _ := res.RowsAffected()
	if rows == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Team not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Admin assigned successfully"})
}

func selectAdmin(c *gin.Context) {
	var input struct {
		AdminID string `json:"admin_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	teamID, _ := c.Get("team_id")
	if teamID == "" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only students in a team can select a mentor"})
		return
	}

	// Verify admin exists
	var exists int
	db.QueryRow("SELECT COUNT(*) FROM users WHERE id = ? AND role = 'admin'", input.AdminID).Scan(&exists)
	if exists == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Mentor not found"})
		return
	}

	_, err := db.Exec("UPDATE teams SET admin_id = ? WHERE id = ?", input.AdminID, teamID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to select mentor"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Mentor selected successfully"})
}

func listTeams(c *gin.Context) {
	rows, err := db.Query("SELECT id, name, locked, progress, git_repo, admin_id, problem_id, innovation_name FROM teams")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch teams"})
		return
	}
	defer rows.Close()

	var teams = []gin.H{}
	for rows.Next() {
		var id, name, gitRepo, adminID, problemID, innovationName sql.NullString
		var locked bool
		var progress int
		rows.Scan(&id, &name, &locked, &progress, &gitRepo, &adminID, &problemID, &innovationName)
		
		// Fetch members for this team
		mRows, _ := db.Query("SELECT id, username FROM users WHERE team_id = ?", id.String)
		var members = []gin.H{}
		for mRows.Next() {
			var mid, mname string
			mRows.Scan(&mid, &mname)
			members = append(members, gin.H{"id": mid, "username": mname})
		}
		mRows.Close()

		teams = append(teams, gin.H{
			"id":       id.String,
			"name":     name.String,
			"locked":   locked,
			"progress": progress,
			"git_repo": gitRepo.String,
			"admin_id": adminID.String,
			"problem_id": problemID.String,
			"innovation_name": innovationName.String,
			"members":  members,
		})
	}
	c.JSON(http.StatusOK, teams)
}
func getKanbanTasks(c *gin.Context) {
	teamID, _ := c.Get("team_id")
	rows, err := db.Query("SELECT id, content, col FROM kanban_tasks WHERE team_id = ?", teamID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tasks"})
		return
	}
	defer rows.Close()

	var tasks = []gin.H{}
	for rows.Next() {
		var id, content, col string
		rows.Scan(&id, &content, &col)
		tasks = append(tasks, gin.H{"id": id, "content": content, "col": col})
	}
	c.JSON(http.StatusOK, tasks)
}

func updateKanbanTask(c *gin.Context) {
	var input struct {
		ID      string `json:"id"`
		Content string `json:"content"`
		Col     string `json:"col"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	teamID, _ := c.Get("team_id")
	_, err := db.Exec("INSERT OR REPLACE INTO kanban_tasks (id, team_id, content, col) VALUES (?, ?, ?, ?)",
		input.ID, teamID, input.Content, input.Col)
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update task"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Task updated"})
}

func deleteKanbanTask(c *gin.Context) {
	var input struct {
		ID string `json:"id"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	teamID, _ := c.Get("team_id")
	_, err := db.Exec("DELETE FROM kanban_tasks WHERE id = ? AND team_id = ?", input.ID, teamID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete task"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Task deleted"})
}

func getLeaderboard(c *gin.Context) {
	rows, err := db.Query("SELECT name, progress, problem_id, innovation_name FROM teams ORDER BY progress DESC, name ASC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch leaderboard"})
		return
	}
	defer rows.Close()

	var leaderboard = []gin.H{}
	for rows.Next() {
		var name, problemID, innovation sql.NullString
		var progress int
		rows.Scan(&name, &progress, &problemID, &innovation)
		leaderboard = append(leaderboard, gin.H{
			"name":            name.String,
			"progress":        progress,
			"problem_id":      problemID.String,
			"innovation_name": innovation.String,
		})
	}
	c.JSON(http.StatusOK, leaderboard)
}

func addAnnouncement(c *gin.Context) {
	var input struct {
		Content string `json:"content"`
		Type    string `json:"type"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	_, err := db.Exec("INSERT INTO announcements (content, type) VALUES (?, ?)", input.Content, input.Type)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to post announcement"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Announcement posted"})
}

func getAnnouncements(c *gin.Context) {
	rows, err := db.Query("SELECT content, type, created_at FROM announcements ORDER BY created_at DESC LIMIT 5")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch announcements"})
		return
	}
	defer rows.Close()

	var items = []gin.H{}
	for rows.Next() {
		var content, atype, createdAt string
		rows.Scan(&content, &atype, &createdAt)
		items = append(items, gin.H{"content": content, "type": atype, "created_at": createdAt})
	}
	c.JSON(http.StatusOK, items)
}

func listProblemStatements(c *gin.Context) {
	rows, err := db.Query("SELECT id, title, technology, bucket, description FROM problem_statements")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch problem statements"})
		return
	}
	defer rows.Close()

	var list = []gin.H{}
	for rows.Next() {
		var id, title, tech, bucket, desc string
		rows.Scan(&id, &title, &tech, &bucket, &desc)
		list = append(list, gin.H{
			"id":          id,
			"title":       title,
			"technology":  tech,
			"bucket":      bucket,
			"description": desc,
		})
	}
	c.JSON(http.StatusOK, list)
}

func getResources(c *gin.Context) {
	rows, err := db.Query("SELECT id, title, url, description FROM resources ORDER BY created_at DESC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch resources"})
		return
	}
	defer rows.Close()

	var items = []gin.H{}
	for rows.Next() {
		var id int
		var title, url, desc string
		rows.Scan(&id, &title, &url, &desc)
		items = append(items, gin.H{"id": id, "title": title, "url": url, "description": desc})
	}
	c.JSON(http.StatusOK, items)
}

func addResource(c *gin.Context) {
	var input struct {
		Title       string `json:"title"`
		URL         string `json:"url"`
		Description string `json:"description"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	_, err := db.Exec("INSERT INTO resources (title, url, description) VALUES (?, ?, ?)", input.Title, input.URL, input.Description)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add resource"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Resource added"})
}

func deleteResource(c *gin.Context) {
	var input struct {
		ID int `json:"id"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	_, err := db.Exec("DELETE FROM resources WHERE id = ?", input.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete resource"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Resource deleted"})
}
