package http

import (
	"bytes"
	"fmt"
	"mime/multipart"
	stdhttp "net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"
	"time"

	"github.com/jmoiron/sqlx"

	"rck-assets/internal/auth"
	"rck-assets/internal/config"
	"rck-assets/internal/db"
	"rck-assets/internal/store"
)

type authFixture struct {
	router     stdhttp.Handler
	adminToken string
	staffToken string
	csrfToken  string

	adminID    int64
	staffID    int64
	otherUser  int64
	assetID    int64
	assetID2   int64
	loanID     int64
	loanItemID int64
}

type routeCase struct {
	name   string
	method string
	path   func(*authFixture) string
	body   func(*authFixture) ([]byte, string)
}

func TestAuthorizationAdminOnlyEndpoints(t *testing.T) {
	t.Parallel()

	cases := []routeCase{
		{
			name:   "company-get",
			method: stdhttp.MethodGet,
			path:   func(_ *authFixture) string { return "/api/settings/company" },
			body:   noBody,
		},
		{
			name:   "company-put",
			method: stdhttp.MethodPut,
			path:   func(_ *authFixture) string { return "/api/settings/company" },
			body:   jsonBody(`{"company_name":"RCK"}`),
		},
		{
			name:   "company-logo-upload",
			method: stdhttp.MethodPost,
			path:   func(_ *authFixture) string { return "/api/settings/company/logo" },
			body:   multipartFieldBody("noop", "1"),
		},
		{
			name:   "company-favicon-upload",
			method: stdhttp.MethodPost,
			path:   func(_ *authFixture) string { return "/api/settings/company/favicon" },
			body:   multipartFieldBody("noop", "1"),
		},
		{
			name:   "users-list",
			method: stdhttp.MethodGet,
			path:   func(_ *authFixture) string { return "/api/users" },
			body:   noBody,
		},
		{
			name:   "users-create",
			method: stdhttp.MethodPost,
			path:   func(_ *authFixture) string { return "/api/users" },
			body:   jsonBody(`{"username":"new-user","full_name":"New User","password":"secret123","role":"staff","is_active":true}`),
		},
		{
			name:   "users-update",
			method: stdhttp.MethodPut,
			path:   func(f *authFixture) string { return fmt.Sprintf("/api/users/%d", f.otherUser) },
			body:   jsonBody(`{"username":"other-user","full_name":"Other User Updated","password":"","role":"staff","is_active":true}`),
		},
		{
			name:   "users-delete",
			method: stdhttp.MethodDelete,
			path:   func(f *authFixture) string { return fmt.Sprintf("/api/users/%d", f.otherUser) },
			body:   noBody,
		},
		{
			name:   "audit-list",
			method: stdhttp.MethodGet,
			path:   func(_ *authFixture) string { return "/api/audit-logs" },
			body:   noBody,
		},
		{
			name:   "types-create",
			method: stdhttp.MethodPost,
			path:   func(_ *authFixture) string { return "/api/asset-types" },
			body:   jsonBody(`{"name":"Kamera Test","description":"desc"}`),
		},
		{
			name:   "types-update",
			method: stdhttp.MethodPut,
			path:   func(_ *authFixture) string { return "/api/asset-types/1" },
			body:   jsonBody(`{"name":"Umum","description":"updated"}`),
		},
		{
			name:   "types-delete",
			method: stdhttp.MethodDelete,
			path:   func(_ *authFixture) string { return "/api/asset-types/9999" },
			body:   noBody,
		},
		{
			name:   "types-export",
			method: stdhttp.MethodGet,
			path:   func(_ *authFixture) string { return "/api/asset-types/export.csv" },
			body:   noBody,
		},
		{
			name:   "types-import",
			method: stdhttp.MethodPost,
			path:   func(_ *authFixture) string { return "/api/asset-types/import.csv" },
			body:   multipartFieldBody("noop", "1"),
		},
		{
			name:   "assets-export",
			method: stdhttp.MethodGet,
			path:   func(_ *authFixture) string { return "/api/assets/export.csv" },
			body:   noBody,
		},
		{
			name:   "assets-import",
			method: stdhttp.MethodPost,
			path:   func(_ *authFixture) string { return "/api/assets/import.csv" },
			body:   multipartFieldBody("noop", "1"),
		},
		{
			name:   "assets-delete",
			method: stdhttp.MethodDelete,
			path:   func(f *authFixture) string { return fmt.Sprintf("/api/assets/%d", f.assetID) },
			body:   noBody,
		},
		{
			name:   "loans-export",
			method: stdhttp.MethodGet,
			path:   func(_ *authFixture) string { return "/api/loans/export.csv" },
			body:   noBody,
		},
		{
			name:   "loans-import",
			method: stdhttp.MethodPost,
			path:   func(_ *authFixture) string { return "/api/loans/import.csv" },
			body:   multipartFieldBody("noop", "1"),
		},
		{
			name:   "loans-delete",
			method: stdhttp.MethodDelete,
			path:   func(f *authFixture) string { return fmt.Sprintf("/api/loans/%d", f.loanID) },
			body:   noBody,
		},
	}

	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			fx := newAuthFixture(t)
			path := tc.path(fx)
			body, contentType := tc.body(fx)
			withCSRF := needCSRF(tc.method)

			staffResp := fx.doRequest(tc.method, path, body, contentType, "staff", withCSRF)
			if staffResp.Code != stdhttp.StatusForbidden {
				t.Fatalf("staff expected 403, got %d body=%s", staffResp.Code, staffResp.Body.String())
			}

			adminResp := fx.doRequest(tc.method, path, body, contentType, "admin", withCSRF)
			if adminResp.Code == stdhttp.StatusUnauthorized || adminResp.Code == stdhttp.StatusForbidden {
				t.Fatalf("admin should be allowed, got %d body=%s", adminResp.Code, adminResp.Body.String())
			}
		})
	}
}

