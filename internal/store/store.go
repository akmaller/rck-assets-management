package store

import (
	"database/sql"
	"errors"
	"strings"
	"time"

	"github.com/jmoiron/sqlx"
)

var ErrNotFound = errors.New("record not found")
var ErrConflict = errors.New("conflict")

type Store struct {
	db *sqlx.DB
}

func New(db *sqlx.DB) *Store {
	return &Store{db: db}
}

type CompanySetting struct {
	ID              int64     `db:"id" json:"id"`
	CompanyName     string    `db:"company_name" json:"company_name"`
	Address         string    `db:"address" json:"address"`
	Email           string    `db:"email" json:"email"`
	Phone           string    `db:"phone" json:"phone"`
	Website         string    `db:"website" json:"website"`
	AssetCodePrefix string    `db:"asset_code_prefix" json:"asset_code_prefix"`
	LogoPath        string    `db:"logo_path" json:"logo_url"`
	FaviconPath     string    `db:"favicon_path" json:"favicon_url"`
	UpdatedAt       time.Time `db:"updated_at" json:"updated_at"`
}

type UpdateCompanySettingInput struct {
	CompanyName     string
	Address         string
	Email           string
	Phone           string
	Website         string
	AssetCodePrefix string
}

type User struct {
	ID        int64     `db:"id" json:"id"`
	Username  string    `db:"username" json:"username"`
	FullName  string    `db:"full_name" json:"full_name"`
	Role      string    `db:"role" json:"role"`
	IsActive  bool      `db:"is_active" json:"is_active"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

type UserWithPassword struct {
	User
	PasswordHash string `db:"password_hash"`
}

type CreateUserInput struct {
	Username     string
	FullName     string
	PasswordHash string
	Role         string
	IsActive     bool
}

type UpdateUserInput struct {
	Username     string
	FullName     string
	Role         string
	IsActive     bool
	PasswordHash *string
}

type Asset struct {
	ID             int64     `db:"id" json:"id"`
	AssetCode      string    `db:"asset_code" json:"asset_code"`
	Name           string    `db:"name" json:"name"`
	PurchaseDate   string    `db:"purchase_date" json:"purchase_date"`
	Condition      string    `db:"asset_condition" json:"condition"`
	AssetTypeID    int64     `db:"asset_type_id" json:"asset_type_id"`
	AssetType      string    `db:"asset_type_name" json:"asset_type_name"`
	AssetSequence  int64     `db:"asset_sequence" json:"asset_sequence"`
	Barcode        string    `db:"barcode" json:"barcode"`
	PhotoPath      string    `db:"photo_path" json:"photo_url"`
	PhotoThumbPath string    `db:"photo_thumb_path" json:"photo_thumb_url"`
	LoanStatus     string    `db:"loan_status" json:"loan_status"`
	CreatedAt      time.Time `db:"created_at" json:"created_at"`
	UpdatedAt      time.Time `db:"updated_at" json:"updated_at"`
}

type AssetFilter struct {
	DateFrom  string
	DateTo    string
	TypeID    int64
	Condition string
	Limit     int
	Offset    int
}

type CreateAssetInput struct {
	AssetCode     string
	Name          string
	PurchaseDate  string
	Condition     string
	AssetTypeID   int64
	AssetSequence int64
	Barcode       string
}

type UpdateAssetInput struct {
	AssetCode    string
	Name         string
	PurchaseDate string
	Condition    string
	AssetTypeID  int64
	Barcode      string
}

type AssetType struct {
	ID        int64     `db:"id" json:"id"`
	Name      string    `db:"name" json:"name"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}

type CreateAssetTypeInput struct {
	Name string
}

type Loan struct {
	ID              int64      `db:"id" json:"id"`
	BorrowerName    string     `db:"borrower_name" json:"borrower_name"`
	BorrowerContact string     `db:"borrower_contact" json:"borrower_contact"`
	BorrowDate      string     `db:"borrow_date" json:"borrow_date"`
	Notes           string     `db:"notes" json:"notes"`
	CreatedAt       time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt       time.Time  `db:"updated_at" json:"updated_at"`
	Items           []LoanItem `json:"items"`
}

