// src/pages/admin/AdminUsersPage.jsx
// Trang quản trị người dùng — dựng trên khung AdminConsoleLayout (sidebar + topbar + footer giống Dashboard).
// Hiện tại là giao diện với dữ liệu mẫu, chưa gọi API.
import { useEffect, useMemo, useRef, useState } from "react";
import {
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
  ShieldCheck,
  Trash2,
  Unlock,
  UserCheck,
  UserPlus,
  Users
} from "lucide-react";
import AdminConsoleLayout, { buildInitials } from "./AdminConsoleLayout.jsx";
import AdminTopActions from "./AdminTopActions.jsx";
import "./AdminUsers.css";

const numberFormat = new Intl.NumberFormat("vi-VN");

const userStats = [
  {
    id: "total",
    label: "Tổng người học & QTV",
    value: 42850,
    icon: Users,
    tone: "purple",
    pill: "+1.240",
    pillTone: "green",
    note: "đăng ký mới tuần này"
  },
  {
    id: "active",
    label: "Đang hoạt động",
    value: 41620,
    icon: UserCheck,
    tone: "green",
    pill: "97,1%",
    pillTone: "green",
    note: "tỉ lệ hoạt động lành mạnh"
  },
  {
    id: "locked",
    label: "Đang tạm khóa",
    value: 180,
    icon: Ban,
    tone: "red",
    pill: "Cần xử lý",
    pillTone: "red",
    note: "vi phạm quy chế ôn luyện"
  },
  {
    id: "staff",
    label: "Ban Quản trị & BTV",
    value: 15,
    icon: ShieldCheck,
    tone: "amber",
    pill: "100% 2FA",
    pillTone: "amber",
    note: "phân quyền kiểm duyệt"
  }
];

const initialUsers = [
  {
    id: "u-01",
    name: "Nguyễn Minh Quân",
    email: "nguyenminhquan@gmail.com",
    role: "student",
    roleLabel: "Học viên",
    roleTone: "violet",
    subtitle: "Top 1 Quân sự Việt",
    avatarTone: "violet",
    progress: { label: "18 Gói hoàn thành", percent: 62, tag: "12.450 XP", tone: "amber", color: "#6a5af9" },
    joined: "15/09/2025",
    status: "active"
  },
  {
    id: "u-02",
    name: "Lê Hùng Vương",
    email: "lehungvuong.history@gmail.com",
    role: "student",
    roleLabel: "Học viên",
    roleTone: "violet",
    subtitle: "Cấp 14 Đại tướng Sử học",
    avatarTone: "green",
    progress: { label: "8 Gói hoàn thành", percent: 34, tag: "5.250 XP", tone: "amber", color: "#6a5af9" },
    joined: "10/01/2026",
    status: "active"
  },
  {
    id: "u-03",
    name: "Trần Thủy Linh",
    email: "thpthan_linh@gmail.com",
    role: "student",
    roleLabel: "Học viên",
    roleTone: "violet",
    subtitle: "Chuyên cần 45 ngày",
    avatarTone: "purple",
    progress: { label: "16 Gói hoàn thành", percent: 57, tag: "11.820 XP", tone: "amber", color: "#10b981" },
    joined: "02/10/2025",
    status: "active"
  },
  {
    id: "u-04",
    name: "Đỗ Hải Đăng",
    email: "haidang.history@outlook.com",
    role: "student",
    roleLabel: "Học viên",
    roleTone: "violet",
    subtitle: "Thử thách ngắn hạn",
    avatarTone: "violet",
    progress: { label: "14 Gói hoàn thành", percent: 50, tag: "9.850 XP", tone: "amber", color: "#10b981" },
    joined: "12/11/2025",
    status: "active"
  },
  {
    id: "u-05",
    name: "Chu Anh Tuấn",
    email: "anhtuan.edu@gmail.com",
    role: "editor",
    roleLabel: "Biên tập viên sử học",
    roleTone: "amber",
    verified: true,
    subtitle: "Viên Lịch sử Quân sự",
    avatarTone: "amber",
    progress: { label: "26 Bộ thẩm định", percent: 100, tag: "100% Phê duyệt", tone: "amber", color: "#f5a524" },
    joined: "18/08/2025",
    status: "active"
  },
  {
    id: "u-06",
    name: "Vũ Tuấn Kiệt",
    email: "tuankiet.spam@tempemail.com",
    role: "student",
    roleLabel: "Học viên",
    roleTone: "red",
    subtitle: "Lý do: Spam phỏng thi đấu",
    avatarTone: "red",
    progress: { label: "0 Gói hoàn thành", percent: 0, tag: "0 XP", tone: "muted", color: "#cbd0e4" },
    joined: "14/02/2026",
    status: "locked"
  }
];

