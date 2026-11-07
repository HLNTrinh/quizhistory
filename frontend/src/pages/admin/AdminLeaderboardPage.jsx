// src/pages/admin/AdminLeaderboardPage.jsx
// Trang quản trị Bảng xếp hạng người học — dựng trên khung AdminConsoleLayout (sidebar + topbar + footer giống Dashboard).
// Hiện tại là giao diện với dữ liệu mẫu, chưa gọi API.
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpDown,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Package,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  X
} from "lucide-react";
import AdminConsoleLayout from "./AdminConsoleLayout.jsx";
import AdminTopActions from "./AdminTopActions.jsx";
import AdminFormModal from "./AdminFormModal.jsx";
import "./AdminLeaderboard.css";

const numberFormat = new Intl.NumberFormat("vi-VN");
const decimalFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

const TOTAL_LEARNERS = 42850;

const leaderboardStats = [
  {
    id: "total",
    label: "Tổng người học xếp hạng",
    value: 42850,
    icon: Trophy,
    tone: "amber",
    note: "+1.240 tích cực tuần này",
    noteTone: "green",
    noteIcon: TrendingUp
  },
  {
    id: "top",
    label: "Điểm XP cao nhất (Top 1)",
    value: 12450,
    unit: "XP",
    icon: Sparkles,
    tone: "amber",
    pill: "Top 1: Nguyễn Minh Quân",
    pillTone: "amber",
    pillIcon: Trophy
  },
  {
    id: "average",
    label: "Điểm trung bình toàn khoá",
    value: 3680,
    unit: "XP",
    icon: TrendingUp,
    tone: "green",
    note: "+14,2% so với tháng trước",
    noteTone: "green",
    noteIcon: TrendingUp
  },
  {
    id: "packages",
    label: "Gói đã hoàn thành TB",
    value: 7.2,
    unit: "Gói",
    format: "decimal",
    icon: Package,
    tone: "violet",
    note: "Tương đương 58 bộ đề lịch sử"
  }
];

const periodOptions = [
  { value: "all", label: "Toàn thời gian (All-time)" },
  { value: "month", label: "Tháng này" },
  { value: "week", label: "Tuần này" }
];

const tierOptions = [
  { value: "all", label: "Tất cả cấp bậc" },
  { value: "champion", label: "Quân quân Sử Việt" },
  { value: "general", label: "Đại tướng Sử học" },
  { value: "pioneer", label: "Tiền phong" },
  { value: "young", label: "Đúng sử trẻ" }
];

const sortOptions = [
  { value: "xp-desc", label: "XP giảm dần" },
  { value: "xp-asc", label: "XP tăng dần" },
  { value: "accuracy", label: "Độ chính xác cao nhất" },
  { value: "recent", label: "Cập nhật gần nhất" }
];

const tierMeta = {
  champion: { label: "Quân quân Sử Việt", tone: "amber" },
  general: { label: "Đại tướng Sử học", tone: "violet" },
  pioneer: { label: "Tiền phong", tone: "blue" },
  young: { label: "Đúng sử trẻ", tone: "green" }
};

const initialLearners = [
  {
    id: "HQ-88291",
    name: "Nguyễn Minh Quân",
    email: "minhquan.nguyen@edu.vn",
    initials: "MQ",
    tier: "champion",
    xp: 12450,
    delta: "+450 XP tuần này",
    packages: 18,
    sets: 142,
    progress: 82,
    accuracy: 94.5,
    updated: "12 phút trước",
    updatedMinutes: 12
  },
  {
    id: "HQ-74129",
    name: "Trần Thùy Linh",
    email: "thuylinh.tran@history.vn",
    initials: "TL",
    tier: "general",
    xp: 11820,
    delta: "+320 XP tuần này",
    packages: 16,
    sets: 128,
    progress: 68,
    accuracy: 92.8,
    updated: "35 phút trước",
    updatedMinutes: 35
  },
  {
    id: "HQ-65520",
    name: "Đỗ Hải Đăng",
    email: "haidang.do@student.hcm.vn",
    initials: "HD",
    tier: "general",
    xp: 9850,
    delta: "+210 XP tuần này",
    packages: 14,
    sets: 110,
    progress: 58,
    accuracy: 89.2,
    updated: "1 giờ trước",
    updatedMinutes: 60
  },
  {
    id: "HQ-52189",
    name: "Lê Hùng Vương",
    email: "hungvuong.le@school.vn",
    initials: "HV",
    tier: "pioneer",
    xp: 8650,
    delta: "0 XP tuần này",
    packages: 12,
    sets: 96,
    progress: 51,
    accuracy: 87.4,
    updated: "3 giờ trước",
    updatedMinutes: 180
  },
  {
    id: "HQ-45993",
    name: "Hoàng Lan Anh",
    email: "lananh.h@vietstudy.org",
    initials: "LA",
    tier: "pioneer",
    xp: 8200,
    delta: "+180 XP tuần này",
    packages: 11,
    sets: 88,
    progress: 46,
    accuracy: 91.0,
    updated: "5 giờ trước",
    updatedMinutes: 300
  },
  {
    id: "HQ-41288",
    name: "Phạm Đức Nam",
    email: "nam.pham@edu.vn",
    initials: "DN",
    tier: "young",
    xp: 7940,
    delta: "+90 XP tuần này",
    packages: 10,
    sets: 80,
    progress: 42,
    accuracy: 85.6,
    updated: "Hôm qua",
    updatedMinutes: 1440
  }
];

