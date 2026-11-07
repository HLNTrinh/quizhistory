// src/pages/admin/AdminCategoriesPage.jsx
// Trang quản trị Chủ đề / Thời kỳ lịch sử — dựng trên khung AdminConsoleLayout (sidebar + topbar + footer giống Dashboard).
// Hiện tại là giao diện với dữ liệu mẫu, chưa gọi API.
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  BookOpenCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flag,
  FolderTree,
  Globe2,
  Landmark,
  Layers,
  Package,
  Pencil,
  Percent,
  Plus,
  ScrollText,
  SlidersHorizontal,
  Trash2
} from "lucide-react";
import AdminConsoleLayout from "./AdminConsoleLayout.jsx";
import AdminTopActions from "./AdminTopActions.jsx";
import AdminFormModal from "./AdminFormModal.jsx";
import "./AdminCategories.css";

const numberFormat = new Intl.NumberFormat("vi-VN");
const percentFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

const TOTAL_CATEGORIES = 6;

const categoryStats = [
  {
    id: "total",
    label: "Tổng số chủ đề",
    value: 6,
    unit: "Chủ đề",
    icon: FolderTree,
    tone: "violet",
    legend: [
      { tone: "open", text: "4 Hoạt động" },
      { tone: "archived", text: "2 Tạm ẩn" }
    ]
  },
  {
    id: "packages",
    label: "Gói thuộc chủ đề",
    value: 12,
    unit: "Gói đề",
    icon: Package,
    tone: "blue",
    pill: "100% gói đã gán chủ đề",
    pillTone: "green",
    pillIcon: CheckCircle2
  },
  {
    id: "questions",
    label: "Câu hỏi phân bố",
    value: 690,
    unit: "Câu hỏi",
    icon: BookOpenCheck,
    tone: "amber",
    pill: "Bám sát chương trình",
    pillTone: "amber",
    pillIcon: BookOpenCheck
  },
  {
    id: "rate",
    label: "Tỷ lệ chủ đề đang mở",
    value: 66.7,
    unit: "% chủ đề",
    icon: Percent,
    tone: "green",
    format: "percent",
    percent: 66.7
  }
];

const statusOptions = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "active", label: "Đang hoạt động" },
  { value: "inactive", label: "Tạm ẩn" }
];

const sortOptions = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "mostPackages", label: "Nhiều gói nhất" },
  { value: "mostQuestions", label: "Nhiều câu hỏi nhất" }
];

const statusMeta = {
  active: { label: "Đang hoạt động", badge: "is-open" },
  inactive: { label: "Tạm ẩn", badge: "is-inactive" }
};

const toneOptions = [
  { value: "amber", label: "Hổ phách" },
  { value: "violet", label: "Tím" },
  { value: "green", label: "Lục" },
  { value: "blue", label: "Lam" },
  { value: "purple", label: "Tím đậm" }
];

const emptyCategoryForm = {
  name: "",
  description: "",
  status: "active",
  tone: "amber"
};

