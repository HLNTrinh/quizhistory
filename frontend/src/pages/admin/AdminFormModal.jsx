// src/pages/admin/AdminFormModal.jsx
// Hộp thoại dùng chung cho các biểu mẫu quản trị (thêm / sửa / xem).
// Dùng lại bộ class .adm-modal-* trong AdminConsole.css để đồng bộ giao diện.
// - onSubmit có => render <form> và hiện nút Hủy/Lưu mặc định.
// - Không có onSubmit => render khối <div> (dùng cho chế độ chỉ xem).
import { useEffect } from "react";
import { X } from "lucide-react";

export default function AdminFormModal({
  open = true,
  title,
  subtitle,
  size = "md", // "md" | "lg" | "xl"
  submitLabel = "Lưu thay đổi",
  cancelLabel = "Hủy bỏ",
  onSubmit,
  onClose,
  footer,
  children
}) {
  useEffect(() => {
    if (!open) return undefined;
    function handleKey(event) {
      if (event.key === "Escape") onClose?.();
    }
    document.addEventListener("keydown", handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const modalClass = `adm-modal${size === "md" ? "" : ` is-${size}`}`;
  const stop = (event) => event.stopPropagation();

  const content = (
    <>
      <div className="adm-modal-head">
        <div>
          <h2 id="adm-form-modal-title">{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        <button type="button" className="adm-modal-close" onClick={onClose} aria-label="Đóng hộp thoại">
          <X size={16} />
        </button>
      </div>

      <div className="adm-modal-body">{children}</div>

      <div className="adm-modal-foot">
        {footer ?? (
          <>
            <button type="button" className="adm-ghost" onClick={onClose}>{cancelLabel}</button>
            <button type="submit" className="adm-primary">{submitLabel}</button>
          </>
        )}
      </div>
    </>
  );

  return (
    <div className="adm-modal-overlay" role="presentation" onClick={onClose}>
      {onSubmit ? (
        <form
          className={modalClass}
          onSubmit={onSubmit}
          onClick={stop}
          role="dialog"
          aria-modal="true"
          aria-labelledby="adm-form-modal-title"
        >
          {content}
        </form>
      ) : (
        <div
          className={modalClass}
          onClick={stop}
          role="dialog"
          aria-modal="true"
          aria-labelledby="adm-form-modal-title"
        >
          {content}
        </div>
      )}
    </div>
  );
}
