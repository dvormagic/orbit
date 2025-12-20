# <img src="public/icon.png" width="32" height="32" /> Orbit

Minimalist cross-platform desktop task tracker for developers.

## Features

- 🎯 **Focus Tracking**: Orbital timer to stay focused.
- 🌌 **Orbit Mode**: Floating sphere widget for active tasks.
- 🔗 **Integrations**: Quick links to tasks and PRs.
- 🌑 **Dark Mode**: Professional navy & cyan aesthetic.
- 🧩 **Subtasks**: Nested tasks (up to multiple levels) with rolled-up time tracking.
- 🚧 **Blocked**: Mark tasks as BLOCKED when you can’t progress.

## Development

```bash
npm install

# Creates/updates the local dev DB at prisma/dev.db (ignored by git)
npx prisma migrate dev

npm run dev
```

## Database

Orbit uses **SQLite** via **Prisma**.

- **Dev DB**: `prisma/dev.db` (local only, ignored by git).
- **Packaged apps**: the runtime DB lives in the OS user data folder (Electron `app.getPath('userData')`).
- Builds ship an **empty template DB** and copy it on first run.

## Build

```bash
# Output installers/artifacts under release/<version>/

# Mac (Silicon)
npm run build:mac

# Windows / Linux
npm run build -- --win
npm run build -- --linux
```

## CI / Releases (GitHub Actions)

- **CI** runs on pushes/PRs to `main` and verifies: typecheck + build + DB template generation (`npm run build:ci`).
- **Release**: pushing a tag like `v0.2.9` triggers a multi-OS build and creates a **draft GitHub Release** with the installers attached.

## Notes for WSL

- **AppImage requires FUSE**. On WSL, prefer `linux-unpacked` or run: `./Orbit-Linux-<version>.AppImage --appimage-extract`.

## License
[MIT](LICENSE) © [dvormagic](https://github.com/dvormagic)