type LoanFilter struct {
	DateFrom string
	DateTo   string
	Limit    int
	Offset   int
}

type LoanItem struct {
	ID         int64     `db:"id" json:"id"`
	LoanID     int64     `db:"loan_id" json:"loan_id"`
	AssetID    int64     `db:"asset_id" json:"asset_id"`
	AssetCode  string    `db:"asset_code" json:"asset_code"`
	AssetName  string    `db:"asset_name" json:"asset_name"`
	ReturnDate string    `db:"return_date" json:"return_date"`
	CreatedAt  time.Time `db:"created_at" json:"created_at"`
	UpdatedAt  time.Time `db:"updated_at" json:"updated_at"`
}

type CreateLoanInput struct {
	BorrowerName    string
	BorrowerContact string
	BorrowDate      string
	Notes           string
	AssetIDs        []int64
}

type UpdateLoanInput struct {
	BorrowerName    string
	BorrowerContact string
	BorrowDate      string
	Notes           string
	AssetIDs        []int64
}

func (s *Store) GetCompanySetting() (CompanySetting, error) {
	var setting CompanySetting
	query := `
		SELECT id, company_name, address, email, phone, website, asset_code_prefix, logo_path, favicon_path, updated_at
		FROM company_settings
		WHERE id = 1
	`
	err := s.db.Get(&setting, query)
	if errors.Is(err, sql.ErrNoRows) {
		insertQuery := `
			INSERT INTO company_settings (id, company_name, address, email, phone, website)
			VALUES (1, '', '', '', '', '')
		`
		_, err = s.db.Exec(insertQuery)
		if err != nil {
			return setting, err
		}
		err = s.db.Get(&setting, query)
	}
	return setting, err
}

func (s *Store) UpdateCompanySetting(input UpdateCompanySettingInput) (CompanySetting, error) {
	query := s.db.Rebind(`
		UPDATE company_settings
		SET company_name = ?, address = ?, email = ?, phone = ?, website = ?, asset_code_prefix = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = 1
	`)
	res, err := s.db.Exec(query, input.CompanyName, input.Address, input.Email, input.Phone, input.Website, input.AssetCodePrefix)
	if err != nil {
		return CompanySetting{}, err
	}

	rows, err := res.RowsAffected()
	if err == nil && rows == 0 {
		insertQuery := s.db.Rebind(`
			INSERT INTO company_settings (id, company_name, address, email, phone, website, asset_code_prefix)
			VALUES (1, ?, ?, ?, ?, ?, ?)
		`)
		if _, err := s.db.Exec(insertQuery, input.CompanyName, input.Address, input.Email, input.Phone, input.Website, input.AssetCodePrefix); err != nil {
			return CompanySetting{}, err
		}
	}

	return s.GetCompanySetting()
}

func (s *Store) UpdateCompanyLogo(path string) (CompanySetting, error) {
	query := s.db.Rebind(`
		UPDATE company_settings
		SET logo_path = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = 1
	`)
	if _, err := s.db.Exec(query, path); err != nil {
		return CompanySetting{}, err
	}
	return s.GetCompanySetting()
}

func (s *Store) UpdateCompanyFavicon(path string) (CompanySetting, error) {
	query := s.db.Rebind(`
		UPDATE company_settings
		SET favicon_path = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = 1
	`)
	if _, err := s.db.Exec(query, path); err != nil {
		return CompanySetting{}, err
	}
	return s.GetCompanySetting()
}

func (s *Store) GetUserByUsername(username string) (UserWithPassword, error) {
	var user UserWithPassword
	query := s.db.Rebind(`
		SELECT id, username, full_name, password_hash, role, is_active, created_at, updated_at
		FROM users
		WHERE username = ?
		LIMIT 1
	`)
	err := s.db.Get(&user, query, strings.TrimSpace(username))
	if errors.Is(err, sql.ErrNoRows) {
		return user, ErrNotFound
	}
	return user, err
}