func TestAuthorizationStaffAllowedEndpoints(t *testing.T) {
	t.Parallel()

	cases := []routeCase{
		{
			name:   "auth-me",
			method: stdhttp.MethodGet,
			path:   func(_ *authFixture) string { return "/api/auth/me" },
			body:   noBody,
		},
		{
			name:   "types-list",
			method: stdhttp.MethodGet,
			path:   func(_ *authFixture) string { return "/api/asset-types" },
			body:   noBody,
		},
		{
			name:   "assets-list",
			method: stdhttp.MethodGet,
			path:   func(_ *authFixture) string { return "/api/assets" },
			body:   noBody,
		},
		{
			name:   "assets-search",
			method: stdhttp.MethodGet,
			path:   func(_ *authFixture) string { return "/api/assets/search?q=AST" },
			body:   noBody,
		},
		{
			name:   "assets-next-id",
			method: stdhttp.MethodGet,
			path:   func(_ *authFixture) string { return "/api/assets/next-id?purchase_date=2026-02-08" },
			body:   noBody,
		},
		{
			name:   "barcode-decode",
			method: stdhttp.MethodPost,
			path:   func(_ *authFixture) string { return "/api/barcode/decode" },
			body:   multipartFieldBody("noop", "1"),
		},
		{
			name:   "assets-create",
			method: stdhttp.MethodPost,
			path:   func(_ *authFixture) string { return "/api/assets" },
			body:   jsonBody(`{"asset_code":"AST-NEW-01","name":"Asset Baru","purchase_date":"2026-02-08","condition":"Baik","asset_type_id":1,"barcode":"BAR-NEW-01"}`),
		},
		{
			name:   "assets-update",
			method: stdhttp.MethodPut,
			path:   func(f *authFixture) string { return fmt.Sprintf("/api/assets/%d", f.assetID) },
			body:   jsonBody(`{"asset_code":"AST-001","name":"Laptop Utama Edit","purchase_date":"2026-02-08","condition":"Baik","asset_type_id":1,"barcode":"BAR-001"}`),
		},
		{
			name:   "assets-photo-upload",
			method: stdhttp.MethodPost,
			path:   func(f *authFixture) string { return fmt.Sprintf("/api/assets/%d/photo", f.assetID) },
			body:   multipartFieldBody("noop", "1"),
		},
		{
			name:   "loans-list",
			method: stdhttp.MethodGet,
			path:   func(_ *authFixture) string { return "/api/loans" },
			body:   noBody,
		},
		{
			name:   "loans-create",
			method: stdhttp.MethodPost,
			path:   func(_ *authFixture) string { return "/api/loans" },
			body:   jsonBody(`{"asset_ids":[1],"borrower_name":"Staff User","borrower_contact":"0812","borrow_date":"2026-02-08","notes":"loan test"}`),
		},
		{
			name:   "loans-update",
			method: stdhttp.MethodPut,
			path:   func(f *authFixture) string { return fmt.Sprintf("/api/loans/%d", f.loanID) },
			body:   jsonBody(`{"asset_ids":[2],"borrower_name":"Peminjam 2","borrower_contact":"","borrow_date":"2026-02-08","notes":"updated"}`),
		},
		{
			name:   "loans-return-item",
			method: stdhttp.MethodPost,
			path:   func(f *authFixture) string { return fmt.Sprintf("/api/loans/%d/items/%d/return", f.loanID, f.loanItemID) },
			body:   noBody,
		},
	}

	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			fx := newAuthFixture(t)
			path := tc.path(fx)
			body, contentType := tc.body(fx)
			withCSRF := needCSRF(tc.method)

			staffResp := fx.doRequest(tc.method, path, body, contentType, "staff", withCSRF)
			if staffResp.Code == stdhttp.StatusUnauthorized || staffResp.Code == stdhttp.StatusForbidden {
				t.Fatalf("staff should be allowed, got %d body=%s", staffResp.Code, staffResp.Body.String())
			}

			adminResp := fx.doRequest(tc.method, path, body, contentType, "admin", withCSRF)
			if adminResp.Code == stdhttp.StatusUnauthorized || adminResp.Code == stdhttp.StatusForbidden {
				t.Fatalf("admin should be allowed, got %d body=%s", adminResp.Code, adminResp.Body.String())
			}
		})
	}
}

