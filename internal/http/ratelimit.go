package http

import (
	stdhttp "net/http"
	"strings"
	"sync"
	"time"
)

type rateLimiter struct {
	mu     sync.Mutex
	window time.Duration
	limit  int
	hits   map[string][]time.Time
}

func newRateLimiter(limit int, window time.Duration) *rateLimiter {
	return &rateLimiter{
		window: window,
		limit:  limit,
		hits:   make(map[string][]time.Time),
	}
}

func (r *rateLimiter) allow(key string) bool {
	now := time.Now()
	cutoff := now.Add(-r.window)

	r.mu.Lock()
	defer r.mu.Unlock()

	times := r.hits[key]
	n := 0
	for _, t := range times {
		if t.After(cutoff) {
			times[n] = t
			n++
		}
	}
	times = times[:n]
	if len(times) >= r.limit {
		r.hits[key] = times
		return false
	}
	times = append(times, now)
	r.hits[key] = times
	return true
}

func rateLimitMiddleware(limiter *rateLimiter) func(stdhttp.Handler) stdhttp.Handler {
	return func(next stdhttp.Handler) stdhttp.Handler {
		return stdhttp.HandlerFunc(func(w stdhttp.ResponseWriter, r *stdhttp.Request) {
			if limiter == nil {
				next.ServeHTTP(w, r)
				return
			}
			key := rateLimitKey(r)
			if !limiter.allow(key) {
				w.Header().Set("Retry-After", "60")
				writeError(w, stdhttp.StatusTooManyRequests, "terlalu banyak permintaan, coba lagi nanti")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func rateLimitKey(r *stdhttp.Request) string {
	if r == nil {
		return ""
	}
	if xff := strings.TrimSpace(r.Header.Get("X-Forwarded-For")); xff != "" {
		parts := strings.Split(xff, ",")
		if len(parts) > 0 {
			return strings.TrimSpace(parts[0])
		}
	}
	if xr := strings.TrimSpace(r.Header.Get("X-Real-IP")); xr != "" {
		return xr
	}
	host := r.RemoteAddr
	if idx := strings.LastIndex(host, ":"); idx != -1 {
		return host[:idx]
	}
	return host
}
