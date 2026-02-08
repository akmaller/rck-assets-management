package http

import (
	"bytes"
	"crypto/rand"
	"encoding/base64"
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"html/template"
	"image"
	_ "image/gif"
	"image/jpeg"
	"image/png"
	"io"
	"math"
	stdhttp "net/http"
	"net/url"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/makiuchi-d/gozxing"
	"github.com/makiuchi-d/gozxing/oned"
	"github.com/makiuchi-d/gozxing/qrcode"
	"golang.org/x/image/draw"

	"rck-assets/internal/auth"
	"rck-assets/internal/config"
	"rck-assets/internal/store"
)

type Handler struct {
	cfg               config.Config
	store             *store.Store
	tokenManager      *auth.JWTManager
	loginTemplate     *template.Template
	dashboardTemplate *template.Template
	events            *eventHub
	loginLimiter      *rateLimiter
}

func NewHandler(cfg config.Config, dataStore *store.Store, tokenManager *auth.JWTManager) (*Handler, error) {
	loginTemplate, err := template.ParseFiles("web/templates/login.html")
	if err != nil {
		return nil, err
	}
	dashboardTemplate, err := template.ParseFiles("web/templates/dashboard.html")
	if err != nil {
		return nil, err
	}

	return &Handler{
		cfg:               cfg,
		store:             dataStore,
		tokenManager:      tokenManager,
		loginTemplate:     loginTemplate,
		dashboardTemplate: dashboardTemplate,
		events:            newEventHub(),
		loginLimiter:      newRateLimiter(10, 1*time.Minute),
	}, nil
}

func (h *Handler) Health(w stdhttp.ResponseWriter, _ *stdhttp.Request) {
	writeJSON(w, stdhttp.StatusOK, map[string]string{
		"status": "ok",
		"app":    h.cfg.AppName,
	})
}

func (h *Handler) LoginPage(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	if claims, err := h.claimsFromRequest(r); err == nil {
		user, err := h.store.GetUserByID(claims.UserID)
		if err == nil && user.IsActive {
			stdhttp.Redirect(w, r, "/dashboard", stdhttp.StatusFound)
			return
		}
	}

	data := map[string]any{"AppName": h.cfg.AppName}
	if err := h.loginTemplate.Execute(w, data); err != nil {
		stdhttp.Error(w, "gagal memuat halaman login", stdhttp.StatusInternalServerError)
	}
}

func (h *Handler) DashboardPage(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	claims, err := h.claimsFromRequest(r)
	if err != nil {
		stdhttp.Redirect(w, r, "/", stdhttp.StatusFound)
		return
	}

	user, err := h.store.GetUserByID(claims.UserID)
	if err != nil || !user.IsActive {
		stdhttp.Redirect(w, r, "/", stdhttp.StatusFound)
		return
	}

	h.ensureCSRFToken(w, r)

	data := map[string]any{
		"AppName":  h.cfg.AppName,
		"Username": user.Username,
	}
	if err := h.dashboardTemplate.Execute(w, data); err != nil {
		stdhttp.Error(w, "gagal memuat dashboard", stdhttp.StatusInternalServerError)
	}
}

func (h *Handler) RequireAuth(next stdhttp.Handler) stdhttp.Handler {
	return stdhttp.HandlerFunc(func(w stdhttp.ResponseWriter, r *stdhttp.Request) {
		claims, err := h.claimsFromRequest(r)
		if err != nil {
			writeError(w, stdhttp.StatusUnauthorized, "autentikasi gagal")
			return
		}

		user, err := h.store.GetUserByID(claims.UserID)
		if err != nil || !user.IsActive {
			writeError(w, stdhttp.StatusUnauthorized, "akun tidak aktif atau tidak ditemukan")
			return
		}

		claims.Username = user.Username
		claims.Role = user.Role
		h.ensureCSRFToken(w, r)
		next.ServeHTTP(w, r.WithContext(withClaims(r.Context(), claims)))
	})
}

func (h *Handler) RequireAdmin(next stdhttp.Handler) stdhttp.Handler {
	return stdhttp.HandlerFunc(func(w stdhttp.ResponseWriter, r *stdhttp.Request) {
		claims, ok := claimsFromContext(r.Context())
		if !ok {
			writeError(w, stdhttp.StatusUnauthorized, "autentikasi gagal")
			return
		}
		if strings.ToLower(claims.Role) != "admin" {
			writeError(w, stdhttp.StatusForbidden, "akses admin diperlukan")
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (h *Handler) RequireCSRF(next stdhttp.Handler) stdhttp.Handler {
	return stdhttp.HandlerFunc(func(w stdhttp.ResponseWriter, r *stdhttp.Request) {
		switch r.Method {
		case stdhttp.MethodGet, stdhttp.MethodHead, stdhttp.MethodOptions:
			next.ServeHTTP(w, r)
			return
		}

		cookie, err := r.Cookie("rck_csrf")
		if err != nil || strings.TrimSpace(cookie.Value) == "" {
			writeError(w, stdhttp.StatusForbidden, "csrf token tidak valid")
			return
		}
		header := strings.TrimSpace(r.Header.Get("X-CSRF-Token"))
		if header == "" || header != cookie.Value {
			writeError(w, stdhttp.StatusForbidden, "csrf token tidak valid")
			return
		}
		if !sameOrigin(r) {
			writeError(w, stdhttp.StatusForbidden, "origin tidak valid")
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (h *Handler) Login(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	type request struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	var req request
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, stdhttp.StatusBadRequest, "payload login tidak valid")
		return
	}

	req.Username = strings.TrimSpace(req.Username)
	if req.Username == "" || strings.TrimSpace(req.Password) == "" {
		writeError(w, stdhttp.StatusBadRequest, "username dan password wajib diisi")
		return
	}

	key := fmt.Sprintf("%s|%s", clientIP(r), strings.ToLower(req.Username))
	if h.loginLimiter != nil && !h.loginLimiter.allow(key) {
		writeError(w, stdhttp.StatusTooManyRequests, "terlalu banyak percobaan, coba lagi nanti")
		return
	}

	user, err := h.store.GetUserByUsername(req.Username)
	if err != nil {
		h.auditExternal(r, "login_failed", "auth", 0, fmt.Sprintf("username=%s", req.Username))
		writeError(w, stdhttp.StatusUnauthorized, "username atau password salah")
		return
	}

	if !user.IsActive {
		h.auditExternal(r, "login_failed", "auth", 0, fmt.Sprintf("username=%s inactive", req.Username))
		writeError(w, stdhttp.StatusUnauthorized, "akun tidak aktif")
		return
	}

	if err := auth.CheckPassword(req.Password, user.PasswordHash); err != nil {
		h.auditExternal(r, "login_failed", "auth", 0, fmt.Sprintf("username=%s", req.Username))
		writeError(w, stdhttp.StatusUnauthorized, "username atau password salah")
		return
	}

	token, err := h.tokenManager.GenerateToken(user.ID, user.Username, user.Role)
	if err != nil {
		writeError(w, stdhttp.StatusInternalServerError, "gagal membuat token")
		return
	}

	h.setAuthCookie(w, token, r)
	h.ensureCSRFToken(w, r)
	h.auditWithUser(r, user.User, "login", "auth", user.ID, "login berhasil")
	writeJSON(w, stdhttp.StatusOK, map[string]any{
		"message": "login berhasil",
		"token":   token,
		"user": map[string]any{
			"id":        user.ID,
			"username":  user.Username,
			"full_name": user.FullName,
			"role":      user.Role,
			"is_active": user.IsActive,
		},
	})
}

func (h *Handler) Logout(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	stdhttp.SetCookie(w, &stdhttp.Cookie{
		Name:     "rck_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		SameSite: stdhttp.SameSiteLaxMode,
		Secure:   isSecureRequest(r),
	})
	h.audit(r, "logout", "auth", 0, "logout")
	writeJSON(w, stdhttp.StatusOK, map[string]string{"message": "logout berhasil"})
}

func (h *Handler) Me(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	claims, ok := claimsFromContext(r.Context())
	if !ok {
		writeError(w, stdhttp.StatusUnauthorized, "autentikasi gagal")
		return
	}

	user, err := h.store.GetUserByID(claims.UserID)
	if err != nil {
		writeError(w, stdhttp.StatusUnauthorized, "user tidak ditemukan")
		return
	}

	writeJSON(w, stdhttp.StatusOK, map[string]any{"user": user})
}

func (h *Handler) GetCompanySetting(w stdhttp.ResponseWriter, _ *stdhttp.Request) {
	setting, err := h.store.GetCompanySetting()
	if err != nil {
		writeError(w, stdhttp.StatusInternalServerError, "gagal mengambil data identitas")
		return
	}
	writeJSON(w, stdhttp.StatusOK, map[string]any{"setting": setting})
}

func (h *Handler) UpdateCompanySetting(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	type request struct {
		CompanyName     string `json:"company_name"`
		Address         string `json:"address"`
		Email           string `json:"email"`
		Phone           string `json:"phone"`
		Website         string `json:"website"`
		AssetCodePrefix string `json:"asset_code_prefix"`
	}
	var req request
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, stdhttp.StatusBadRequest, "payload tidak valid")
		return
	}

	updated, err := h.store.UpdateCompanySetting(store.UpdateCompanySettingInput{
		CompanyName:     strings.TrimSpace(req.CompanyName),
		Address:         strings.TrimSpace(req.Address),
		Email:           strings.TrimSpace(req.Email),
		Phone:           strings.TrimSpace(req.Phone),
		Website:         strings.TrimSpace(req.Website),
		AssetCodePrefix: sanitizeAssetPrefix(req.AssetCodePrefix),
	})
	if err != nil {
		writeError(w, stdhttp.StatusInternalServerError, "gagal menyimpan identitas perusahaan")
		return
	}
	writeJSON(w, stdhttp.StatusOK, map[string]any{
		"message": "identitas perusahaan tersimpan",
		"setting": updated,
	})
	h.audit(r, "update", "company_setting", 1, fmt.Sprintf("company_name=%s", updated.CompanyName))
	h.notify("company")
}

func (h *Handler) GetCompanySettingPublic(w stdhttp.ResponseWriter, _ *stdhttp.Request) {
	setting, err := h.store.GetCompanySetting()
	if err != nil {
		writeError(w, stdhttp.StatusInternalServerError, "gagal mengambil data identitas")
		return
	}
	writeJSON(w, stdhttp.StatusOK, map[string]any{
		"setting": map[string]any{
			"company_name":      setting.CompanyName,
			"logo_url":          setting.LogoPath,
			"favicon_url":       setting.FaviconPath,
			"asset_code_prefix": setting.AssetCodePrefix,
		},
	})
}

func (h *Handler) UploadCompanyLogo(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	path, err := h.handleImageUpload(w, r, "company-logo", 1024, 1024, 85)
	if err != nil {
		writeError(w, stdhttp.StatusBadRequest, err.Error())
		return
	}

	setting, err := h.store.UpdateCompanyLogo(path)
	if err != nil {
		writeError(w, stdhttp.StatusInternalServerError, "gagal menyimpan logo")
		return
	}
	writeJSON(w, stdhttp.StatusOK, map[string]any{
		"message": "logo berhasil diupload",
		"setting": setting,
	})
	h.audit(r, "upload", "company_logo", 1, "logo diperbarui")
	h.notify("company")
}

func (h *Handler) UploadCompanyFavicon(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	path, err := h.handleImageUpload(w, r, "company-favicon", 256, 256, 85)
	if err != nil {
		writeError(w, stdhttp.StatusBadRequest, err.Error())
		return
	}

	setting, err := h.store.UpdateCompanyFavicon(path)
	if err != nil {
		writeError(w, stdhttp.StatusInternalServerError, "gagal menyimpan favicon")
		return
	}
	writeJSON(w, stdhttp.StatusOK, map[string]any{
		"message": "favicon berhasil diupload",
		"setting": setting,
	})
	h.audit(r, "upload", "company_favicon", 1, "favicon diperbarui")
	h.notify("company")
}

func (h *Handler) ListUsers(w stdhttp.ResponseWriter, _ *stdhttp.Request) {
	users, err := h.store.ListUsers()
	if err != nil {
		writeError(w, stdhttp.StatusInternalServerError, "gagal mengambil daftar users")
		return
	}
	writeJSON(w, stdhttp.StatusOK, map[string]any{"users": users})
}

func (h *Handler) ListAuditLogs(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	limit := 100
	if raw := strings.TrimSpace(r.URL.Query().Get("limit")); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil && parsed > 0 {
			if parsed > 500 {
				parsed = 500
			}
			limit = parsed
		}
	}
	page := 1
	if raw := strings.TrimSpace(r.URL.Query().Get("page")); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil && parsed > 0 {
			page = parsed
		}
	}
	offset := (page - 1) * limit

	username := strings.TrimSpace(r.URL.Query().Get("user"))
	action := strings.TrimSpace(r.URL.Query().Get("action"))
	dateFrom := strings.TrimSpace(r.URL.Query().Get("date_from"))
	dateTo := strings.TrimSpace(r.URL.Query().Get("date_to"))

	if dateFrom != "" {
		if _, err := time.Parse("2006-01-02", dateFrom); err != nil {
			writeError(w, stdhttp.StatusBadRequest, "format date_from tidak valid (YYYY-MM-DD)")
			return
		}
	}
	if dateTo != "" {
		if _, err := time.Parse("2006-01-02", dateTo); err != nil {
			writeError(w, stdhttp.StatusBadRequest, "format date_to tidak valid (YYYY-MM-DD)")
			return
		}
	}

	logs, hasMore, err := h.store.ListAuditLogs(store.AuditLogFilter{
		Username: username,
		Action:   action,
		DateFrom: dateFrom,
		DateTo:   dateTo,
		Limit:    limit,
		Offset:   offset,
	})
	if err != nil {
		writeError(w, stdhttp.StatusInternalServerError, "gagal mengambil audit log")
		return
	}
	writeJSON(w, stdhttp.StatusOK, map[string]any{
		"logs":     logs,
		"page":     page,
		"limit":    limit,
		"has_more": hasMore,
	})
}

func (h *Handler) ListAssetTypes(w stdhttp.ResponseWriter, _ *stdhttp.Request) {
	types, err := h.store.ListAssetTypes()
	if err != nil {
		writeError(w, stdhttp.StatusInternalServerError, "gagal mengambil jenis aset")
		return
	}
	writeJSON(w, stdhttp.StatusOK, map[string]any{"types": types})
}

func (h *Handler) CreateAssetType(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	type request struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	var req request
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, stdhttp.StatusBadRequest, "payload tidak valid")
		return
	}
	name := strings.TrimSpace(req.Name)
	if len(name) < 2 {
		writeError(w, stdhttp.StatusBadRequest, "nama jenis minimal 2 karakter")
		return
	}
	created, err := h.store.CreateAssetType(store.CreateAssetTypeInput{
		Name:        name,
		Description: strings.TrimSpace(req.Description),
	})
	if err != nil {
		if isUniqueError(err) {
			writeError(w, stdhttp.StatusConflict, "jenis aset sudah ada")
			return
		}
		writeError(w, stdhttp.StatusInternalServerError, "gagal menambah jenis aset")
		return
	}
	writeJSON(w, stdhttp.StatusCreated, map[string]any{
		"message": "jenis aset berhasil ditambahkan",
		"type":    created,
	})
	h.audit(r, "create", "asset_type", created.ID, fmt.Sprintf("name=%s", created.Name))
	h.notify("asset_types")
}

