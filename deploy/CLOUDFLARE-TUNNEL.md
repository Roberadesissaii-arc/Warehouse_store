# Cloudflare Tunnel (optional)

Installed during `./install.sh`. Use this when you want a public domain instead of a raw LAN IP (e.g. for `WAREHOUSE_URL`).

## One-time setup

```bash
cloudflared tunnel login
cloudflared tunnel create arcellite
cloudflared tunnel route dns arcellite cloud.yourdomain.com
```

## Run the tunnel

```bash
cloudflared tunnel run arcellite
```

Set `WAREHOUSE_URL=https://cloud.yourdomain.com` in `.env.local` when your warehouse is behind the tunnel.

See [Cloudflare systemd docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/configure-tunnels/local-management/as-a-service/linux/) for a persistent tunnel service.
