import { ArrowLeft, Construction, ShieldCheck } from "lucide-react";
import AdminConsoleLayout, { buildInitials } from "./AdminConsoleLayout.jsx";

/**
 * Trang tạm cho các mục quản trị chưa được triển khai.
 * Khi có file trang thật (AdminUsersPage, AdminPackagesPage, ...) thì thay route tương ứng trong App.jsx.
 */
const sectionNotes = {
  "/admin/users": "Danh sách học viên, vai trò, trạng thái tài khoản cùng thao tác khoá/mở sẽ xuất hiện tại đây.",
  "/admin/packages": "Bảng gói câu hỏi theo thời kỳ lịch sử, số bộ đề và số câu hỏi sẽ được quản lý tại đây.",
  "/admin/question-sets": "Các bộ đề thuộc từng gói câu hỏi sẽ được tạo, chỉnh sửa và sắp xếp tại đây.",
  "/admin/questions": "Ngân hàng câu hỏi trắc nghiệm theo chủ đề và mức độ khó sẽ được quản lý tại đây.",
  "/admin/leaderboard": "Bảng xếp hạng học viên theo điểm số và chuỗi ngày học sẽ hiển thị tại đây.",
  "/admin/reports": "Báo cáo lượt làm bài, tỉ lệ trả lời đúng và tăng trưởng người học sẽ hiển thị tại đây."
};

export default function AdminSectionPage({ admin, onLogout, onNavigate, activePath, title }) {
  const note = sectionNotes[activePath]
    || `Nội dung quản lý ${String(title || "").toLowerCase()} sẽ được bổ sung trong phiên bản tiếp theo.`;

  return (
    <AdminConsoleLayout
      admin={admin}
      onLogout={onLogout}
      onNavigate={onNavigate}
      activePath={activePath}
      breadcrumb={`Quản trị / ${title}`}
    >
      <div className="adm-page-head-row">
        <span className="adm-live-chip">
          <ShieldCheck size={13} /> KHU VỰC QUẢN TRỊ
        </span>
        <div className="adm-user-chip">
          <span className="adm-user-avatar" aria-hidden="true">{buildInitials(admin?.name)}</span>
          <span className="adm-user-chip-text">
            <strong>{admin?.name || "Quản trị viên"}</strong>
            <small>Quản trị viên trường</small>
          </span>
        </div>
      </div>

      <section className="adm-state-card is-empty">
        <span className="adm-state-icon" aria-hidden="true"><Construction size={28} /></span>
        <h2>Trang “{title}” đang được hoàn thiện</h2>
        <p>{note}</p>
        <p>
          Bảng điều khiển tổng quan đã dùng giao diện mới; các mục còn lại sẽ được nối API và dựng
          bảng dữ liệu chi tiết ở bước tiếp theo.
        </p>
        <div className="adm-state-actions">
          <button type="button" className="adm-primary" onClick={() => onNavigate("/admin")}>
            <ArrowLeft size={16} /> Về tổng quan
          </button>
        </div>
      </section>
    </AdminConsoleLayout>
  );
}
