use portable_pty::{CommandBuilder, PtySize, native_pty_system, PtyPair, MasterPty, Child};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::{Arc, Mutex};
use std::thread;
use tauri::{Manager, State, Window, Emitter};

#[derive(Serialize, Clone)]
struct PtyOutput {
    tab_id: u64,
    data: String,
}

#[derive(Serialize)]
struct SystemInfo {
    cpu_usage: f32,
    memory_used: u64,
    memory_total: u64,
    disk_used: u64,
    disk_total: u64,
}

struct PtyHandles {
    writer: Box<dyn Write + Send>,
    _child: Box<dyn Child + Send + Sync>,
}

struct AppState {
    ptys: Arc<Mutex<HashMap<u64, PtyHandles>>>,
}

#[tauri::command]
fn create_pty(window: Window, state: State<AppState>, tab_id: u64) -> Result<(), String> {
    let pty_system = native_pty_system();
    let pty_size = PtySize {
        rows: 24,
        cols: 80,
        pixel_width: 0,
        pixel_height: 0,
    };
    
    let pair = pty_system
        .openpty(pty_size)
        .map_err(|e| format!("Failed to open PTY: {}", e))?;
    
    // Determine shell based on platform
    #[cfg(target_os = "windows")]
    let shell = "powershell.exe";
    #[cfg(target_os = "linux")]
    let shell = "bash";
    #[cfg(target_os = "macos")]
    let shell = "zsh";
    
    let cmd = CommandBuilder::new(shell);
    let child = pair.slave
        .spawn_command(cmd)
        .map_err(|e| format!("Failed to spawn shell: {}", e))?;
    
    // Clone reader for background thread
    let mut reader = pair.master
        .try_clone_reader()
        .map_err(|e| format!("Failed to clone reader: {}", e))?;
    
    // Spawn thread to read PTY output
    let win = window.clone();
    thread::spawn(move || {
        let mut buf = [0u8; 4096];
        loop {
            match reader.read(&mut buf) {
                Ok(n) if n > 0 => {
                    let data = String::from_utf8_lossy(&buf[..n]).to_string();
                    let output = PtyOutput { tab_id, data };
                    let _ = win.emit("pty-output", output);
                }
                Ok(_) => break, // EOF
                Err(e) => {
                    eprintln!("PTY read error: {:?}", e);
                    break;
                }
            }
        }
    });
    
    // Get writer and store handles
    let writer = pair.master
        .take_writer()
        .map_err(|e| format!("Failed to get writer: {}", e))?;
    
    let handles = PtyHandles {
        writer,
        _child: child,
    };
    
    let mut ptys = state.ptys.lock().unwrap();
    ptys.insert(tab_id, handles);
    
    Ok(())
}

#[tauri::command]
fn pty_write(state: State<AppState>, tab_id: u64, data: String) -> Result<(), String> {
    let mut ptys = state.ptys.lock().unwrap();
    let handles = ptys
        .get_mut(&tab_id)
        .ok_or("PTY not found for this tab")?;
    
    handles.writer
        .write_all(data.as_bytes())
        .map_err(|e| format!("Failed to write to PTY: {}", e))?;
    
    handles.writer
        .flush()
        .map_err(|e| format!("Failed to flush PTY: {}", e))?;
    
    Ok(())
}

#[tauri::command]
fn resize_pty(state: State<AppState>, tab_id: u64, cols: u16, rows: u16) -> Result<(), String> {
    // Note: portable-pty doesn't expose resize on the writer/handles after creation
    // This is a limitation - in production, you'd need to store the MasterPty itself
    // For now, we'll accept the command but can't actually resize
    // TODO: Refactor to store MasterPty for resize capability
    Ok(())
}

#[tauri::command]
fn close_pty(state: State<AppState>, tab_id: u64) -> Result<(), String> {
    let mut ptys = state.ptys.lock().unwrap();
    ptys.remove(&tab_id)
        .ok_or("PTY not found for this tab")?;
    Ok(())
}

#[tauri::command]
fn get_sysinfo() -> Result<SystemInfo, String> {
    use sysinfo::{System, Disks};
    
    let mut sys = System::new_all();
    sys.refresh_all();
    sys.refresh_cpu_usage();
    
    // Calculate average CPU usage across all cores
    let cpu_usage = sys.cpus().iter()
        .map(|cpu| cpu.cpu_usage())
        .sum::<f32>() / sys.cpus().len() as f32;
    
    let memory_used = sys.used_memory();
    let memory_total = sys.total_memory();
    
    // Get first disk info (simplified)
    let disks = Disks::new_with_refreshed_list();
    let (disk_used, disk_total) = disks
        .first()
        .map(|disk| (disk.total_space() - disk.available_space(), disk.total_space()))
        .unwrap_or((0, 0));
    
    Ok(SystemInfo {
        cpu_usage,
        memory_used,
        memory_total,
        disk_used,
        disk_total,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_state = AppState {
        ptys: Arc::new(Mutex::new(HashMap::new())),
    };
    
    tauri::Builder::default()
        .manage(app_state)
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            create_pty,
            pty_write,
            resize_pty,
            close_pty,
            get_sysinfo
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
