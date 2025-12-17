# Orbit 🪐

Orbit is a minimalist and elegant cross-platform desktop task tracker, designed for developers who need to manage their time and focus on tasks and Pull Requests efficiently.

<img src="public/icon.png" width="128" alt="Orbit Icon" />

## Features

- 🎯 **Focus Tracking**: Orbital timer to keep focus on one task at a time.
- 🌌 **Orbit Mode**: Minimizes the app to a floating sphere ("planet") that shows your active task and allows interaction without taking up screen space.
- 🔗 **Quick Integration**: Direct links to your task management tool and Pull Requests.
- 📊 **Metrics**: Visualization of total time spent per task.
- 🌑 **Native Dark Mode**: Modern design with navy blue and cyan tones.

## Tech Stack

- **Frontend**: Vue 3 + TypeScript + TailwindCSS
- **Backend/Desktop**: Electron
- **Database**: SQLite + Prisma ORM
- **Build Tool**: Vite + Electron Builder

## Development

```bash
# Install dependencies
npm install

# Initialize database
npx prisma db push

# Start in development mode
npm run dev
```

## Building for Production

Orbit is a multi-platform application. You can build the source for any of the following systems:

### 🍎 Mac (Apple Silicon / Intel)

```bash
# For Apple Silicon (M1/M2/M3)
npm run build:mac

# For Intel
npm run build -- --mac --x64
```

### 🪟 Windows

```bash
# This will generate an .exe installer
npm run build -- --win
```

### 🐧 Linux

```bash
# Generates AppImage
npm run build -- --linux
```

## Project Structure

- `electron/`: Main process code (backend).
- `src/`: Renderer process code (Vue frontend).
- `prisma/`: Database schema and migrations.
- `public/`: Static assets.

## Database Note

In production, the database is stored in the system's user data folder to ensure persistence:
- Mac: `~/Library/Application Support/orbit/database.db`
- Windows: `%APPDATA%/orbit/database.db`

## License

[MIT](LICENSE) © [dvormagic](https://github.com/dvormagic)
