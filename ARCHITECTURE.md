# Warehouse Store — architecture

Customer storefront: catalog, bag, checkout. Talks to **WarehouseDB** over HTTP only.

| Piece | Port | Database |
|-------|------|----------|
| Next.js UI | 5001 | — |
| Flask API | 5004 | `instance/store.db` (customers) |

Stock and pick tasks live in WarehouseDB — store uses `WAREHOUSE_URL` + `STORE_API_KEY`.

Ecosystem overview: [../WarehouseDB/ARCHITECTURE.md](../WarehouseDB/ARCHITECTURE.md)

## Run (development)

```powershell
.\dev.ps1
```

Or separately: `pnpm dev:api` then `pnpm dev`.

## Configuration

Copy [.env.local.example](.env.local.example) to `.env.local`.

License: [MIT](LICENSE)