func (h *Handler) UpdateAssetType(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	typeID, err := parseIDParam(r, "id")
	if err != nil {
		writeError(w, stdhttp.StatusBadRequest, "id jenis aset tidak valid")
		return
	}

	type request struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	var req request
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, stdhttp.StatusBadRequest, "payload tidak valid")
		return
	}

	name := strings.TrimSpace(req.Name)
	if len(name) < 2 {
		writeError(w, stdhttp.StatusBadRequest, "nama jenis minimal 2 karakter")
		return
	}

	updated, err := h.store.UpdateAssetType(typeID, store.UpdateAssetTypeInput{
		Name:        name,
		Description: strings.TrimSpace(req.Description),
	})
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, stdhttp.StatusNotFound, "jenis aset tidak ditemukan")
			return
		}
		if isUniqueError(err) {
			writeError(w, stdhttp.StatusConflict, "jenis aset sudah ada")
			return
		}
		writeError(w, stdhttp.StatusInternalServerError, "gagal mengubah jenis aset")
		return
	}

	writeJSON(w, stdhttp.StatusOK, map[string]any{
		"message": "jenis aset berhasil diubah",
		"type":    updated,
	})
	h.audit(r, "update", "asset_type", updated.ID, fmt.Sprintf("name=%s", updated.Name))
	h.notify("asset_types")
}

func (h *Handler) DeleteAssetType(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	typeID, err := parseIDParam(r, "id")
	if err != nil {
		writeError(w, stdhttp.StatusBadRequest, "id jenis aset tidak valid")
		return
	}

	if err := h.store.DeleteAssetType(typeID); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, stdhttp.StatusNotFound, "jenis aset tidak ditemukan")
			return
		}
		if errors.Is(err, store.ErrConflict) {
			writeError(w, stdhttp.StatusConflict, "jenis aset sedang digunakan")
			return
		}
		writeError(w, stdhttp.StatusInternalServerError, "gagal menghapus jenis aset")
		return
	}
	writeJSON(w, stdhttp.StatusOK, map[string]string{"message": "jenis aset berhasil dihapus"})
	h.audit(r, "delete", "asset_type", typeID, "")
	h.notify("asset_types")
}
func (h *Handler) CreateUser(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	type request struct {
		Username string `json:"username"`
		FullName string `json:"full_name"`
		Password string `json:"password"`
		Role     string `json:"role"`
		IsActive *bool  `json:"is_active"`
	}
	var req request
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, stdhttp.StatusBadRequest, "payload tidak valid")
		return
	}

	req.Username = strings.ToLower(strings.TrimSpace(req.Username))
	req.FullName = strings.TrimSpace(req.FullName)
	req.Role = strings.ToLower(strings.TrimSpace(req.Role))

	if len(req.Username) < 3 {
		writeError(w, stdhttp.StatusBadRequest, "username minimal 3 karakter")
		return
	}
	if len(req.Password) < 6 {
		writeError(w, stdhttp.StatusBadRequest, "password minimal 6 karakter")
		return
	}
	if req.FullName == "" {
		writeError(w, stdhttp.StatusBadRequest, "nama lengkap wajib diisi")
		return
	}
	if !validRole(req.Role) {
		writeError(w, stdhttp.StatusBadRequest, "role harus admin atau staff")
		return
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		writeError(w, stdhttp.StatusInternalServerError, "gagal memproses password")
		return
	}

	created, err := h.store.CreateUser(store.CreateUserInput{
		Username:     req.Username,
		FullName:     req.FullName,
		PasswordHash: hash,
		Role:         req.Role,
		IsActive:     isActive,
	})
	if err != nil {
		if isUniqueError(err) {
			writeError(w, stdhttp.StatusConflict, "username sudah digunakan")
			return
		}
		writeError(w, stdhttp.StatusInternalServerError, "gagal membuat user")
		return
	}

	writeJSON(w, stdhttp.StatusCreated, map[string]any{
		"message": "user berhasil dibuat",
		"user":    created,
	})
	h.audit(r, "create", "user", created.ID, fmt.Sprintf("username=%s", created.Username))
	h.notify("users")
}

func (h *Handler) UpdateUser(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	userID, err := parseIDParam(r, "id")
	if err != nil {
		writeError(w, stdhttp.StatusBadRequest, "id user tidak valid")
		return
	}

	type request struct {
		Username string `json:"username"`
		FullName string `json:"full_name"`
		Password string `json:"password"`
		Role     string `json:"role"`
		IsActive *bool  `json:"is_active"`
	}
	var req request
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, stdhttp.StatusBadRequest, "payload tidak valid")
		return
	}

	req.Username = strings.ToLower(strings.TrimSpace(req.Username))
	req.FullName = strings.TrimSpace(req.FullName)
	req.Role = strings.ToLower(strings.TrimSpace(req.Role))

	if len(req.Username) < 3 {
		writeError(w, stdhttp.StatusBadRequest, "username minimal 3 karakter")
		return
	}
	if req.FullName == "" {
		writeError(w, stdhttp.StatusBadRequest, "nama lengkap wajib diisi")
		return
	}
	if !validRole(req.Role) {
		writeError(w, stdhttp.StatusBadRequest, "role harus admin atau staff")
		return
	}
	if req.IsActive == nil {
		writeError(w, stdhttp.StatusBadRequest, "status aktif wajib diisi")
		return
	}

	var passwordHash *string
	if strings.TrimSpace(req.Password) != "" {
		if len(req.Password) < 6 {
			writeError(w, stdhttp.StatusBadRequest, "password minimal 6 karakter")
			return
		}
		hash, err := auth.HashPassword(req.Password)
		if err != nil {
			writeError(w, stdhttp.StatusInternalServerError, "gagal memproses password")
			return
		}
		passwordHash = &hash
	}

	updated, err := h.store.UpdateUser(userID, store.UpdateUserInput{
		Username:     req.Username,
		FullName:     req.FullName,
		Role:         req.Role,
		IsActive:     *req.IsActive,
		PasswordHash: passwordHash,
	})
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, stdhttp.StatusNotFound, "user tidak ditemukan")
			return
		}
		if isUniqueError(err) {
			writeError(w, stdhttp.StatusConflict, "username sudah digunakan")
			return
		}
		writeError(w, stdhttp.StatusInternalServerError, "gagal mengubah user")
		return
	}

	writeJSON(w, stdhttp.StatusOK, map[string]any{
		"message": "user berhasil diubah",
		"user":    updated,
	})
	h.audit(r, "update", "user", updated.ID, fmt.Sprintf("username=%s", updated.Username))
	h.notify("users")
}

func (h *Handler) DeleteUser(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	userID, err := parseIDParam(r, "id")
	if err != nil {
		writeError(w, stdhttp.StatusBadRequest, "id user tidak valid")
		return
	}

	if claims, ok := claimsFromContext(r.Context()); ok && claims.UserID == userID {
		writeError(w, stdhttp.StatusBadRequest, "tidak bisa menghapus akun sendiri")
		return
	}

	if err := h.store.DeleteUser(userID); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, stdhttp.StatusNotFound, "user tidak ditemukan")
			return
		}
		writeError(w, stdhttp.StatusInternalServerError, "gagal menghapus user")
		return
	}
	writeJSON(w, stdhttp.StatusOK, map[string]string{"message": "user berhasil dihapus"})
	h.audit(r, "delete", "user", userID, "")
	h.notify("users")
}

