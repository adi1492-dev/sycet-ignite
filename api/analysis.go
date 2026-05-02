package handler

import (
	"strings"
)

// AnalyzeSentiment performs a lightweight analysis of progress text
// Returns a score between -10 and 10
func AnalyzeSentiment(text string) int {
	text = strings.ToLower(text)
	
	positiveWords := []string{
		"finished", "completed", "working", "solved", "implemented", 
		"fixed", "done", "success", "progress", "milestone", "added",
	}
	
	negativeWords := []string{
		"stuck", "failed", "error", "bug", "broken", "issue", 
		"problem", "difficult", "stopped", "slow", "nothing",
	}

	score := 0
	
	// Reward for length (effort)
	if len(text) > 100 {
		score += 2
	}
	if len(text) > 300 {
		score += 2
	}

	// Keyword matching
	for _, word := range positiveWords {
		if strings.Contains(text, word) {
			score += 2
		}
	}

	for _, word := range negativeWords {
		if strings.Contains(text, word) {
			score -= 3
		}
	}

	// Cap the score
	if score > 10 {
		score = 10
	}
	if score < -10 {
		score = -10
	}

	return score
}
