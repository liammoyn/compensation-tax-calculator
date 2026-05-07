// Switch storage backend by changing this one import:
//   localStorage (static / GitHub Pages): localStorageStore
//   SQLite (Bun server):                  sqliteStore  (from "./sqlite")
export { localStorageStore as store } from "./localstorage";