func (s *Store) GetUserByID(id int64) (User, error) {
	var user User
	query := s.db.Rebind(`
		SELECT id, username, full_name, role, is_active, created_at, updated_at
		FROM users
		WHERE id = ?
		LIMIT 1
	`)
	err := s.db.Get(&user, query, id)
	if errors.Is(err, sql.ErrNoRows) {
		return user, ErrNotFound
	}
	return user, err
}

func (s *Store) ListUsers() ([]User, error) {
	users := []User{}
	query := `
		SELECT id, username, full_name, role, is_active, created_at, updated_at
		FROM users
		ORDER BY created_at DESC
	`
	err := s.db.Select(&users, query)
	return users, err
}

func (s *Store) CreateUser(input CreateUserInput) (User, error) {
	query := s.db.Rebind(`
		INSERT INTO users (username, full_name, password_hash, role, is_active)
		VALUES (?, ?, ?, ?, ?)
	`)
	_, err := s.db.Exec(query, input.Username, input.FullName, input.PasswordHash, input.Role, input.IsActive)
	if err != nil {
		return User{}, err
	}

	created, err := s.GetUserByUsername(input.Username)
	if err != nil {
		return User{}, err
	}
	return created.User, nil
}

func (s *Store) UpdateUser(id int64, input UpdateUserInput) (User, error) {
	if input.PasswordHash != nil {
		query := s.db.Rebind(`
			UPDATE users
			SET username = ?, full_name = ?, role = ?, is_active = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP
			WHERE id = ?
		`)
		res, err := s.db.Exec(query, input.Username, input.FullName, input.Role, input.IsActive, *input.PasswordHash, id)
		if err != nil {
			return User{}, err
		}
		rows, _ := res.RowsAffected()
		if rows == 0 {
			return User{}, ErrNotFound
		}
		return s.GetUserByID(id)
	}

	query := s.db.Rebind(`
		UPDATE users
		SET username = ?, full_name = ?, role = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`)
	res, err := s.db.Exec(query, input.Username, input.FullName, input.Role, input.IsActive, id)
	if err != nil {
		return User{}, err
	}
	rows, _ := res.RowsAffected()
	if rows == 0 {
		return User{}, ErrNotFound
	}
	return s.GetUserByID(id)
}

func (s *Store) DeleteUser(id int64) error {
	query := s.db.Rebind(`DELETE FROM users WHERE id = ?`)
	res, err := s.db.Exec(query, id)
	if err != nil {
		return err
	}
	rows, _ := res.RowsAffected()
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Store) ListAssets() ([]Asset, error) {
	assets := []Asset{}
	query := `
		SELECT a.id, a.asset_code, a.name, a.purchase_date, a.asset_condition, a.asset_type_id, a.asset_sequence,
		       COALESCE(t.name, '') AS asset_type_name,
		       a.barcode, a.photo_path, a.photo_thumb_path,
		       CASE
		         WHEN EXISTS (
		           SELECT 1 FROM loan_items li
		           WHERE li.asset_id = a.id AND (li.return_date IS NULL OR li.return_date = '')
		         ) THEN 'Dipinjam'
		         ELSE 'Ada'
		       END AS loan_status,
		       a.created_at, a.updated_at
		FROM assets a
		LEFT JOIN asset_types t ON t.id = a.asset_type_id
		ORDER BY a.created_at DESC
	`
	err := s.db.Select(&assets, query)
	return assets, err
}

func (s *Store) SearchAssets(term string, limit int) ([]Asset, error) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 50 {
		limit = 50
	}
	assets := []Asset{}
	query := `
		SELECT a.id, a.asset_code, a.name, a.asset_type_id,
		       COALESCE(t.name, '') AS asset_type_name,
		       a.purchase_date, a.asset_condition, a.barcode, a.photo_path, a.photo_thumb_path,
		       CASE
		         WHEN EXISTS (
		           SELECT 1 FROM loan_items li
		           WHERE li.asset_id = a.id AND (li.return_date IS NULL OR li.return_date = '')
		         ) THEN 'Dipinjam'
		         ELSE 'Ada'
		       END AS loan_status,
		       a.created_at, a.updated_at
		FROM assets a
		LEFT JOIN asset_types t ON t.id = a.asset_type_id
		WHERE LOWER(a.asset_code) LIKE ? OR LOWER(a.name) LIKE ?
		ORDER BY a.created_at DESC, a.id DESC
		LIMIT ?
	`
	like := "%" + strings.ToLower(strings.TrimSpace(term)) + "%"
	query = s.db.Rebind(query)
	if err := s.db.Select(&assets, query, like, like, limit); err != nil {
		return nil, err
	}
	return assets, nil
}

