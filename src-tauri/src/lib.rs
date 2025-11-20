// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use std::process::Command;
use std::sync::Mutex;
use std::env;
use serde::{Deserialize, Serialize};
use encoding_rs;

#[derive(Clone, Serialize, Deserialize)]
struct ShellInfo {
    name: String,
    path: String,
    shell_type: String,
}

struct TerminalState {
    _process: Mutex<Option<std::process::Child>>,
}

fn decode_output(bytes: &[u8], shell_type: &str) -> String {
    // If empty, return empty string
    if bytes.is_empty() {
        return String::new();
    }
    
    // For Windows shells, we need special handling
    if cfg!(target_os = "windows") && (shell_type == "cmd" || shell_type == "powershell") {
        // Try UTF-8 first (after chcp 65001)
        if let Ok(utf8_str) = std::str::from_utf8(bytes) {
            return utf8_str.to_string();
        }
        
        // Try to decode with system codepage
        // Common Windows codepages:
        // - Windows-1252 (Western European)
        // - GBK/CP936 (Simplified Chinese)
        // - Big5/CP950 (Traditional Chinese)
        // - Shift-JIS/CP932 (Japanese)
        // - CP949 (Korean)
        
        // Try GBK for Simplified Chinese systems
        let (decoded_gbk, _, had_errors_gbk) = encoding_rs::GBK.decode(bytes);
        if !had_errors_gbk && decoded_gbk.chars().all(|c| !c.is_control() || c.is_whitespace()) {
            return decoded_gbk.to_string();
        }
        
        // Try Big5 for Traditional Chinese systems (use BIG5_HKSCS which is more complete)
        let (decoded_big5, _, had_errors_big5) = encoding_rs::BIG5.decode(bytes);
        if !had_errors_big5 && decoded_big5.chars().all(|c| !c.is_control() || c.is_whitespace()) {
            return decoded_big5.to_string();
        }
        
        // Try Windows-1252 for Western systems
        let (decoded_1252, _, _) = encoding_rs::WINDOWS_1252.decode(bytes);
        return decoded_1252.to_string();
    }
    
    // For Unix shells, UTF-8 is standard
    String::from_utf8_lossy(bytes).to_string()
}

#[tauri::command]
fn get_home_directory() -> Result<String, String> {
    env::var("USERPROFILE")
        .or_else(|_| env::var("HOME"))
        .map_err(|e| format!("Failed to get home directory: {}", e))
}

#[tauri::command]
fn execute_command(command: String, shell_type: String, working_dir: Option<String>) -> Result<String, String> {
    let home_dir = working_dir.or_else(|| env::var("USERPROFILE").or_else(|_| env::var("HOME")).ok());
    
    let output = match shell_type.as_str() {
        "powershell" => {
            let mut cmd = if cfg!(target_os = "windows") {
                let mut c = Command::new("powershell");
                c.args([
                    "-NoProfile",
                    "-NonInteractive",
                    "-Command",
                    &format!(
                        "$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; {}",
                        command
                    )
                ]);
                c
            } else {
                let mut c = Command::new("pwsh");
                c.args(["-NoProfile", "-Command", &command]);
                c
            };
            
            if let Some(dir) = home_dir {
                cmd.current_dir(dir);
            }
            
            cmd.output()
        }
        "cmd" => {
            let wrapped_command = format!("@echo off & chcp 65001 >nul 2>&1 & {}", command);
            let mut cmd = Command::new("cmd");
            cmd.args(["/C", &wrapped_command]);
            
            if let Some(dir) = home_dir {
                cmd.current_dir(dir);
            }
            
            cmd.output()
        }
        "bash" => {
            let mut cmd = Command::new("bash");
            cmd.args(["-c", &command])
                .env("LANG", "C.UTF-8")
                .env("LC_ALL", "C.UTF-8");
            
            if let Some(dir) = home_dir {
                cmd.current_dir(dir);
            }
            
            cmd.output()
        }
        "zsh" => {
            let mut cmd = Command::new("zsh");
            cmd.args(["-c", &command])
                .env("LANG", "C.UTF-8")
                .env("LC_ALL", "C.UTF-8");
            
            if let Some(dir) = home_dir {
                cmd.current_dir(dir);
            }
            
            cmd.output()
        }
        _ => {
            if cfg!(target_os = "windows") {
                let wrapped_command = format!("@echo off & chcp 65001 >nul 2>&1 & {}", command);
                let mut cmd = Command::new("cmd");
                cmd.args(["/C", &wrapped_command]);
                
                if let Some(dir) = home_dir {
                    cmd.current_dir(dir);
                }
                
                cmd.output()
            } else {
                let mut cmd = Command::new("sh");
                cmd.args(["-c", &command])
                    .env("LANG", "C.UTF-8");
                
                if let Some(dir) = home_dir {
                    cmd.current_dir(dir);
                }
                
                cmd.output()
            }
        }
    };

    match output {
        Ok(output) => {
            let stdout = decode_output(&output.stdout, &shell_type);
            let stderr = decode_output(&output.stderr, &shell_type);
            
            // Clean up output
            let mut result = String::new();
            
            if !stdout.is_empty() {
                result.push_str(&stdout);
            }
            
            if !stderr.is_empty() {
                // Filter out common noise from stderr
                let cleaned_stderr: String = stderr
                    .lines()
                    .filter(|line| {
                        let line_lower = line.to_lowercase();
                        !line_lower.contains("active code page") &&
                        !line_lower.is_empty()
                    })
                    .collect::<Vec<_>>()
                    .join("\n");
                
                if !cleaned_stderr.is_empty() {
                    if !result.is_empty() {
                        result.push('\n');
                    }
                    result.push_str(&cleaned_stderr);
                }
            }
            
            Ok(result)
        }
        Err(e) => Err(format!("Failed to execute command: {}", e)),
    }
}

