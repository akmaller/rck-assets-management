# RCK-Assets Management

Aplikasi web manajemen aset berbasis Go (API + server-rendered frontend) untuk kebutuhan inventaris, peminjaman, audit aktivitas, dan pengelolaan identitas perusahaan.

## Fitur Utama

- Login single page + session berbasis JWT cookie.
- Sidebar menu:
  - `Tambah Aset`
  - `Manajemen Aset`
  - `Peminjaman`
  - `Jenis Aset`
  - `Setting Users`
  - `Setting Identitas`
  - `Audit Log`
- Manajemen aset:
  - Tambah/edit aset
  - Upload foto aset
  - Simpan 2 varian gambar otomatis saat upload:
    - `full image` untuk detail/export
    - `thumbnail` untuk tabel agar ringan
  - Filter + pagination
  - Export/Import CSV (admin)
- Peminjaman:
  - Buat/edit pinjaman (form dalam modal)
  - Kembalikan item pinjaman
  - Filter + pagination
  - Export/Import CSV (admin)
- Jenis aset:
  - Lihat daftar jenis aset + keterangan + jumlah aset per jenis
  - Tambah/edit/hapus (admin)
  - Export/Import CSV (admin)
- Setting identitas perusahaan (admin):
  - Nama perusahaan, alamat, email, telepon, website, prefix ID aset
  - Upload logo/favicon via modal progress + crop rasio 1:1
  - Mendukung input PNG/JPG/WEBP/SVG
- Barcode:
  - Scan lewat kamera jika tersedia
  - Fallback upload foto barcode (lebih kompatibel lintas device/browser)
- UI:
  - Snackbar untuk notifikasi sukses/warning/error (auto hide)
  - Modal konfirmasi custom (bukan `alert/confirm` bawaan browser)
  - Responsif desktop/mobile

## Role dan Hak Akses

| Modul/Fitur | Admin | Staff |
| --- | --- | --- |
| Tambah aset | Ya | Ya |
| Manajemen aset: lihat/tambah/edit | Ya | Ya |
| Manajemen aset: hapus | Ya | Tidak |
| Manajemen aset: export/import CSV | Ya | Tidak |
| Peminjaman: lihat/tambah/edit/kembalikan item | Ya | Ya |
| Peminjaman: hapus | Ya | Tidak |
| Peminjaman: export/import CSV | Ya | Tidak |
| Jenis aset: lihat daftar | Ya | Ya |
| Jenis aset: tambah/edit/hapus | Ya | Tidak |
| Jenis aset: export/import CSV | Ya | Tidak |
| Setting users | Ya | Tidak |
| Setting identitas | Ya | Tidak |
| Audit log | Ya | Tidak |

Catatan:
- Staff tetap bisa melihat branding perusahaan (menggunakan endpoint publik identitas).
- Pembatasan role diterapkan di frontend dan backend.

## Teknologi

- Go `1.22` (lihat `go.mod`)
- Router: `github.com/go-chi/chi/v5`
- DB access: `github.com/jmoiron/sqlx`
- JWT: `github.com/golang-jwt/jwt/v5`
- Barcode decode backend: `github.com/makiuchi-d/gozxing`
- Driver database:
  - SQLite: `modernc.org/sqlite`
  - PostgreSQL: `github.com/jackc/pgx/v5/stdlib`
  - MySQL: `github.com/go-sql-driver/mysql`
- Frontend: HTML + CSS + Vanilla JavaScript

## Konfigurasi Environment

Contoh `.env`:

```env
APP_NAME=RCK-Assets
HTTP_ADDR=:8080

# sqlite (default)
DB_DRIVER=sqlite
DB_DSN=data/rck_assets.db

# untuk postgres:
# DB_DRIVER=postgres
# DB_DSN=postgres://postgres:postgres@localhost:5432/rck_assets?sslmode=disable

# untuk mysql:
# DB_DRIVER=mysql
# DB_DSN=root:password@tcp(localhost:3306)/rck_assets?parseTime=true

JWT_SECRET=ganti-secret-produksi
TOKEN_TTL=12h
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=admin123
```

## Menjalankan Lokal

1. Pastikan Go `1.22+`.
2. Copy `.env`:

```bash
cp .env.example .env
```

3. Jalankan:

```bash
go mod tidy
go run ./cmd/server
```

4. Buka:
- `http://localhost:8080` (atau sesuai `HTTP_ADDR`)

