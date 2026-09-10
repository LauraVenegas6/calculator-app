package main

import (
	"log"
	"net/http"

	"calculator/backend/handlers"
)

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/calculate", handlers.CalculatorHandler)

	log.Println("server starting on :8080")
	if err := http.ListenAndServe(":8080", mux); err != nil {
		log.Fatal(err)
	}
}
