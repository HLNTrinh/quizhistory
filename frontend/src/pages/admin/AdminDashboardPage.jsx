import { useEffect, useState } from "react";
import {
  BookOpenCheck, ClipboardList, LogOut, RefreshCw, ShieldCheck, Trophy, Users
} from "lucide-react";
import { adminApi, clearAdminToken } from "../../lib/api.js";
import "./AdminPages.css";

const numberFormat = new Intl.NumberFormat("vi-VN");

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
  } catch {
    return "—";
  }
}

export default function AdminDashboardPage({ admin, onLogout, onNavigate }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function loadOverview(signal) {
    setLoading(true);
    setError("");
    adminApi("/admin/overview")
      .then((data) => {
        if (!signal?.aborted) setOverview(data);
      })
      .catch((loadError) => {
        if (signal?.aborted) return;
        if (loadError.status === 401 || loadError.status === 403) {
          clearAdminToken();
          onLogout();
          return;
        }
        setError(loadError.message);
      })
      .finally(() => {
        if (!signal?.aborted) setLoading(false);
      });
  }

  useEffect(() => {
    const controller = new AbortController();
    loadOverview(controller.signal);
    return () => controller.abort();
  }, []);

  const totals = overview?.totals;

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <div>
          <span className="admin-kicker"><ShieldCheck size={13} /> BẢNG ĐIỀU KHIỂN QUẢN TRỊ</span>
          <h1>Xin chào, {admin?.name || "quản trị viên"}</h1>
          <p>{admin?.email} · Vai trò: quản trị viên</p>
        </div>
        <div className="admin-topbar-actions">
          <button type="button" className="admin-ghost" onClick={() => loadOverview()}>
            <RefreshCw size={14} /> Làm mới
          </button>
          <button type="button" className="admin-ghost" onClick={() => onNavigate("/")}>
            <BookOpenCheck size={14} /> Cổng học tập
          </button>
          <button type="button" className="admin-danger" onClick={onLogout}>
            <LogOut size={14} /> Đăng xuất
          </button>
        </div>
      </header>

      {error && <div className="admin-error-banner" role="alert">{error}</div>}

      {loading && !overview ? (
        <div className="admin-loading">Đang tải số liệu hệ thống...</div>
      ) : (
        <>
          <section className="admin-stat-grid">
            <article className="admin-stat">
              <span className="admin-stat-icon"><Users size={17} /></span>
              <div>
                <strong>{totals ? numberFormat.format(totals.students) : "—"}</strong>
                <span>Học sinh</span>
              </div>
            </article>
            <article className="admin-stat">
              <span className="admin-stat-icon admin-stat-icon-admin"><ShieldCheck size={17} /></span>
              <div>
                <strong>{totals ? numberFormat.format(totals.admins) : "—"}</strong>
                <span>Quản trị viên</span>
              </div>
            </article>
            <article className="admin-stat">
              <span className="admin-stat-icon"><BookOpenCheck size={17} /></span>
              <div>
                <strong>{totals ? numberFormat.format(totals.packages) : "—"}</strong>
                <span>Gói câu hỏi</span>
              </div>
            </article>
            <article className="admin-stat">
              <span className="admin-stat-icon"><ClipboardList size={17} /></span>
              <div>
                <strong>{totals ? numberFormat.format(totals.questionSets) : "—"}</strong>
                <span>Bộ câu hỏi</span>
              </div>
            </article>
            <article className="admin-stat">
              <span className="admin-stat-icon"><Trophy size={17} /></span>
              <div>
                <strong>{totals ? numberFormat.format(totals.attempts) : "—"}</strong>
                <span>Lượt làm bài</span>
              </div>
            </article>
          </section>

          <div className="admin-columns">
            <section className="admin-panel">
              <div className="admin-panel-head">
                <h2>Tài khoản mới nhất</h2>
                <span>{overview?.latestUsers?.length || 0} tài khoản</span>
              </div>
              {overview?.latestUsers?.length ? (
                <table className="admin-table">
                  <thead>
                    <tr><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th>Ngày tạo</th></tr>
                  </thead>
                  <tbody>
                    {overview.latestUsers.map((user) => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td className="admin-muted">{user.email}</td>
                        <td><span className={`admin-badge ${user.role === "admin" ? "is-admin" : ""}`}>{user.role === "admin" ? "Quản trị" : "Học sinh"}</span></td>
                        <td className="admin-muted">{user.status === "locked" ? "Đã khoá" : "Hoạt động"}</td>
                        <td className="admin-muted">{formatDate(user.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="admin-empty">Chưa có tài khoản nào.</p>}
            </section>

            <section className="admin-panel">
              <div className="admin-panel-head">
                <h2>Lượt làm bài gần đây</h2>
                <span>{overview?.latestAttempts?.length || 0} lượt</span>
              </div>
              {overview?.latestAttempts?.length ? (
                <ul className="admin-attempt-list">
                  {overview.latestAttempts.map((attempt) => (
                    <li key={attempt.id}>
                      <div>
                        <strong>{attempt.studentName}</strong>
                        <span>{formatDate(attempt.completedAt)}</span>
                      </div>
                      <span className="admin-attempt-score">{attempt.score}/{attempt.totalQuestions || 0}</span>
                      <span className="admin-attempt-accuracy">{attempt.accuracy || 0}%</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="admin-empty">Chưa có lượt làm bài nào.</p>}
            </section>
          </div>

          <p className="admin-hint">
            Đây là bảng điều khiển khung. Có thể bổ sung chức năng quản trị sau bằng cách thêm route mới trong
            <code> backend/routes/admin.js</code> kèm middleware <code>requireAdmin</code>.
          </p>
        </>
      )}
    </main>
  );
}