func (s *Store) ListAssetsPage(filter AssetFilter) ([]Asset, bool, int64, error) {
	limit := filter.Limit
	if limit <= 0 {
		limit = 20
	}
	offset := filter.Offset
	if offset < 0 {
		offset = 0
	}
	assets := []Asset{}
	query := `
		SELECT a.id, a.asset_code, a.name, a.purchase_date, a.asset_condition, a.asset_type_id, a.asset_sequence,
		       COALESCE(t.name, '') AS asset_type_name,
		       a.barcode, a.photo_path, a.photo_thumb_path,
		       CASE
		         WHEN EXISTS (
		           SELECT 1 FROM loan_items li
		           WHERE li.asset_id = a.id AND (li.return_date IS NULL OR li.return_date = '')
		         ) THEN 'Dipinjam'
		         ELSE 'Ada'
		       END AS loan_status,
		       a.created_at, a.updated_at
		FROM assets a
		LEFT JOIN asset_types t ON t.id = a.asset_type_id
	`
	args := []any{}
	clauses := []string{}

	if strings.TrimSpace(filter.DateFrom) != "" {
		clauses = append(clauses, "a.purchase_date >= ?")
		args = append(args, strings.TrimSpace(filter.DateFrom))
	}
	if strings.TrimSpace(filter.DateTo) != "" {
		clauses = append(clauses, "a.purchase_date <= ?")
		args = append(args, strings.TrimSpace(filter.DateTo))
	}
	if filter.TypeID > 0 {
		clauses = append(clauses, "a.asset_type_id = ?")
		args = append(args, filter.TypeID)
	}
	if strings.TrimSpace(filter.Condition) != "" {
		clauses = append(clauses, "a.asset_condition = ?")
		args = append(args, strings.TrimSpace(filter.Condition))
	}
	if len(clauses) > 0 {
		query += " WHERE " + strings.Join(clauses, " AND ")
	}

	countQuery := "SELECT COUNT(1) FROM assets a"
	if len(clauses) > 0 {
		countQuery += " WHERE " + strings.Join(clauses, " AND ")
	}
	countQuery = s.db.Rebind(countQuery)
	var total int64
	if err := s.db.Get(&total, countQuery, args...); err != nil {
		return nil, false, 0, err
	}

	query += " ORDER BY a.created_at DESC, a.id DESC LIMIT ? OFFSET ?"
	args = append(args, limit+1, offset)
	query = s.db.Rebind(query)
	if err := s.db.Select(&assets, query, args...); err != nil {
		return nil, false, 0, err
	}
	hasMore := false
	if len(assets) > limit {
		hasMore = true
		assets = assets[:limit]
	}
	return assets, hasMore, total, nil
}

func (s *Store) GetAssetByID(id int64) (Asset, error) {
	var asset Asset
	query := s.db.Rebind(`
		SELECT a.id, a.asset_code, a.name, a.purchase_date, a.asset_condition, a.asset_type_id, a.asset_sequence,
		       COALESCE(t.name, '') AS asset_type_name,
		       a.barcode, a.photo_path, a.photo_thumb_path,
		       CASE
		         WHEN EXISTS (
		           SELECT 1 FROM loan_items li
		           WHERE li.asset_id = a.id AND (li.return_date IS NULL OR li.return_date = '')
		         ) THEN 'Dipinjam'
		         ELSE 'Ada'
		       END AS loan_status,
		       a.created_at, a.updated_at
		FROM assets a
		LEFT JOIN asset_types t ON t.id = a.asset_type_id
		WHERE a.id = ?
		LIMIT 1
	`)
	err := s.db.Get(&asset, query, id)
	if errors.Is(err, sql.ErrNoRows) {
		return asset, ErrNotFound
	}
	return asset, err
}

