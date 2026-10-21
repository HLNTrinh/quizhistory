const ADMIN_SESSION_KEY = "quizhistory-admin-session";

export function readAdminSession() {
  const raw = localStorage.getItem(ADMIN_SESSION_KEY) || sessionStorage.getItem(ADMIN_SESSION_KEY);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw);
    return session && session.email ? session : null;
  } catch {
    return null;
  }
}

export function saveAdminSession(session, remember = false) {
  clearAdminSession();
  const store = remember ? localStorage : sessionStorage;
  store.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}