const medalTones = ["gold", "silver", "bronze"];

export default function AdminLeaderboardPage({ admin, onLogout, onNavigate }) {
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("all");
  const [tier, setTier] = useState("all");
  const [sort, setSort] = useState("xp-desc");
  const [unreadCount, setUnreadCount] = useState(1);
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);
  const [learners, setLearners] = useState(initialLearners);
  const [viewLearner, setViewLearner] = useState(null);
  const [xpTarget, setXpTarget] = useState(null);
  const [xpForm, setXpForm] = useState({ xp: "", delta: "" });

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

  function handleResetFilters() {
    setQuery("");
    setPeriod("all");
    setTier("all");
    setSort("xp-desc");
    showToast("Đã đặt lại toàn bộ bộ lọc bảng xếp hạng.");
  }

  function openLearnerProfile(row) {
    setViewLearner(row);
  }

  function openXpAdjust(row) {
    setXpTarget(row);
    setXpForm({ xp: String(row.xp), delta: row.delta });
    setViewLearner(null);
  }

  function closeLearnerModals() {
    setViewLearner(null);
    setXpTarget(null);
  }

  function handleXpSubmit(event) {
    event.preventDefault();
    if (!xpTarget) return;
    const xp = Number(xpForm.xp);
    if (!Number.isFinite(xp) || xp < 0) {
      showToast("Điểm XP phải là số không âm.");
      return;
    }

    setLearners((current) => current.map((row) => (row.id === xpTarget.id
      ? { ...row, xp, delta: xpForm.delta.trim() || row.delta }
      : row)));
    showToast(`Đã cập nhật XP của ${xpTarget.name} (dữ liệu mẫu).`);
    setXpTarget(null);
  }

  const filteredLearners = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const list = learners.filter((row) => {
      const matchKeyword = !keyword
        || row.name.toLowerCase().includes(keyword)
        || row.id.toLowerCase().includes(keyword)
        || row.email.toLowerCase().includes(keyword);
      const matchTier = tier === "all" || row.tier === tier;
      return matchKeyword && matchTier;
    });

    return [...list].sort((a, b) => {
      if (sort === "xp-asc") return a.xp - b.xp;
      if (sort === "accuracy") return b.accuracy - a.accuracy;
      if (sort === "recent") return a.updatedMinutes - b.updatedMinutes;
      return b.xp - a.xp;
    });
  }, [learners, query, tier, sort]);

  const periodLabel = periodOptions.find((option) => option.value === period)?.label || "";
  const tierLabel = tierOptions.find((option) => option.value === tier)?.label || "";

  return (
    <AdminConsoleLayout
      admin={admin}
      onLogout={onLogout}
      onNavigate={onNavigate}
      activePath="/admin/leaderboard"
      breadcrumb="Quản trị / Bảng xếp hạng người học"
      actions={
        <AdminTopActions
          admin={admin}
          onLogout={onLogout}
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Tìm kiếm người học theo tên, ID hoặc email..."
          searchLabel="Tìm kiếm người học trong bảng xếp hạng"
          unreadCount={unreadCount}
          onBellClick={handleBellClick}
        />
      }
      onFooterAction={(label) => showToast(`${label}: nội dung đang được hoàn thiện.`)}
    >
      <div className="adm-stat-grid">
        {leaderboardStats.map((item) => {
          const Icon = item.icon;
          const NoteIcon = item.noteIcon;
          const PillIcon = item.pillIcon;
          return (
            <article className="adm-stat" key={item.id}>
              <div className="adm-stat-head">
                <p className="adm-stat-label">{item.label}</p>
                <span className={`adm-stat-icon is-${item.tone}`} aria-hidden="true">
                  <Icon size={18} />
                </span>
              </div>
              <p className="adm-stat-value">
                {item.format === "decimal" ? decimalFormat.format(item.value) : numberFormat.format(item.value)}
                {item.unit ? <span>{item.unit}</span> : null}
              </p>

              {item.note ? (
                <div className={`adm-rank-stat-note${item.noteTone ? ` is-${item.noteTone}` : ""}`}>
                  {NoteIcon ? <NoteIcon size={13} aria-hidden="true" /> : null}
                  <span>{item.note}</span>
                </div>
              ) : null}

              {item.pill ? (
                <div className="adm-stat-footer">
                  <span className={`adm-pill is-${item.pillTone}`}>
                    {PillIcon ? <PillIcon size={11} aria-hidden="true" /> : null} {item.pill}
                  </span>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <section className="adm-filter-bar is-leaderboard" aria-label="Bộ lọc bảng xếp hạng">
        <select
          className="adm-filter-select"
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
          aria-label="Lọc theo chu kỳ xếp hạng"
        >
          {periodOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        <select
          className="adm-filter-select"
          value={tier}
          onChange={(event) => setTier(event.target.value)}
          aria-label="Lọc theo cấp bậc"
        >
          {tierOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        <span className="adm-rank-sort">
          <ArrowUpDown size={14} aria-hidden="true" />
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            aria-label="Sắp xếp bảng xếp hạng"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </span>

        <button
          type="button"
          className="adm-filter-reset"
          onClick={handleResetFilters}
          aria-label="Mở bộ lọc nâng cao"
        >
          <SlidersHorizontal size={16} />
        </button>

        <div className="adm-rank-chips">
          <span className="adm-rank-chips-label">Đang lọc theo:</span>
          <span className="adm-rank-chip">
            Chu kỳ: {periodLabel}
            <button
              type="button"
              onClick={() => setPeriod("all")}
              aria-label="Bỏ lọc chu kỳ"
              disabled={period === "all"}
            >
              <X size={11} />
            </button>
          </span>
          <span className="adm-rank-chip">
            Cấp bậc: {tierLabel}
            <button
              type="button"
              onClick={() => setTier("all")}
              aria-label="Bỏ lọc cấp bậc"
              disabled={tier === "all"}
            >
              <X size={11} />
            </button>
          </span>
          <span className="adm-rank-chips-count">Hiển thị {filteredLearners.length} học viên nổi bật</span>
        </div>
      </section>

      <section className="adm-panel adm-panel-flush" aria-label="Bảng xếp hạng người học">
        <div className="adm-table-wrap">
          <table className="adm-table adm-table-rank">
            <thead>
              <tr>
                <th scope="col">Thứ hạng</th>
                <th scope="col">Học viên</th>
                <th scope="col">Cấp bậc / Danh hiệu</th>
                <th scope="col">Tổng XP</th>
                <th scope="col">Tiến trình</th>
                <th scope="col">Độ chính xác</th>
                <th scope="col">Cập nhật</th>
                <th scope="col">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredLearners.length === 0 ? (
                <tr>
                  <td colSpan={8} className="adm-empty-row">
                    Không tìm thấy học viên phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredLearners.map((row, index) => {
                  const meta = tierMeta[row.tier];
                  return (
                    <tr key={row.id}>
                      <td>
                        <span className={`adm-rank-medal${index < 3 ? ` is-${medalTones[index]}` : ""}`}>
                          {index < 3 ? index + 1 : String(index + 1).padStart(2, "0")}
                        </span>
                      </td>
                      <td>
                        <div className="adm-rank-student">
                          <span className="adm-rank-avatar" aria-hidden="true">
                            {row.initials}
                            {index === 0 ? (
                              <span className="adm-rank-star"><Star size={9} /></span>
                            ) : null}
                          </span>
                          <span className="adm-rank-user">
                            <strong>{row.name}</strong>
                            <span className="adm-rank-id">
                              ID: {row.id}
                              <i className="adm-rank-dot" aria-hidden="true" />
                            </span>
                            <small>{row.email}</small>
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`adm-rank-tier is-${meta.tone}`}>{meta.label}</span>
                      </td>
                      <td>
                        <span className="adm-rank-xp">
                          <b>{numberFormat.format(row.xp)} <small>XP</small></b>
                          <em className={row.delta.startsWith("+") ? "is-up" : ""}>{row.delta}</em>
                        </span>
                      </td>
                      <td>
                        <div className="adm-rank-progress">
                          <span>
                            {row.packages} Gói <i aria-hidden="true">•</i> {row.sets} Bộ đề
                          </span>
                          <span className="adm-track">
                            <i
                              className={index < 3 ? "is-top" : ""}
                              style={{ width: `${row.progress}%` }}
                            />
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="adm-rank-accuracy">{decimalFormat.format(row.accuracy)}%</span>
                      </td>
                      <td>
                        <span className="adm-rank-updated">{row.updated}</span>
                      </td>
                      <td>
                        <div className="adm-row-actions">
                          <button
                            type="button"
                            className="adm-eye-btn"
                            onClick={() => openLearnerProfile(row)}
                            aria-label={`Xem hồ sơ ${row.name}`}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            className="adm-eye-btn"
                            onClick={() => openXpAdjust(row)}
                            aria-label={`Điều chỉnh XP của ${row.name}`}
                          >
                            <SlidersHorizontal size={15} />
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
            Hiển thị <b>1 – {filteredLearners.length}</b> trong tổng số <b>{numberFormat.format(TOTAL_LEARNERS)}</b> người học xếp hạng
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
            <button type="button" className="adm-pager-btn" onClick={() => showToast("Phân trang sẽ được nối API ở bước tiếp theo.")}>7142</button>
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

      <div className="adm-rank-note">
        <span className="adm-rank-note-icon" aria-hidden="true">
          <ShieldCheck size={16} />
        </span>
        <p>
          <b>Nguyên tắc bảo toàn tính cạnh tranh công bằng:</b> Hệ thống không cho phép đặt lại (reset) tùy tiện
          toàn bộ bảng xếp hạng nhằm bảo vệ thành quả học tập của học sinh. Mọi thao tác cộng hoặc trừ điểm XP của
          quản trị viên đều bắt buộc nhập lý do và được lưu trữ vĩnh viễn trong Audit Log.
        </p>
      </div>

      {viewLearner ? (
        <AdminFormModal
          title={`Hồ sơ: ${viewLearner.name}`}
          subtitle="Thông tin tham khảo — dữ liệu mẫu, chưa nối API."
          size="lg"
          onClose={closeLearnerModals}
          footer={
            <>
              <button type="button" className="adm-ghost" onClick={closeLearnerModals}>Đóng</button>
              <button type="button" className="adm-primary" onClick={() => openXpAdjust(viewLearner)}>Điều chỉnh XP</button>
            </>
          }
        >
          <div className="adm-detail">
            <div className="adm-detail-row"><span>Mã học viên</span><strong>{viewLearner.id}</strong></div>
            <div className="adm-detail-row"><span>Họ và tên</span><strong>{viewLearner.name}</strong></div>
            <div className="adm-detail-row"><span>Email</span><strong>{viewLearner.email}</strong></div>
            <div className="adm-detail-row"><span>Cấp bậc</span><strong>{tierMeta[viewLearner.tier]?.label || viewLearner.tier}</strong></div>
            <div className="adm-detail-row"><span>Điểm XP</span><strong>{numberFormat.format(viewLearner.xp)} XP · {viewLearner.delta}</strong></div>
            <div className="adm-detail-row"><span>Tiến độ</span><strong>{viewLearner.packages} gói · {viewLearner.sets} bộ đề · {viewLearner.progress}%</strong></div>
            <div className="adm-detail-row"><span>Độ chính xác</span><strong>{decimalFormat.format(viewLearner.accuracy)}%</strong></div>
            <div className="adm-detail-row"><span>Cập nhật gần nhất</span><strong>{viewLearner.updated}</strong></div>
          </div>
        </AdminFormModal>
      ) : null}

      {xpTarget ? (
        <AdminFormModal
          title="Điều chỉnh điểm XP"
          subtitle={`Học viên: ${xpTarget.name} · ${xpTarget.id}`}
          submitLabel="Lưu điểm XP"
          onSubmit={handleXpSubmit}
          onClose={closeLearnerModals}
        >
          <div className="adm-field">
            <label htmlFor="adm-xp-value">Điểm XP mới</label>
            <input
              id="adm-xp-value"
              type="number"
              min="0"
              className="adm-input"
              value={xpForm.xp}
              onChange={(event) => setXpForm((current) => ({ ...current, xp: event.target.value }))}
              autoFocus
            />
            <span className="adm-field-hint">Điểm hiện tại: {numberFormat.format(xpTarget.xp)} XP.</span>
          </div>
          <div className="adm-field">
            <label htmlFor="adm-xp-reason">Ghi chú / Lý do điều chỉnh</label>
            <input
              id="adm-xp-reason"
              className="adm-input"
              value={xpForm.delta}
              onChange={(event) => setXpForm((current) => ({ ...current, delta: event.target.value }))}
              placeholder="Ví dụ: +450 XP tuần này"
            />
            <span className="adm-field-hint">Mọi thay đổi XP đều được ghi vào Audit Log theo quy chế.</span>
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