func (s *Store) CreateAsset(input CreateAssetInput) (Asset, error) {
	query := s.db.Rebind(`
		INSERT INTO assets (asset_code, name, purchase_date, asset_condition, asset_type_id, asset_sequence, barcode)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`)
	_, err := s.db.Exec(query, input.AssetCode, input.Name, input.PurchaseDate, input.Condition, input.AssetTypeID, input.AssetSequence, input.Barcode)
	if err != nil {
		return Asset{}, err
	}

	lookup := s.db.Rebind(`
		SELECT a.id, a.asset_code, a.name, a.purchase_date, a.asset_condition, a.asset_type_id, a.asset_sequence,
		       COALESCE(t.name, '') AS asset_type_name,
		       a.barcode, a.photo_path, a.photo_thumb_path,
		       CASE
		         WHEN EXISTS (
		           SELECT 1 FROM loan_items li
		           WHERE li.asset_id = a.id AND (li.return_date IS NULL OR li.return_date = '')
		         ) THEN 'Dipinjam'
		         ELSE 'Ada'
		       END AS loan_status,
		       a.created_at, a.updated_at
		FROM assets a
		LEFT JOIN asset_types t ON t.id = a.asset_type_id
		WHERE a.asset_code = ?
		LIMIT 1
	`)
	var created Asset
	if err := s.db.Get(&created, lookup, input.AssetCode); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return created, ErrNotFound
		}
		return created, err
	}
	return created, nil
}

func (s *Store) UpdateAsset(id int64, input UpdateAssetInput) (Asset, error) {
	query := s.db.Rebind(`
		UPDATE assets
		SET asset_code = ?, name = ?, purchase_date = ?, asset_condition = ?, asset_type_id = ?, barcode = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`)
	res, err := s.db.Exec(query, input.AssetCode, input.Name, input.PurchaseDate, input.Condition, input.AssetTypeID, input.Barcode, id)
	if err != nil {
		return Asset{}, err
	}
	rows, _ := res.RowsAffected()
	if rows == 0 {
		return Asset{}, ErrNotFound
	}
	return s.GetAssetByID(id)
}

func (s *Store) NextAssetSequence() (int64, error) {
	var seq int64
	query := `SELECT COALESCE(MAX(asset_sequence), 0) + 1 FROM assets`
	if err := s.db.Get(&seq, query); err != nil {
		return 0, err
	}
	return seq, nil
}

func (s *Store) DeleteAsset(id int64) error {
	query := s.db.Rebind(`DELETE FROM assets WHERE id = ?`)
	res, err := s.db.Exec(query, id)
	if err != nil {
		return err
	}
	rows, _ := res.RowsAffected()
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Store) UpdateAssetPhoto(id int64, fullPath, thumbPath string) (Asset, error) {
	query := s.db.Rebind(`
		UPDATE assets
		SET photo_path = ?, photo_thumb_path = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`)
	res, err := s.db.Exec(query, fullPath, thumbPath, id)
	if err != nil {
		return Asset{}, err
	}
	rows, _ := res.RowsAffected()
	if rows == 0 {
		return Asset{}, ErrNotFound
	}
	return s.GetAssetByID(id)
}

func (s *Store) ListAssetTypes() ([]AssetType, error) {
	types := []AssetType{}
	query := `
		SELECT id, name, created_at
		FROM asset_types
		ORDER BY name ASC
	`
	err := s.db.Select(&types, query)
	return types, err
}

func (s *Store) CreateAssetType(input CreateAssetTypeInput) (AssetType, error) {
	query := s.db.Rebind(`
		INSERT INTO asset_types (name)
		VALUES (?)
	`)
	_, err := s.db.Exec(query, input.Name)
	if err != nil {
		return AssetType{}, err
	}

	var created AssetType
	getQuery := s.db.Rebind(`SELECT id, name, created_at FROM asset_types WHERE name = ? LIMIT 1`)
	if err := s.db.Get(&created, getQuery, input.Name); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return created, ErrNotFound
		}
		return created, err
	}
	return created, nil
}

