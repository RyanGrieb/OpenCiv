import fs from "fs";
import path from "path";
import YAML from "yaml";

// Reads and caches a config/*.yml file, keyed by its path, and reloads that entry in place
// whenever the file changes on disk - callers just call load() again to see fresh data,
// no restart needed. A whole directory gets one fs.watch, shared across every path loaded
// from it, since Windows' ReadDirectoryChangesW backing doesn't reliably track a watch
// handle across an editor's save-via-rename.
export class ConfigLoader {
  private static cache = new Map<string, any>();
  private static reloadTimers = new Map<string, NodeJS.Timeout>();
  private static watchedDirs = new Set<string>();

  public static load<T>(configPath: string): T {
    const key = ConfigLoader.normalize(configPath);

    if (!ConfigLoader.cache.has(key)) {
      ConfigLoader.reload(key);
      ConfigLoader.watchDirectoryOf(key);
    }

    return ConfigLoader.cache.get(key) as T;
  }

  private static normalize(configPath: string): string {
    return path.normalize(configPath);
  }

  private static reload(key: string): void {
    const fileContents = fs.readFileSync(key, "utf-8");
    const parsed = YAML.parse(fileContents);
    // Deep-clone off of YAML.parse's own result, same as every call site did by hand before
    // this class existed - keeps the cached value a plain, isolated JS object graph.
    ConfigLoader.cache.set(key, JSON.parse(JSON.stringify(parsed)));
  }

  private static watchDirectoryOf(key: string): void {
    const dir = path.dirname(key);
    if (ConfigLoader.watchedDirs.has(dir)) return;
    ConfigLoader.watchedDirs.add(dir);

    // persistent: false so a lingering watcher never keeps a process (notably `jest`) alive.
    fs.watch(dir, { persistent: false }, (eventType, filename) => {
      if (!filename) return;

      const changedKey = ConfigLoader.normalize(path.join(dir, filename));
      if (!ConfigLoader.cache.has(changedKey)) return;

      // Editors commonly save via a temp-file-then-rename, which fires several events in
      // quick succession (and can briefly present an empty/partial file) - debounce so we
      // only reload once, after things settle.
      clearTimeout(ConfigLoader.reloadTimers.get(changedKey));
      ConfigLoader.reloadTimers.set(
        changedKey,
        setTimeout(() => {
          try {
            ConfigLoader.reload(changedKey);
            console.log(`Config reloaded: ${changedKey}`);
          } catch (err) {
            console.error(`Failed to reload config ${changedKey}, keeping previous data`, err);
          }
        }, 150)
      );
    });
  }
}
