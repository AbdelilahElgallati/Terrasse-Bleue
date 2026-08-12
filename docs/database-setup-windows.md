# Local PostgreSQL setup on Windows

This project needs a real PostgreSQL server. The existing `pgAgent` utility on this computer is not the database server.

## 1. Install PostgreSQL

Download the Windows installer from the PostgreSQL website and install PostgreSQL 17 (recommended for this local MVP) or another supported stable release.

In the installer:

- install **PostgreSQL Server**, **Command Line Tools**, and **pgAdmin 4**;
- keep port `5432` unless it is already occupied;
- set and safely retain the local `postgres` password;
- StackBuilder extras are not required for this project.

After installation, open PowerShell and verify:

```powershell
Get-Service *postgres*
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" --version
```

The PostgreSQL service must show `Running`. Adjust `17` if a different version was installed.

## 2. Create the development database

Use pgAdmin (`Databases` → `Create` → `Database`) and name it `terrasse_bleue`, owned by `postgres`.

Alternatively:

```powershell
& "C:\Program Files\PostgreSQL\17\bin\createdb.exe" -h localhost -U postgres terrasse_bleue
```

## 3. Configure project secrets

Copy the root example:

```powershell
Copy-Item .env.example .env
```

Edit `.env` and set:

```dotenv
DATABASE_URL="postgresql://postgres:URL_ENCODED_PASSWORD@localhost:5432/terrasse_bleue?schema=public"
JWT_ACCESS_SECRET="a-long-random-value"
JWT_REFRESH_SECRET="a-different-long-random-value"
JWT_ACCESS_TTL="15m"
JWT_REFRESH_TTL="7d"
PORT=3001
HOST=0.0.0.0
```

If the PostgreSQL password contains `@`, `:`, `/`, `?`, `#`, or `%`, URL-encode it before placing it in `DATABASE_URL`. Never commit `.env`.

Generate each JWT secret separately in PowerShell:

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
```

## 4. Apply and seed

From the repository root:

```powershell
pnpm install
pnpm db:validate
pnpm db:generate
pnpm exec prisma migrate deploy
pnpm db:seed
pnpm exec prisma migrate status
```

The seed imports `prisma/data/terrasse_bleue_demo_seed.json`: 14 café menu sections and 58 provisional products. It also creates the development-only customer:

- email: `client@terrassebleue.local`
- password: the private value of `SEED_CUSTOMER_PASSWORD` (12 characters minimum)

## 5. Connect the physical phone

Find the computer's active Wi-Fi IPv4 address:

```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -match 'Wi-Fi' -and $_.IPAddress -notlike '169.254*' }
```

Copy `apps/mobile/.env.example` to `apps/mobile/.env` and replace the placeholder:

```dotenv
EXPO_PUBLIC_API_URL="http://YOUR_ACTIVE_IPV4:3001"
```

The phone and computer must use the same Wi-Fi/hotspot network. Allow Node.js on Windows **Private networks** when the firewall prompt appears.

## 6. Start and verify

Use two PowerShell windows:

```powershell
# Window 1, repository root
pnpm dev:api

# Window 2
cd apps/mobile
pnpm exec expo start --go --lan --clear
```

From the computer, verify `http://localhost:3001/health`. From the phone browser, verify `http://YOUR_ACTIVE_IPV4:3001/health`. Both must return the Terrasse Bleue health JSON before testing registration and checkout.

Do not run `prisma migrate reset`: it deletes development data.
