#![cfg_attr(
all(not(debug_assertions), target_os = "windows"),
windows_subsystem = "windows"
)]

use std::fs::read_dir;
use tauri::regex::Regex;
use tauri_plugin_fs_watch::Watcher;

fn main() {
    tauri::Builder::default()
        .plugin(Watcher::default())
        .invoke_handler(tauri::generate_handler![discover_path])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[derive(serde::Serialize)]
struct PathNode {
    path: String,
    name: String,
    is_dir: bool,
    file_type: String,
    icon: String,
}

#[tauri::command]
fn discover_path(path: String) -> Result<Vec<PathNode>, String> {
    let mut result = vec![];
    let postfix_reg = Regex::new(r"([a-zA-Z0-9]+\.|^[a-zA-Z0-9]*)").unwrap();

    match read_dir(path) {
        Err(err) => {
            println!("Error:  {:?}", err);
            return Err(err.to_string());
        }
        Ok(paths) => {
            for entry in paths {
                println!("Ok: {:?}", entry);
                let entry = entry.unwrap();
                let path = entry.path();
                let is_dir = path.is_dir();

                let abs_path = path.into_os_string().into_string().unwrap();
                let clone = abs_path.clone();
                let mut abs_paths = clone.split('/');
                let name = abs_paths.next_back().unwrap_or("");

                let file_type = postfix_reg.replace_all(name, "");
                let icon = if is_dir { String::from("folder") } else { String::from("description") };
                result.push(PathNode { path: abs_path, name: String::from(name), is_dir: is_dir, file_type: String::from(file_type), icon: icon });
            }

            return Ok(result);
        }
    }
}
