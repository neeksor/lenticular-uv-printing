import { EN_DICT } from "./en";
import { type Dict, type DictKey, ZH_DICT } from "./zh";

export type Locale = "zh" | "en";

const STORAGE_KEY = "lenticular.locale";
const DICTS: Record<Locale, Dict> = { zh: ZH_DICT, en: EN_DICT };

let current: Locale = "en";

const listeners = new Set<(l: Locale) => void>();

export function getLocale(): Locale {
  return current;
}

export function setLocale(loc: Locale): void {
  if (current === loc) return;
  current = loc;
  try {
    localStorage.setItem(STORAGE_KEY, loc);
  } catch {
    /* private mode etc. */
  }
  document.documentElement.lang = loc === "zh" ? "zh-CN" : "en";
  applyDom();
  for (const fn of listeners) fn(loc);
}

export function onLocaleChange(fn: (l: Locale) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function initLocale(): void {
  document.documentElement.lang = "en";
  applyDom();
}

export function t(key: DictKey, params?: Record<string, string | number>): string {
  let s: string = DICTS[current][key] ?? ZH_DICT[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      s = s.replaceAll(`{${k}}`, String(v));
    }
  }
  return s;
}

/**
 * Update DOM elements decorated with `data-i18n="key"`.
 * Optionally `data-i18n-params='{"name":"value"}'` for templated strings.
 * `data-i18n-attr="placeholder:key,title:key2"` updates attributes.
 */
export function applyDom(root: ParentNode = document): void {
  // page <title> — find via data-i18n="page.title" on <title>, OR fall back to a fixed key.
  if (root === document) {
    document.title = t("page.title");
  }

  for (const el of root.querySelectorAll<HTMLElement>("[data-i18n]")) {
    const key = el.dataset["i18n"] as DictKey;
    let params: Record<string, string | number> | undefined;
    const raw = el.dataset["i18nParams"];
    if (raw) {
      try {
        params = JSON.parse(raw);
      } catch {
        params = undefined;
      }
    }
    el.textContent = t(key, params);
  }

  for (const el of root.querySelectorAll<HTMLElement>("[data-i18n-attr]")) {
    const spec = el.dataset["i18nAttr"];
    if (!spec) continue;
    for (const pair of spec.split(",")) {
      const [attr, key] = pair.split(":").map((s) => s.trim());
      if (!attr || !key) continue;
      el.setAttribute(attr, t(key as DictKey));
    }
  }
}
