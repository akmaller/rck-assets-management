package http

import (
	"context"

	"rck-assets/internal/auth"
)

type contextKey string

const claimsKey contextKey = "claims"

func withClaims(ctx context.Context, claims *auth.Claims) context.Context {
	return context.WithValue(ctx, claimsKey, claims)
}

func claimsFromContext(ctx context.Context) (*auth.Claims, bool) {
	claims, ok := ctx.Value(claimsKey).(*auth.Claims)
	return claims, ok
}
