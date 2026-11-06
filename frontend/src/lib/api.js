export function readToken() {
  return localStorage.getItem("quizhistory-token") || sessionStorage.getItem("quizhistory-token");
}

export async function api(path, options = {}) {
  const token = readToken();
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(`Máy chủ API trả về phản hồi không phải JSON (HTTP ${response.status}). Kiểm tra backend và kết nối cơ sở dữ liệu.`);
  }
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Không thể kết nối đến máy chủ.");
  return data;
}

const ADMIN_TOKEN_KEY = "quizhistory-admin-token";

export function readAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY) || sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

export function saveAdminToken(token, remember = true) {
  const storage = remember ? localStorage : sessionStorage;
  const otherStorage = remember ? sessionStorage : localStorage;
  otherStorage.removeItem(ADMIN_TOKEN_KEY);
  storage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}

// Gọi các route /api/admin/* bằng token quản trị riêng (không dùng token học sinh).
export async function adminApi(path, options = {}) {
  const token = readAdminToken();
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(`Máy chủ API trả về phản hồi không phải JSON (HTTP ${response.status}). Kiểm tra backend và kết nối cơ sở dữ liệu.`);
  }
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || "Không thể kết nối đến máy chủ.");
    error.status = response.status;
    throw error;
  }
  return data;
}
