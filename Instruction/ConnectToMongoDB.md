# MongoDB Compass Connection Guide (Project Rewood)

## What went right

- MongoDB container is healthy and running on Docker Compose service `mongo`.
- Backend and frontend are both connected to the same MongoDB database: `senior_database`.
- Authentication works with:
	- username: `admin`
	- password: `admin`
	- auth database: `admin`
- MongoDB Compass can connect successfully using the WSL IP endpoint.

## What went wrong

- MongoDB Compass failed with:
	- `MongoServerSelectionError: Server selection timed out after 30000 ms`
	when using `localhost:27017` and `127.0.0.1:27017` from Windows.

## Root cause

- This was a host networking path issue between Windows Compass and the Docker/WSL networking stack.
- MongoDB itself was not broken.
- In this environment, Windows `localhost:27017` was not reaching the WSL/Docker-published Mongo port, while direct connection to the WSL IP worked.

## Current working Compass URI

Use this URI in MongoDB Compass:

`mongodb://admin:admin@172.24.160.46:27017/senior_database?authSource=admin&directConnection=true`

If your WSL IP changes after restart, refresh it with:

```bash
hostname -I | awk '{print $1}'
```

Then replace the host in the URI.

## How to make `localhost:27017` work from Compass (Windows)

Run these commands in **PowerShell as Administrator**:

```powershell
$wslIp = (wsl hostname -I).Trim().Split(' ')[0]
netsh interface portproxy delete v4tov4 listenaddress=127.0.0.1 listenport=27017
netsh interface portproxy add v4tov4 listenaddress=127.0.0.1 listenport=27017 connectaddress=$wslIp connectport=27017
```

After that, use this Compass URI:

`mongodb://admin:admin@127.0.0.1:27017/senior_database?authSource=admin&directConnection=true`

## Quick verification checklist

1. Start services:

```bash
docker compose up -d mongo backend frontend
```

2. Confirm Mongo is healthy:

```bash
docker compose ps mongo
```

3. Check container auth from terminal:

```bash
docker compose exec -T mongo mongosh --username admin --password admin --authenticationDatabase admin --eval "db.adminCommand({ ping: 1 })"
```

Expected output includes:

`{ ok: 1 }`

