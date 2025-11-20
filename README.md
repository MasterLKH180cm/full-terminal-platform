# Full Terminal Platform

A modern, feature-rich terminal platform built with React, Tauri, and TypeScript. Provides a customizable, multi-terminal environment with resource monitoring, drag-and-drop layout management, and extensive shell support.

![Full Terminal Platform](https://img.shields.io/badge/version-0.1.0-blue)
![Tauri](https://img.shields.io/badge/Tauri-2.9-orange)
![React](https://img.shields.io/badge/React-19.2-61dafb)

## ✨ Features

### 🖥️ Multi-Terminal Support
- **Multiple shell types**: PowerShell, CMD, Bash, Zsh
- **Terminal tabs**: Easy switching between terminals
- **Per-terminal shell selection**: Choose different shells for each terminal
- **Home directory default**: Terminals start in user home directory
- **UTF-8 encoding**: Proper support for international characters

### 📊 Resource Monitoring
- **Real-time CPU monitoring**: Live CPU usage graph
- **Memory tracking**: Real-time memory usage visualization
- **Interactive charts**: Powered by Recharts with 60-second history
- **System info**: Accurate resource data from Rust backend

### 🎨 Customizable Layout
- **Drag-and-drop grid**: Powered by react-grid-layout
- **Resizable blocks**: Drag from corners and edges to resize
- **Responsive design**: Adapts to different screen sizes
- **Layout persistence**: Save and load custom layouts
- **Export/Import layouts**: Share layouts as JSON files
- **Remove blocks**: Easy block management with close buttons

### 🎨 Theme & Appearance
- **Multiple themes**: Dark, Light, Monokai
- **Custom colors**: Choose your own border/accent colors
- **Font size adjustment**: 10-20px range
- **Minimal UI**: Unobtrusive drag/resize handles
- **Smooth animations**: Professional transitions and effects

### 💾 Layout Management
- **Save layouts**: Name and save custom arrangements
- **Load layouts**: Quick access to saved layouts
- **Default layout**: Auto-load preferred layout on startup
- **Export to JSON**: Share layouts with others
- **Import from JSON**: Load community layouts

## 🚀 Getting Started

### Prerequisites

- **Node.js** 16+ 
- **Rust** 1.70+ (for Tauri)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/full-terminal-platform.git
cd full-terminal-platform
```

2. **Install dependencies**
```bash
npm install
```

3. **Run development server**
```bash
npm run tauri:dev
```

### Building for Production

```bash
npm run tauri:build
```

The built application will be in `src-tauri/target/release/`.

## 📖 Usage

### Creating Terminals

1. Click **"➕ New Terminal"** in the header
2. Select your preferred shell type (PowerShell, CMD, Bash, Zsh)
3. Click **"Create"**

### Managing Layout

#### Drag and Drop
- Hover over any block's top edge to reveal the drag handle
- Click and hold the blue bar to drag blocks around
- Release to drop in new position

#### Resizing
- Hover over a block to reveal resize handles
- Drag from corners for diagonal resize
- Drag from edges for horizontal/vertical resize

#### Removing Blocks
- Hover over a block to reveal the close button (×)
- Click the red × in the top-right corner
- Note: Cannot remove the last block

### Saving Layouts

1. Click **"📐 Layouts"** in the header
2. Click **"💾 Save Layout"**
3. Enter a name for your layout
4. Click **"Save"**

### Loading Layouts

1. Click **"📐 Layouts"**
2. Select a saved layout
3. Click **"Load"**

### Settings

Access settings via **"⚙️ Settings"** button:

- **Theme**: Dark, Light, or Monokai
- **Border Color**: Custom accent color picker
- **Layout**: Grid arrangement preferences
- **Default Shell**: Set preferred shell for new terminals
- **Font Size**: Adjust terminal font size (10-20px)

## 🎯 Keyboard Shortcuts

### Terminal
- `Ctrl+C`: Cancel current command
- `Ctrl+L`: Clear screen
- `Enter`: Execute command
- `Backspace`: Delete character

### Commands
- `clear` or `cls`: Clear terminal
- `ls` (Unix) / `dir` (Windows): List directory contents
- Standard shell commands for your selected shell type

## 🛠️ Technology Stack

### Frontend
- **React 19.2**: UI framework
- **Vite**: Build tool and dev server
- **react-grid-layout**: Drag-and-drop grid system
- **recharts**: Data visualization
- **xterm.js**: Terminal emulator
- **react-router-dom**: Routing (if needed)

### Backend
- **Tauri 2.9**: Desktop app framework
- **Rust**: Backend logic
- **sysinfo**: System resource monitoring
- **encoding_rs**: Character encoding support

## 📁 Project Structure

```
full-terminal-platform/
├── public/                  # Static assets
│   ├── icons/               # App icons
│   └── index.html           # Main HTML file
├── src/                     # Source code
│   ├── components/          # Reusable components
│   ├── layouts/             # Layout components
│   ├── pages/               # Page components
│   ├── App.tsx              # Main App component
│   ├── main.tsx             # Entry point
│   └── styles/              # Global styles
├── src-tauri/              # Tauri specific files
│   ├── icons/               # Tauri icons
│   ├── tauri.conf.json      # Tauri configuration
│   └── src/                 # Tauri Rust source
├── .gitignore               # Git ignore file
├── package.json             # NPM package file
├── README.md                # This README file
└── tsconfig.json            # TypeScript configuration
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/YourFeature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some feature'`)
5. Push to the branch (`git push origin feature/YourFeature`)
6. Open a pull request

Please ensure your code follows the project's coding standards and includes appropriate tests.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Made with ❤️ by [Your Name](https://github.com/yourusername)
