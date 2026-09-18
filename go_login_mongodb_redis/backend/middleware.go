package main

import (
	"context"
	"net/http"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

func sessionUserID(w http.ResponseWriter, r *http.Request) (bson.ObjectID, context.Context, context.CancelFunc, bool) {
	cookie, err := r.Cookie("session_id")
	if err != nil { errorJSON(w, http.StatusUnauthorized, "not logged in"); return bson.NilObjectID, nil, nil, false }
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	userID, err := rdb.Get(ctx, "session:"+cookie.Value).Result()
	if err != nil { cancel(); errorJSON(w, http.StatusUnauthorized, "session expired or invalid"); return bson.NilObjectID, nil, nil, false }
	objectID, err := bson.ObjectIDFromHex(userID)
	if err != nil { cancel(); errorJSON(w, http.StatusUnauthorized, "invalid session"); return bson.NilObjectID, nil, nil, false }
	return objectID, ctx, cancel, true
}

func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := os.Getenv("CORS_ORIGIN")
		if origin == "" {
			origin = "http://localhost:5500"
		}
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}