Default login:
- Username: `admin`
- Password: `admin123`

## Build Binary

```bash
go build -buildvcs=false -o rck-assets ./cmd/server
```

`-buildvcs=false` penting jika environment server tidak lengkap metadata git dan muncul error `error obtaining VCS status`.

## Instalasi Ubuntu 24.04 (systemd + reverse proxy)

### 1) Install Go 1.22+

Jika ada error:
`go.mod file indicates go 1.22, but maximum version supported by tidy is 1.18`
maka Go di server terlalu lama.

Contoh upgrade manual:

```bash
sudo apt remove -y golang-go || true
sudo apt autoremove -y
cd /tmp
wget https://go.dev/dl/go1.22.10.linux-amd64.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.22.10.linux-amd64.tar.gz
echo 'export PATH=/usr/local/go/bin:$PATH' | sudo tee /etc/profile.d/go.sh
source /etc/profile.d/go.sh
go version
```

### 2) Siapkan folder aplikasi

```bash
sudo mkdir -p /opt/rck-assets
sudo chown -R www-data:www-data /opt/rck-assets
```

Salin source ke `/opt/rck-assets`, lalu:

```bash
cd /opt/rck-assets
cp .env.example .env
mkdir -p data data/uploads
```

Disarankan untuk SQLite gunakan path absolut agar konsisten saat dijalankan service:

```env
DB_DRIVER=sqlite
DB_DSN=/opt/rck-assets/data/rck_assets.db
```

### 3) Build

```bash
cd /opt/rck-assets
go mod tidy
go build -buildvcs=false -o rck-assets ./cmd/server
sudo chown www-data:www-data /opt/rck-assets/rck-assets
sudo chmod +x /opt/rck-assets/rck-assets
```

### 4) Buat service systemd

File: `/etc/systemd/system/rck-assets.service`

```ini
[Unit]
Description=RCK Assets Management
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/opt/rck-assets
EnvironmentFile=/opt/rck-assets/.env
ExecStart=/opt/rck-assets/rck-assets
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Aktifkan service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now rck-assets
sudo systemctl status rck-assets
```

### 5) Nginx reverse proxy

Contoh:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 15m;

    location / {
        proxy_pass http://127.0.0.1:8080; # sesuaikan dengan HTTP_ADDR
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/events {
        proxy_pass http://127.0.0.1:8080; # sesuaikan dengan HTTP_ADDR
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_cache off;
    }
}
```

Aktifkan:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Deploy aaPanel / Panel Lain

Jika memakai aaPanel, intinya Nginx tetap reverse proxy ke aplikasi Go.

Checklist:
- Proxy target ke `http://127.0.0.1:<PORT_APP>`
- Forward header:
  - `Host`
  - `X-Real-IP`
  - `X-Forwarded-For`
  - `X-Forwarded-Proto`
- `client_max_body_size 15m`
- Disable buffering untuk `/api/events`
- Nonaktifkan include PHP default bila tidak dipakai

Command reload Nginx aaPanel:

```bash
/www/server/nginx/sbin/nginx -t
/www/server/nginx/sbin/nginx -s reload
```

## Update Aplikasi di Server Ubuntu 22 (via Git)

Panduan ini untuk server yang sudah pernah dideploy sebelumnya.

### 1) Masuk ke folder project

```bash
cd /www/wwwroot/rck-assets-management
```

### 2) Backup cepat sebelum update

```bash
sudo mkdir -p /www/backup/rck-assets
sudo cp -a rck-assets /www/backup/rck-assets/rck-assets-bin-$(date +%F-%H%M%S) 2>/dev/null || true
sudo cp -a data/rck_assets.db /www/backup/rck-assets/rck_assets-$(date +%F-%H%M%S).db 2>/dev/null || true
```

### 3) Tarik perubahan terbaru dari Git

```bash
git fetch origin
git status --short
git pull --ff-only origin main
```

Jika branch deploy bukan `main`, ganti nama branch sesuai branch deploy Anda.

Jika muncul konflik karena ada perubahan lokal:

```bash
git stash push -u -m "pre-update-$(date +%F-%H%M%S)"
git pull --ff-only origin main
```

### 4) Build binary terbaru

```bash
go version
go build -buildvcs=false -o rck-assets ./cmd/server
```

### 5) Set permission binary sesuai user service

Contoh jika service berjalan sebagai user `www`:

