const ADMIN_PASSWORD_KEY = "aliasist-admin-password";

export function getStoredAdminPassword(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(ADMIN_PASSWORD_KEY) ?? "";
}

export function clearStoredAdminPassword(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_PASSWORD_KEY);
}

export function getOrPromptAdminPassword(): string | null {
  if (typeof window === "undefined") return null;

  const stored = getStoredAdminPassword().trim();
  if (stored) return stored;

  const entered = window.prompt("Enter admin password");
  const normalized = entered?.trim() ?? "";
  if (!normalized) return null;

  localStorage.setItem(ADMIN_PASSWORD_KEY, normalized);
  return normalized;
}
