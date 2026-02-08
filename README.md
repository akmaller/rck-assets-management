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

## Instalasi di Server Ubuntu 24.04

Di bawah ini contoh deploy produksi menggunakan `systemd` + reverse proxy (Nginx).

### 0) Pastikan Go 1.22+ (penting)

Jika muncul error seperti:
```
go.mod file indicates go 1.22, but maximum version supported by tidy is 1.18
```
maka Go di server masih lama. Upgrade ke 1.22+ sebelum lanjut:

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


### 1) Siapkan user dan folder aplikasi

```bash
sudo adduser --system --group --home /opt/rck-assets rckassets
sudo mkdir -p /opt/rck-assets
sudo chown -R rckassets:rckassets /opt/rck-assets
```

Upload kode ke `/opt/rck-assets` (git clone atau scp), lalu:

```bash
cd /opt/rck-assets
cp .env.example .env
```

Edit `.env` sesuai kebutuhan. Untuk SQLite, pastikan `DB_DRIVER=sqlite` dan file DB berada di folder yang bisa ditulis.
Disarankan gunakan path absolut agar tidak masalah di `systemd`:
```
DB_DSN=/opt/rck-assets/data/rck_assets.db
```
### 2) Install dependency

```bash
sudo apt update
sudo apt install -y golang-go nginx
```

### 3) Build aplikasi

```bash
cd /opt/rck-assets
go mod tidy
go build -buildvcs=false -o rck-assets ./cmd/server
sudo chown rckassets:rckassets rck-assets
```

Catatan: jika build gagal dengan `error obtaining VCS status`, gunakan `-buildvcs=false` seperti di atas.

### 4) Buat service systemd

Buat file ` /etc/systemd/system/rck-assets.service `:

```ini
[Unit]
Description=RCK Assets Management
After=network.target

[Service]
User=rckassets
Group=rckassets
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

Secara default aplikasi berjalan di `:8080`. Jika di `.env` kamu set `HTTP_ADDR` ke port lain (mis. `:8444`), sesuaikan semua `proxy_pass` ke port tersebut.

### 5) Konfigurasi Nginx (reverse proxy)

Buat config Nginx, misalnya ` /etc/nginx/sites-available/rck-assets `:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 15m;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SSE /api/events butuh buffering dimatikan
    location /api/events {
        proxy_pass http://127.0.0.1:8080;
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
sudo ln -s /etc/nginx/sites-available/rck-assets /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Opsional: pasang SSL (Let's Encrypt) via `certbot`.

## Deploy via aaPanel / Panel Lain

Jika memakai aaPanel, CyberPanel, Plesk, atau panel lain, intinya sama: buat site dan set reverse proxy ke aplikasi Go.

**Pengaturan yang perlu diperhatikan:**

- **Reverse proxy ke** `http://127.0.0.1:8080` (sesuaikan port dengan `HTTP_ADDR`)
- **Header forward**: `Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`
- **Disable proxy buffering** untuk endpoint SSE ` /api/events `
- **Max upload size** minimal `15m` (karena ada upload foto aset & logo)
- **Matikan PHP** jika panel menambahkan konfigurasi PHP default

Contoh aturan di panel (pseudo):

- Route `/` -> `http://127.0.0.1:8080` (sesuaikan port)
- Route `/api/events` -> `http://127.0.0.1:8080` (sesuaikan port) dengan `proxy_buffering off`
- `client_max_body_size 15m`

Contoh reload nginx pada aaPanel:

```bash
/www/server/nginx/sbin/nginx -t
/www/server/nginx/sbin/nginx -s reload
```

## Troubleshooting Umum

- **Aplikasi tetap jalan di `:8080` padahal `.env` set `HTTP_ADDR`**  
  Pastikan `EnvironmentFile` dan `WorkingDirectory` benar di `systemd`, lalu `daemon-reload` dan restart service.

- **`connect database: unable to open database file (14)`**  
  Folder DB tidak writable. Pastikan owner/permission dan gunakan path absolut di `DB_DSN`.

- **`attempt to write a readonly database (8)`**  
  User service tidak punya izin write ke file SQLite. Samakan user service dengan owner folder/DB.

- **`error obtaining VCS status` saat build**  
  Gunakan `go build -buildvcs=false ...`.

- **Domain tidak bisa diakses**  
  Cek DNS A record mengarah ke IP server. Jika `dig` belum resolve, tunggu propagasi.

## Catatan Database Produksi

- **SQLite** cocok untuk kebutuhan ringan/menengah, pastikan folder `data/` bisa ditulis.
- **PostgreSQL/MySQL** disarankan untuk skala lebih besar:
  - Set `DB_DRIVER=postgres` atau `DB_DRIVER=mysql`
  - Isi `DB_DSN` sesuai koneksi database produksi

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