func TestAuthorizationRequireAuth(t *testing.T) {
	t.Parallel()
	fx := newAuthFixture(t)

	cases := []struct {
		name       string
		method     string
		path       string
		body       []byte
		contentType string
		withCSRF   bool
	}{
		{
			name:       "get-assets-without-token",
			method:     stdhttp.MethodGet,
			path:       "/api/assets",
			body:       nil,
			contentType: "",
			withCSRF:   false,
		},
		{
			name:       "post-assets-without-token",
			method:     stdhttp.MethodPost,
			path:       "/api/assets",
			body:       []byte(`{"asset_code":"AST-NOAUTH","name":"X","purchase_date":"2026-02-08","condition":"Baik","asset_type_id":1}`),
			contentType: "application/json",
			withCSRF:   true,
		},
		{
			name:       "admin-only-without-token",
			method:     stdhttp.MethodGet,
			path:       "/api/users",
			body:       nil,
			contentType: "",
			withCSRF:   false,
		},
	}

	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			resp := fx.doRequest(tc.method, tc.path, tc.body, tc.contentType, "", tc.withCSRF)
			if resp.Code != stdhttp.StatusUnauthorized {
				t.Fatalf("expected 401, got %d body=%s", resp.Code, resp.Body.String())
			}
		})
	}
}

func TestAuthorizationRequireCSRF(t *testing.T) {
	t.Parallel()
	fx := newAuthFixture(t)

	staffResp := fx.doRequest(
		stdhttp.MethodPost,
		"/api/assets",
		[]byte(`{"asset_code":"AST-CSRF","name":"X","purchase_date":"2026-02-08","condition":"Baik","asset_type_id":1,"barcode":"BAR-CSRF"}`),
		"application/json",
		"staff",
		false,
	)
	if staffResp.Code != stdhttp.StatusForbidden {
		t.Fatalf("staff missing csrf expected 403, got %d body=%s", staffResp.Code, staffResp.Body.String())
	}

	adminResp := fx.doRequest(
		stdhttp.MethodPut,
		"/api/settings/company",
		[]byte(`{"company_name":"RCK CSRF"}`),
		"application/json",
		"admin",
		false,
	)
	if adminResp.Code != stdhttp.StatusForbidden {
		t.Fatalf("admin missing csrf expected 403, got %d body=%s", adminResp.Code, adminResp.Body.String())
	}
}