func (h *Handler) ListAssets(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	limit := 20
	if raw := strings.TrimSpace(r.URL.Query().Get("limit")); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil && parsed > 0 {
			if parsed > 20 {
				parsed = 20
			}
			limit = parsed
		}
	}
	page := 1
	if raw := strings.TrimSpace(r.URL.Query().Get("page")); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil && parsed > 0 {
			page = parsed
		}
	}
	offset := (page - 1) * limit

	dateFrom := strings.TrimSpace(r.URL.Query().Get("date_from"))
	dateTo := strings.TrimSpace(r.URL.Query().Get("date_to"))
	if dateFrom != "" {
		if _, err := time.Parse("2006-01-02", dateFrom); err != nil {
			writeError(w, stdhttp.StatusBadRequest, "format date_from tidak valid (YYYY-MM-DD)")
			return
		}
	}
	if dateTo != "" {
		if _, err := time.Parse("2006-01-02", dateTo); err != nil {
			writeError(w, stdhttp.StatusBadRequest, "format date_to tidak valid (YYYY-MM-DD)")
			return
		}
	}

	var typeID int64
	if raw := strings.TrimSpace(r.URL.Query().Get("type_id")); raw != "" {
		parsed, err := strconv.ParseInt(raw, 10, 64)
		if err != nil || parsed < 0 {
			writeError(w, stdhttp.StatusBadRequest, "type_id tidak valid")
			return
		}
		typeID = parsed
	}
	condition := strings.TrimSpace(r.URL.Query().Get("condition"))

	assets, hasMore, total, err := h.store.ListAssetsPage(store.AssetFilter{
		DateFrom:  dateFrom,
		DateTo:    dateTo,
		TypeID:    typeID,
		Condition: condition,
		Limit:     limit,
		Offset:    offset,
	})
	if err != nil {
		writeError(w, stdhttp.StatusInternalServerError, "gagal mengambil daftar aset")
		return
	}
	writeJSON(w, stdhttp.StatusOK, map[string]any{
		"assets":   assets,
		"total":    total,
		"page":     page,
		"limit":    limit,
		"has_more": hasMore,
	})
}

func (h *Handler) SearchAssets(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	term := strings.TrimSpace(r.URL.Query().Get("q"))
	if term == "" {
		writeJSON(w, stdhttp.StatusOK, map[string]any{"assets": []store.Asset{}})
		return
	}
	limit := 20
	if raw := strings.TrimSpace(r.URL.Query().Get("limit")); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil && parsed > 0 {
			if parsed > 50 {
				parsed = 50
			}
			limit = parsed
		}
	}
	assets, err := h.store.SearchAssets(term, limit)
	if err != nil {
		writeError(w, stdhttp.StatusInternalServerError, "gagal mencari aset")
		return
	}
	writeJSON(w, stdhttp.StatusOK, map[string]any{"assets": assets})
}

func (h *Handler) NextAssetCode(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	purchaseDate := strings.TrimSpace(r.URL.Query().Get("purchase_date"))
	if purchaseDate == "" {
		writeError(w, stdhttp.StatusBadRequest, "purchase_date wajib diisi")
		return
	}
	if _, err := time.Parse("2006-01-02", purchaseDate); err != nil {
		writeError(w, stdhttp.StatusBadRequest, "format tanggal tidak valid")
		return
	}

	seq, err := h.store.NextAssetSequence()
	if err != nil {
		writeError(w, stdhttp.StatusInternalServerError, "gagal menghitung id aset")
		return
	}

	setting, err := h.store.GetCompanySetting()
	if err != nil {
		writeError(w, stdhttp.StatusInternalServerError, "gagal mengambil setting")
		return
	}

	code := buildAssetCode(setting.AssetCodePrefix, purchaseDate, seq)
	writeJSON(w, stdhttp.StatusOK, map[string]any{
		"asset_code": code,
		"sequence":   seq,
	})
}

func (h *Handler) CreateAsset(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	type request struct {
		AssetCode    string `json:"asset_code"`
		Name         string `json:"name"`
		PurchaseDate string `json:"purchase_date"`
		Condition    string `json:"condition"`
		AssetTypeID  int64  `json:"asset_type_id"`
		Barcode      string `json:"barcode"`
	}
	var req request
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, stdhttp.StatusBadRequest, "payload tidak valid")
		return
	}

	if strings.TrimSpace(req.PurchaseDate) == "" {
		writeError(w, stdhttp.StatusBadRequest, "tanggal pembelian wajib diisi")
		return
	}

	exists, err := h.store.AssetTypeExists(req.AssetTypeID)
	if err != nil {
		writeError(w, stdhttp.StatusInternalServerError, "gagal memvalidasi jenis aset")
		return
	}
	if !exists {
		writeError(w, stdhttp.StatusBadRequest, "jenis aset tidak ditemukan")
		return
	}

	seq, err := h.store.NextAssetSequence()
	if err != nil {
		writeError(w, stdhttp.StatusInternalServerError, "gagal menghitung id aset")
		return
	}

	if strings.TrimSpace(req.AssetCode) == "" {
		setting, err := h.store.GetCompanySetting()
		if err != nil {
			writeError(w, stdhttp.StatusInternalServerError, "gagal mengambil setting")
			return
		}
		req.AssetCode = buildAssetCode(setting.AssetCodePrefix, req.PurchaseDate, seq)
	}

	input, ok := normalizeAssetPayload(req.AssetCode, req.Name, req.PurchaseDate, req.Condition, req.Barcode, req.AssetTypeID)
	if !ok {
		writeError(w, stdhttp.StatusBadRequest, "semua field aset wajib diisi dengan format benar")
		return
	}
	if input.Barcode == "" {
		input.Barcode = generateAutoBarcode()
	}

	created, err := h.store.CreateAsset(store.CreateAssetInput{
		AssetCode:     input.AssetCode,
		Name:          input.Name,
		PurchaseDate:  input.PurchaseDate,
		Condition:     input.Condition,
		AssetTypeID:   input.AssetTypeID,
		AssetSequence: seq,
		Barcode:       input.Barcode,
	})
	if err != nil {
		if isUniqueError(err) {
			writeError(w, stdhttp.StatusConflict, "asset id atau barcode sudah digunakan")
			return
		}
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, stdhttp.StatusBadRequest, "jenis aset tidak ditemukan")
			return
		}
		writeError(w, stdhttp.StatusInternalServerError, "gagal menambah aset")
		return
	}
	writeJSON(w, stdhttp.StatusCreated, map[string]any{
		"message": "aset berhasil ditambahkan",
		"asset":   created,
	})
	h.audit(r, "create", "asset", created.ID, fmt.Sprintf("asset_code=%s", created.AssetCode))
	h.notify("assets")
}

func (h *Handler) UpdateAsset(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	assetID, err := parseIDParam(r, "id")
	if err != nil {
		writeError(w, stdhttp.StatusBadRequest, "id aset tidak valid")
		return
	}

	type request struct {
		AssetCode    string `json:"asset_code"`
		Name         string `json:"name"`
		PurchaseDate string `json:"purchase_date"`
		Condition    string `json:"condition"`
		AssetTypeID  int64  `json:"asset_type_id"`
		Barcode      string `json:"barcode"`
	}
	var req request
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, stdhttp.StatusBadRequest, "payload tidak valid")
		return
	}

	exists, err := h.store.AssetTypeExists(req.AssetTypeID)
	if err != nil {
		writeError(w, stdhttp.StatusInternalServerError, "gagal memvalidasi jenis aset")
		return
	}
	if !exists {
		writeError(w, stdhttp.StatusBadRequest, "jenis aset tidak ditemukan")
		return
	}

	input, ok := normalizeAssetPayload(req.AssetCode, req.Name, req.PurchaseDate, req.Condition, req.Barcode, req.AssetTypeID)
	if !ok {
		writeError(w, stdhttp.StatusBadRequest, "semua field aset wajib diisi dengan format benar")
		return
	}
	if input.Barcode == "" {
		current, err := h.store.GetAssetByID(assetID)
		if err != nil {
			if errors.Is(err, store.ErrNotFound) {
				writeError(w, stdhttp.StatusNotFound, "aset tidak ditemukan")
				return
			}
			writeError(w, stdhttp.StatusInternalServerError, "gagal memuat aset")
			return
		}
		input.Barcode = current.Barcode
	}

	updated, err := h.store.UpdateAsset(assetID, store.UpdateAssetInput{
		AssetCode:    input.AssetCode,
		Name:         input.Name,
		PurchaseDate: input.PurchaseDate,
		Condition:    input.Condition,
		AssetTypeID:  input.AssetTypeID,
		Barcode:      input.Barcode,
	})
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, stdhttp.StatusNotFound, "aset tidak ditemukan")
			return
		}
		if isUniqueError(err) {
			writeError(w, stdhttp.StatusConflict, "asset id atau barcode sudah digunakan")
			return
		}
		writeError(w, stdhttp.StatusInternalServerError, "gagal mengubah aset")
		return
	}

	writeJSON(w, stdhttp.StatusOK, map[string]any{
		"message": "aset berhasil diubah",
		"asset":   updated,
	})
	h.audit(r, "update", "asset", updated.ID, fmt.Sprintf("asset_code=%s", updated.AssetCode))
	h.notify("assets")
}

func (h *Handler) DeleteAsset(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	assetID, err := parseIDParam(r, "id")
	if err != nil {
		writeError(w, stdhttp.StatusBadRequest, "id aset tidak valid")
		return
	}

	asset, _ := h.store.GetAssetByID(assetID)
	if err := h.store.DeleteAsset(assetID); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, stdhttp.StatusNotFound, "aset tidak ditemukan")
			return
		}
		writeError(w, stdhttp.StatusInternalServerError, "gagal menghapus aset")
		return
	}

	writeJSON(w, stdhttp.StatusOK, map[string]string{"message": "aset berhasil dihapus"})
	detail := ""
	if asset.ID != 0 {
		detail = fmt.Sprintf("asset_code=%s", asset.AssetCode)
	}
	h.audit(r, "delete", "asset", assetID, detail)
	h.notify("assets")
}

func (h *Handler) UploadAssetPhoto(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	assetID, err := parseIDParam(r, "id")
	if err != nil {
		writeError(w, stdhttp.StatusBadRequest, "id aset tidak valid")
		return
	}

	if _, err := h.store.GetAssetByID(assetID); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, stdhttp.StatusNotFound, "aset tidak ditemukan")
			return
		}
		writeError(w, stdhttp.StatusInternalServerError, "gagal memuat aset")
		return
	}

	r.Body = stdhttp.MaxBytesReader(w, r.Body, 12<<20)
	if err := r.ParseMultipartForm(12 << 20); err != nil {
		writeError(w, stdhttp.StatusBadRequest, "file terlalu besar atau form tidak valid")
		return
	}

	file, _, err := r.FormFile("photo")
	if err != nil {
		writeError(w, stdhttp.StatusBadRequest, "file foto tidak ditemukan")
		return
	}
	defer file.Close()

	fullPath, thumbPath, err := h.saveAssetImageVariants(file, fmt.Sprintf("asset-%d", assetID))
	if err != nil {
		writeError(w, stdhttp.StatusBadRequest, err.Error())
		return
	}

	asset, err := h.store.UpdateAssetPhoto(assetID, fullPath, thumbPath)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, stdhttp.StatusNotFound, "aset tidak ditemukan")
			return
		}
		writeError(w, stdhttp.StatusInternalServerError, "gagal menyimpan foto")
		return
	}

	writeJSON(w, stdhttp.StatusOK, map[string]any{
		"message": "foto aset berhasil diupload",
		"asset":   asset,
	})
	h.audit(r, "upload", "asset_photo", asset.ID, fmt.Sprintf("asset_code=%s", asset.AssetCode))
	h.notify("assets")
}

