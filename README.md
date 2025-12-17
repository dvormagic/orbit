# Orbit 🪐

Orbit is a minimalist and elegant desktop task tracker, designed for developers who need to manage their time and focus on tasks and Pull Requests efficiently.

![Orbit Icon](public/icon.png)

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

# Start in development mode
npm run dev
```

## Release & Versioning

We use [Semantic Versioning](https://semver.org/) managed by `npm version`. This workflow automatically updates `package.json`, commits the change, and creates a Git Tag.

### Workflow

1. **Commit your changes**: Ensure your working directory is clean.
2. **Bump version**: Run one of the following commands:

   ```bash
   # For bug fixes (0.0.1 -> 0.0.2)
   npm version patch

   # For new features (0.0.1 -> 0.1.0)
   npm version minor

   # For breaking changes (0.0.1 -> 1.0.0)
   npm version major
   ```

3. **Push changes and tags**:
   ```bash
   git push origin main --tags
   ```

## Building for Production

To generate installable executables for your OS:

### 🍎 Mac (Apple Silicon / M1, M2, M3)

This command generates a `.dmg` file in the `release/` folder.

```bash
npm run build:mac
```

### 🪟 Windows

```bash
# Requires running on Windows or using Wine
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

In production, the database is stored in the system's user data folder:
- Mac: `~/Library/Application Support/Orbit/database.db`
- Windows: `%APPDATA%/Orbit/database.db`

## License

[MIT](LICENSE) © [dvormagic](https://github.com/dvormagic)
