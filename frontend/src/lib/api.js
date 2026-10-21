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