package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
	"github.com/redis/go-redis/v9"
	"github.com/rs/cors"
)

type Message struct {
	ChannelName string `json:"channelName"`
	UserName    string `json:"userName"`
	Message     string `json:"message"`
}
type ChatHistory struct {
	Sender  string `json:"sender"`
	Message string `json:"message"`
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}
var redisClient *redis.Client
var ctx = context.Background()

func initRedis() {
	redisClient = redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
		DB:       0,
	})
	if _, err := redisClient.Ping(ctx).Result(); err != nil {
		log.Fatal("Failed to connect to redis", err)
	}
}

func addChannel(w http.ResponseWriter, r *http.Request) {
	userName := r.URL.Query().Get("userName")
	channelName := r.URL.Query().Get("channelName")
	key := "channel:" + channelName
	exists, _ := redisClient.Exists(ctx, key).Result()
	if exists == 1 {
		http.Error(w, "Channel already exists", http.StatusBadRequest)
		return
	}
	_, _ = redisClient.HSet(ctx, key, "creator", userName, "createdOn", time.Now()).Result()
	key = "channelSet:" + channelName + ":users"
	_, _ = redisClient.SAdd(ctx, key, userName).Result()
	key = "user:" + userName + ":channels"
	_, _ = redisClient.SAdd(ctx, key, channelName).Result()
	w.WriteHeader(http.StatusOK)
}

func loadPage(w http.ResponseWriter, r *http.Request) {
	userName := r.URL.Query().Get("userName")
	key := "user:" + userName + ":channels"
	channels, _ := redisClient.SMembers(ctx, key).Result()
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(channels)
}

func addUser(w http.ResponseWriter, r *http.Request) {
	channelName := r.URL.Query().Get("channelName")
	userName := r.URL.Query().Get("userName")
	key := "channelSet:" + channelName + ":users"
	_, err := redisClient.Exists(ctx, key).Result()
	if err != nil {
		http.Error(w, "Channel does not exist", http.StatusBadRequest)
		return
	}
	isMember, err := redisClient.SIsMember(ctx, key, userName).Result()
	if err != nil {
		http.Error(w, "Failed to check if user is member of channel", http.StatusInternalServerError)
		return
	}
	if !isMember {
		_, err := redisClient.SAdd(ctx, key, userName).Result()
		if err != nil {
			http.Error(w, "Failed to add user to channel", http.StatusInternalServerError)
			return
		}
		key = "user:" + userName + ":channels"
		_, err = redisClient.SAdd(ctx, key, channelName).Result()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	} else {
		http.Error(w, "User is already a member of the channel", http.StatusBadRequest)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func getUsersInChannel(w http.ResponseWriter, r *http.Request) {
	channelName := r.URL.Query().Get("channelName")
	key := "channelSet:" + channelName + ":users"
	users, _ := redisClient.SMembers(ctx, key).Result()
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(users)
}

func getChatHistory(w http.ResponseWriter, r *http.Request) {
	channelName := r.URL.Query().Get("channelName")
	messages, _ := redisClient.LRange(ctx, "messages:"+channelName, 0, -1).Result()
	senders, _ := redisClient.LRange(ctx, "senders:"+channelName, 0, -1).Result()
	var history []ChatHistory
	for i := range messages {
		history = append(history, ChatHistory{
			Sender:  senders[i],
			Message: messages[i],
		})
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(history)
}

func leaveChannel(w http.ResponseWriter, r *http.Request) {
	channelName := r.URL.Query().Get("channelName")
	userName := r.URL.Query().Get("userName")
	key := "channelSet:" + channelName + ":users"
	_, err := redisClient.SRem(ctx, key, userName).Result()
	if err != nil {
		http.Error(w, "Failed to remove user from channel", http.StatusInternalServerError)
		return
	}
	key = "user:" + userName + ":channels"
	_, err = redisClient.SRem(ctx, key, channelName).Result()
	if err != nil {
		http.Error(w, "Failed to remove channel from user", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func handlewebsockets(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}

	sub := redisClient.Subscribe(ctx, "chat_channel")
	defer sub.Close()
	ch := sub.Channel()

	go func() {
		for {
			_, msg, err := conn.ReadMessage()
			if err != nil {
				return
			}
			var decodedMsg Message
			json.Unmarshal(msg, &decodedMsg)

			_ = redisClient.RPush(ctx, "messages:"+decodedMsg.ChannelName,
				decodedMsg.Message).Err()

			_ = redisClient.RPush(ctx, "senders:"+decodedMsg.ChannelName,
				decodedMsg.UserName).Err()

			mp := map[string]string{
				"channel": decodedMsg.ChannelName,
				"msg":     decodedMsg.Message,
				"sender":  decodedMsg.UserName,
			}
			msgJson, _ := json.Marshal(mp)
			if err := redisClient.Publish(ctx, "chat_channel", msgJson).Err(); err != nil {
				log.Println("Error publishing message to redis")
				return
			}
		}
	}()

	for msg := range ch {
		if err := conn.WriteMessage(websocket.TextMessage, []byte(msg.Payload)); err != nil {
			log.Println("Error writing message to websocket")
			return
		}
	}
}

func main() {
	initRedis()
	http.HandleFunc("/wsserver", handlewebsockets)
	http.HandleFunc("/loadPage", loadPage)
	http.HandleFunc("/addChannel", addChannel)
	http.HandleFunc("/addUser", addUser)
	http.HandleFunc("/getUsersInChannel", getUsersInChannel)
	http.HandleFunc("/getChatHistory", getChatHistory)
	http.HandleFunc("/leaveChannel", leaveChannel)
	corsHandler := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type"},
		AllowCredentials: true,
	}).Handler(http.DefaultServeMux)
	http.ListenAndServe(":8000", corsHandler)
}