#[tauri::command]
fn get_available_shells() -> Result<Vec<ShellInfo>, String> {
    let mut shells = Vec::new();
    
    if cfg!(target_os = "windows") {
        // Check for PowerShell
        if Command::new("powershell").arg("-Command").arg("echo test").output().is_ok() {
            shells.push(ShellInfo {
                name: "PowerShell".to_string(),
                path: "powershell".to_string(),
                shell_type: "powershell".to_string(),
            });
        }
        
        // Check for PowerShell Core
        if Command::new("pwsh").arg("-Command").arg("echo test").output().is_ok() {
            shells.push(ShellInfo {
                name: "PowerShell Core".to_string(),
                path: "pwsh".to_string(),
                shell_type: "powershell".to_string(),
            });
        }
        
        // CMD is always available on Windows
        shells.push(ShellInfo {
            name: "Command Prompt".to_string(),
            path: "cmd".to_string(),
            shell_type: "cmd".to_string(),
        });
        
        // Check for Git Bash
        if Command::new("bash").arg("-c").arg("echo test").output().is_ok() {
            shells.push(ShellInfo {
                name: "Bash".to_string(),
                path: "bash".to_string(),
                shell_type: "bash".to_string(),
            });
        }
    } else {
        // Check for Bash
        if Command::new("bash").arg("-c").arg("echo test").output().is_ok() {
            shells.push(ShellInfo {
                name: "Bash".to_string(),
                path: "bash".to_string(),
                shell_type: "bash".to_string(),
            });
        }
        
        // Check for Zsh
        if Command::new("zsh").arg("-c").arg("echo test").output().is_ok() {
            shells.push(ShellInfo {
                name: "Zsh".to_string(),
                path: "zsh".to_string(),
                shell_type: "zsh".to_string(),
            });
        }
        
        // Check for PowerShell Core on Unix
        if Command::new("pwsh").arg("-Command").arg("echo test").output().is_ok() {
            shells.push(ShellInfo {
                name: "PowerShell Core".to_string(),
                path: "pwsh".to_string(),
                shell_type: "powershell".to_string(),
            });
        }
    }
    
    if shells.is_empty() {
        Err("No shells found".to_string())
    } else {
        Ok(shells)
    }
}

#[tauri::command]
fn get_system_info() -> Result<serde_json::Value, String> {
    use sysinfo::System;
    
    let mut sys = System::new_all();
    sys.refresh_all();
    
    let cpus = sys.cpus();
    let cpu_usage: f32 = if !cpus.is_empty() {
        cpus.iter().map(|cpu| cpu.cpu_usage()).sum::<f32>() / cpus.len() as f32
    } else {
        0.0
    };
    
    let total_memory = sys.total_memory();
    let used_memory = sys.used_memory();
    let memory_usage = if total_memory > 0 {
        (used_memory as f64 / total_memory as f64) * 100.0
    } else {
        0.0
    };
    
    Ok(serde_json::json!({
        "cpu": cpu_usage,
        "memory": memory_usage
    }))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(TerminalState {
            _process: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            execute_command,
            get_available_shells,
            get_system_info,
            get_home_directory
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
