package main

import (
	"log"
	"net/http"
	"os"
	"hackathon-server/api"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Local server starting on port %s...", port)
	
	// Use the Handler from the api package
	if err := http.ListenAndServe(":"+port, http.HandlerFunc(handler.Handler)); err != nil {
		log.Fatal(err)
	}
}