const initialCategories = [
  {
    id: "cat-01",
    name: "Thời Văn Lang - Âu Lạc",
    description: "Nhà nước đầu tiên trong lịch sử dân tộc, gắn với truyền thuyết các vua Hùng và thành Cổ Loa.",
    icon: Landmark,
    tone: "amber",
    packageCount: 2,
    questionCount: 120,
    status: "active",
    updatedAt: "12/02",
    sortDate: "2026-02-12"
  },
  {
    id: "cat-02",
    name: "Thời Bắc thuộc & đấu tranh giành độc lập",
    description: "Hơn một nghìn năm đô hộ cùng các cuộc khởi nghĩa tiêu biểu của Hai Bà Trưng, Lý Bí, Ngô Quyền.",
    icon: Flag,
    tone: "violet",
    packageCount: 3,
    questionCount: 180,
    status: "active",
    updatedAt: "08/02",
    sortDate: "2026-02-08"
  },
  {
    id: "cat-03",
    name: "Đại Việt thời Lý - Trần",
    description: "Sự nghiệp dựng nước và giữ nước thời Lý - Trần, ba lần kháng chiến chống quân Nguyên - Mông.",
    icon: ScrollText,
    tone: "green",
    packageCount: 2,
    questionCount: 140,
    status: "active",
    updatedAt: "05/02",
    sortDate: "2026-02-05"
  },
  {
    id: "cat-04",
    name: "Kháng chiến chống Pháp (1945 - 1954)",
    description: "Từ Cách mạng Tháng Tám đến chiến thắng Điện Biên Phủ lịch sử năm 1954.",
    icon: Globe2,
    tone: "blue",
    packageCount: 3,
    questionCount: 160,
    status: "active",
    updatedAt: "02/02",
    sortDate: "2026-02-02"
  },
  {
    id: "cat-05",
    name: "Kháng chiến chống Mỹ (1954 - 1975)",
    description: "Hành trình đấu tranh thống nhất đất nước, đỉnh cao là chiến dịch Hồ Chí Minh mùa xuân 1975.",
    icon: BookOpenCheck,
    tone: "purple",
    packageCount: 2,
    questionCount: 90,
    status: "inactive",
    updatedAt: "28/01",
    sortDate: "2026-01-28"
  },
  {
    id: "cat-06",
    name: "Thời kỳ Đổi mới & hội nhập",
    description: "Đại hội Đảng lần thứ VI và công cuộc đổi mới, hội nhập quốc tế của Việt Nam từ năm 1986.",
    icon: Layers,
    tone: "amber",
    packageCount: 0,
    questionCount: 0,
    status: "inactive",
    updatedAt: "20/01",
    sortDate: "2026-01-20"
  }
];