func newAuthFixture(t *testing.T) *authFixture {
	t.Helper()

	dbPath := filepath.Join(t.TempDir(), "authz-test.db")
	sqlDB, err := db.Open("sqlite", dbPath)
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	t.Cleanup(func() {
		_ = sqlDB.Close()
	})

	if err := db.Migrate(sqlDB, "sqlite"); err != nil {
		t.Fatalf("migrate db: %v", err)
	}

	adminID := insertTestUser(t, sqlDB, "admin-test", "admin")
	staffID := insertTestUser(t, sqlDB, "staff-test", "staff")
	otherUser := insertTestUser(t, sqlDB, "other-user", "staff")

	st := store.New(sqlDB)
	asset1, err := st.CreateAsset(store.CreateAssetInput{
		AssetCode:     "AST-001",
		Name:          "Laptop Utama",
		PurchaseDate:  "2026-02-08",
		Condition:     "Baik",
		AssetTypeID:   1,
		AssetSequence: 1,
		Barcode:       "BAR-001",
	})
	if err != nil {
		t.Fatalf("seed asset1: %v", err)
	}
	asset2, err := st.CreateAsset(store.CreateAssetInput{
		AssetCode:     "AST-002",
		Name:          "Laptop Kedua",
		PurchaseDate:  "2026-02-08",
		Condition:     "Baik",
		AssetTypeID:   1,
		AssetSequence: 2,
		Barcode:       "BAR-002",
	})
	if err != nil {
		t.Fatalf("seed asset2: %v", err)
	}

	loanHeaderQuery := sqlDB.Rebind(`
		INSERT INTO loan_headers (borrower_name, borrower_contact, borrow_date, notes)
		VALUES (?, ?, ?, ?)
	`)
	loanRes, err := sqlDB.Exec(loanHeaderQuery, "Seed Borrower", "081234", "2026-02-08", "seed")
	if err != nil {
		t.Fatalf("seed loan header: %v", err)
	}
	loanID, err := loanRes.LastInsertId()
	if err != nil {
		t.Fatalf("seed loan header last id: %v", err)
	}

	loanItemQuery := sqlDB.Rebind(`
		INSERT INTO loan_items (loan_id, asset_id, return_date)
		VALUES (?, ?, '')
	`)
	itemRes, err := sqlDB.Exec(loanItemQuery, loanID, asset2.ID)
	if err != nil {
		t.Fatalf("seed loan item: %v", err)
	}
	loanItemID, err := itemRes.LastInsertId()
	if err != nil {
		t.Fatalf("seed loan item last id: %v", err)
	}

	cfg := config.Config{
		AppName:   "RCK-Assets-Test",
		HTTPAddr:  ":0",
		DBDriver:  "sqlite",
		DBDSN:     dbPath,
		JWTSecret: "test-secret",
		TokenTTL:  time.Hour,
	}
	tokenMgr := auth.NewJWTManager(cfg.JWTSecret, cfg.TokenTTL)

	adminToken, err := tokenMgr.GenerateToken(adminID, "admin-test", "admin")
	if err != nil {
		t.Fatalf("generate admin token: %v", err)
	}
	staffToken, err := tokenMgr.GenerateToken(staffID, "staff-test", "staff")
	if err != nil {
		t.Fatalf("generate staff token: %v", err)
	}

	handler := &Handler{
		cfg:          cfg,
		store:        st,
		tokenManager: tokenMgr,
		events:       newEventHub(),
		loginLimiter: newRateLimiter(100, time.Minute),
	}

	return &authFixture{
		router:     NewRouter(handler),
		adminToken: adminToken,
		staffToken: staffToken,
		csrfToken:  "csrf-test-token",
		adminID:    adminID,
		staffID:    staffID,
		otherUser:  otherUser,
		assetID:    asset1.ID,
		assetID2:   asset2.ID,
		loanID:     loanID,
		loanItemID: loanItemID,
	}
}

func (f *authFixture) doRequest(method, path string, body []byte, contentType, role string, withCSRF bool) *httptest.ResponseRecorder {
	var req *stdhttp.Request
	if body == nil {
		req = httptest.NewRequest(method, path, nil)
	} else {
		req = httptest.NewRequest(method, path, bytes.NewReader(body))
	}
	req.RemoteAddr = "127.0.0.1:12345"
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}

	switch role {
	case "admin":
		req.AddCookie(&stdhttp.Cookie{Name: "rck_token", Value: f.adminToken, Path: "/"})
	case "staff":
		req.AddCookie(&stdhttp.Cookie{Name: "rck_token", Value: f.staffToken, Path: "/"})
	case "":
	default:
		panic("unknown role: " + role)
	}

	if withCSRF {
		req.AddCookie(&stdhttp.Cookie{Name: "rck_csrf", Value: f.csrfToken, Path: "/"})
		req.Header.Set("X-CSRF-Token", f.csrfToken)
	}

	rec := httptest.NewRecorder()
	f.router.ServeHTTP(rec, req)
	return rec
}

func insertTestUser(t *testing.T, database *sqlx.DB, username, role string) int64 {
	t.Helper()
	hash, err := auth.HashPassword("secret123")
	if err != nil {
		t.Fatalf("hash password: %v", err)
	}
	query := database.Rebind(`
		INSERT INTO users (username, full_name, password_hash, role, is_active)
		VALUES (?, ?, ?, ?, ?)
	`)
	res, err := database.Exec(query, username, username, hash, role, true)
	if err != nil {
		t.Fatalf("insert user %s: %v", username, err)
	}
	id, err := res.LastInsertId()
	if err != nil {
		t.Fatalf("last insert id user %s: %v", username, err)
	}
	return id
}

func needCSRF(method string) bool {
	switch method {
	case stdhttp.MethodGet, stdhttp.MethodHead, stdhttp.MethodOptions:
		return false
	default:
		return true
	}
}

func noBody(_ *authFixture) ([]byte, string) {
	return nil, ""
}

func jsonBody(raw string) func(*authFixture) ([]byte, string) {
	return func(_ *authFixture) ([]byte, string) {
		return []byte(raw), "application/json"
	}
}

func multipartFieldBody(field, value string) func(*authFixture) ([]byte, string) {
	return func(_ *authFixture) ([]byte, string) {
		var buf bytes.Buffer
		writer := multipart.NewWriter(&buf)
		_ = writer.WriteField(field, value)
		_ = writer.Close()
		return buf.Bytes(), writer.FormDataContentType()
	}
}
