import { Numbers } from "./util/Numbers";

const STORAGE_KEY = "openciv.settings";

// Each setting's name is its key and its default is its value.
const DEFAULT_SETTINGS = {
  HUD_TRANSPARENCY: 0.75, // Opacity of the corner HUD windows (research, unit info).
  GLOBE_EDGE_SPRITE_WIDTH: 0.7, // The least of their width the globe's sprites narrow to near its edge (1: never).
  MOVE_UNIT_BUTTON: true // Units needing orders turn Next Turn into Move Unit, which selects them instead of ending the turn.
};

type Settings = typeof DEFAULT_SETTINGS;

// Inclusive [min, max] for numeric settings that have one.
const NUMBER_RANGES: Partial<Record<keyof Settings, [number, number]>> = {
  HUD_TRANSPARENCY: [0, 1],
  GLOBE_EDGE_SPRITE_WIDTH: [0.3, 1]
};

// Client-only preferences, persisted in localStorage. Windows read them when built, so a change applies to the next one
// opened; the globe reads its own every frame.
export class ClientSettings {
  private static settings: Settings;

  public static get<K extends keyof Settings>(key: K): Settings[K] {
    return ClientSettings.load()[key];
  }

  public static set<K extends keyof Settings>(key: K, value: Settings[K]) {
    ClientSettings.load()[key] = ClientSettings.sanitize(key, value);
    ClientSettings.save();
  }

  // Falls back to the default when the value's type doesn't match it; numbers are clamped to their range.
  private static sanitize<K extends keyof Settings>(key: K, value: unknown): Settings[K] {
    const fallback = DEFAULT_SETTINGS[key];
    if (typeof value !== typeof fallback) return fallback;

    const range = NUMBER_RANGES[key];
    if (typeof value === "number" && range) {
      return Numbers.clamp(value, range[0], range[1]) as Settings[K];
    }

    return value as Settings[K];
  }

  private static load(): Settings {
    if (ClientSettings.settings) return ClientSettings.settings;

    const settings: Record<keyof Settings, unknown> = { ...DEFAULT_SETTINGS };
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
        settings[key] = ClientSettings.sanitize(key, stored[key]);
      }
    } catch {
      // Storage unavailable or corrupt - fall back to defaults.
    }

    ClientSettings.settings = settings as Settings;
    return ClientSettings.settings;
  }

  private static save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ClientSettings.settings));
    } catch {
      // Storage unavailable (private mode, quota) - the setting just won't persist.
    }
  }
}