func (s *Store) DeleteAssetType(id int64) error {
	var count int
	countQuery := s.db.Rebind(`SELECT COUNT(1) FROM assets WHERE asset_type_id = ?`)
	if err := s.db.Get(&count, countQuery, id); err != nil {
		return err
	}
	if count > 0 {
		return ErrConflict
	}
	delQuery := s.db.Rebind(`DELETE FROM asset_types WHERE id = ?`)
	res, err := s.db.Exec(delQuery, id)
	if err != nil {
		return err
	}
	rows, _ := res.RowsAffected()
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Store) AssetTypeExists(id int64) (bool, error) {
	if id <= 0 {
		return false, nil
	}
	var count int
	query := s.db.Rebind(`SELECT COUNT(1) FROM asset_types WHERE id = ?`)
	if err := s.db.Get(&count, query, id); err != nil {
		return false, err
	}
	return count > 0, nil
}

func (s *Store) ListLoans() ([]Loan, error) {
	type row struct {
		LoanID          int64     `db:"loan_id"`
		BorrowerName    string    `db:"borrower_name"`
		BorrowerContact string    `db:"borrower_contact"`
		BorrowDate      string    `db:"borrow_date"`
		Notes           string    `db:"notes"`
		LoanCreatedAt   time.Time `db:"loan_created_at"`
		LoanUpdatedAt   time.Time `db:"loan_updated_at"`
		ItemID          int64     `db:"item_id"`
		AssetID         int64     `db:"asset_id"`
		AssetCode       string    `db:"asset_code"`
		AssetName       string    `db:"asset_name"`
		ReturnDate      string    `db:"return_date"`
		ItemCreatedAt   time.Time `db:"item_created_at"`
		ItemUpdatedAt   time.Time `db:"item_updated_at"`
	}

	rows := []row{}
	query := `
		SELECT h.id AS loan_id,
		       h.borrower_name,
		       COALESCE(h.borrower_contact, '') AS borrower_contact,
		       h.borrow_date,
		       COALESCE(h.notes, '') AS notes,
		       h.created_at AS loan_created_at,
		       h.updated_at AS loan_updated_at,
		       i.id AS item_id,
		       i.asset_id,
		       COALESCE(a.asset_code, '') AS asset_code,
		       COALESCE(a.name, '') AS asset_name,
		       COALESCE(i.return_date, '') AS return_date,
		       i.created_at AS item_created_at,
		       i.updated_at AS item_updated_at
		FROM loan_headers h
		LEFT JOIN loan_items i ON i.loan_id = h.id
		LEFT JOIN assets a ON a.id = i.asset_id
		ORDER BY h.created_at DESC, i.id ASC
	`
	if err := s.db.Select(&rows, query); err != nil {
		return nil, err
	}

	loans := []Loan{}
	index := map[int64]*Loan{}
	for _, r := range rows {
		loan, ok := index[r.LoanID]
		if !ok {
			loan = &Loan{
				ID:              r.LoanID,
				BorrowerName:    r.BorrowerName,
				BorrowerContact: r.BorrowerContact,
				BorrowDate:      r.BorrowDate,
				Notes:           r.Notes,
				CreatedAt:       r.LoanCreatedAt,
				UpdatedAt:       r.LoanUpdatedAt,
				Items:           []LoanItem{},
			}
			loans = append(loans, *loan)
			index[r.LoanID] = &loans[len(loans)-1]
		}
		if r.ItemID == 0 {
			continue
		}
		loan.Items = append(loan.Items, LoanItem{
			ID:         r.ItemID,
			LoanID:     r.LoanID,
			AssetID:    r.AssetID,
			AssetCode:  r.AssetCode,
			AssetName:  r.AssetName,
			ReturnDate: r.ReturnDate,
			CreatedAt:  r.ItemCreatedAt,
			UpdatedAt:  r.ItemUpdatedAt,
		})
	}

	return loans, nil
}

