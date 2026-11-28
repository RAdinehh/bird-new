import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { ICON_KEYS, ICON_KEY_ALIASES, normalizeIconKey, isValidIconKey } from "../shr/icons/AppIcons";

describe("Icon System Integrity (Global Standard)", () => {
  const emojiDir = path.resolve(process.cwd(), "public/assets/emojis");

  it("every key in ICON_KEYS has a non-empty SVG file", () => {
    const missing: string[] = [];
    for (const key of ICON_KEYS) {
      const filePath = path.join(emojiDir, key + ".svg");
      if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
        missing.push(key);
      }
    }
    expect(missing).toEqual([]);
  });

  it("all ICON_KEY_ALIASES resolve to valid ICON_KEYS", () => {
    for (const [alias, target] of Object.entries(ICON_KEY_ALIASES)) {
      expect(ICON_KEYS).toContain(target);
      expect(normalizeIconKey(alias)).toBe(target);
      expect(isValidIconKey(alias)).toBe(true);
    }
  });

  it("normalizeIconKey falls back safely to unknown for invalid/deleted keys", () => {
    expect(normalizeIconKey("non_existent_key_123")).toBe("unknown");
    expect(normalizeIconKey("")).toBe("unknown");
    expect(normalizeIconKey(undefined)).toBe("unknown");
  });
});
