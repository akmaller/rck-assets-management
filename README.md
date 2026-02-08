# RCK-Assets

Aplikasi web manajemen aset berbasis Go dengan arsitektur API-first (JWT), sehingga siap dikembangkan ke aplikasi mobile.

## Fitur

- Landing page berupa single login page.
- Dashboard manajemen aset.
- Setting identitas perusahaan:
  - Nama perusahaan
  - Alamat
  - Email
  - Telepon
  - Website
  - Prefix ID aset
- Setting users (khusus admin):
  - CRUD user login
  - Role `admin` dan `staff`
  - Status aktif/nonaktif
- Registrasi aset:
  - ID Aset (`asset_code`)
  - Nama aset
  - Tanggal pembelian
  - Kondisi
  - Barcode
- Manajemen aset:
  - List aset
  - Edit aset
  - Hapus aset
- DB multi-driver:
  - Default: SQLite
  - Opsi: PostgreSQL dan MySQL

## Teknologi

- Go (net/http + chi router)
- JWT (`github.com/golang-jwt/jwt/v5`)
- SQLX (`github.com/jmoiron/sqlx`)
- Driver DB:
  - SQLite (`modernc.org/sqlite`)
  - PostgreSQL (`github.com/jackc/pgx/v5/stdlib`)
  - MySQL (`github.com/go-sql-driver/mysql`)
- Frontend: HTML + CSS + Vanilla JavaScript

## Menjalankan Aplikasi

1. Install Go 1.22+.
2. Copy konfigurasi:

```bash
cp .env.example .env
```

3. Set environment variable dari `.env` (atau langsung export di shell).
4. Jalankan:

```bash
go mod tidy
go run ./cmd/server
```

5. Buka `http://localhost:8080`.

Default login:

- Username: `admin`
- Password: `admin123`

## Endpoint API Utama

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/settings/company`
- `PUT /api/settings/company`
- `POST /api/settings/company/logo`
- `POST /api/settings/company/favicon`
- `GET /api/settings/company/public`
- `GET /api/events` (SSE)
- `GET /api/asset-types`
- `POST /api/asset-types` (admin)
- `DELETE /api/asset-types/{id}` (admin)
- `GET /api/users` (admin)
- `POST /api/users` (admin)
- `PUT /api/users/{id}` (admin)
- `DELETE /api/users/{id}` (admin)
- `GET /api/assets`
- `GET /api/assets/export.csv`
- `POST /api/assets`
- `POST /api/assets/{id}/photo`
- `PUT /api/assets/{id}`
- `DELETE /api/assets/{id}`

## Catatan Keamanan

- Password disimpan menggunakan bcrypt hash.
- Autentikasi memakai JWT dengan dukungan cookie `HttpOnly` dan `Authorization: Bearer <token>`.
- Kontrol akses role-based (`admin` vs `staff`) di layer API.
