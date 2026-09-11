// main.go
package main

import (
	"log"
	"net/http"

	"calculator/backend/handlers"
)

func main() {
	mux := http.NewServeMux()

	// API routes
	mux.HandleFunc("/api/calculate", withCORS(handlers.CalculatorHandler))

	// Serve the built frontend (Vite's dist/) for everything else.
	// ServeMux matches the most specific pattern first, so "/api/calculate"
	// above always takes priority over this catch-all.
	mux.Handle("/", http.FileServer(http.Dir("./static")))

	log.Println("server starting on :8080")
	if err := http.ListenAndServe(":8080", mux); err != nil {
		log.Fatal(err)
	}
}

func withCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next(w, r)
	}
}