func (h *Handler) DecodeBarcodeFromPhoto(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	r.Body = stdhttp.MaxBytesReader(w, r.Body, 10<<20)
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		writeError(w, stdhttp.StatusBadRequest, "file terlalu besar atau form tidak valid")
		return
	}

	file, _, err := r.FormFile("photo")
	if err != nil {
		writeError(w, stdhttp.StatusBadRequest, "file foto tidak ditemukan")
		return
	}
	defer file.Close()

	img, _, err := image.Decode(file)
	if err != nil {
		writeError(w, stdhttp.StatusBadRequest, "format gambar tidak didukung")
		return
	}

	value, format, err := decodeBarcodeText(img)
	if err != nil {
		writeError(w, stdhttp.StatusUnprocessableEntity, "barcode tidak terdeteksi dari foto")
		return
	}

	writeJSON(w, stdhttp.StatusOK, map[string]any{
		"value":  value,
		"format": format,
	})
}

func decodeBarcodeText(img image.Image) (string, string, error) {
	decodeHints := map[gozxing.DecodeHintType]interface{}{
		gozxing.DecodeHintType_TRY_HARDER:   true,
		gozxing.DecodeHintType_ALSO_INVERTED: true,
	}

	readers := []func() gozxing.Reader{
		oned.NewCode128Reader,
		oned.NewCode39Reader,
		oned.NewCode93Reader,
		oned.NewCodaBarReader,
		oned.NewITFReader,
		oned.NewEAN13Reader,
		oned.NewEAN8Reader,
		oned.NewUPCAReader,
		oned.NewUPCEReader,
		qrcode.NewQRCodeReader,
	}

	for _, variant := range buildDecodeImageVariants(img) {
		bitmap, err := gozxing.NewBinaryBitmapFromImage(variant)
		if err != nil {
			continue
		}
		for _, newReader := range readers {
			reader := newReader()
			result, err := reader.Decode(bitmap, decodeHints)
			if err != nil || result == nil {
				result, err = reader.DecodeWithoutHints(bitmap)
			}
			reader.Reset()
			if err != nil || result == nil {
				continue
			}
			value := strings.TrimSpace(result.GetText())
			if value == "" {
				continue
			}
			return value, fmt.Sprintf("%v", result.GetBarcodeFormat()), nil
		}
	}

	return "", "", errors.New("barcode tidak ditemukan")
}

func buildDecodeImageVariants(img image.Image) []image.Image {
	if img == nil {
		return nil
	}
	bounds := img.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()
	if width <= 0 || height <= 0 {
		return []image.Image{img}
	}

	type decodeVariant struct {
		crop    float64
		scale   float64
		anchors [][2]float64
	}

	variants := []decodeVariant{
		{
			crop:  1,
			scale: 1.3,
			anchors: [][2]float64{
				{0.5, 0.5},
			},
		},
		{
			crop:  0.82,
			scale: 1.7,
			anchors: [][2]float64{
				{0.5, 0.5},
				{0, 0.5},
				{1, 0.5},
				{0.5, 0},
				{0.5, 1},
			},
		},
		{
			crop:  0.66,
			scale: 2.1,
			anchors: [][2]float64{
				{0.5, 0.5},
				{0, 0.5},
				{1, 0.5},
				{0.5, 0},
				{0.5, 1},
				{0, 0},
				{1, 0},
				{0, 1},
				{1, 1},
			},
		},
	}

	results := make([]image.Image, 0, 18)
	seen := make(map[string]struct{})

	appendVariant := func(src image.Image, sx, sy, cropW, cropH int, scale float64) {
		key := fmt.Sprintf("%d:%d:%d:%d:%.2f", sx, sy, cropW, cropH, scale)
		if _, ok := seen[key]; ok {
			return
		}
		seen[key] = struct{}{}

		rect := image.Rect(bounds.Min.X+sx, bounds.Min.Y+sy, bounds.Min.X+sx+cropW, bounds.Min.Y+sy+cropH)
		cropped := cropImage(src, rect)
		if scale > 1 {
			cropped = scaleImage(cropped, scale)
		}
		results = append(results, cropped)
	}

	for _, variant := range variants {
		cropW := int(math.Round(float64(width) * variant.crop))
		cropH := int(math.Round(float64(height) * variant.crop))
		if cropW < 1 {
			cropW = 1
		}
		if cropH < 1 {
			cropH = 1
		}
		if cropW > width {
			cropW = width
		}
		if cropH > height {
			cropH = height
		}

		maxSX := width - cropW
		maxSY := height - cropH
		for _, anchor := range variant.anchors {
			sx := int(math.Round(float64(maxSX) * anchor[0]))
			sy := int(math.Round(float64(maxSY) * anchor[1]))
			if sx < 0 {
				sx = 0
			}
			if sy < 0 {
				sy = 0
			}
			if sx > maxSX {
				sx = maxSX
			}
			if sy > maxSY {
				sy = maxSY
			}
			appendVariant(img, sx, sy, cropW, cropH, variant.scale)
		}
	}

	if len(results) == 0 {
		return []image.Image{img}
	}
	return results
}

func cropImage(img image.Image, rect image.Rectangle) image.Image {
	dst := image.NewRGBA(image.Rect(0, 0, rect.Dx(), rect.Dy()))
	draw.CatmullRom.Scale(dst, dst.Bounds(), img, rect, draw.Over, nil)
	return dst
}

func scaleImage(img image.Image, scale float64) image.Image {
	if scale <= 1 {
		return img
	}
	bounds := img.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()
	newW := int(math.Round(float64(width) * scale))
	newH := int(math.Round(float64(height) * scale))
	if newW < 1 {
		newW = 1
	}
	if newH < 1 {
		newH = 1
	}
	dst := image.NewRGBA(image.Rect(0, 0, newW, newH))
	draw.CatmullRom.Scale(dst, dst.Bounds(), img, bounds, draw.Over, nil)
	return dst
}

func (h *Handler) ExportAssetsCSV(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	assets, err := h.store.ListAssets()
	if err != nil {
		writeError(w, stdhttp.StatusInternalServerError, "gagal mengambil daftar aset")
		return
	}

	filename := fmt.Sprintf("rck-assets-%s.csv", time.Now().Format("20060102-150405"))
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", filename))

	writer := csv.NewWriter(w)
	defer writer.Flush()

	_ = writer.Write([]string{"ID", "Asset Code", "Nama", "Jenis", "Tanggal Pembelian", "Kondisi", "Barcode", "Foto URL", "Created At", "Updated At"})
	for _, asset := range assets {
		photoURL := publicAssetURL(r, asset.PhotoPath)
		_ = writer.Write([]string{
			strconv.FormatInt(asset.ID, 10),
			asset.AssetCode,
			asset.Name,
			asset.AssetType,
			asset.PurchaseDate,
			asset.Condition,
			asset.Barcode,
			photoURL,
			asset.CreatedAt.Format(time.RFC3339),
			asset.UpdatedAt.Format(time.RFC3339),
		})
	}
}

func (h *Handler) ExportAssetTypesCSV(w stdhttp.ResponseWriter, _ *stdhttp.Request) {
	types, err := h.store.ListAssetTypes()
	if err != nil {
		writeError(w, stdhttp.StatusInternalServerError, "gagal mengambil daftar jenis aset")
		return
	}

	filename := fmt.Sprintf("rck-asset-types-%s.csv", time.Now().Format("20060102-150405"))
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", filename))

	writer := csv.NewWriter(w)
	defer writer.Flush()

	_ = writer.Write([]string{"ID", "Nama Jenis", "Keterangan", "Jumlah Aset", "Created At"})
	for _, item := range types {
		_ = writer.Write([]string{
			strconv.FormatInt(item.ID, 10),
			item.Name,
			item.Description,
			strconv.FormatInt(item.AssetCount, 10),
			item.CreatedAt.Format(time.RFC3339),
		})
	}
}

func (h *Handler) ExportLoansCSV(w stdhttp.ResponseWriter, _ *stdhttp.Request) {
	loans, err := h.store.ListLoans()
	if err != nil {
		writeError(w, stdhttp.StatusInternalServerError, "gagal mengambil daftar peminjaman")
		return
	}

	filename := fmt.Sprintf("rck-loans-%s.csv", time.Now().Format("20060102-150405"))
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", filename))

	writer := csv.NewWriter(w)
	defer writer.Flush()

	_ = writer.Write([]string{
		"Loan ID",
		"Nama Peminjam",
		"Kontak",
		"Tanggal Pinjam",
		"Kode Aset",
		"Nama Aset",
		"Tanggal Kembali",
		"Status",
		"Catatan",
		"Created At",
		"Updated At",
	})

	for _, loan := range loans {
		if len(loan.Items) == 0 {
			_ = writer.Write([]string{
				strconv.FormatInt(loan.ID, 10),
				loan.BorrowerName,
				loan.BorrowerContact,
				loan.BorrowDate,
				"",
				"",
				"",
				"-",
				loan.Notes,
				loan.CreatedAt.Format(time.RFC3339),
				loan.UpdatedAt.Format(time.RFC3339),
			})
			continue
		}

		for _, item := range loan.Items {
			returnDate := strings.TrimSpace(item.ReturnDate)
			status := "Dipinjam"
			if returnDate != "" {
				status = "Dikembalikan"
			}
			_ = writer.Write([]string{
				strconv.FormatInt(loan.ID, 10),
				loan.BorrowerName,
				loan.BorrowerContact,
				loan.BorrowDate,
				item.AssetCode,
				item.AssetName,
				returnDate,
				status,
				loan.Notes,
				loan.CreatedAt.Format(time.RFC3339),
				loan.UpdatedAt.Format(time.RFC3339),
			})
		}
	}
}

func (h *Handler) ImportAssetTypesCSV(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	records, err := readCSVUpload(w, r, 10<<20)
	if err != nil {
		writeError(w, stdhttp.StatusBadRequest, err.Error())
		return
	}
	if len(records) < 2 {
		writeError(w, stdhttp.StatusBadRequest, "file CSV tidak berisi data")
		return
	}

	header := csvHeaderIndex(records[0])
	nameCol, ok := findCSVColumn(header, "nama jenis", "name")
	if !ok {
		writeError(w, stdhttp.StatusBadRequest, "format CSV jenis aset tidak sesuai header export")
		return
	}
	descriptionCol, _ := findCSVColumn(header, "keterangan", "description")

	existingTypes, err := h.store.ListAssetTypes()
	if err != nil {
		writeError(w, stdhttp.StatusInternalServerError, "gagal mengambil jenis aset")
		return
	}
	typesByName := map[string]store.AssetType{}
	for _, item := range existingTypes {
		typesByName[normalizeTextKey(item.Name)] = item
	}

	var processed, created, updated int
	for i, record := range records[1:] {
		line := i + 2
		if csvRecordEmpty(record) {
			continue
		}
		name := strings.TrimSpace(csvColumn(record, nameCol))
		if len(name) < 2 {
			writeError(w, stdhttp.StatusBadRequest, fmt.Sprintf("baris %d: nama jenis minimal 2 karakter", line))
			return
		}
		description := strings.TrimSpace(csvColumn(record, descriptionCol))
		key := normalizeTextKey(name)
		if current, exists := typesByName[key]; exists {
			result, err := h.store.UpdateAssetType(current.ID, store.UpdateAssetTypeInput{
				Name:        name,
				Description: description,
			})
			if err != nil {
				if isUniqueError(err) {
					writeError(w, stdhttp.StatusConflict, fmt.Sprintf("baris %d: nama jenis sudah digunakan", line))
					return
				}
				writeError(w, stdhttp.StatusInternalServerError, fmt.Sprintf("baris %d: gagal mengubah jenis aset", line))
				return
			}
			typesByName[key] = result
			updated++
		} else {
			result, err := h.store.CreateAssetType(store.CreateAssetTypeInput{
				Name:        name,
				Description: description,
			})
			if err != nil {
				if isUniqueError(err) {
					writeError(w, stdhttp.StatusConflict, fmt.Sprintf("baris %d: nama jenis sudah digunakan", line))
					return
				}
				writeError(w, stdhttp.StatusInternalServerError, fmt.Sprintf("baris %d: gagal menambah jenis aset", line))
				return
			}
			typesByName[key] = result
			created++
		}
		processed++
	}

	if processed == 0 {
		writeError(w, stdhttp.StatusBadRequest, "tidak ada baris data valid untuk diimport")
		return
	}

	message := fmt.Sprintf(
		"import jenis aset selesai: diproses %d, ditambah %d, diubah %d",
		processed,
		created,
		updated,
	)
	writeJSON(w, stdhttp.StatusOK, map[string]any{
		"message":   message,
		"processed": processed,
		"created":   created,
		"updated":   updated,
	})
	h.audit(r, "import", "asset_type", int64(processed), fmt.Sprintf("created=%d updated=%d", created, updated))
	h.notify("asset_types")
}

