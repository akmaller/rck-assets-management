package store

import (
	"strings"
	"time"
)

type AuditLog struct {
	ID        int64     `db:"id" json:"id"`
	UserID    int64     `db:"user_id" json:"user_id"`
	Username  string    `db:"username" json:"username"`
	Role      string    `db:"role" json:"role"`
	Action    string    `db:"action" json:"action"`
	Entity    string    `db:"entity" json:"entity"`
	EntityID  int64     `db:"entity_id" json:"entity_id"`
	Detail    string    `db:"detail" json:"detail"`
	IP        string    `db:"ip" json:"ip"`
	UserAgent string    `db:"user_agent" json:"user_agent"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}

type CreateAuditLogInput struct {
	UserID    int64
	Username  string
	Role      string
	Action    string
	Entity    string
	EntityID  int64
	Detail    string
	IP        string
	UserAgent string
}

type AuditLogFilter struct {
	Username string
	Action   string
	DateFrom string
	DateTo   string
	Limit    int
	Offset   int
}

func (s *Store) CreateAuditLog(input CreateAuditLogInput) error {
	query := s.db.Rebind(`
        INSERT INTO audit_logs (user_id, username, role, action, entity, entity_id, detail, ip, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
	_, err := s.db.Exec(query, input.UserID, input.Username, input.Role, input.Action, input.Entity, input.EntityID, input.Detail, input.IP, input.UserAgent)
	return err
}

func (s *Store) ListAuditLogs(filter AuditLogFilter) ([]AuditLog, bool, error) {
	limit := filter.Limit
	if limit <= 0 {
		limit = 200
	}
	offset := filter.Offset
	if offset < 0 {
		offset = 0
	}
	logs := []AuditLog{}
	query := `
        SELECT id, user_id, username, role, action, entity, entity_id, detail, ip, user_agent, created_at
        FROM audit_logs
    `
	args := []any{}
	clauses := []string{}

	if strings.TrimSpace(filter.Username) != "" {
		clauses = append(clauses, "LOWER(username) LIKE ?")
		args = append(args, "%"+strings.ToLower(strings.TrimSpace(filter.Username))+"%")
	}
	if strings.TrimSpace(filter.Action) != "" {
		clauses = append(clauses, "LOWER(action) LIKE ?")
		args = append(args, "%"+strings.ToLower(strings.TrimSpace(filter.Action))+"%")
	}
	if strings.TrimSpace(filter.DateFrom) != "" {
		clauses = append(clauses, "created_at >= ?")
		args = append(args, filter.DateFrom+" 00:00:00")
	}
	if strings.TrimSpace(filter.DateTo) != "" {
		clauses = append(clauses, "created_at <= ?")
		args = append(args, filter.DateTo+" 23:59:59")
	}

	if len(clauses) > 0 {
		query += " WHERE " + strings.Join(clauses, " AND ")
	}

	query += " ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?"
	args = append(args, limit+1, offset)
	query = s.db.Rebind(query)
	err := s.db.Select(&logs, query, args...)
	if err != nil {
		return nil, false, err
	}
	hasMore := false
	if len(logs) > limit {
		hasMore = true
		logs = logs[:limit]
	}
	return logs, hasMore, nil
}