func (s *Store) ListLoansPage(filter LoanFilter) ([]Loan, bool, error) {
	limit := filter.Limit
	if limit <= 0 {
		limit = 20
	}
	offset := filter.Offset
	if offset < 0 {
		offset = 0
	}

	query := `
		SELECT id, borrower_name, borrower_contact, borrow_date, notes, created_at, updated_at
		FROM loan_headers
	`
	args := []any{}
	clauses := []string{}
	if strings.TrimSpace(filter.DateFrom) != "" {
		clauses = append(clauses, "borrow_date >= ?")
		args = append(args, strings.TrimSpace(filter.DateFrom))
	}
	if strings.TrimSpace(filter.DateTo) != "" {
		clauses = append(clauses, "borrow_date <= ?")
		args = append(args, strings.TrimSpace(filter.DateTo))
	}
	if len(clauses) > 0 {
		query += " WHERE " + strings.Join(clauses, " AND ")
	}
	query += " ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?"
	args = append(args, limit+1, offset)
	query = s.db.Rebind(query)

	loans := []Loan{}
	if err := s.db.Select(&loans, query, args...); err != nil {
		return nil, false, err
	}

	hasMore := false
	if len(loans) > limit {
		hasMore = true
		loans = loans[:limit]
	}
	if len(loans) == 0 {
		return loans, hasMore, nil
	}

	ids := make([]int64, 0, len(loans))
	index := map[int64]*Loan{}
	for i := range loans {
		loan := &loans[i]
		loan.Items = []LoanItem{}
		ids = append(ids, loan.ID)
		index[loan.ID] = loan
	}

	itemQuery, itemArgs, err := sqlx.In(`
		SELECT i.id, i.loan_id, i.asset_id,
		       COALESCE(a.asset_code, '') AS asset_code,
		       COALESCE(a.name, '') AS asset_name,
		       COALESCE(i.return_date, '') AS return_date,
		       i.created_at, i.updated_at
		FROM loan_items i
		LEFT JOIN assets a ON a.id = i.asset_id
		WHERE i.loan_id IN (?)
		ORDER BY i.loan_id DESC, i.id ASC
	`, ids)
	if err != nil {
		return loans, hasMore, err
	}
	itemQuery = s.db.Rebind(itemQuery)
	items := []LoanItem{}
	if err := s.db.Select(&items, itemQuery, itemArgs...); err != nil {
		return loans, hasMore, err
	}
	for _, item := range items {
		if loan, ok := index[item.LoanID]; ok {
			loan.Items = append(loan.Items, item)
		}
	}
	return loans, hasMore, nil
}

func (s *Store) GetLoanByID(id int64) (Loan, error) {
	loans, err := s.ListLoans()
	if err != nil {
		return Loan{}, err
	}
	for _, loan := range loans {
		if loan.ID == id {
			return loan, nil
		}
	}
	return Loan{}, ErrNotFound
}

func (s *Store) ActiveLoanExists(assetID int64, excludeLoanID int64) (bool, error) {
	if assetID <= 0 {
		return false, nil
	}
	var count int
	query := s.db.Rebind(`
		SELECT COUNT(1)
		FROM loan_items
		WHERE asset_id = ?
		  AND (return_date IS NULL OR return_date = '')
		  AND loan_id != ?
	`)
	if err := s.db.Get(&count, query, assetID, excludeLoanID); err != nil {
		return false, err
	}
	return count > 0, nil
}