```bash
sudo chown www:www rck-assets
sudo chmod +x rck-assets
```

Catatan: sesuaikan user/group dengan isi `User=` dan `Group=` di `/etc/systemd/system/rck-assets.service`.

### 6) Restart service

```bash
sudo systemctl daemon-reload
sudo systemctl restart rck-assets
sudo systemctl status rck-assets --no-pager -l
sudo journalctl -u rck-assets -n 80 --no-pager
```

### 7) Verifikasi aplikasi

```bash
curl -sS http://127.0.0.1:8080/api/health
```

Jika `HTTP_ADDR` Anda bukan `:8080`, sesuaikan port.

Jika memakai aaPanel Nginx:

```bash
/www/server/nginx/sbin/nginx -t
/www/server/nginx/sbin/nginx -s reload
```

### 8) Rollback cepat jika update gagal

```bash
cd /www/wwwroot/rck-assets-management
sudo cp -a /www/backup/rck-assets/rck-assets-bin-YYYY-MM-DD-HHMMSS ./rck-assets
sudo chmod +x rck-assets
sudo chown www:www rck-assets
sudo systemctl restart rck-assets
```

Ganti `YYYY-MM-DD-HHMMSS` dengan nama file backup yang benar.

## Endpoint API dan Akses

Public:
- `GET /api/health`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/settings/company/public`

Authenticated (admin + staff):
- `GET /api/auth/me`
- `GET /api/events`
- `GET /api/asset-types`
- `GET /api/assets`
- `GET /api/assets/search`
- `GET /api/assets/next-id`
- `POST /api/barcode/decode`
- `POST /api/assets`
- `POST /api/assets/{id}/photo`
- `PUT /api/assets/{id}`
- `GET /api/loans`
- `POST /api/loans`
- `PUT /api/loans/{id}`
- `POST /api/loans/{id}/items/{itemId}/return`

Admin only:
- `GET /api/settings/company`
- `PUT /api/settings/company`
- `POST /api/settings/company/logo`
- `POST /api/settings/company/favicon`
- `POST /api/asset-types`
- `PUT /api/asset-types/{id}`
- `DELETE /api/asset-types/{id}`
- `GET /api/asset-types/export.csv`
- `POST /api/asset-types/import.csv`
- `GET /api/assets/export.csv`
- `POST /api/assets/import.csv`
- `DELETE /api/assets/{id}`
- `GET /api/loans/export.csv`
- `POST /api/loans/import.csv`
- `DELETE /api/loans/{id}`
- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/{id}`
- `DELETE /api/users/{id}`
- `GET /api/audit-logs`

## Testing

Jalankan semua test:

```bash
go test ./...
```

Test authorization khusus endpoint:

```bash
go test ./internal/http -run Authorization -v
```

## Troubleshooting

- `status=203/EXEC` pada `systemd`:
  - Cek path `ExecStart` benar dan binary executable.
  - Pastikan file ada, contoh: `/opt/rck-assets/rck-assets`.

- `Failed to load environment files`:
  - Cek `EnvironmentFile` mengarah ke file `.env` yang benar.

- App tetap jalan di `:8080` padahal `.env` sudah `:8444`:
  - Pastikan service membaca `.env` yang benar.
  - Jalankan:
    - `sudo systemctl daemon-reload`
    - `sudo systemctl restart rck-assets`

- `connect database: unable to open database file` atau `readonly database`:
  - Path `DB_DSN` salah atau tidak writable.
  - Pastikan user service punya izin write ke folder `data`.

- `error obtaining VCS status` saat build:
  - Gunakan `go build -buildvcs=false ...`.

- Domain tidak resolve:
  - Pastikan DNS A record sudah mengarah ke IP server.

- Reverse proxy jalan tapi domain belum tembus:
  - Validasi lokal dulu:
    - `curl -I http://127.0.0.1:<PORT_APP>`
  - Lalu validasi via domain dan log Nginx.

- Scanner kamera tidak siap:
  - Beri izin kamera di browser.
  - Gunakan fallback upload foto barcode jika kamera/live scanner tidak tersedia.

## Keamanan

- Password disimpan dengan bcrypt hash.
- JWT disimpan sebagai cookie `HttpOnly`, juga mendukung header `Authorization: Bearer`.
- CSRF protection untuk request write.
- Security headers aktif (`CSP`, `X-Frame-Options`, `Referrer-Policy`, dll).
- Role-based authorization di backend.
