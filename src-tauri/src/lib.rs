use tauri::{
  menu::{Menu, MenuItem, PredefinedMenuItem},
  Manager,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      // ---- logging (keep this) ----
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // ---- get main webview window ----
      let window = app
        .get_webview_window("main")
        .expect("main window not found");

      // ---- menu items ----
      let prev = MenuItem::with_id(app, "prev", "←", true, None::<String>)?;
      let next = MenuItem::with_id(app, "next", "→", true, None::<String>)?;
      let reload = MenuItem::with_id(app, "reload", "↻", true, None::<String>)?;
      let separator = PredefinedMenuItem::separator(app)?;

      // ---- build menu ----
      let menu = Menu::with_items(app, &[
        &prev,
        &next,
        &reload,
        &separator,
      ])?;

      // ---- attach menu to window ----
      window.set_menu(menu)?;

      Ok(())
    })
    .on_menu_event(|app, event| {
      let window = app
        .get_webview_window("main")
        .expect("main window not found");

      match event.id().as_ref() {
        "prev" => {
          let _ = window.eval("window.history.back()");
        }
        "next" => {
          let _ = window.eval("window.history.forward()");
        }
        "reload" => {
          let _ = window.eval("window.location.reload()");
        }
        "quit" => {
          std::process::exit(0);
        }
        _ => {}
      }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
