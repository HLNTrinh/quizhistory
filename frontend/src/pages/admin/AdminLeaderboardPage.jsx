// src/pages/admin/AdminLeaderboardPage.jsx
// Trang quản trị Bảng xếp hạng người học — kết nối dữ liệu thật từ GET /api/admin/leaderboard.
// Hỗ trợ tìm kiếm, lọc theo chu kỳ / cấp bậc, sắp xếp, phân trang và điều chỉnh điểm XP người học.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Package,
  RefreshCw,
  RotateCcw,
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
import { adminApi } from "../../lib/api.js";
import "./AdminLeaderboard.css";

const numberFormat = new Intl.NumberFormat("vi-VN");
const decimalFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });
const PAGE_SIZE = 10;

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

const medalTones = ["gold", "silver", "bronze"];

function buildPageList(current, totalPages) {
  const total = Math.max(1, totalPages);
  const start = Math.max(1, Math.min(current - 2, total - 4));
  const list = [];
  for (let page = start; page < start + 5 && page <= total; page += 1) list.push(page);
  return list;
}

export default function AdminLeaderboardPage({ admin, onLogout, onNavigate }) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [period, setPeriod] = useState("all");
  const [tier, setTier] = useState("all");
  const [sort, setSort] = useState("xp-desc");
  const [page, setPage] = useState(1);

  const [learners, setLearners] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [loadState, setLoadState] = useState("loading");
  const [loadError, setLoadError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [unreadCount, setUnreadCount] = useState(1);
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

  const [viewLearner, setViewLearner] = useState(null);
  const [xpTarget, setXpTarget] = useState(null);
  const [xpForm, setXpForm] = useState({ xp: "", delta: "" });
  const [submittingXp, setSubmittingXp] = useState(false);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  function showToast(message) {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 3200);
  }

  // Debounce tìm kiếm 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Đổi bộ lọc: quay về trang 1
  function handlePeriodChange(event) {
    setPeriod(event.target.value);
    setPage(1);
  }

  function handleTierChange(event) {
    setTier(event.target.value);
    setPage(1);
  }

  function handleSortChange(event) {
    setSort(event.target.value);
    setPage(1);
  }

  const fetchLeaderboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoadState("loading");
    setLoadError(null);

    try {
      const params = new URLSearchParams({
        q: debouncedQuery,
        period,
        tier,
        sort,
        page: String(page),
        limit: String(PAGE_SIZE)
      });
      const data = await adminApi(`/admin/leaderboard?${params.toString()}`);
      setLearners(data.items || []);
      setStats(data.stats || null);
      setPagination(data.pagination || { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
      setLoadState("ready");
    } catch (error) {
      setLoadError(error);
      setLoadState("error");
      showToast(error.message || "Không thể tải dữ liệu bảng xếp hạng.");
    } finally {
      setRefreshing(false);
    }
  }, [debouncedQuery, period, tier, sort, page]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  function handleBellClick() {
    setUnreadCount(0);
    showToast("Đã đánh dấu toàn bộ thông báo là đã đọc.");
  }

  function handleResetFilters() {
    setQuery("");
    setDebouncedQuery("");
    setPeriod("all");
    setTier("all");
    setSort("xp-desc");
    setPage(1);
    showToast("Đã đặt lại toàn bộ bộ lọc bảng xếp hạng.");
  }

  function openLearnerProfile(row) {
    setViewLearner(row);
  }

  function openXpAdjust(row) {
    setXpTarget(row);
    setXpForm({ xp: String(row.xp), delta: row.delta || "" });
    setViewLearner(null);
  }

  function closeLearnerModals() {
    setViewLearner(null);
    setXpTarget(null);
  }

  async function handleXpSubmit(event) {
    event.preventDefault();
    if (!xpTarget) return;
    const numericXp = Number(xpForm.xp);
    if (!Number.isFinite(numericXp) || numericXp < 0) {
      showToast("Điểm XP phải là số không âm.");
      return;
    }

    setSubmittingXp(true);
    try {
      const result = await adminApi(`/admin/leaderboard/${xpTarget.id}/xp`, {
        method: "PATCH",
        body: JSON.stringify({ xp: numericXp, delta: xpForm.delta })
      });
      showToast(result.message || `Đã cập nhật XP của ${xpTarget.name}.`);
      setXpTarget(null);
      fetchLeaderboard(true);
    } catch (error) {
      showToast(error.message || "Không thể cập nhật điểm XP.");
    } finally {
      setSubmittingXp(false);
    }
  }

  const periodLabel = periodOptions.find((option) => option.value === period)?.label || "";
  const tierLabel = tierOptions.find((option) => option.value === tier)?.label || "";

  const statCards = useMemo(() => {
    if (!stats) return [];
    return [
      {
        id: "total",
        label: "Tổng người học xếp hạng",
        value: stats.totalLearners || 0,
        icon: Trophy,
        tone: "amber",
        note: stats.activeThisWeek
          ? `+${numberFormat.format(stats.activeThisWeek)} tích cực tuần này`
          : "Chưa có hoạt động mới tuần này",
        noteTone: "green",
        noteIcon: TrendingUp
      },
      {
        id: "top",
        label: "Điểm XP cao nhất (Top 1)",
        value: stats.topScore || 0,
        unit: "XP",
        icon: Sparkles,
        tone: "amber",
        pill: `Top 1: ${stats.topLearnerName || "Chưa có"}`,
        pillTone: "amber",
        pillIcon: Trophy
      },
      {
        id: "average",
        label: "Điểm trung bình toàn khoá",
        value: stats.averageScore || 0,
        unit: "XP",
        icon: TrendingUp,
        tone: "green",
        note: `Tổng ${numberFormat.format(stats.totalLearners || 0)} học viên`,
        noteTone: "green",
        noteIcon: TrendingUp
      },
      {
        id: "packages",
        label: "Gói đã hoàn thành TB",
        value: stats.avgPackagesCompleted || 0,
        unit: "Gói",
        format: "decimal",
        icon: Package,
        tone: "violet",
        note: stats.totalPackages ? `Trên ${stats.totalPackages} gói bài học` : "Nội dung ôn luyện"
      }
    ];
  }, [stats]);

  const pageList = useMemo(
    () => buildPageList(pagination.page, pagination.totalPages),
    [pagination]
  );

  const startItem = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.total, pagination.page * pagination.limit);

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
      onFooterAction={(label) => showToast(`${label}: nội dung đang được cập nhật.`)}
    >
      {/* 1. Lưới thống kê */}
      <div className="adm-stat-grid">
        {statCards.map((item) => {
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

      {/* 2. Thanh lọc và sắp xếp */}
      <section className="adm-filter-bar is-leaderboard" aria-label="Bộ lọc bảng xếp hạng">
        <select
          className="adm-filter-select"
          value={period}
          onChange={handlePeriodChange}
          aria-label="Lọc theo chu kỳ xếp hạng"
        >
          {periodOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        <select
          className="adm-filter-select"
          value={tier}
          onChange={handleTierChange}
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
            onChange={handleSortChange}
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
          aria-label="Đặt lại bộ lọc"
          title="Đặt lại bộ lọc"
        >
          <SlidersHorizontal size={16} />
        </button>

        <button
          type="button"
          className="adm-filter-reset"
          onClick={() => fetchLeaderboard(true)}
          disabled={refreshing}
          aria-label="Tải lại dữ liệu"
          title="Tải lại bảng xếp hạng"
        >
          <RefreshCw size={16} className={refreshing ? "adm-spin" : ""} />
        </button>

        <div className="adm-rank-chips">
          <span className="adm-rank-chips-label">Đang lọc theo:</span>
          <span className="adm-rank-chip">
            Chu kỳ: {periodLabel}
            <button
              type="button"
              onClick={() => { setPeriod("all"); setPage(1); }}
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
              onClick={() => { setTier("all"); setPage(1); }}
              aria-label="Bỏ lọc cấp bậc"
              disabled={tier === "all"}
            >
              <X size={11} />
            </button>
          </span>
          {debouncedQuery ? (
            <span className="adm-rank-chip">
              Tìm kiếm: {debouncedQuery}
              <button
                type="button"
                onClick={() => { setQuery(""); setDebouncedQuery(""); setPage(1); }}
                aria-label="Bỏ tìm kiếm"
              >
                <X size={11} />
              </button>
            </span>
          ) : null}
          <span className="adm-rank-chips-count">Hiển thị {pagination.total} học viên phù hợp</span>
        </div>
      </section>

      {/* 3. Báo lỗi nếu tải thất bại */}
      {loadState === "error" && !learners.length ? (
        <div className="adm-state-card is-error" style={{ padding: "32px 20px", textAlign: "center", background: "#fff", borderRadius: "16px", margin: "16px 0", border: "1px solid #fee2e2" }}>
          <span className="adm-state-icon" style={{ color: "#ef4444", display: "inline-block", marginBottom: 12 }}><AlertTriangle size={32} /></span>
          <h2 style={{ fontSize: 18, color: "#1e1b4b", marginBottom: 8 }}>Không thể tải bảng xếp hạng</h2>
          <p style={{ color: "#6b7280", maxWidth: 480, margin: "0 auto 16px" }}>
            {loadError?.message || "Không thể kết nối đến máy chủ API quản trị."}
          </p>
          <button type="button" className="adm-primary" onClick={() => fetchLeaderboard(false)}>
            <RotateCcw size={15} /> Thử tải lại ngay
          </button>
        </div>
      ) : null}

      {/* 4. Bảng xếp hạng */}
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
              {loadState === "loading" && !refreshing ? (
                <tr>
                  <td colSpan={8} className="adm-empty-row" style={{ padding: 40 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#6366f1" }}>
                      <RefreshCw size={18} className="adm-spin" /> Đang tải bảng xếp hạng người học...
                    </div>
                  </td>
                </tr>
              ) : learners.length === 0 ? (
                <tr>
                  <td colSpan={8} className="adm-empty-row">
                    Không tìm thấy học viên phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                learners.map((row, index) => {
                  const meta = tierMeta[row.tier] || tierMeta.young;
                  const rankNumber = (pagination.page - 1) * pagination.limit + index + 1;
                  const isTopMedal = rankNumber <= 3;
                  return (
                    <tr key={row.id}>
                      <td>
                        <span className={`adm-rank-medal${isTopMedal ? ` is-${medalTones[rankNumber - 1]}` : ""}`}>
                          {isTopMedal ? rankNumber : String(rankNumber).padStart(2, "0")}
                        </span>
                      </td>
                      <td>
                        <div className="adm-rank-student">
                          <span className="adm-rank-avatar" aria-hidden="true">
                            {row.initials}
                            {rankNumber === 1 ? (
                              <span className="adm-rank-star"><Star size={9} /></span>
                            ) : null}
                          </span>
                          <span className="adm-rank-user">
                            <strong>{row.name}</strong>
                            <span className="adm-rank-id">
                              ID: {row.shortId || row.id.slice(-6).toUpperCase()}
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
                          <em className={row.delta && row.delta.startsWith("+") ? "is-up" : ""}>{row.delta}</em>
                        </span>
                      </td>
                      <td>
                        <div className="adm-rank-progress">
                          <span>
                            {row.packages} Gói <i aria-hidden="true">•</i> {row.sets} Bộ đề
                          </span>
                          <span className="adm-track">
                            <i
                              className={isTopMedal ? "is-top" : ""}
                              style={{ width: `${Math.min(100, Math.max(0, row.progress))}%` }}
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
                            title="Xem chi tiết hồ sơ"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            className="adm-eye-btn"
                            onClick={() => openXpAdjust(row)}
                            aria-label={`Điều chỉnh XP của ${row.name}`}
                            title="Điều chỉnh điểm XP"
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

        {/* Chân bảng: Phân trang thực tế */}
        <div className="adm-table-foot">
          <span>
            Hiển thị <b>{numberFormat.format(startItem)} – {numberFormat.format(endItem)}</b> trong tổng số{" "}
            <b>{numberFormat.format(pagination.total)}</b> người học xếp hạng
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
                {item}
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

      {/* Ghi chú bảo toàn tính công bằng */}
      {/* <div className="adm-rank-note">
        <span className="adm-rank-note-icon" aria-hidden="true">
          <ShieldCheck size={16} />
        </span>
        <p>
          <b>Nguyên tắc bảo toàn tính cạnh tranh công bằng:</b> Hệ thống không cho phép đặt lại (reset) tùy tiện
          toàn bộ bảng xếp hạng nhằm bảo vệ thành quả học tập của học sinh. Mọi thao tác cộng hoặc trừ điểm XP của
          quản trị viên đều bắt buộc nhập lý do và được lưu trữ trong nhật ký hệ thống.
        </p>
      </div> */}

      {/* Modal xem hồ sơ học viên */}
      {viewLearner ? (
        <AdminFormModal
          title={`Hồ sơ: ${viewLearner.name}`}
          subtitle="Thông tin chi tiết học viên trong hệ thống ôn luyện."
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
            <div className="adm-detail-row"><span>Mã học viên</span><strong>{viewLearner.shortId || viewLearner.id}</strong></div>
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

      {/* Modal điều chỉnh điểm XP */}
      {xpTarget ? (
        <AdminFormModal
          title="Điều chỉnh điểm XP"
          subtitle={`Học viên: ${xpTarget.name} · ${xpTarget.shortId || xpTarget.id}`}
          submitLabel={submittingXp ? "Đang lưu..." : "Lưu điểm XP"}
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
              required
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
              placeholder="Ví dụ: +450 XP thưởng hoạt động ngoại khóa"
            />
            <span className="adm-field-hint">Mọi thay đổi XP đều được lưu vết phục vụ kiểm tra và thống kê.</span>
          </div>
        </AdminFormModal>
      ) : null}

      {/* Toast thông báo */}
      {toast ? (
        <div className="adm-toast" role="status">
          <CheckCircle2 size={16} />
          <span>{toast}</span>
        </div>
      ) : null}
    </AdminConsoleLayout>
  );
}