func (h *Handler) ImportAssetsCSV(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	records, err := readCSVUpload(w, r, 20<<20)
	if err != nil {
		writeError(w, stdhttp.StatusBadRequest, err.Error())
		return
	}
	if len(records) < 2 {
		writeError(w, stdhttp.StatusBadRequest, "file CSV tidak berisi data")
		return
	}

	header := csvHeaderIndex(records[0])
	assetCodeCol, ok := findCSVColumn(header, "asset code", "asset_code", "kode aset", "id aset")
	if !ok {
		writeError(w, stdhttp.StatusBadRequest, "format CSV aset tidak sesuai header export")
		return
	}
	nameCol, ok := findCSVColumn(header, "nama", "name")
	if !ok {
		writeError(w, stdhttp.StatusBadRequest, "format CSV aset tidak sesuai header export")
		return
	}
	typeNameCol, ok := findCSVColumn(header, "jenis", "jenis aset", "asset type", "asset_type")
	if !ok {
		writeError(w, stdhttp.StatusBadRequest, "format CSV aset tidak sesuai header export")
		return
	}
	purchaseDateCol, ok := findCSVColumn(header, "tanggal pembelian", "purchase date", "purchase_date", "tgl beli")
	if !ok {
		writeError(w, stdhttp.StatusBadRequest, "format CSV aset tidak sesuai header export")
		return
	}
	conditionCol, ok := findCSVColumn(header, "kondisi", "condition")
	if !ok {
		writeError(w, stdhttp.StatusBadRequest, "format CSV aset tidak sesuai header export")
		return
	}
	barcodeCol, _ := findCSVColumn(header, "barcode")
	photoURLCol, _ := findCSVColumn(header, "foto url", "photo url", "foto", "photo")

	existingTypes, err := h.store.ListAssetTypes()
	if err != nil {
		writeError(w, stdhttp.StatusInternalServerError, "gagal mengambil jenis aset")
		return
	}
	typesByName := map[string]store.AssetType{}
	for _, item := range existingTypes {
		typesByName[normalizeTextKey(item.Name)] = item
	}

	resolveType := func(typeName string, line int) (store.AssetType, error) {
		key := normalizeTextKey(typeName)
		if key == "" {
			return store.AssetType{}, fmt.Errorf("baris %d: jenis aset wajib diisi", line)
		}
		if item, ok := typesByName[key]; ok {
			return item, nil
		}

		createdType, err := h.store.CreateAssetType(store.CreateAssetTypeInput{
			Name:        strings.TrimSpace(typeName),
			Description: "",
		})
		if err != nil {
			if isUniqueError(err) {
				latestTypes, reloadErr := h.store.ListAssetTypes()
				if reloadErr != nil {
					return store.AssetType{}, fmt.Errorf("baris %d: gagal memvalidasi jenis aset", line)
				}
				for _, t := range latestTypes {
					typesByName[normalizeTextKey(t.Name)] = t
				}
				if item, ok := typesByName[key]; ok {
					return item, nil
				}
			}
			return store.AssetType{}, fmt.Errorf("baris %d: gagal menambah jenis aset %q", line, strings.TrimSpace(typeName))
		}
		typesByName[key] = createdType
		return createdType, nil
	}

	var processed, created, updated, autoCreatedTypes int
	for i, record := range records[1:] {
		line := i + 2
		if csvRecordEmpty(record) {
			continue
		}

		assetCode := strings.TrimSpace(csvColumn(record, assetCodeCol))
		name := strings.TrimSpace(csvColumn(record, nameCol))
		typeName := strings.TrimSpace(csvColumn(record, typeNameCol))
		purchaseDate := strings.TrimSpace(csvColumn(record, purchaseDateCol))
		condition := strings.TrimSpace(csvColumn(record, conditionCol))
		barcode := strings.TrimSpace(csvColumn(record, barcodeCol))
		photoURL := strings.TrimSpace(csvColumn(record, photoURLCol))

		if assetCode == "" {
			writeError(w, stdhttp.StatusBadRequest, fmt.Sprintf("baris %d: asset code wajib diisi", line))
			return
		}
		if name == "" {
			writeError(w, stdhttp.StatusBadRequest, fmt.Sprintf("baris %d: nama aset wajib diisi", line))
			return
		}
		if purchaseDate == "" {
			writeError(w, stdhttp.StatusBadRequest, fmt.Sprintf("baris %d: tanggal pembelian wajib diisi", line))
			return
		}
		if _, err := time.Parse("2006-01-02", purchaseDate); err != nil {
			writeError(w, stdhttp.StatusBadRequest, fmt.Sprintf("baris %d: format tanggal pembelian harus YYYY-MM-DD", line))
			return
		}
		if condition == "" {
			writeError(w, stdhttp.StatusBadRequest, fmt.Sprintf("baris %d: kondisi aset wajib diisi", line))
			return
		}

		typeKey := normalizeTextKey(typeName)
		_, typeExistsBefore := typesByName[typeKey]
		assetType, err := resolveType(typeName, line)
		if err != nil {
			writeError(w, stdhttp.StatusBadRequest, err.Error())
			return
		}
		if !typeExistsBefore {
			autoCreatedTypes++
		}

		existingAsset, getErr := h.store.GetAssetByCode(assetCode)
		if getErr != nil && !errors.Is(getErr, store.ErrNotFound) {
			writeError(w, stdhttp.StatusInternalServerError, fmt.Sprintf("baris %d: gagal memuat aset", line))
			return
		}

		if errors.Is(getErr, store.ErrNotFound) {
			seq, err := h.store.NextAssetSequence()
			if err != nil {
				writeError(w, stdhttp.StatusInternalServerError, fmt.Sprintf("baris %d: gagal menghitung sequence aset", line))
				return
			}
			if barcode == "" {
				barcode = generateAutoBarcode()
			}

			createdAsset, err := h.store.CreateAsset(store.CreateAssetInput{
				AssetCode:     assetCode,
				Name:          name,
				PurchaseDate:  purchaseDate,
				Condition:     condition,
				AssetTypeID:   assetType.ID,
				AssetSequence: seq,
				Barcode:       barcode,
			})
			if err != nil {
				if isUniqueError(err) {
					writeError(w, stdhttp.StatusConflict, fmt.Sprintf("baris %d: asset code atau barcode sudah digunakan", line))
					return
				}
				writeError(w, stdhttp.StatusInternalServerError, fmt.Sprintf("baris %d: gagal menambah aset", line))
				return
			}
			if photoURL != "" {
				if _, err := h.store.UpdateAssetPhoto(createdAsset.ID, photoURL, photoURL); err != nil {
					writeError(w, stdhttp.StatusInternalServerError, fmt.Sprintf("baris %d: gagal menyimpan foto aset", line))
					return
				}
			}
			created++
		} else {
			if barcode == "" {
				barcode = existingAsset.Barcode
			}
			if barcode == "" {
				barcode = generateAutoBarcode()
			}
			updatedAsset, err := h.store.UpdateAsset(existingAsset.ID, store.UpdateAssetInput{
				AssetCode:    assetCode,
				Name:         name,
				PurchaseDate: purchaseDate,
				Condition:    condition,
				AssetTypeID:  assetType.ID,
				Barcode:      barcode,
			})
			if err != nil {
				if isUniqueError(err) {
					writeError(w, stdhttp.StatusConflict, fmt.Sprintf("baris %d: asset code atau barcode sudah digunakan", line))
					return
				}
				writeError(w, stdhttp.StatusInternalServerError, fmt.Sprintf("baris %d: gagal mengubah aset", line))
				return
			}
			if photoURL != "" {
				if _, err := h.store.UpdateAssetPhoto(updatedAsset.ID, photoURL, photoURL); err != nil {
					writeError(w, stdhttp.StatusInternalServerError, fmt.Sprintf("baris %d: gagal menyimpan foto aset", line))
					return
				}
			}
			updated++
		}
		processed++
	}

	if processed == 0 {
		writeError(w, stdhttp.StatusBadRequest, "tidak ada baris data valid untuk diimport")
		return
	}

	message := fmt.Sprintf(
		"import aset selesai: diproses %d, ditambah %d, diubah %d, jenis otomatis %d",
		processed,
		created,
		updated,
		autoCreatedTypes,
	)
	writeJSON(w, stdhttp.StatusOK, map[string]any{
		"message":            message,
		"processed":          processed,
		"created":            created,
		"updated":            updated,
		"auto_created_types": autoCreatedTypes,
	})
	h.audit(
		r,
		"import",
		"asset",
		int64(processed),
		fmt.Sprintf("created=%d updated=%d auto_types=%d", created, updated, autoCreatedTypes),
	)
	h.notify("assets")
	if autoCreatedTypes > 0 {
		h.notify("asset_types")
	}
}