export default function AdminCategoriesPage({ admin, onLogout, onNavigate }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [unreadCount, setUnreadCount] = useState(3);
  const [toast, setToast] = useState("");
  const [categories, setCategories] = useState(initialCategories);
  const toastTimer = useRef(null);
  const [categoryModal, setCategoryModal] = useState(null); // "create" | "edit" | null
  const [activeCategory, setActiveCategory] = useState(null);
  const [form, setForm] = useState(emptyCategoryForm);

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

  const filteredCategories = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const rows = categories.filter((row) => {
      const matchKeyword = !keyword
        || row.name.toLowerCase().includes(keyword)
        || row.description.toLowerCase().includes(keyword);
      const matchStatus = statusFilter === "all" || row.status === statusFilter;
      return matchKeyword && matchStatus;
    });

    const sorted = [...rows];
    if (sortOrder === "oldest") {
      sorted.sort((a, b) => a.sortDate.localeCompare(b.sortDate));
    } else if (sortOrder === "mostPackages") {
      sorted.sort((a, b) => b.packageCount - a.packageCount);
    } else if (sortOrder === "mostQuestions") {
      sorted.sort((a, b) => b.questionCount - a.questionCount);
    } else {
      sorted.sort((a, b) => b.sortDate.localeCompare(a.sortDate));
    }
    return sorted;
  }, [categories, query, statusFilter, sortOrder]);

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreateCategory() {
    setActiveCategory(null);
    setForm(emptyCategoryForm);
    setCategoryModal("create");
  }

  function handleEditCategory(row) {
    setActiveCategory(row);
    setForm({
      name: row.name,
      description: row.description,
      status: row.status,
      tone: row.tone
    });
    setCategoryModal("edit");
  }

  function closeCategoryModal() {
    setCategoryModal(null);
    setActiveCategory(null);
  }

  function handleCategorySubmit(event) {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      showToast("Vui lòng nhập tên chủ đề trước khi lưu.");
      return;
    }

    const now = new Date();
    const updatedAt = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}`;
    const sortDate = now.toISOString().slice(0, 10);
    const payload = {
      name,
      description: form.description.trim() || "Chưa có mô tả cho chủ đề này.",
      status: form.status,
      tone: form.tone,
      updatedAt: "Vừa xong",
      sortDate
    };

    if (categoryModal === "edit" && activeCategory) {
      setCategories((current) => current.map((row) => (row.id === activeCategory.id
        ? { ...row, ...payload }
        : row)));
      showToast(`Đã cập nhật chủ đề “${name}” (dữ liệu mẫu).`);
    } else {
      setCategories((current) => [{
        id: `cat-${Date.now()}`,
        icon: FolderTree,
        packageCount: 0,
        questionCount: 0,
        ...payload
      }, ...current]);
      showToast(`Đã tạo chủ đề “${name}” (dữ liệu mẫu, chưa lưu máy chủ).`);
    }
    closeCategoryModal();
  }

  function handleDeleteCategory(row) {
    if (row.packageCount > 0) {
      showToast(`Chủ đề “${row.name}” đang chứa ${row.packageCount} gói — hãy chuyển các gói sang chủ đề khác trước khi xóa.`);
      return;
    }
    setCategories((current) => current.filter((item) => item.id !== row.id));
    showToast(`Đã xóa chủ đề “${row.name}” (dữ liệu mẫu).`);
  }

  return (
    <AdminConsoleLayout
      admin={admin}
      onLogout={onLogout}
      onNavigate={onNavigate}
      activePath="/admin/categories"
      breadcrumb="Quản trị / Quản lý chủ đề"
      actions={
        <AdminTopActions
          admin={admin}
          onLogout={onLogout}
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Tìm tên chủ đề, thời kỳ lịch sử..."
          searchLabel="Tìm kiếm chủ đề lịch sử"
          unreadCount={unreadCount}
          onBellClick={handleBellClick}
        />
      }
      onFooterAction={(label) => showToast(`${label}: nội dung đang được hoàn thiện.`)}
    >
      <div className="adm-stat-grid">
        {categoryStats.map((item) => {
          const Icon = item.icon;
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
                {item.format === "percent" ? percentFormat.format(item.value) : numberFormat.format(item.value)}
                <span>{item.unit}</span>
              </p>

              {item.legend ? (
                <div className="adm-cat-stat-legend">
                  {item.legend.map((entry) => (
                    <span key={entry.text} className={`is-${entry.tone}`}>
                      <i aria-hidden="true" />
                      {entry.text}
                    </span>
                  ))}
                </div>
              ) : null}

              {item.percent !== undefined ? (
                <div className="adm-cat-stat-progress">
                  <span className="adm-track">
                    <i
                      style={{
                        width: `${item.percent}%`,
                        background: "linear-gradient(90deg, #34d399, #10b981)"
                      }}
                    />
                  </span>
                  <small>trên tổng số chủ đề đã tạo</small>
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

      <section className="adm-filter-bar is-categories" aria-label="Bộ lọc chủ đề">
        <select
          className="adm-filter-select"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Lọc theo trạng thái"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        <button
          type="button"
          className="adm-icon-btn"
          onClick={() => showToast("Bộ lọc nâng cao (số gói, số câu hỏi) sẽ có ở bước nối API.")}
          aria-label="Bộ lọc nâng cao"
        >
          <SlidersHorizontal size={16} />
        </button>

        <div className="adm-filter-actions">
          <label className="adm-sort">
            <ArrowUpDown size={15} aria-hidden="true" />
            <span className="adm-sort-label">Sắp xếp thứ tự hiển thị</span>
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              aria-label="Sắp xếp thứ tự hiển thị"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="adm-primary"
            onClick={openCreateCategory}
          >
            <Plus size={16} /> Tạo chủ đề mới
          </button>
        </div>
      </section>

      <section className="adm-panel adm-panel-flush" aria-label="Danh sách chủ đề">
        <div className="adm-table-wrap">
          <table className="adm-table adm-table-categories">
            <thead>
              <tr>
                <th scope="col">Biểu tượng</th>
                <th scope="col">Tên chủ đề</th>
                <th scope="col">Mô tả tóm tắt</th>
                <th scope="col">Số gói</th>
                <th scope="col">Số câu hỏi</th>
                <th scope="col">Trạng thái</th>
                <th scope="col">Cập nhật</th>
                <th scope="col">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={8} className="adm-empty-row">
                    Không tìm thấy chủ đề phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((row) => {
                  const ThumbIcon = row.icon;
                  const status = statusMeta[row.status];
                  const isLocked = row.packageCount > 0;
                  return (
                    <tr key={row.id}>
                      <td>
                        <span className={`adm-cat-thumb is-${row.tone}`} aria-hidden="true">
                          <ThumbIcon size={18} />
                        </span>
                      </td>
                      <td>
                        <span className="adm-cat-name">
                          <strong>{row.name}</strong>
                          <small>
                            <Landmark size={11} aria-hidden="true" />
                            Giai đoạn lịch sử
                          </small>
                        </span>
                      </td>
                      <td>
                        <p className="adm-cat-desc">{row.description}</p>
                      </td>
                      <td>
                        <span className="adm-cat-count">
                          {row.packageCount} Gói
                          <small>thuộc chủ đề</small>
                        </span>
                      </td>
                      <td>
                        <span className="adm-cat-count">
                          {numberFormat.format(row.questionCount)} Câu
                          <small>câu hỏi</small>
                        </span>
                      </td>
                      <td>
                        <span className={`adm-badge ${status.badge}`}>
                          <i aria-hidden="true" />
                          {status.label}
                        </span>
                      </td>
                      <td>
                        <span className="adm-cat-date">{row.updatedAt}</span>
                      </td>
                      <td>
                        <div className="adm-table-actions">
                          <button
                            type="button"
                            className="adm-eye-btn"
                            onClick={() => handleEditCategory(row)}
                            aria-label={`Chỉnh sửa ${row.name}`}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            className="adm-eye-btn is-danger"
                            onClick={() => handleDeleteCategory(row)}
                            title={isLocked ? "Chủ đề còn gói, không thể xóa" : "Xóa chủ đề"}
                            aria-label={`Xóa ${row.name}`}
                          >
                            {isLocked ? <AlertTriangle size={15} /> : <Trash2 size={15} />}
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
            Hiển thị <b>1 – {filteredCategories.length}</b> trong tổng số <b>{numberFormat.format(TOTAL_CATEGORIES)}</b> chủ đề lịch sử
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

      {categoryModal ? (
        <AdminFormModal
          title={categoryModal === "edit" ? "Chỉnh sửa chủ đề" : "Tạo chủ đề mới"}
          subtitle="Giao diện mẫu — dữ liệu chưa được lưu lên máy chủ."
          size="lg"
          submitLabel={categoryModal === "edit" ? "Lưu thay đổi" : "Tạo chủ đề ngay"}
          onSubmit={handleCategorySubmit}
          onClose={closeCategoryModal}
        >
          <div className="adm-field">
            <label htmlFor="adm-cat-name">Tên chủ đề / thời kỳ</label>
            <input
              id="adm-cat-name"
              className="adm-input"
              value={form.name}
              onChange={(event) => updateForm("name", event.target.value)}
              placeholder="Ví dụ: Kháng chiến chống Pháp (1945 - 1954)"
              autoFocus
            />
          </div>

          <div className="adm-field">
            <label htmlFor="adm-cat-description">Mô tả chủ đề</label>
            <textarea
              id="adm-cat-description"
              className="adm-textarea"
              value={form.description}
              onChange={(event) => updateForm("description", event.target.value)}
              placeholder="Tóm tắt phạm vi thời kỳ, sự kiện trọng tâm của chủ đề..."
            />
          </div>

          <div className="adm-field-row">
            <div className="adm-field">
              <label htmlFor="adm-cat-status">Trạng thái</label>
              <select
                id="adm-cat-status"
                className="adm-select"
                value={form.status}
                onChange={(event) => updateForm("status", event.target.value)}
              >
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Tạm ẩn</option>
              </select>
              <span className="adm-field-hint">Chủ đề tạm ẩn sẽ không hiển thị ở cổng học tập.</span>
            </div>
            <div className="adm-field">
              <label htmlFor="adm-cat-tone">Màu biểu tượng</label>
              <select
                id="adm-cat-tone"
                className="adm-select"
                value={form.tone}
                onChange={(event) => updateForm("tone", event.target.value)}
              >
                {toneOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
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
