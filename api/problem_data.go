package handler

import (
	"database/sql"
	"log"
)

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
	{"sycet026m", "Automated Certificate Generator", "Node.js/Python, PDF Libs", "Standard", "Build a batch-processing tool that takes a CSV file of participant names and a template image, automatically generates personalized PDF certificates for a workshop, and emails them to the participants."},
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

func seedProblemStatements(db *sql.DB) {
	for _, ps := range ProblemStatements {
		_, err := db.Exec("INSERT OR REPLACE INTO problem_statements (id, title, technology, bucket, description) VALUES (?, ?, ?, ?, ?)",
			ps.ID, ps.Title, ps.Technology, ps.Bucket, ps.Description)
		if err != nil {
			log.Printf("Failed to seed problem statement %s: %v\n", ps.ID, err)
		}
	}
}