func (h *Handler) ImportLoansCSV(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	records, err := readCSVUpload(w, r, 20<<20)
	if err != nil {
		writeError(w, stdhttp.StatusBadRequest, err.Error())
		return
	}
	if len(records) < 2 {
		writeError(w, stdhttp.StatusBadRequest, "file CSV tidak berisi data")
		return
	}

	header := csvHeaderIndex(records[0])
	loanIDCol, _ := findCSVColumn(header, "loan id", "id peminjaman")
	borrowerCol, ok := findCSVColumn(header, "nama peminjam", "borrower")
	if !ok {
		writeError(w, stdhttp.StatusBadRequest, "format CSV peminjaman tidak sesuai header export")
		return
	}
	contactCol, _ := findCSVColumn(header, "kontak", "contact")
	borrowDateCol, ok := findCSVColumn(header, "tanggal pinjam", "borrow date", "borrow_date")
	if !ok {
		writeError(w, stdhttp.StatusBadRequest, "format CSV peminjaman tidak sesuai header export")
		return
	}
	assetCodeCol, ok := findCSVColumn(header, "kode aset", "asset code", "asset_code")
	if !ok {
		writeError(w, stdhttp.StatusBadRequest, "format CSV peminjaman tidak sesuai header export")
		return
	}
	returnDateCol, _ := findCSVColumn(header, "tanggal kembali", "return date", "return_date")
	notesCol, _ := findCSVColumn(header, "catatan", "notes")

	type loanImportItem struct {
		Line       int
		AssetCode  string
		ReturnDate string
	}
	type loanImportGroup struct {
		Line            int
		Key             string
		BorrowerName    string
		BorrowerContact string
		BorrowDate      string
		Notes           string
		Items           []loanImportItem
	}

	groups := map[string]*loanImportGroup{}
	order := make([]string, 0, len(records))
	for i, record := range records[1:] {
		line := i + 2
		if csvRecordEmpty(record) {
			continue
		}

		loanKey := strings.TrimSpace(csvColumn(record, loanIDCol))
		if loanKey == "" {
			loanKey = fmt.Sprintf("row-%d", line)
		}
		borrowerName := strings.TrimSpace(csvColumn(record, borrowerCol))
		borrowerContact := strings.TrimSpace(csvColumn(record, contactCol))
		borrowDate := strings.TrimSpace(csvColumn(record, borrowDateCol))
		assetCode := strings.TrimSpace(csvColumn(record, assetCodeCol))
		returnDate := strings.TrimSpace(csvColumn(record, returnDateCol))
		notes := strings.TrimSpace(csvColumn(record, notesCol))

		if borrowerName == "" {
			writeError(w, stdhttp.StatusBadRequest, fmt.Sprintf("baris %d: nama peminjam wajib diisi", line))
			return
		}
		if borrowDate == "" {
			writeError(w, stdhttp.StatusBadRequest, fmt.Sprintf("baris %d: tanggal pinjam wajib diisi", line))
			return
		}
		if _, err := time.Parse("2006-01-02", borrowDate); err != nil {
			writeError(w, stdhttp.StatusBadRequest, fmt.Sprintf("baris %d: format tanggal pinjam harus YYYY-MM-DD", line))
			return
		}
		if assetCode == "" {
			writeError(w, stdhttp.StatusBadRequest, fmt.Sprintf("baris %d: kode aset wajib diisi", line))
			return
		}
		if returnDate != "" {
			if _, err := time.Parse("2006-01-02", returnDate); err != nil {
				writeError(w, stdhttp.StatusBadRequest, fmt.Sprintf("baris %d: format tanggal kembali harus YYYY-MM-DD", line))
				return
			}
		}

		group, exists := groups[loanKey]
		if !exists {
			group = &loanImportGroup{
				Line:            line,
				Key:             loanKey,
				BorrowerName:    borrowerName,
				BorrowerContact: borrowerContact,
				BorrowDate:      borrowDate,
				Notes:           notes,
				Items:           make([]loanImportItem, 0, 4),
			}
			groups[loanKey] = group
			order = append(order, loanKey)
		} else {
			if group.BorrowerName != borrowerName || group.BorrowDate != borrowDate || group.Notes != notes || group.BorrowerContact != borrowerContact {
				writeError(w, stdhttp.StatusBadRequest, fmt.Sprintf("baris %d: data header peminjaman tidak konsisten untuk loan id %q", line, loanKey))
				return
			}
		}

		group.Items = append(group.Items, loanImportItem{
			Line:       line,
			AssetCode:  assetCode,
			ReturnDate: returnDate,
		})
	}

	if len(groups) == 0 {
		writeError(w, stdhttp.StatusBadRequest, "tidak ada baris data valid untuk diimport")
		return
	}

	groupList := make([]loanImportGroup, 0, len(order))
	for _, key := range order {
		group := groups[key]
		if group == nil {
			continue
		}
		groupList = append(groupList, *group)
	}
	sort.Slice(groupList, func(i, j int) bool {
		if groupList[i].BorrowDate == groupList[j].BorrowDate {
			return groupList[i].Line < groupList[j].Line
		}
		return groupList[i].BorrowDate < groupList[j].BorrowDate
	})

	assetIDCache := map[string]int64{}
	resolveAssetID := func(assetCode string, line int) (int64, error) {
		key := normalizeTextKey(assetCode)
		if key == "" {
			return 0, fmt.Errorf("baris %d: kode aset wajib diisi", line)
		}
		if assetID, ok := assetIDCache[key]; ok {
			return assetID, nil
		}
		asset, err := h.store.GetAssetByCode(assetCode)
		if err != nil {
			if errors.Is(err, store.ErrNotFound) {
				return 0, fmt.Errorf("baris %d: aset %q tidak ditemukan", line, assetCode)
			}
			return 0, fmt.Errorf("baris %d: gagal memvalidasi aset %q", line, assetCode)
		}
		assetIDCache[key] = asset.ID
		return asset.ID, nil
	}

	var createdLoans, updatedLoans, returnedItems int
	for _, group := range groupList {
		seenAssetCode := map[string]struct{}{}
		assetIDs := make([]int64, 0, len(group.Items))
		returnByCode := map[string]string{}
		for _, item := range group.Items {
			key := normalizeTextKey(item.AssetCode)
			if _, exists := seenAssetCode[key]; exists {
				writeError(w, stdhttp.StatusBadRequest, fmt.Sprintf("baris %d: kode aset duplikat dalam satu peminjaman", item.Line))
				return
			}
			seenAssetCode[key] = struct{}{}
			assetID, err := resolveAssetID(item.AssetCode, item.Line)
			if err != nil {
				writeError(w, stdhttp.StatusBadRequest, err.Error())
				return
			}
			assetIDs = append(assetIDs, assetID)
			returnByCode[key] = strings.TrimSpace(item.ReturnDate)
		}

		targetLoanID := int64(0)
		useUpdate := false
		if parsedLoanID, parseErr := strconv.ParseInt(strings.TrimSpace(group.Key), 10, 64); parseErr == nil && parsedLoanID > 0 {
			_, loanErr := h.store.GetLoanByID(parsedLoanID)
			if loanErr == nil {
				useUpdate = true
				targetLoanID = parsedLoanID
			} else if !errors.Is(loanErr, store.ErrNotFound) {
				writeError(w, stdhttp.StatusInternalServerError, fmt.Sprintf("gagal memvalidasi loan id %q", group.Key))
				return
			}
		}

		for _, item := range group.Items {
			if strings.TrimSpace(item.ReturnDate) != "" {
				continue
			}
			assetID, err := resolveAssetID(item.AssetCode, item.Line)
			if err != nil {
				writeError(w, stdhttp.StatusBadRequest, err.Error())
				return
			}
			exists, err := h.store.ActiveLoanExists(assetID, targetLoanID)
			if err != nil {
				writeError(w, stdhttp.StatusInternalServerError, fmt.Sprintf("gagal memeriksa status aset %q", item.AssetCode))
				return
			}
			if exists {
				writeError(w, stdhttp.StatusConflict, fmt.Sprintf("baris %d: aset %q masih dipinjam", item.Line, item.AssetCode))
				return
			}
		}

		var savedLoan store.Loan
		if useUpdate {
			updatedLoan, err := h.store.UpdateLoan(targetLoanID, store.UpdateLoanInput{
				BorrowerName:    group.BorrowerName,
				BorrowerContact: group.BorrowerContact,
				BorrowDate:      group.BorrowDate,
				Notes:           group.Notes,
				AssetIDs:        assetIDs,
			})
			if err != nil {
				if errors.Is(err, store.ErrNotFound) {
					writeError(w, stdhttp.StatusNotFound, fmt.Sprintf("loan id %q tidak ditemukan", group.Key))
					return
				}
				if isUniqueError(err) || errors.Is(err, store.ErrConflict) {
					writeError(w, stdhttp.StatusConflict, fmt.Sprintf("gagal import loan %q: konflik data aset yang sedang dipinjam", group.Key))
					return
				}
				writeError(w, stdhttp.StatusBadRequest, fmt.Sprintf("gagal update loan %q: %v", group.Key, err))
				return
			}
			savedLoan = updatedLoan
			updatedLoans++
		} else {
			createdLoan, err := h.store.CreateLoan(store.CreateLoanInput{
				BorrowerName:    group.BorrowerName,
				BorrowerContact: group.BorrowerContact,
				BorrowDate:      group.BorrowDate,
				Notes:           group.Notes,
				AssetIDs:        assetIDs,
			})
			if err != nil {
				if isUniqueError(err) || errors.Is(err, store.ErrConflict) {
					writeError(w, stdhttp.StatusConflict, fmt.Sprintf("gagal import loan %q: konflik data aset yang sedang dipinjam", group.Key))
					return
				}
				writeError(w, stdhttp.StatusBadRequest, fmt.Sprintf("gagal import loan %q: %v", group.Key, err))
				return
			}
			savedLoan = createdLoan
			createdLoans++
		}

		itemByCode := map[string]store.LoanItem{}
		for _, createdItem := range savedLoan.Items {
			itemByCode[normalizeTextKey(createdItem.AssetCode)] = createdItem
		}
		for codeKey, returnDate := range returnByCode {
			loanItem, ok := itemByCode[codeKey]
			if !ok {
				writeError(w, stdhttp.StatusInternalServerError, fmt.Sprintf("gagal menandai return untuk loan %q: item aset tidak ditemukan", group.Key))
				return
			}
			if _, err := h.store.MarkLoanItemReturned(savedLoan.ID, loanItem.ID, returnDate); err != nil {
				writeError(w, stdhttp.StatusInternalServerError, fmt.Sprintf("gagal menandai return untuk loan %q", group.Key))
				return
			}
			if returnDate != "" {
				returnedItems++
			}
		}
	}

	message := fmt.Sprintf(
		"import peminjaman selesai: loan dibuat %d, loan diupdate %d, item dikembalikan %d",
		createdLoans,
		updatedLoans,
		returnedItems,
	)
	writeJSON(w, stdhttp.StatusOK, map[string]any{
		"message":        message,
		"created_loans":  createdLoans,
		"updated_loans":  updatedLoans,
		"returned_items": returnedItems,
	})
	h.audit(r, "import", "loan", int64(createdLoans+updatedLoans), fmt.Sprintf("created=%d updated=%d returned_items=%d", createdLoans, updatedLoans, returnedItems))
	h.notify("loans")
}

func (h *Handler) ListLoans(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	limit := 20
	if raw := strings.TrimSpace(r.URL.Query().Get("limit")); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil && parsed > 0 {
			if parsed > 20 {
				parsed = 20
			}
			limit = parsed
		}
	}
	page := 1
	if raw := strings.TrimSpace(r.URL.Query().Get("page")); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil && parsed > 0 {
			page = parsed
		}
	}
	offset := (page - 1) * limit

	dateFrom := strings.TrimSpace(r.URL.Query().Get("date_from"))
	dateTo := strings.TrimSpace(r.URL.Query().Get("date_to"))
	if dateFrom != "" {
		if _, err := time.Parse("2006-01-02", dateFrom); err != nil {
			writeError(w, stdhttp.StatusBadRequest, "format date_from tidak valid (YYYY-MM-DD)")
			return
		}
	}
	if dateTo != "" {
		if _, err := time.Parse("2006-01-02", dateTo); err != nil {
			writeError(w, stdhttp.StatusBadRequest, "format date_to tidak valid (YYYY-MM-DD)")
			return
		}
	}

	loans, hasMore, err := h.store.ListLoansPage(store.LoanFilter{
		DateFrom: dateFrom,
		DateTo:   dateTo,
		Limit:    limit,
		Offset:   offset,
	})
	if err != nil {
		writeError(w, stdhttp.StatusInternalServerError, "gagal mengambil daftar peminjaman")
		return
	}
	writeJSON(w, stdhttp.StatusOK, map[string]any{
		"loans":    loans,
		"page":     page,
		"limit":    limit,
		"has_more": hasMore,
	})
}

