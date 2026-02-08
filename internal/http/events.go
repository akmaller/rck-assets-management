package http

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"
)

type eventHub struct {
	mu      sync.Mutex
	clients map[chan string]struct{}
}

func newEventHub() *eventHub {
	return &eventHub{
		clients: make(map[chan string]struct{}),
	}
}

func (h *eventHub) subscribe() chan string {
	ch := make(chan string, 8)
	h.mu.Lock()
	h.clients[ch] = struct{}{}
	h.mu.Unlock()
	return ch
}

func (h *eventHub) unsubscribe(ch chan string) {
	h.mu.Lock()
	delete(h.clients, ch)
	h.mu.Unlock()
	close(ch)
}

func (h *eventHub) broadcast(eventType string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	payload, _ := json.Marshal(map[string]string{"type": eventType})
	msg := fmt.Sprintf("data: %s\n\n", payload)
	for ch := range h.clients {
		select {
		case ch <- msg:
		default:
		}
	}
}

func (h *Handler) EventsStream(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming tidak didukung", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")

	client := h.events.subscribe()
	defer h.events.unsubscribe(client)

	keepalive := time.NewTicker(25 * time.Second)
	defer keepalive.Stop()

	ctx := r.Context()
	write := func(msg string) {
		_, _ = w.Write([]byte(msg))
		flusher.Flush()
	}

	write("event: ready\ndata: {}\n\n")

	for {
		select {
		case <-ctx.Done():
			return
		case <-keepalive.C:
			write(":keepalive\n\n")
		case msg := <-client:
			write(msg)
		}
	}
}

func (h *Handler) notify(eventType string) {
	h.events.broadcast(eventType)
}

func (h *Handler) notifyAll() {
	h.events.broadcast("all")
}
