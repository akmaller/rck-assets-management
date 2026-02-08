package http

import (
	stdhttp "net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func NewRouter(handler *Handler) stdhttp.Handler {
	r := chi.NewRouter()
	r.Use(securityHeaders)
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)

	r.Handle("/static/*", stdhttp.StripPrefix("/static/", stdhttp.FileServer(stdhttp.Dir("web/static"))))
	r.Handle("/uploads/*", stdhttp.StripPrefix("/uploads/", stdhttp.FileServer(stdhttp.Dir("data/uploads"))))
	r.Get("/", handler.LoginPage)
	r.Get("/dashboard", handler.DashboardPage)

	r.Route("/api", func(api chi.Router) {
		apiLimiter := newRateLimiter(300, time.Minute)
		api.Get("/health", handler.Health)
		api.Post("/auth/login", handler.Login)
		api.Post("/auth/logout", handler.Logout)
		api.Get("/settings/company/public", handler.GetCompanySettingPublic)

		api.Group(func(secure chi.Router) {
			secure.Use(handler.RequireAuth)
			secure.Use(handler.RequireCSRF)
			secure.Use(rateLimitMiddleware(apiLimiter))
			secure.Get("/auth/me", handler.Me)
			secure.Get("/events", handler.EventsStream)

			secure.Get("/asset-types", handler.ListAssetTypes)
			secure.Post("/asset-types", handler.CreateAssetType)
			secure.Post("/asset-types/import.csv", handler.ImportAssetTypesCSV)
			secure.Put("/asset-types/{id}", handler.UpdateAssetType)
			secure.Get("/asset-types/export.csv", handler.ExportAssetTypesCSV)

			secure.Get("/assets", handler.ListAssets)
			secure.Get("/assets/search", handler.SearchAssets)
			secure.Get("/assets/next-id", handler.NextAssetCode)
			secure.Post("/assets/import.csv", handler.ImportAssetsCSV)
			secure.Get("/assets/export.csv", handler.ExportAssetsCSV)
			secure.Post("/barcode/decode", handler.DecodeBarcodeFromPhoto)
			secure.Post("/assets", handler.CreateAsset)
			secure.Post("/assets/{id}/photo", handler.UploadAssetPhoto)
			secure.Put("/assets/{id}", handler.UpdateAsset)
			secure.Delete("/assets/{id}", handler.DeleteAsset)

			secure.Get("/loans", handler.ListLoans)
			secure.Post("/loans/import.csv", handler.ImportLoansCSV)
			secure.Get("/loans/export.csv", handler.ExportLoansCSV)
			secure.Post("/loans", handler.CreateLoan)
			secure.Put("/loans/{id}", handler.UpdateLoan)
			secure.Post("/loans/{id}/items/{itemId}/return", handler.ReturnLoan)
			secure.Delete("/loans/{id}", handler.DeleteLoan)

			secure.Group(func(admin chi.Router) {
				admin.Use(handler.RequireAdmin)
				admin.Get("/settings/company", handler.GetCompanySetting)
				admin.Put("/settings/company", handler.UpdateCompanySetting)
				admin.Post("/settings/company/logo", handler.UploadCompanyLogo)
				admin.Post("/settings/company/favicon", handler.UploadCompanyFavicon)
				admin.Delete("/asset-types/{id}", handler.DeleteAssetType)
				admin.Get("/users", handler.ListUsers)
				admin.Post("/users", handler.CreateUser)
				admin.Put("/users/{id}", handler.UpdateUser)
				admin.Delete("/users/{id}", handler.DeleteUser)
				admin.Get("/audit-logs", handler.ListAuditLogs)
			})
		})
	})

	return r
}

func securityHeaders(next stdhttp.Handler) stdhttp.Handler {
	return stdhttp.HandlerFunc(func(w stdhttp.ResponseWriter, r *stdhttp.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Referrer-Policy", "no-referrer")
		w.Header().Set("Permissions-Policy", "camera=(self), microphone=(), geolocation=()")
		w.Header().Set("Cross-Origin-Resource-Policy", "same-origin")
		w.Header().Set("Cross-Origin-Opener-Policy", "same-origin")
		w.Header().Set("Cross-Origin-Embedder-Policy", "unsafe-none")
		if isSecureRequest(r) {
			w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		}
		w.Header().Set(
			"Content-Security-Policy",
			"default-src 'self'; img-src 'self' data: blob:; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; script-src 'self' https://unpkg.com; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
		)
		next.ServeHTTP(w, r)
	})
}