func (h *Handler) CreateLoan(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	type request struct {
		AssetIDs        []int64 `json:"asset_ids"`
		BorrowerName    string  `json:"borrower_name"`
		BorrowerContact *string `json:"borrower_contact"`
		BorrowDate      string  `json:"borrow_date"`
		Notes           *string `json:"notes"`
	}
	var req request
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, stdhttp.StatusBadRequest, "payload tidak valid")
		return
	}

	input, ok := normalizeLoanPayload(
		req.AssetIDs,
		req.BorrowerName,
		optionalString(req.BorrowerContact),
		req.BorrowDate,
		optionalString(req.Notes),
	)
	if !ok {
		writeError(w, stdhttp.StatusBadRequest, "data peminjaman tidak lengkap")
		return
	}

	for _, assetID := range input.AssetIDs {
		if _, err := h.store.GetAssetByID(assetID); err != nil {
			if errors.Is(err, store.ErrNotFound) {
				writeError(w, stdhttp.StatusBadRequest, "aset tidak ditemukan")
				return
			}
			writeError(w, stdhttp.StatusInternalServerError, "gagal memvalidasi aset")
			return
		}
		exists, err := h.store.ActiveLoanExists(assetID, 0)
		if err != nil {
			writeError(w, stdhttp.StatusInternalServerError, "gagal memeriksa status peminjaman")
			return
		}
		if exists {
			writeError(w, stdhttp.StatusConflict, "ada aset yang masih dipinjam, kembalikan dulu")
			return
		}
	}

	created, err := h.store.CreateLoan(store.CreateLoanInput{
		BorrowerName:    input.BorrowerName,
		BorrowerContact: input.BorrowerContact,
		BorrowDate:      input.BorrowDate,
		Notes:           input.Notes,
		AssetIDs:        input.AssetIDs,
	})
	if err != nil {
		writeError(w, stdhttp.StatusInternalServerError, "gagal menambah peminjaman")
		return
	}
	writeJSON(w, stdhttp.StatusCreated, map[string]any{
		"message": "peminjaman berhasil ditambahkan",
		"loan":    created,
	})
	h.audit(r, "create", "loan", created.ID, fmt.Sprintf("borrower=%s", created.BorrowerName))
	h.notify("loans")
}

func (h *Handler) UpdateLoan(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	loanID, err := parseIDParam(r, "id")
	if err != nil {
		writeError(w, stdhttp.StatusBadRequest, "id peminjaman tidak valid")
		return
	}

	type request struct {
		AssetIDs        []int64 `json:"asset_ids"`
		BorrowerName    string  `json:"borrower_name"`
		BorrowerContact *string `json:"borrower_contact"`
		BorrowDate      string  `json:"borrow_date"`
		Notes           *string `json:"notes"`
	}
	var req request
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, stdhttp.StatusBadRequest, "payload tidak valid")
		return
	}

	input, ok := normalizeLoanPayload(
		req.AssetIDs,
		req.BorrowerName,
		optionalString(req.BorrowerContact),
		req.BorrowDate,
		optionalString(req.Notes),
	)
	if !ok {
		writeError(w, stdhttp.StatusBadRequest, "data peminjaman tidak lengkap")
		return
	}

	for _, assetID := range input.AssetIDs {
		if _, err := h.store.GetAssetByID(assetID); err != nil {
			if errors.Is(err, store.ErrNotFound) {
				writeError(w, stdhttp.StatusBadRequest, "aset tidak ditemukan")
				return
			}
			writeError(w, stdhttp.StatusInternalServerError, "gagal memvalidasi aset")
			return
		}
		exists, err := h.store.ActiveLoanExists(assetID, loanID)
		if err != nil {
			writeError(w, stdhttp.StatusInternalServerError, "gagal memeriksa status peminjaman")
			return
		}
		if exists {
			writeError(w, stdhttp.StatusConflict, "ada aset yang masih dipinjam, kembalikan dulu")
			return
		}
	}

	updated, err := h.store.UpdateLoan(loanID, store.UpdateLoanInput{
		BorrowerName:    input.BorrowerName,
		BorrowerContact: input.BorrowerContact,
		BorrowDate:      input.BorrowDate,
		Notes:           input.Notes,
		AssetIDs:        input.AssetIDs,
	})
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, stdhttp.StatusNotFound, "peminjaman tidak ditemukan")
			return
		}
		writeError(w, stdhttp.StatusInternalServerError, "gagal mengubah peminjaman")
		return
	}

	writeJSON(w, stdhttp.StatusOK, map[string]any{
		"message": "peminjaman berhasil diubah",
		"loan":    updated,
	})
	h.audit(r, "update", "loan", updated.ID, fmt.Sprintf("borrower=%s", updated.BorrowerName))
	h.notify("loans")
}

func (h *Handler) ReturnLoan(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	loanID, err := parseIDParam(r, "id")
	if err != nil {
		writeError(w, stdhttp.StatusBadRequest, "id peminjaman tidak valid")
		return
	}

	itemID, err := parseIDParam(r, "itemId")
	if err != nil {
		writeError(w, stdhttp.StatusBadRequest, "id item tidak valid")
		return
	}

	today := time.Now().Format("2006-01-02")
	updated, err := h.store.MarkLoanItemReturned(loanID, itemID, today)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, stdhttp.StatusNotFound, "peminjaman tidak ditemukan")
			return
		}
		writeError(w, stdhttp.StatusInternalServerError, "gagal mengembalikan aset")
		return
	}

	writeJSON(w, stdhttp.StatusOK, map[string]any{
		"message": "aset berhasil dikembalikan",
		"loan":    updated,
	})
	h.audit(r, "update", "loan_return", loanID, fmt.Sprintf("item_id=%d", itemID))
	h.notify("loans")
}

func (h *Handler) DeleteLoan(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	loanID, err := parseIDParam(r, "id")
	if err != nil {
		writeError(w, stdhttp.StatusBadRequest, "id peminjaman tidak valid")
		return
	}

	if err := h.store.DeleteLoan(loanID); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, stdhttp.StatusNotFound, "peminjaman tidak ditemukan")
			return
		}
		writeError(w, stdhttp.StatusInternalServerError, "gagal menghapus peminjaman")
		return
	}

	writeJSON(w, stdhttp.StatusOK, map[string]string{"message": "peminjaman berhasil dihapus"})
	h.audit(r, "delete", "loan", loanID, "")
	h.notify("loans")
}

func (h *Handler) claimsFromRequest(r *stdhttp.Request) (*auth.Claims, error) {
	token := extractToken(r)
	if token == "" {
		return nil, errors.New("token kosong")
	}
	return h.tokenManager.ParseToken(token)
}

func extractToken(r *stdhttp.Request) string {
	authorization := strings.TrimSpace(r.Header.Get("Authorization"))
	if strings.HasPrefix(strings.ToLower(authorization), "bearer ") {
		return strings.TrimSpace(authorization[7:])
	}

	cookie, err := r.Cookie("rck_token")
	if err == nil {
		return strings.TrimSpace(cookie.Value)
	}
	return ""
}

func clientIP(r *stdhttp.Request) string {
	if r == nil {
		return ""
	}
	host := r.RemoteAddr
	if idx := strings.LastIndex(host, ":"); idx != -1 {
		return host[:idx]
	}
	return host
}

func isSecureRequest(r *stdhttp.Request) bool {
	if r == nil {
		return false
	}
	if r.TLS != nil {
		return true
	}
	if strings.EqualFold(r.Header.Get("X-Forwarded-Proto"), "https") {
		return true
	}
	if strings.EqualFold(r.Header.Get("X-Forwarded-Ssl"), "on") {
		return true
	}
	return false
}

func sameOrigin(r *stdhttp.Request) bool {
	if r == nil {
		return false
	}
	origin := strings.TrimSpace(r.Header.Get("Origin"))
	if origin == "" {
		origin = strings.TrimSpace(r.Header.Get("Referer"))
	}
	if origin == "" {
		return true
	}
	parsed, err := url.Parse(origin)
	if err != nil {
		return false
	}
	if parsed.Host == "" {
		return false
	}
	return strings.EqualFold(parsed.Host, r.Host)
}

func (h *Handler) audit(r *stdhttp.Request, action, entity string, entityID int64, detail string) {
	if h == nil || h.store == nil {
		return
	}
	var userID int64
	var username string
	var role string
	if claims, ok := claimsFromContext(r.Context()); ok {
		userID = claims.UserID
		username = claims.Username
		role = claims.Role
	}
	_ = h.store.CreateAuditLog(store.CreateAuditLogInput{
		UserID:    userID,
		Username:  username,
		Role:      role,
		Action:    action,
		Entity:    entity,
		EntityID:  entityID,
		Detail:    detail,
		IP:        clientIP(r),
		UserAgent: r.UserAgent(),
	})
	h.notify("audit")
}

func (h *Handler) auditWithUser(r *stdhttp.Request, user store.User, action, entity string, entityID int64, detail string) {
	if h == nil || h.store == nil {
		return
	}
	_ = h.store.CreateAuditLog(store.CreateAuditLogInput{
		UserID:    user.ID,
		Username:  user.Username,
		Role:      user.Role,
		Action:    action,
		Entity:    entity,
		EntityID:  entityID,
		Detail:    detail,
		IP:        clientIP(r),
		UserAgent: r.UserAgent(),
	})
	h.notify("audit")
}

func (h *Handler) auditExternal(r *stdhttp.Request, action, entity string, entityID int64, detail string) {
	if h == nil || h.store == nil {
		return
	}
	_ = h.store.CreateAuditLog(store.CreateAuditLogInput{
		UserID:    0,
		Username:  "",
		Role:      "",
		Action:    action,
		Entity:    entity,
		EntityID:  entityID,
		Detail:    detail,
		IP:        clientIP(r),
		UserAgent: r.UserAgent(),
	})
	h.notify("audit")
}

func (h *Handler) ensureCSRFToken(w stdhttp.ResponseWriter, r *stdhttp.Request) {
	if r == nil {
		return
	}
	if cookie, err := r.Cookie("rck_csrf"); err == nil && strings.TrimSpace(cookie.Value) != "" {
		return
	}
	token := generateCSRFToken()
	stdhttp.SetCookie(w, &stdhttp.Cookie{
		Name:     "rck_csrf",
		Value:    token,
		Path:     "/",
		HttpOnly: false,
		SameSite: stdhttp.SameSiteLaxMode,
		Secure:   isSecureRequest(r),
	})
}

func generateCSRFToken() string {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return fmt.Sprintf("csrf-%d", time.Now().UnixNano())
	}
	return base64.RawURLEncoding.EncodeToString(buf)
}

func (h *Handler) setAuthCookie(w stdhttp.ResponseWriter, token string, r *stdhttp.Request) {
	stdhttp.SetCookie(w, &stdhttp.Cookie{
		Name:     "rck_token",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		SameSite: stdhttp.SameSiteLaxMode,
		Secure:   isSecureRequest(r),
		MaxAge:   int(h.cfg.TokenTTL.Seconds()),
		Expires:  time.Now().Add(h.cfg.TokenTTL),
	})
}

func readCSVUpload(w stdhttp.ResponseWriter, r *stdhttp.Request, maxBytes int64) ([][]string, error) {
	if r == nil {
		return nil, errors.New("request tidak valid")
	}
	r.Body = stdhttp.MaxBytesReader(w, r.Body, maxBytes)
	if err := r.ParseMultipartForm(maxBytes); err != nil {
		return nil, errors.New("file terlalu besar atau form tidak valid")
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		return nil, errors.New("file CSV tidak ditemukan")
	}
	defer file.Close()

	reader := csv.NewReader(file)
	reader.TrimLeadingSpace = true
	reader.FieldsPerRecord = -1
	records, err := reader.ReadAll()
	if err != nil {
		return nil, errors.New("format CSV tidak valid")
	}
	if len(records) == 0 {
		return nil, errors.New("file CSV kosong")
	}
	return records, nil
}

func csvHeaderIndex(header []string) map[string]int {
	index := make(map[string]int, len(header))
	for i, raw := range header {
		key := normalizeCSVHeader(raw)
		if key == "" {
			continue
		}
		index[key] = i
	}
	return index
}