func (s *Store) CreateLoan(input CreateLoanInput) (Loan, error) {
	tx, err := s.db.Beginx()
	if err != nil {
		return Loan{}, err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	var loanID int64
	if s.db.DriverName() == "pgx" {
		query := tx.Rebind(`
			INSERT INTO loan_headers (borrower_name, borrower_contact, borrow_date, notes)
			VALUES (?, ?, ?, ?)
			RETURNING id
		`)
		if err = tx.Get(&loanID, query, input.BorrowerName, input.BorrowerContact, input.BorrowDate, input.Notes); err != nil {
			return Loan{}, err
		}
	} else {
		query := tx.Rebind(`
			INSERT INTO loan_headers (borrower_name, borrower_contact, borrow_date, notes)
			VALUES (?, ?, ?, ?)
		`)
		res, execErr := tx.Exec(query, input.BorrowerName, input.BorrowerContact, input.BorrowDate, input.Notes)
		if execErr != nil {
			return Loan{}, execErr
		}
		loanID, err = res.LastInsertId()
		if err != nil {
			return Loan{}, err
		}
	}

	itemQuery := tx.Rebind(`
		INSERT INTO loan_items (loan_id, asset_id)
		VALUES (?, ?)
	`)
	for _, assetID := range input.AssetIDs {
		if _, err = tx.Exec(itemQuery, loanID, assetID); err != nil {
			return Loan{}, err
		}
	}

	if err = tx.Commit(); err != nil {
		return Loan{}, err
	}
	return s.GetLoanByID(loanID)
}

func (s *Store) UpdateLoan(id int64, input UpdateLoanInput) (Loan, error) {
	tx, err := s.db.Beginx()
	if err != nil {
		return Loan{}, err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	updateQuery := tx.Rebind(`
		UPDATE loan_headers
		SET borrower_name = ?, borrower_contact = ?, borrow_date = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`)
	res, err := tx.Exec(updateQuery, input.BorrowerName, input.BorrowerContact, input.BorrowDate, input.Notes, id)
	if err != nil {
		return Loan{}, err
	}
	rows, _ := res.RowsAffected()
	if rows == 0 {
		return Loan{}, ErrNotFound
	}

	type existingItem struct {
		AssetID    int64  `db:"asset_id"`
		ReturnDate string `db:"return_date"`
	}
	existing := []existingItem{}
	existingQuery := tx.Rebind(`SELECT asset_id, COALESCE(return_date, '') AS return_date FROM loan_items WHERE loan_id = ?`)
	if err = tx.Select(&existing, existingQuery, id); err != nil {
		return Loan{}, err
	}
	existingMap := map[int64]string{}
	for _, item := range existing {
		existingMap[item.AssetID] = item.ReturnDate
	}

	delQuery := tx.Rebind(`DELETE FROM loan_items WHERE loan_id = ?`)
	if _, err = tx.Exec(delQuery, id); err != nil {
		return Loan{}, err
	}

	insertQuery := tx.Rebind(`INSERT INTO loan_items (loan_id, asset_id, return_date) VALUES (?, ?, ?)`)
	for _, assetID := range input.AssetIDs {
		returnDate := existingMap[assetID]
		if _, err = tx.Exec(insertQuery, id, assetID, returnDate); err != nil {
			return Loan{}, err
		}
	}

	if err = tx.Commit(); err != nil {
		return Loan{}, err
	}
	return s.GetLoanByID(id)
}

func (s *Store) MarkLoanItemReturned(loanID, itemID int64, returnDate string) (Loan, error) {
	query := s.db.Rebind(`
		UPDATE loan_items
		SET return_date = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = ? AND loan_id = ?
	`)
	res, err := s.db.Exec(query, returnDate, itemID, loanID)
	if err != nil {
		return Loan{}, err
	}
	rows, _ := res.RowsAffected()
	if rows == 0 {
		return Loan{}, ErrNotFound
	}
	return s.GetLoanByID(loanID)
}

func (s *Store) DeleteLoan(id int64) error {
	tx, err := s.db.Beginx()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	delItems := tx.Rebind(`DELETE FROM loan_items WHERE loan_id = ?`)
	if _, err = tx.Exec(delItems, id); err != nil {
		return err
	}
	delLoan := tx.Rebind(`DELETE FROM loan_headers WHERE id = ?`)
	res, err := tx.Exec(delLoan, id)
	if err != nil {
		return err
	}
	rows, _ := res.RowsAffected()
	if rows == 0 {
		return ErrNotFound
	}
	return tx.Commit()
}
