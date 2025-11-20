# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Full Terminal Platform is a modern terminal application built with **Rust + Tauri + xterm.js**. It aims to provide a full-featured terminal experience with tabs, split panes, system monitoring, and theme customization.

**Tech Stack:**
- **Frontend**: Tauri webview with React + Vite, xterm.js for terminal rendering
- **Backend**: Rust (Tauri) for PTY management, system metrics (sysinfo), config persistence
- **IPC**: Tauri `invoke` commands and event streaming for PTY <-> frontend communication
- **Config**: TOML/JSON stored in standard config directory (`$XDG_CONFIG_HOME/myterminal` or Windows equivalent)

## Development Setup

### Prerequisites
```powershell
# Ensure you have:
# - Rust toolchain (rustup)
# - Node.js LTS
# - npm or yarn
```

### Initial Project Setup
```powershell
# Create Vite + React frontend
npm create vite@latest myterminal -- --template react
cd myterminal
npm install

# Initialize Tauri
npx tauri init
```

### Install Dependencies

**Rust dependencies** (add to `src-tauri/Cargo.toml`):
```toml
[dependencies]
tauri = { version = "1" }
portable-pty = "0.9"          # PTY abstraction across platforms
sysinfo = "0.30"              # system performance metrics
serde = { version = "1.0", features = ["derive"] }
dirs = "5.0"                  # config dir paths
```

**Frontend dependencies**:
```powershell
npm install xterm xterm-addon-fit
npm install react-router-dom tailwindcss  # optional UI libs
```

### Development Commands

```powershell
# Run development server (hot reload for both frontend and Rust)
npm run tauri dev

# Run frontend only (for UI development)
npm run dev

# Build for production
npm run build
npx tauri build

# Run Rust tests
cargo test --manifest-path src-tauri/Cargo.toml

# Frontend tests (once configured)
npm test
```

### Testing

- **Rust**: `cargo test` in `src-tauri/` directory for backend logic
- **Frontend**: Jest/React Testing Library for component tests
- **E2E**: Use Playwright for full UI flow testing

## Architecture

### High-Level Flow

```
User Input (xterm.js) 
  → Frontend (React)
  → Tauri IPC (invoke "pty_write")
  → Rust PTY Manager
  → PTY Process (shell)
  → PTY Output
  → Tauri Event ("pty-output")
  → Frontend (React)
  → xterm.js Display
```

### Core Components

#### Backend (Rust - src-tauri/)

**PTY Manager**
- Uses `portable-pty` crate for cross-platform PTY handling
- Maintains `HashMap<tab_id, (Reader, Writer)>` for active terminals
- Spawns shell processes (PowerShell on Windows, zsh/bash on Unix)
- Streams output via Tauri events to frontend
- Handles resize events (`resize_pty(tab_id, cols, rows)`)

**Key Tauri Commands**:
- `create_pty(tab_id)` - spawns new PTY for a tab
- `pty_write(tab_id, data)` - sends user input to PTY stdin
- `resize_pty(tab_id, cols, rows)` - resizes PTY dimensions
- `get_sysinfo()` - returns CPU/RAM/disk metrics
- `get_config()` / `set_config()` - manages persistent configuration

**State Management**:
- PTY writers/readers stored in `Arc<Mutex<HashMap<u64, PtyHandles>>>` for thread-safe access
- Each tab has unique `tab_id` (u64) for routing I/O

#### Frontend (React + xterm.js - src/)

**TerminalTab Component**:
- Manages single xterm.js instance
- Calls `invoke("create_pty", { tabId })` on mount
- Listens for `"pty-output"` events filtered by `tab_id`
- Forwards `term.onData()` to backend via `invoke("pty_write")`
- Uses `FitAddon` for responsive terminal sizing

**Tab Manager**:
- Maintains array of active tabs with unique IDs
- Handles tab creation, switching, and closing
- Each tab renders separate `TerminalTab` component

**Split Panes**:
- Multiple `TerminalTab` components rendered side-by-side
- Each pane has its own PTY process and `tab_id`

**UI Panels**:
- **System Monitor**: Polls `get_sysinfo()` every 1s, displays CPU/RAM/disk
- **Hint Block**: Context-specific hints below terminal (can be fed from backend or computed frontend)
- **Navbar**: Theme switcher, settings, tab management

### PTY Lifecycle

1. **Creation**: Frontend calls `create_pty(tab_id)` → Rust spawns shell with `portable-pty`
2. **Reading**: Background thread reads PTY output → emits `"pty-output"` events → frontend writes to xterm
3. **Writing**: User types → xterm `onData` → `invoke("pty_write")` → Rust writes to PTY stdin
4. **Resize**: Window resize → compute cols/rows → `invoke("resize_pty")` → Rust calls `master.resize()`
5. **Cleanup**: Tab close → dispose xterm instance → Rust drops PTY handles (process exits)

### Configuration System

**Config File Location**:
- Windows: `%APPDATA%\myterminal\config.toml`
- macOS/Linux: `~/.config/myterminal/config.toml`

**Config Structure** (example):
```toml
theme = "dracula"
font_size = 14
border_radius = 8
default_shell = "powershell.exe"  # or "zsh", "bash"

[panels]
monitor = true
hint = true
```

**Theme System**:
- CSS variables in frontend for colors
- Themes stored as JSON/TOML files
- `set_theme(name)` command persists selection and swaps CSS variables
- Support for import/export of custom themes

### Security