export default function AdminUsersPage({ admin, onLogout, onNavigate }) {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [unreadCount, setUnreadCount] = useState(3);
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  function showToast(message) {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 3200);
  }

  function handleBellClick() {
    setUnreadCount(0);
    showToast("Đã đánh dấu toàn bộ thông báo là đã đọc.");
  }

  function resetFilters() {
    setQuery("");
    setRoleFilter("all");
    setStatusFilter("all");
    showToast("Đã đặt lại bộ lọc danh sách người dùng.");
  }

  function toggleLock(id) {
    setUsers((rows) => rows.map((row) => {
      if (row.id !== id) return row;
      const nextLocked = row.status !== "locked";
      return {
        ...row,
        status: nextLocked ? "locked" : "active",
        subtitle: nextLocked ? "Lý do: Tạm khóa bởi quản trị viên" : row.role === "editor" ? "Viên Lịch sử Quân sự" : "Thử thách ngắn hạn"
      };
    }));
    const target = users.find((row) => row.id === id);
    showToast(target && target.status === "locked"
      ? `Đã mở khóa tài khoản ${target.name}.`
      : `Đã tạm khóa tài khoản ${target ? target.name : ""}.`);
  }

  const filteredUsers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return users.filter((row) => {
      const matchKeyword = !keyword
        || row.name.toLowerCase().includes(keyword)
        || row.email.toLowerCase().includes(keyword)
        || row.roleLabel.toLowerCase().includes(keyword);
      const matchRole = roleFilter === "all" || row.role === roleFilter;
      const matchStatus = statusFilter === "all" || row.status === statusFilter;
      return matchKeyword && matchRole && matchStatus;
    });
  }, [users, query, roleFilter, statusFilter]);

  function exportCsv() {
    const header = ["Họ tên", "Email liên kết", "Vai trò", "Tiến độ học tập", "Ngày tham gia", "Trạng thái"];
    const rows = filteredUsers.map((row) => [
      row.name,
      row.email,
      row.roleLabel,
      row.progress.label,
      row.joined,
      row.status === "active" ? "Hoạt động" : "Đang tạm khóa"
    ]);
    const csv = [header, ...rows]
      .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "nguoi-dung-su-ky.csv";
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Đã xuất CSV ${filteredUsers.length} tài khoản (dữ liệu mẫu).`);
  }

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
      <div className="adm-stat-grid">
        {userStats.map((item) => {
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
          onChange={(event) => setRoleFilter(event.target.value)}
          aria-label="Lọc theo vai trò"
        >
          <option value="all">Tất cả vai trò</option>
          <option value="student">Học viên</option>
          <option value="admin">Quản trị viên</option>
        </select>

        <select
          className="adm-filter-select"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Lọc theo trạng thái"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="locked">Đang tạm khóa</option>
        </select>

        <button type="button" className="adm-ghost adm-filter-reset" onClick={resetFilters}>
          <RefreshCw size={15} /> Đặt lại bộ lọc
        </button>

        <div className="adm-filter-actions">
          <button type="button" className="adm-ghost" onClick={exportCsv}>
            <Download size={15} /> Xuất CSV
          </button>
          <button
            type="button"
            className="adm-primary"
            onClick={() => showToast("Biểu mẫu thêm người dùng sẽ được nối API ở bước tiếp theo.")}
          >
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
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="adm-empty-row">
                    Không tìm thấy người dùng phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((row) => (
                  <tr key={row.id} className={row.status === "locked" ? "is-locked" : undefined}>
                    <td>
                      <div className="adm-member">
                        <span className={`adm-member-avatar is-${row.avatarTone}`} aria-hidden="true">
                          {buildInitials(row.name)}
                        </span>
                        <span className="adm-member-text">
                          <strong>
                            {row.name}
                            {row.verified ? <Link2 size={12} className="is-link" aria-label="Đã xác thực" /> : null}
                            {row.status === "locked" ? <LockKeyhole size={12} className="is-lock" aria-label="Đang tạm khóa" /> : null}
                          </strong>
                          <small>{row.subtitle}</small>
                        </span>
                      </div>
                    </td>
                    <td><span className="adm-member-email">{row.email}</span></td>
                    <td><span className={`adm-role-pill is-${row.roleTone}`}>{row.roleLabel}</span></td>
                    <td>
                      <div className="adm-progress">
                        <div className="adm-progress-top">
                          <span className="adm-progress-label">{row.progress.label}</span>
                          <span className={`adm-pill is-${row.progress.tone}`}>{row.progress.tag}</span>
                        </div>
                        <div className="adm-track">
                          <i style={{ width: `${row.progress.percent}%`, background: row.progress.color }} />
                        </div>
                      </div>
                    </td>
                    <td><span className="adm-member-date">{row.joined}</span></td>
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
                          onClick={() => showToast(`Xem hồ sơ của ${row.name} (dữ liệu mẫu).`)}
                          aria-label={`Xem hồ sơ ${row.name}`}
                        >
                          <Eye size={15} />
                        </button>
                        {row.status === "active" ? (
                          <>
                            <button
                              type="button"
                              className="adm-eye-btn"
                              onClick={() => showToast(`Chỉnh sửa vai trò của ${row.name} sẽ có ở bước nối API.`)}
                              aria-label={`Chỉnh sửa ${row.name}`}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              className="adm-eye-btn is-danger"
                              onClick={() => toggleLock(row.id)}
                              aria-label={`Tạm khóa ${row.name}`}
                            >
                              <Ban size={15} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="adm-eye-btn"
                              onClick={() => toggleLock(row.id)}
                              aria-label={`Mở khóa ${row.name}`}
                            >
                              <Unlock size={15} />
                            </button>
                            <button
                              type="button"
                              className="adm-eye-btn is-danger"
                              onClick={() => showToast(`Xóa tài khoản ${row.name} sẽ có ở bước nối API.`)}
                              aria-label={`Xóa ${row.name}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="adm-table-foot">
          <span>
            Hiển thị <b>1 – {filteredUsers.length}</b> trong tổng số <b>{numberFormat.format(42850)}</b> tài khoản
          </span>
          <div className="adm-pager">
            <button
              type="button"
              className="adm-pager-btn"
              onClick={() => showToast("Bạn đang ở trang đầu tiên.")}
              aria-label="Trang trước"
            >
              <ChevronLeft size={15} />
            </button>
            <button type="button" className="adm-pager-btn is-active" aria-current="page">1</button>
            <button type="button" className="adm-pager-btn" onClick={() => showToast("Phân trang sẽ được nối API ở bước tiếp theo.")}>2</button>
            <button type="button" className="adm-pager-btn" onClick={() => showToast("Phân trang sẽ được nối API ở bước tiếp theo.")}>3</button>
            <span className="adm-pager-gap" aria-hidden="true">…</span>
            <button type="button" className="adm-pager-btn" onClick={() => showToast("Phân trang sẽ được nối API ở bước tiếp theo.")}>4.295</button>
            <button
              type="button"
              className="adm-pager-btn"
              onClick={() => showToast("Phân trang sẽ được nối API ở bước tiếp theo.")}
              aria-label="Trang sau"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </section>


      {toast ? (
        <div className="adm-toast" role="status">
          <CheckCircle2 size={16} />
          <span>{toast}</span>
        </div>
      ) : null}
    </AdminConsoleLayout>
  );
}
