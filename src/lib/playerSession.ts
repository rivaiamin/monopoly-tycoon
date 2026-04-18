const CLIENT_ID_KEY = "ptycoon:clientId";

/** Stable per-browser id (like a lightweight login). Used to resume a seat after refresh or later. */
export function getOrCreateClientId(): string {
  try {
    let id = localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `pty-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  } catch {
    return `pty-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
}
