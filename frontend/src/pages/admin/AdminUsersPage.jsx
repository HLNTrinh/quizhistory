// src/pages/admin/AdminUsersPage.jsx
// Trang quản trị người dùng — dữ liệu thật từ GET /api/admin/users.
// Tìm kiếm, lọc vai trò/trạng thái, sắp xếp và phân trang đều xử lý phía máy chủ.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Link2,
  LockKeyhole,
  Pencil,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Unlock,
  UserCheck,
  UserPlus,
  Users
} from "lucide-react";
import AdminConsoleLayout, { buildInitials } from "./AdminConsoleLayout.jsx";
import AdminTopActions from "./AdminTopActions.jsx";
import AdminFormModal from "./AdminFormModal.jsx";
import { adminApi } from "../../lib/api.js";
import "./AdminUsers.css";

const numberFormat = new Intl.NumberFormat("vi-VN");
const PAGE_SIZE = 10;

const ROLE_LABELS = { student: "Học viên", admin: "Quản trị viên" };
const ROLE_TONES = { student: "violet", admin: "amber" };
const ROLE_OPTIONS = [
  { value: "all", label: "Tất cả vai trò" },
  { value: "student", label: "Học viên" },
  { value: "admin", label: "Quản trị viên" }
];
const STATUS_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "active", label: "Đang hoạt động" },
  { value: "locked", label: "Đang tạm khóa" }
];
const SORT_OPTIONS = [
  { value: "newest", label: "Mới tham gia gần nhất" },
  { value: "oldest", label: "Tham gia lâu nhất" },
  { value: "name", label: "Tên A → Z" },
  { value: "score", label: "Điểm tích lũy cao nhất" }
];

const EMPTY_PAGINATION = { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 };
const EMPTY_FORM = { name: "", email: "", role: "student", status: "active", password: "" };

function formatDate(value) {
  if (!value) return "--";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
    .format(new Date(value));
}

function avatarTone(row) {
  if (row.status === "locked") return "red";
  return row.role === "admin" ? "amber" : "violet";
}

function memberNote(row) {
  if (row.status === "locked") return "Tài khoản đang bị tạm khóa";
  if (!row.attempts) return "Chưa có lượt làm bài";
  const accuracy = row.avgAccuracy === null || row.avgAccuracy === undefined ? "--" : `${row.avgAccuracy}%`;
  return `${numberFormat.format(row.attempts)} lượt làm bài · độ chính xác TB ${accuracy}`;
}

function buildPageList(current, totalPages) {
  const total = Math.max(1, totalPages);
  const start = Math.max(1, Math.min(current - 2, total - 4));
  const list = [];
  for (let page = start; page < start + 5 && page <= total; page += 1) list.push(page);
  return list;
}

