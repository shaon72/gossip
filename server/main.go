package main

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gorilla/websocket"
)

var clients = make(map[*websocket.Conn]string)
var broadcast = make(chan string)
var clientId = 0
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func handlewebsockets(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer conn.Close()
	clientId++
	clients[conn] = strconv.Itoa(clientId)
	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			delete(clients, conn)
			return
		}
		if len(msg) > 0 {
			broadcast <- fmt.Sprintf("User %s: %s", clients[conn], string(msg))
		}
	}
}

func handlemessages() {
	for {
		msg := <-broadcast
		for client := range clients {
			err := client.WriteMessage(websocket.TextMessage, []byte(msg))
			if err != nil {
				client.Close()
				delete(clients, client)
				return
			}
		}
	}
}
func main() {
	http.HandleFunc("/wsserver", handlewebsockets)
	go handlemessages()
	http.ListenAndServe(":8000", nil)
}