- Tauri's secure defaults restrict API access
- Validate all input on Rust side before executing
- No arbitrary command execution from frontend without explicit user action
- File access limited via `tauri.conf.json` permissions
- Secret redaction applies to all terminal output (if implemented)

## Key Implementation Details

### Handling Multiple PTYs

Store PTY handles in shared state:
```rust
struct AppState {
    ptys: Arc<Mutex<HashMap<u64, PtyHandles>>>,
}

struct PtyHandles {
    reader: Box<dyn Read + Send>,
    writer: Box<dyn Write + Send>,
    child: Box<dyn Child + Send + Sync>,
}
```

Access in commands:
```rust
#[tauri::command]
fn pty_write(state: State<AppState>, tab_id: u64, data: String) -> Result<(), String> {
    let mut ptys = state.ptys.lock().unwrap();
    let handles = ptys.get_mut(&tab_id).ok_or("PTY not found")?;
    handles.writer.write_all(data.as_bytes()).map_err(|e| e.to_string())?;
    Ok(())
}
```

### Resize Handling

When terminal element resizes:
1. Use `FitAddon.fit()` to adjust xterm dimensions
2. Read `term.rows` and `term.cols`
3. Call `invoke("resize_pty", { tabId, cols, rows })`
4. Rust calls `master.resize(PtySize { rows, cols, ... })`

### Platform-Specific Shell Selection

```rust
#[cfg(target_os = "windows")]
const DEFAULT_SHELL: &str = "powershell.exe";

#[cfg(target_os = "macos")]
const DEFAULT_SHELL: &str = "zsh";

#[cfg(target_os = "linux")]
const DEFAULT_SHELL: &str = "bash";
```

Override via config file or environment detection.

### Event Streaming Performance

- Chunk large PTY output (4KB buffers) to avoid overwhelming frontend
- Use Tauri events (non-blocking) rather than synchronous invoke
- Frontend batches xterm writes when possible

## Code Organization

```
full-terminal-platform/
├── src/                    # React frontend
│   ├── components/
│   │   ├── TerminalTab.jsx    # xterm.js wrapper
│   │   ├── TabManager.jsx     # tab state management
│   │   ├── SystemMonitor.jsx  # CPU/RAM display
│   │   ├── HintBlock.jsx      # contextual hints
│   │   └── Navbar.jsx         # top navigation
│   ├── App.jsx
│   └── main.jsx
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── main.rs            # entry point, command handlers
│   │   ├── pty.rs             # PTY manager module
│   │   ├── config.rs          # config read/write
│   │   └── sysinfo.rs         # system metrics
│   ├── Cargo.toml
│   └── tauri.conf.json        # Tauri configuration
├── public/                 # static assets
├── package.json
└── README.md
```

## Common Patterns

### Creating a New Tab
```javascript
const createTab = () => {
  const newTabId = Date.now(); // or use UUID
  setTabs([...tabs, { id: newTabId, title: 'Terminal' }]);
  // TerminalTab component will auto-invoke create_pty(newTabId)
};
```

### Listening to PTY Output
```javascript
const unlistenPromise = listen("pty-output", (event) => {
  const { tab_id, data } = event.payload;
  if (tab_id === currentTabId) {
    terminal.write(data);
  }
});
```

### Writing to PTY
```javascript
terminal.onData((data) => {
  invoke("pty_write", { tabId: currentTabId, data });
});
```

### Reading Config
```rust
#[tauri::command]
fn get_config() -> Result<Config, String> {
    let config_path = dirs::config_dir()
        .ok_or("Could not find config dir")?
        .join("myterminal")
        .join("config.toml");
    
    let contents = std::fs::read_to_string(config_path)
        .map_err(|e| e.to_string())?;
    
    toml::from_str(&contents).map_err(|e| e.to_string())
}
```

## Performance Considerations

- Reuse PTY writer/reader objects efficiently (avoid cloning)
- Use streaming via events for PTY output
- GPU-accelerated rendering via xterm.js (enabled by default)
- Lazy-load heavy panels (system monitor only updates when visible)
- Allow configurable polling frequency for system metrics
- Profile CSS/React rendering for smooth 60fps UI

## Packaging & Distribution

### Build Commands
```powershell
# Production build
npm run build
npx tauri build

# Output locations:
# Windows: src-tauri/target/release/bundle/msi/
# macOS: src-tauri/target/release/bundle/dmg/
# Linux: src-tauri/target/release/bundle/deb/ or appimage/
```

### Code Signing
- **Windows**: Use signtool.exe with certificate
- **macOS**: Notarization required for distribution (see Apple developer docs)
- **Linux**: Optional, depends on distribution method

### Bundle Size
Tauri produces significantly smaller bundles than Electron (~5-15 MB vs 100+ MB).

## MVP Priority Checklist

1. ✅ Tauri + React skeleton with xterm.js rendering
2. ✅ PTY spawning and output streaming to xterm
3. ✅ User input forwarding to PTY stdin
4. Tab creation and closing
5. Resize handling (terminal and PTY)
6. Config persistence (theme, font, shell)
7. System monitor panel with sysinfo
8. Split panes support
9. Hint block and navbar UI
10. Theme system with CSS variables
11. Production build and packaging

## Windows-Specific Notes

- Default shell: `powershell.exe` (Windows PowerShell) or `pwsh.exe` (PowerShell Core)
- Config location: `%APPDATA%\myterminal\config.toml`
- Use `portable-pty` for consistent PTY behavior across Windows versions
- Test on both Windows 10 and 11 for compatibility
- Consider supporting WSL integration for Unix shell access