export default function AdminUsersPage({ admin, onLogout, onNavigate }) {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [loadState, setLoadState] = useState("loading");
  const [loadError, setLoadError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [page, setPage] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState("");
  const [userModal, setUserModal] = useState(null); // "create" | "edit" | "view" | null
  const [activeUser, setActiveUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const toastTimer = useRef(null);
  const requestRef = useRef(null);
  const hasDataRef = useRef(false);

  useEffect(() => () => {
    window.clearTimeout(toastTimer.current);
    requestRef.current?.abort();
  }, []);

  function showToast(message) {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 3600);
  }

  function handleBellClick() {
    setUnreadCount(0);
    showToast("Đã đánh dấu toàn bộ thông báo là đã đọc.");
  }


  // Gõ tìm kiếm được debounce 320ms để không gọi API liên tục theo từng ký tự.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 320);
    return () => window.clearTimeout(timer);
  }, [query]);

  const loadUsers = useCallback(async ({ silent = false } = {}) => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoadError(null);
    if (!silent && !hasDataRef.current) setLoadState("loading");

    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), sort: sortOrder });
    if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
    if (roleFilter !== "all") params.set("role", roleFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);

    try {
      const payload = await adminApi(`/admin/users?${params.toString()}`, { signal: controller.signal });
      if (controller.signal.aborted) return { ok: false };
      hasDataRef.current = true;
      setRows(Array.isArray(payload.items) ? payload.items : []);
      setStats(payload.stats || null);
      setPagination(payload.pagination || EMPTY_PAGINATION);
      setLoadState("ready");
      return { ok: true };
    } catch (error) {
      if (controller.signal.aborted) return { ok: false };
      setLoadError(error);
      if (!hasDataRef.current) setLoadState("error");
      return { ok: false, error };
    }
  }, [page, debouncedQuery, roleFilter, statusFilter, sortOrder]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function handleRefresh() {
    setRefreshing(true);
    const result = await loadUsers();
    setRefreshing(false);
    if (result.ok) showToast("Đã làm mới danh sách người dùng.");
    else if (result.error) showToast(`Không tải được danh sách: ${result.error.message}`);
  }
  function resetFilters() {
    setQuery("");
    setDebouncedQuery("");
    setRoleFilter("all");
    setStatusFilter("all");
    setSortOrder("newest");
    setPage(1);
    showToast("Đã đặt lại bộ lọc danh sách người dùng.");
  }

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreateUser() {
    setActiveUser(null);
    setForm(EMPTY_FORM);
    setUserModal("create");
  }

  function openEditUser(row) {
    setActiveUser(row);
    setForm({ name: row.name, email: row.email, role: row.role, status: row.status, password: "" });
    setUserModal("edit");
  }

  function openViewUser(row) {
    setActiveUser(row);
    setUserModal("view");
  }

  function closeUserModal() {
    setUserModal(null);
    setActiveUser(null);
  }

  async function handleUserSubmit(event) {
    event.preventDefault();
    if (saving) return;

    const name = form.name.trim();
    const email = form.email.trim();
    if (name.length < 2) {
      showToast("Vui lòng nhập họ tên người dùng (ít nhất 2 ký tự).");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast("Email liên kết chưa đúng định dạng.");
      return;
    }
    if (userModal === "create" && form.password.length < 8) {
      showToast("Mật khẩu khởi tạo cần có ít nhất 8 ký tự.");
      return;
    }

    setSaving(true);
    try {
      if (userModal === "edit" && activeUser) {
        await adminApi(`/admin/users/${activeUser.id}`, {
          method: "PATCH",
          body: JSON.stringify({ fullName: name, email, role: form.role, status: form.status })
        });
        showToast(`Đã cập nhật người dùng “${name}”.`);
      } else {
        await adminApi("/admin/users", {
          method: "POST",
          body: JSON.stringify({ fullName: name, email, password: form.password, role: form.role, status: form.status })
        });
        showToast(`Đã thêm người dùng “${name}”.`);
      }
      closeUserModal();
      await loadUsers({ silent: true });
    } catch (error) {
      showToast(error.message || "Không lưu được người dùng.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleLock(row) {
    const nextStatus = row.status === "locked" ? "active" : "locked";
    try {
      await adminApi(`/admin/users/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus })
      });
      showToast(nextStatus === "locked"
        ? `Đã tạm khóa tài khoản ${row.name}.`
        : `Đã mở khóa tài khoản ${row.name}.`);
      await loadUsers({ silent: true });
    } catch (error) {
      showToast(error.message || "Không cập nhật được trạng thái tài khoản.");
    }
  }

  async function handleDeleteSubmit(event) {
    event.preventDefault();
    if (!deleteTarget || saving) return;

    setSaving(true);
    try {
      await adminApi(`/admin/users/${deleteTarget.id}`, { method: "DELETE" });
      const deletedName = deleteTarget.name;
      setDeleteTarget(null);
      showToast(`Đã xóa tài khoản ${deletedName}.`);
      if (rows.length === 1 && pagination.page > 1) setPage(pagination.page - 1);
      else await loadUsers({ silent: true });
    } catch (error) {
      showToast(error.message || "Không xóa được tài khoản.");
    } finally {
      setSaving(false);
    }
  }

  


  function exportCsv() {
    if (!rows.length) {
      showToast("Chưa có dữ liệu để xuất CSV.");
      return;
    }
    const header = ["Họ tên", "Email liên kết", "Vai trò", "Bộ hoàn thành", "Điểm tích lũy", "Ngày tham gia", "Trạng thái"];
    const lines = rows.map((row) => [
      row.name,
      row.email,
      ROLE_LABELS[row.role] || ROLE_LABELS.student,
      row.completedSets,
      row.totalScore,
      formatDate(row.joinedAt),
      row.status === "active" ? "Hoạt động" : "Đang tạm khóa"
    ]);
    const csv = [header, ...lines]
      .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "nguoi-dung-su-ky.csv";
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Đã xuất CSV ${rows.length} tài khoản của trang hiện tại.`);
  }

  const statCards = useMemo(() => {
    if (!stats) return [];
    return [
      {
        id: "total",
        label: "Tổng người dùng",
        value: stats.total,
        icon: Users,
        tone: "purple",
        pill: `+${numberFormat.format(stats.newUsers7d)}`,
        pillTone: "green",
        note: "tài khoản mới trong 7 ngày"
      },
      {
        id: "active",
        label: "Đang hoạt động",
        value: stats.active,
        icon: UserCheck,
        tone: "green",
        pill: `${stats.activeRatio}%`,
        pillTone: "green",
        note: "tỉ lệ tài khoản đang hoạt động"
      },
      {
        id: "locked",
        label: "Đang tạm khóa",
        value: stats.locked,
        icon: Ban,
        tone: "red",
        pill: stats.locked ? "Cần xử lý" : "Không có",
        pillTone: stats.locked ? "red" : "muted",
        note: stats.locked ? "tài khoản đang bị tạm khóa" : "không có tài khoản bị khóa"
      },
      {
        id: "staff",
        label: "Ban quản trị",
        value: stats.admins,
        icon: ShieldCheck,
        tone: "amber",
        pill: `${numberFormat.format(stats.students)} học viên`,
        pillTone: "blue",
        note: "phân quyền quản trị hệ thống"
      }
    ];
  }, [stats]);

  const pageList = useMemo(
    () => buildPageList(pagination.page, pagination.totalPages),
    [pagination]
  );

  const startItem = pagination.total ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total);
  const hasFilters = Boolean(debouncedQuery.trim()) || roleFilter !== "all" || statusFilter !== "all";

  return (
    <AdminConsoleLayout
      admin={admin}
      onLogout={onLogout}
      onNavigate={onNavigate}
      activePath="/admin/users"
      breadcrumb="Quản trị / Người dùng"
      actions={
        <AdminTopActions
          admin={admin}
          onLogout={onLogout}
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Tìm họ tên, email người dùng..."
          searchLabel="Tìm kiếm người dùng"
          unreadCount={unreadCount}
          onBellClick={handleBellClick}
        />
      }
      onFooterAction={(label) => showToast(`${label}: nội dung đang được hoàn thiện.`)}
    >
      {loadState === "loading" && !stats ? (
        <>
          <div className="adm-stat-grid">
            {[0, 1, 2, 3].map((key) => (
              <div className="adm-stat" key={key}>
                <div className="adm-skeleton" style={{ height: 14, width: "62%" }} />
                <div className="adm-skeleton" style={{ height: 28, width: "45%" }} />
                <div className="adm-skeleton" style={{ height: 12, width: "72%" }} />
              </div>
            ))}
          </div>
          <div className="adm-panel adm-panel-flush">
            <div style={{ padding: 20 }}>
              <div className="adm-skeleton" style={{ height: 16, width: "38%" }} />
              <div className="adm-skeleton" style={{ height: 260, marginTop: 16 }} />
            </div>
          </div>
        </>
      ) : null}

      {loadState === "error" && !stats ? (
        <div className="adm-state-card is-error">
          <span className="adm-state-icon"><AlertTriangle size={30} /></span>
          <h2>Không tải được danh sách người dùng</h2>
          <p>
            {loadError?.message || "Không thể kết nối đến máy chủ API quản trị."}
            {" "}Vui lòng kiểm tra backend và kết nối cơ sở dữ liệu rồi thử lại.
          </p>
          <div className="adm-state-actions">
            <button type="button" className="adm-primary" onClick={handleRefresh}>
              <RotateCcw size={15} /> Thử tải lại ngay
            </button>
            {loadError?.status === 401 ? (
              <button type="button" className="adm-ghost" onClick={onLogout}>Đăng nhập lại</button>
            ) : null}
          </div>
        </div>
      ) : null}

      {stats ? (
        <>
          <div className="adm-stat-grid">
            {statCards.map((item) => {
              const Icon = item.icon;
              return (
                <article className="adm-stat" key={item.id}>
                  <div className="adm-stat-head">
                    <p className="adm-stat-label">{item.label}</p>
                    <span className={`adm-stat-icon is-${item.tone}`} aria-hidden="true">
                      <Icon size={18} />
                    </span>
                  </div>
                  <p className="adm-stat-value">{numberFormat.format(item.value)}</p>
                  <div className="adm-stat-footer">
                    <span className={`adm-pill is-${item.pillTone}`}>{item.pill}</span>
                    <span>{item.note}</span>
                  </div>
                </article>
              );
            })}
          </div>

          <section className="adm-filter-bar" aria-label="Bộ lọc người dùng">
            <select
              className="adm-filter-select"
              value={roleFilter}
              onChange={(event) => {
                setRoleFilter(event.target.value);
                setPage(1);
              }}
              aria-label="Lọc theo vai trò"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <select
              className="adm-filter-select"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              aria-label="Lọc theo trạng thái"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <select
              className="adm-filter-select"
              value={sortOrder}
              onChange={(event) => {
                setSortOrder(event.target.value);
                setPage(1);
              }}
              aria-label="Sắp xếp danh sách"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <button type="button" className="adm-ghost adm-filter-reset" onClick={resetFilters}>
              <RefreshCw size={15} /> Đặt lại bộ lọc
            </button>

            <div className="adm-filter-actions">
              <button type="button" className="adm-ghost" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw size={15} /> {refreshing ? "Đang tải..." : "Làm mới"}
              </button>
              <button type="button" className="adm-ghost" onClick={exportCsv} disabled={!rows.length}>
                <Download size={15} /> Xuất CSV
              </button>
              <button type="button" className="adm-primary" onClick={openCreateUser}>
                <UserPlus size={16} /> Thêm người dùng mới
              </button>
            </div>
          </section>


          <section className="adm-panel adm-panel-flush" aria-label="Danh sách người dùng">
            <div className="adm-table-wrap">
              <table className="adm-table adm-table-users">
                <thead>
                  <tr>
                    <th scope="col">Thành viên</th>
                    <th scope="col">Email liên kết</th>
                    <th scope="col">Vai trò</th>
                    <th scope="col">Tiến độ học tập</th>
                    <th scope="col">Ngày tham gia</th>
                    <th scope="col">Trạng thái</th>
                    <th scope="col">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="adm-empty-row">
                        {hasFilters
                          ? "Không tìm thấy người dùng phù hợp với bộ lọc hiện tại."
                          : "Chưa có người dùng nào trong hệ thống. Hãy thêm tài khoản đầu tiên."}
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => {
                      const roleLabel = ROLE_LABELS[row.role] || ROLE_LABELS.student;
                      const roleTone = ROLE_TONES[row.role] || "violet";
                      const totalSets = stats?.questionSets || 0;
                      const percent = totalSets
                        ? Math.min(100, Math.round((row.completedSets / totalSets) * 100))
                        : 0;
                      return (
                        <tr key={row.id} className={row.status === "locked" ? "is-locked" : undefined}>
                          <td>
                            <div className="adm-member">
                              <span className={`adm-member-avatar is-${avatarTone(row)}`} aria-hidden="true">
                                {buildInitials(row.name)}
                              </span>
                              <span className="adm-member-text">
                                <strong>
                                  {row.name}
                                  {row.role === "admin" ? <Link2 size={12} className="is-link" aria-label="Quản trị viên" /> : null}
                                  {row.status === "locked" ? <LockKeyhole size={12} className="is-lock" aria-label="Đang tạm khóa" /> : null}
                                </strong>
                                <small>{memberNote(row)}</small>
                              </span>
                            </div>
                          </td>
                          <td><span className="adm-member-email">{row.email}</span></td>
                          <td><span className={`adm-role-pill is-${roleTone}`}>{roleLabel}</span></td>
                          <td>
                            <div className="adm-progress">
                              <div className="adm-progress-top">
                                <span className="adm-progress-label">
                                  {numberFormat.format(row.completedSets)} bộ hoàn thành
                                </span>
                                <span className={`adm-pill is-${row.completedSets ? "amber" : "muted"}`}>
                                  {numberFormat.format(row.totalScore)} điểm
                                </span>
                              </div>
                              <div className="adm-track">
                                <i
                                  style={{
                                    width: `${percent}%`,
                                    background: row.status === "locked" ? "#cbd0e4" : "#6a5af9"
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td><span className="adm-member-date">{formatDate(row.joinedAt)}</span></td>
                          <td>
                            {row.status === "active" ? (
                              <span className="adm-badge is-open"><i aria-hidden="true" />Hoạt động</span>
                            ) : (
                              <span className="adm-badge is-locked"><i aria-hidden="true" />Đang tạm khóa</span>
                            )}
                          </td>

                          <td>
                            <div className="adm-table-actions">
                              <button
                                type="button"
                                className="adm-eye-btn"
                                onClick={() => openViewUser(row)}
                                aria-label={`Xem hồ sơ ${row.name}`}
                              >
                                <Eye size={15} />
                              </button>
                              <button
                                type="button"
                                className="adm-eye-btn"
                                onClick={() => openEditUser(row)}
                                aria-label={`Chỉnh sửa ${row.name}`}
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                type="button"
                                className="adm-eye-btn"
                                onClick={() => handleToggleLock(row)}
                                aria-label={row.status === "locked" ? `Mở khóa ${row.name}` : `Tạm khóa ${row.name}`}
                              >
                                {row.status === "locked" ? <Unlock size={15} /> : <Ban size={15} />}
                              </button>
                              <button
                                type="button"
                                className="adm-eye-btn is-danger"
                                onClick={() => setDeleteTarget(row)}
                                aria-label={`Xóa ${row.name}`}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="adm-table-foot">
              <span>
                Hiển thị <b>{numberFormat.format(startItem)} – {numberFormat.format(endItem)}</b> trong tổng số{" "}
                <b>{numberFormat.format(pagination.total)}</b> tài khoản
              </span>
              <div className="adm-pager">
                <button
                  type="button"
                  className="adm-pager-btn"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={pagination.page <= 1}
                  aria-label="Trang trước"
                >
                  <ChevronLeft size={15} />
                </button>
                {pageList.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`adm-pager-btn${item === pagination.page ? " is-active" : ""}`}
                    aria-current={item === pagination.page ? "page" : undefined}
                    onClick={() => setPage(item)}
                  >
                    {numberFormat.format(item)}
                  </button>
                ))}
                <button
                  type="button"
                  className="adm-pager-btn"
                  onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
                  disabled={pagination.page >= pagination.totalPages}
                  aria-label="Trang sau"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </section>
        </>
      ) : null}


      {userModal === "view" && activeUser ? (
        <AdminFormModal
          title={`Hồ sơ: ${activeUser.name}`}
          subtitle="Thông tin tài khoản lấy trực tiếp từ cơ sở dữ liệu."
          size="lg"
          onClose={closeUserModal}
          footer={
            <>
              <button type="button" className="adm-ghost" onClick={closeUserModal}>Đóng</button>
              <button type="button" className="adm-primary" onClick={() => openEditUser(activeUser)}>Chỉnh sửa</button>
            </>
          }
        >
          <div className="adm-detail">
            <div className="adm-detail-row"><span>Họ và tên</span><strong>{activeUser.name}</strong></div>
            <div className="adm-detail-row"><span>Email liên kết</span><strong>{activeUser.email}</strong></div>
            <div className="adm-detail-row"><span>Vai trò</span><strong>{ROLE_LABELS[activeUser.role] || ROLE_LABELS.student}</strong></div>
            <div className="adm-detail-row">
              <span>Trạng thái</span>
              <strong>{activeUser.status === "active" ? "Đang hoạt động" : "Đang tạm khóa"}</strong>
            </div>
            <div className="adm-detail-row">
              <span>Tiến độ học tập</span>
              <strong>
                {numberFormat.format(activeUser.completedSets)} bộ hoàn thành · {numberFormat.format(activeUser.totalScore)} điểm
              </strong>
            </div>
            <div className="adm-detail-row">
              <span>Lượt làm bài</span>
              <strong>
                {numberFormat.format(activeUser.attempts)} lượt
                {activeUser.avgAccuracy === null ? "" : ` · độ chính xác TB ${activeUser.avgAccuracy}%`}
              </strong>
            </div>
            <div className="adm-detail-row">
              <span>Hoạt động gần nhất</span>
              <strong>{formatDate(activeUser.lastActiveAt)}</strong>
            </div>
            <div className="adm-detail-row"><span>Ngày tham gia</span><strong>{formatDate(activeUser.joinedAt)}</strong></div>
          </div>
        </AdminFormModal>
      ) : null}


      {userModal === "create" || userModal === "edit" ? (
        <AdminFormModal
          title={userModal === "edit" ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
          subtitle={userModal === "edit"
            ? "Thay đổi được lưu trực tiếp vào cơ sở dữ liệu."
            : "Tài khoản mới có thể đăng nhập ngay bằng email và mật khẩu khởi tạo."}
          size="lg"
          onSubmit={handleUserSubmit}
          onClose={closeUserModal}
          footer={
            <>
              <button type="button" className="adm-ghost" onClick={closeUserModal}>Hủy bỏ</button>
              <button type="submit" className="adm-primary" disabled={saving}>
                {saving ? "Đang lưu..." : userModal === "edit" ? "Lưu thay đổi" : "Thêm người dùng"}
              </button>
            </>
          }
        >
          <div className="adm-field-row">
            <div className="adm-field">
              <label htmlFor="adm-user-name">Họ và tên</label>
              <input
                id="adm-user-name"
                className="adm-input"
                value={form.name}
                onChange={(event) => updateForm("name", event.target.value)}
                placeholder="Ví dụ: Nguyễn Minh Quân"
                autoFocus
              />
            </div>
            <div className="adm-field">
              <label htmlFor="adm-user-email">Email liên kết</label>
              <input
                id="adm-user-email"
                type="email"
                className="adm-input"
                value={form.email}
                onChange={(event) => updateForm("email", event.target.value)}
                placeholder="vidu@email.com"
              />
            </div>
          </div>

          <div className="adm-field-row">
            <div className="adm-field">
              <label htmlFor="adm-user-role">Vai trò</label>
              <select
                id="adm-user-role"
                className="adm-select"
                value={form.role}
                onChange={(event) => updateForm("role", event.target.value)}
              >
                <option value="student">Học viên</option>
                <option value="admin">Quản trị viên</option>
              </select>
            </div>
            <div className="adm-field">
              <label htmlFor="adm-user-status">Trạng thái</label>
              <select
                id="adm-user-status"
                className="adm-select"
                value={form.status}
                onChange={(event) => updateForm("status", event.target.value)}
              >
                <option value="active">Đang hoạt động</option>
                <option value="locked">Tạm khóa</option>
              </select>
            </div>
          </div>

          {userModal === "create" ? (
            <div className="adm-field">
              <label htmlFor="adm-user-password">Mật khẩu khởi tạo</label>
              <input
                id="adm-user-password"
                type="password"
                className="adm-input"
                value={form.password}
                onChange={(event) => updateForm("password", event.target.value)}
                placeholder="Tối thiểu 8 ký tự"
                autoComplete="new-password"
              />
              <span className="adm-field-hint">
                Mật khẩu được băm bằng bcrypt trước khi lưu và không hiển thị lại sau này.
              </span>
            </div>
          ) : null}
        </AdminFormModal>
      ) : null}


      {deleteTarget ? (
        <AdminFormModal
          title="Xóa tài khoản người dùng"
          subtitle="Hành động này không thể hoàn tác."
          onSubmit={handleDeleteSubmit}
          onClose={() => setDeleteTarget(null)}
          footer={
            <>
              <button type="button" className="adm-ghost" onClick={() => setDeleteTarget(null)}>Hủy bỏ</button>
              <button type="submit" className="adm-primary" disabled={saving}>
                {saving ? "Đang xóa..." : "Xóa vĩnh viễn"}
              </button>
            </>
          }
        >
          <div className="adm-note">
            <span className="adm-note-icon" aria-hidden="true"><AlertTriangle size={18} /></span>
            <p>
              Tài khoản <b>{deleteTarget.name}</b> ({deleteTarget.email}) sẽ bị xóa cùng toàn bộ lượt làm bài,
              tiến độ học tập và điểm xếp hạng. Cân nhắc dùng chức năng <b>Tạm khóa</b> nếu chỉ muốn ngưng truy cập.
            </p>
          </div>
        </AdminFormModal>
      ) : null}

      {toast ? (
        <div className="adm-toast" role="status">
          <CheckCircle2 size={16} />
          <span>{toast}</span>
        </div>
      ) : null}
    </AdminConsoleLayout>
  );
}