func findCSVColumn(index map[string]int, names ...string) (int, bool) {
	for _, name := range names {
		key := normalizeCSVHeader(name)
		if key == "" {
			continue
		}
		if i, ok := index[key]; ok {
			return i, true
		}
	}
	return -1, false
}

func csvColumn(record []string, idx int) string {
	if idx < 0 || idx >= len(record) {
		return ""
	}
	return record[idx]
}

func csvRecordEmpty(record []string) bool {
	for _, value := range record {
		if strings.TrimSpace(strings.TrimPrefix(value, "\ufeff")) != "" {
			return false
		}
	}
	return true
}

func normalizeCSVHeader(value string) string {
	value = strings.TrimSpace(strings.TrimPrefix(value, "\ufeff"))
	value = strings.ToLower(value)
	value = strings.ReplaceAll(value, "_", " ")
	value = strings.ReplaceAll(value, "-", " ")
	value = strings.Join(strings.Fields(value), " ")
	return value
}

func normalizeTextKey(value string) string {
	value = strings.TrimSpace(strings.TrimPrefix(value, "\ufeff"))
	value = strings.ToLower(value)
	value = strings.Join(strings.Fields(value), " ")
	return value
}

func decodeJSON(r *stdhttp.Request, dst any) error {
	if r == nil {
		return errors.New("request kosong")
	}
	contentType := strings.TrimSpace(r.Header.Get("Content-Type"))
	if !strings.HasPrefix(strings.ToLower(contentType), "application/json") {
		return errors.New("content-type harus application/json")
	}
	defer r.Body.Close()
	decoder := json.NewDecoder(io.LimitReader(r.Body, 1<<20))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(dst); err != nil {
		return err
	}
	if decoder.More() {
		return errors.New("payload berlebihan")
	}
	return nil
}

func writeJSON(w stdhttp.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Pragma", "no-cache")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeError(w stdhttp.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func parseIDParam(r *stdhttp.Request, param string) (int64, error) {
	raw := chi.URLParam(r, param)
	return strconv.ParseInt(raw, 10, 64)
}

func validRole(role string) bool {
	switch strings.ToLower(strings.TrimSpace(role)) {
	case "admin", "staff":
		return true
	default:
		return false
	}
}

func normalizeAssetPayload(assetCode, name, purchaseDate, condition, barcode string, assetTypeID int64) (store.CreateAssetInput, bool) {
	assetCode = strings.TrimSpace(assetCode)
	name = strings.TrimSpace(name)
	purchaseDate = strings.TrimSpace(purchaseDate)
	condition = strings.TrimSpace(condition)
	barcode = strings.TrimSpace(barcode)

	if assetCode == "" || name == "" || purchaseDate == "" || condition == "" || assetTypeID <= 0 {
		return store.CreateAssetInput{}, false
	}
	if _, err := time.Parse("2006-01-02", purchaseDate); err != nil {
		return store.CreateAssetInput{}, false
	}
	return store.CreateAssetInput{
		AssetCode:    assetCode,
		Name:         name,
		PurchaseDate: purchaseDate,
		Condition:    condition,
		AssetTypeID:  assetTypeID,
		Barcode:      barcode,
	}, true
}

func generateAutoBarcode() string {
	return fmt.Sprintf("AUTO-%d", time.Now().UnixNano())
}

func normalizeLoanPayload(assetIDs []int64, borrowerName, borrowerContact, borrowDate, notes string) (store.UpdateLoanInput, bool) {
	borrowerName = strings.TrimSpace(borrowerName)
	borrowerContact = strings.TrimSpace(borrowerContact)
	borrowDate = strings.TrimSpace(borrowDate)
	notes = strings.TrimSpace(notes)

	cleanIDs := make([]int64, 0, len(assetIDs))
	seen := map[int64]struct{}{}
	for _, id := range assetIDs {
		if id <= 0 {
			continue
		}
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		cleanIDs = append(cleanIDs, id)
	}

	if len(cleanIDs) == 0 || borrowerName == "" || borrowDate == "" {
		return store.UpdateLoanInput{}, false
	}
	if _, err := time.Parse("2006-01-02", borrowDate); err != nil {
		return store.UpdateLoanInput{}, false
	}

	return store.UpdateLoanInput{
		BorrowerName:    borrowerName,
		BorrowerContact: borrowerContact,
		BorrowDate:      borrowDate,
		Notes:           notes,
		AssetIDs:        cleanIDs,
	}, true
}

func optionalString(value *string) string {
	if value == nil {
		return ""
	}
	return strings.TrimSpace(*value)
}

func sanitizeAssetPrefix(prefix string) string {
	prefix = strings.ToUpper(strings.TrimSpace(prefix))
	if prefix == "" {
		return "RCK"
	}
	clean := make([]rune, 0, len(prefix))
	for _, r := range prefix {
		if (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') {
			clean = append(clean, r)
		}
		if len(clean) >= 6 {
			break
		}
	}
	if len(clean) == 0 {
		return "RCK"
	}
	return string(clean)
}

func buildAssetCode(prefix, purchaseDate string, seq int64) string {
	prefix = sanitizeAssetPrefix(prefix)
	t, err := time.Parse("2006-01-02", purchaseDate)
	if err != nil {
		return prefix
	}
	month := t.Format("01")
	year := t.Format("06")
	seqStr := fmt.Sprintf("%04d", seq)
	if seq >= 10000 {
		seqStr = strconv.FormatInt(seq, 10)
	}
	return fmt.Sprintf("%s%s%s%s", prefix, month, year, seqStr)
}

func isUniqueError(err error) bool {
	if err == nil {
		return false
	}
	message := strings.ToLower(err.Error())
	return strings.Contains(message, "unique constraint") ||
		strings.Contains(message, "duplicate key") ||
		strings.Contains(message, "duplicate entry") ||
		strings.Contains(message, "sqlstate 23505")
}

func resizeToFit(img image.Image, maxWidth, maxHeight int) image.Image {
	bounds := img.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()
	if width <= maxWidth && height <= maxHeight {
		return img
	}

	scaleW := float64(maxWidth) / float64(width)
	scaleH := float64(maxHeight) / float64(height)
	scale := math.Min(scaleW, scaleH)
	newW := int(math.Round(float64(width) * scale))
	newH := int(math.Round(float64(height) * scale))
	if newW < 1 {
		newW = 1
	}
	if newH < 1 {
		newH = 1
	}

	dst := image.NewRGBA(image.Rect(0, 0, newW, newH))
	draw.CatmullRom.Scale(dst, dst.Bounds(), img, bounds, draw.Over, nil)
	return dst
}

func (h *Handler) handleImageUpload(w stdhttp.ResponseWriter, r *stdhttp.Request, prefix string, maxWidth, maxHeight, quality int) (string, error) {
	r.Body = stdhttp.MaxBytesReader(w, r.Body, 10<<20)
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		return "", errors.New("file terlalu besar atau form tidak valid")
	}

	file, _, err := r.FormFile("photo")
	if err != nil {
		return "", errors.New("file foto tidak ditemukan")
	}
	defer file.Close()

	return h.saveImage(file, prefix, maxWidth, maxHeight, quality)
}

func (h *Handler) saveAssetImageVariants(file io.Reader, prefix string) (string, string, error) {
	img, _, err := image.Decode(file)
	if err != nil {
		return "", "", errors.New("format gambar tidak didukung")
	}

	if err := os.MkdirAll(filepath.Join("data", "uploads"), 0o755); err != nil {
		return "", "", errors.New("gagal menyiapkan folder upload")
	}

	// Simpan dua versi: full image untuk detail/export dan thumbnail untuk tabel.
	ts := time.Now().UnixNano()
	fullName := fmt.Sprintf("%s-full-%d.jpg", prefix, ts)
	thumbName := fmt.Sprintf("%s-thumb-%d.jpg", prefix, ts)

	fullPath := filepath.Join("data", "uploads", fullName)
	thumbPath := filepath.Join("data", "uploads", thumbName)

	if err := saveResizedJPEG(fullPath, img, 1920, 1080, 82); err != nil {
		return "", "", errors.New("gagal menyimpan foto full")
	}
	if err := saveResizedJPEG(thumbPath, img, 320, 240, 74); err != nil {
		return "", "", errors.New("gagal menyimpan thumbnail")
	}

	return "/uploads/" + fullName, "/uploads/" + thumbName, nil
}

func saveResizedJPEG(diskPath string, img image.Image, maxWidth, maxHeight, quality int) error {
	resized := resizeToFit(img, maxWidth, maxHeight)
	out, err := os.Create(diskPath)
	if err != nil {
		return err
	}
	defer out.Close()
	return jpeg.Encode(out, resized, &jpeg.Options{Quality: quality})
}

func saveResizedPNG(diskPath string, img image.Image, maxWidth, maxHeight int) error {
	resized := resizeToFit(img, maxWidth, maxHeight)
	out, err := os.Create(diskPath)
	if err != nil {
		return err
	}
	defer out.Close()

	encoder := png.Encoder{CompressionLevel: png.BestSpeed}
	return encoder.Encode(out, resized)
}

func (h *Handler) saveImage(file io.Reader, prefix string, maxWidth, maxHeight, quality int) (string, error) {
	raw, err := io.ReadAll(io.LimitReader(file, 10<<20))
	if err != nil {
		return "", errors.New("gagal membaca file gambar")
	}
	if len(raw) == 0 {
		return "", errors.New("file gambar kosong")
	}
	_ = quality

	if err := os.MkdirAll(filepath.Join("data", "uploads"), 0o755); err != nil {
		return "", errors.New("gagal menyiapkan folder upload")
	}

	if isSVGContent(raw) {
		filename := fmt.Sprintf("%s-%d.svg", prefix, time.Now().UnixNano())
		diskPath := filepath.Join("data", "uploads", filename)
		if err := os.WriteFile(diskPath, raw, 0o644); err != nil {
			return "", errors.New("gagal menyimpan logo SVG")
		}
		return "/uploads/" + filename, nil
	}

	img, _, err := image.Decode(bytes.NewReader(raw))
	if err != nil {
		return "", errors.New("format gambar tidak didukung")
	}

	filename := fmt.Sprintf("%s-%d.png", prefix, time.Now().UnixNano())
	diskPath := filepath.Join("data", "uploads", filename)
	if err := saveResizedPNG(diskPath, img, maxWidth, maxHeight); err != nil {
		return "", errors.New("gagal menyimpan foto")
	}
	return "/uploads/" + filename, nil
}

func isSVGContent(raw []byte) bool {
	if len(raw) == 0 {
		return false
	}
	contentType := strings.ToLower(strings.TrimSpace(stdhttp.DetectContentType(raw)))
	if strings.Contains(contentType, "image/svg+xml") {
		return true
	}

	sampleLen := len(raw)
	if sampleLen > 4096 {
		sampleLen = 4096
	}
	sample := strings.ToLower(string(bytes.TrimSpace(raw[:sampleLen])))
	return strings.Contains(sample, "<svg")
}

func publicAssetURL(r *stdhttp.Request, path string) string {
	path = strings.TrimSpace(path)
	if path == "" {
		return ""
	}
	if strings.HasPrefix(path, "http://") || strings.HasPrefix(path, "https://") {
		return path
	}
	if r == nil || strings.TrimSpace(r.Host) == "" {
		return path
	}
	scheme := "http"
	if isSecureRequest(r) {
		scheme = "https"
	}
	if !strings.HasPrefix(path, "/") {
		path = "/" + path
	}
	return fmt.Sprintf("%s://%s%s", scheme, r.Host, path)
}
