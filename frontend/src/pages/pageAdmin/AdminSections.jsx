import React, { useMemo, useState } from 'react';
import './AdminSections.css';
import {
  FiFolder,
  FiLayers,
  FiHelpCircle,
  FiAward,
  FiTrendingUp,
  FiSearch,
  FiPlus,
  FiEye,
  FiEdit2,
  FiChevronDown,
  FiCheckCircle,
  FiClock,
  FiDatabase,
  FiDownload,
  FiUsers,
  FiTarget,
  FiActivity,
  FiArrowUpRight,
  FiFilter,
  FiRefreshCw,
  FiBookOpen,
} from 'react-icons/fi';

const PACKAGES = [
  { id: 'PKG-001', title: 'Chiến dịch Điện Biên Phủ 1954', category: 'Lịch sử Việt Nam', sets: 8, questions: 80, status: 'active', passRate: '92%', updated: '10 phút trước' },
  { id: 'PKG-002', title: 'Chiến dịch Hồ Chí Minh 1975', category: 'Lịch sử Việt Nam', sets: 10, questions: 100, status: 'active', passRate: '88%', updated: 'Hôm qua' },
  { id: 'PKG-003', title: 'Ba lần đại thắng Nguyên Mông', category: 'Lịch sử trung đại', sets: 6, questions: 60, status: 'draft', passRate: '--', updated: '2 ngày trước' },
  { id: 'PKG-004', title: 'Thời kỳ Hùng Vương & Văn Lang', category: 'Lịch sử cổ đại', sets: 4, questions: 40, status: 'active', passRate: '95%', updated: '3 ngày trước' },
  { id: 'PKG-005', title: 'Phong trào Cần Vương cuối thế kỷ XIX', category: 'Lịch sử cận đại', sets: 7, questions: 70, status: 'active', passRate: '84%', updated: '4 ngày trước' },
  { id: 'PKG-006', title: 'Việt Nam trong kỷ nguyên Đổi mới', category: 'Lịch sử hiện đại', sets: 5, questions: 50, status: 'draft', passRate: '--', updated: '6 ngày trước' },
];

const SETS = [
  { id: 'SET-001', title: 'Hào khí Điện Biên - Phần 1', pack: 'Chiến dịch Điện Biên Phủ 1954', questions: 10, duration: '15 phút', attempts: '4.280', difficulty: 'medium', status: 'active' },
  { id: 'SET-002', title: 'Hào khí Điện Biên - Phần 2', pack: 'Chiến dịch Điện Biên Phủ 1954', questions: 10, duration: '15 phút', attempts: '3.940', difficulty: 'hard', status: 'active' },
  { id: 'SET-003', title: 'Giải phóng miền Nam - Phần 1', pack: 'Chiến dịch Hồ Chí Minh 1975', questions: 12, duration: '18 phút', attempts: '5.120', difficulty: 'easy', status: 'active' },
  { id: 'SET-004', title: 'Giải phóng miền Nam - Phần 2', pack: 'Chiến dịch Hồ Chí Minh 1975', questions: 12, duration: '18 phút', attempts: '4.760', difficulty: 'hard', status: 'active' },
  { id: 'SET-005', title: 'Bạch Đằng Giang - Trận chiến lịch sử', pack: 'Ba lần đại thắng Nguyên Mông', questions: 10, duration: '12 phút', attempts: '--', difficulty: 'medium', status: 'draft' },
  { id: 'SET-006', title: 'Vua Hùng dựng nước', pack: 'Thời kỳ Hùng Vương & Văn Lang', questions: 8, duration: '10 phút', attempts: '2.310', difficulty: 'easy', status: 'active' },
];

const QUESTIONS = [
  { id: 'Q-1042', content: 'Chiến thắng Điện Biên Phủ diễn ra vào ngày tháng năm nào?', topic: 'Kháng chiến chống Pháp', difficulty: 'easy', pack: 'Chiến dịch Điện Biên Phủ 1954', status: 'active' },
  { id: 'Q-1043', content: 'Ai là Tổng chỉ huy chiến dịch Điện Biên Phủ năm 1954?', topic: 'Kháng chiến chống Pháp', difficulty: 'easy', pack: 'Chiến dịch Điện Biên Phủ 1954', status: 'active' },
  { id: 'Q-1044', content: 'Chiến dịch Hồ Chí Minh kết thúc vào thời điểm nào?', topic: 'Kháng chiến chống Mỹ', difficulty: 'medium', pack: 'Chiến dịch Hồ Chí Minh 1975', status: 'active' },
  { id: 'Q-1045', content: 'Trận Bạch Đằng năm 1288 gắn với vị tướng nào?', topic: 'Lịch sử trung đại', difficulty: 'medium', pack: 'Ba lần đại thắng Nguyên Mông', status: 'active' },
  { id: 'Q-1046', content: 'Kinh đô của nước Văn Lang đặt tại đâu?', topic: 'Lịch sử cổ đại', difficulty: 'easy', pack: 'Thời kỳ Hùng Vương & Văn Lang', status: 'active' },
  { id: 'Q-1047', content: 'Phong trào Cần Vương do ai khởi xướng năm 1885?', topic: 'Lịch sử cận đại', difficulty: 'hard', pack: 'Phong trào Cần Vương cuối thế kỷ XIX', status: 'draft' },
];

const RANKING = [
  { rank: 1, name: 'Nguyễn Minh Quân', school: 'THPT Chuyên Hà Nội - Amsterdam', xp: '12.450', sets: 18, streak: 45, badge: 'Quán quân Sử Việt' },
  { rank: 2, name: 'Lê Hùng Vương', school: 'THPT Lê Hồng Phong', xp: '11.820', sets: 16, streak: 38, badge: 'Đại tướng Sử học' },
  { rank: 3, name: 'Trần Thùy Linh', school: 'THPT Nguyễn Huệ', xp: '11.250', sets: 15, streak: 32, badge: 'Chiến binh tri thức' },
  { rank: 4, name: 'Đỗ Hải Đăng', school: 'THPT Phan Đình Phùng', xp: '9.850', sets: 14, streak: 27, badge: 'Thử thách ngàn năm' },
  { rank: 5, name: 'Phạm Gia Hân', school: 'THPT Chu Văn An', xp: '9.410', sets: 13, streak: 24, badge: 'Nhà sử học trẻ' },
  { rank: 6, name: 'Hoàng Bảo Nam', school: 'THPT Trần Phú', xp: '8.760', sets: 12, streak: 21, badge: 'Học giả tương lai' },
  { rank: 7, name: 'Vũ Khánh An', school: 'THPT Kim Liên', xp: '8.120', sets: 11, streak: 19, badge: 'Chiến binh tri thức' },
];

const TOPICS = [
  { label: 'Kháng chiến chống Pháp', value: 92, count: '682 câu', tone: 'primary' },
  { label: 'Kháng chiến chống Mỹ', value: 84, count: '620 câu', tone: 'teal' },
  { label: 'Lịch sử trung đại', value: 71, count: '524 câu', tone: 'amber' },
  { label: 'Lịch sử cổ đại', value: 58, count: '428 câu', tone: 'violet' },
  { label: 'Lịch sử cận - hiện đại', value: 39, count: '196 câu', tone: 'slate' },
];

const DIFFICULTY_LABEL = { easy: 'Dễ', medium: 'Trung bình', hard: 'Khó' };

function KpiCard({ icon, label, value, delta, tone }) {
  return (
    <div className={`hq-section-kpi ${tone || 'primary'}`}>
      <div className="hq-section-kpi-top">
        <span className="hq-section-kpi-icon">{icon}</span>
        {delta && <span className="hq-section-kpi-delta">{delta}</span>}
      </div>
      <div className="hq-section-kpi-value">{value}</div>
      <div className="hq-section-kpi-label">{label}</div>
    </div>
  );
}

function SectionHead({ icon, eyebrow, title, description, children }) {
  return (
    <div className="hq-section-head">
      <div className="hq-section-head-main">
        <div className="hq-section-head-icon">{icon}</div>
        <div>
          <div className="hq-section-eyebrow">{eyebrow}</div>
          <h2 className="hq-section-title">{title}</h2>
          <p className="hq-section-desc">{description}</p>
        </div>
      </div>
      <div className="hq-section-head-actions">{children}</div>
    </div>
  );
}

function Toolbar({ query, setQuery, placeholder, filters, activeFilter, setFilter, actionLabel, actionIcon }) {
  return (
    <div className="hq-section-toolbar">
      <div className="hq-section-search">
        <FiSearch />
        <input
          type="search"
          value={query}
          placeholder={placeholder}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="hq-section-filter-group">
        <span className="hq-section-filter-label"><FiFilter /> Lọc</span>
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            className={`hq-section-pill ${activeFilter === item.value ? 'active' : ''}`}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <button type="button" className="hq-btn-primary-tactile hq-section-cta">
        {actionIcon}
        <span>{actionLabel}</span>
      </button>
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === 'active') {
    return (
      <span className="hq-badge-active">
        <span className="hq-badge-active-dot" /> Đang mở
      </span>
    );
  }
  return (
    <span className="hq-badge-draft">
      <span className="hq-badge-draft-dot" /> Bản nháp
    </span>
  );
}

function DifficultyBadge({ level }) {
  return (
    <span className={`hq-difficulty hq-difficulty-${level}`}>
      {DIFFICULTY_LABEL[level] || level}
    </span>
  );
}

function TableActions() {
  return (
    <div className="hq-section-row-actions">
      <button type="button" className="hq-btn-edit">Chỉnh sửa</button>
      <button type="button" className="hq-btn-view" aria-label="Xem chi tiết"><FiEye /></button>
    </div>
  );
}

function Pagination({ total }) {
  return (
    <div className="hq-section-pagination">
      <span>Hiển thị <strong>{total}</strong> kết quả</span>
      <div className="hq-section-page-buttons">
        <button type="button" className="hq-section-page-btn" disabled>Trước</button>
        <button type="button" className="hq-section-page-btn active">1</button>
        <button type="button" className="hq-section-page-btn">2</button>
        <button type="button" className="hq-section-page-btn">3</button>
        <button type="button" className="hq-section-page-btn">Sau</button>
      </div>
    </div>
  );
}

function PackagesPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const rows = useMemo(() => PACKAGES.filter((item) => {
    const matchQuery = `${item.title} ${item.id} ${item.category}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchFilter = filter === 'all' || item.status === filter;
    return matchQuery && matchFilter;
  }), [query, filter]);

  return (
    <div className="hq-section-page">
      <SectionHead
        icon={<FiFolder />}
        eyebrow="Nội dung học tập"
        title="Gói câu hỏi"
        description="Tổ chức lộ trình kiến thức lịch sử thành từng gói, gắn bộ đề và theo dõi hiệu quả học tập."
      >
        <button type="button" className="hq-btn-primary-tactile">
          <FiPlus /><span>Tạo gói câu hỏi</span>
        </button>
        <button type="button" className="hq-btn-secondary">
          <FiDownload /><span>Xuất dữ liệu</span>
        </button>
      </SectionHead>

      <div className="hq-section-kpi-grid">
        <KpiCard icon={<FiFolder />} label="Tổng gói câu hỏi" value="24" delta="+4 tháng này" tone="primary" />
        <KpiCard icon={<FiCheckCircle />} label="Đang xuất bản" value="18" delta="75%" tone="teal" />
        <KpiCard icon={<FiLayers />} label="Tổng bộ câu hỏi" value="186" delta="+12 bộ" tone="violet" />
        <KpiCard icon={<FiDatabase />} label="Tổng câu hỏi" value="2.450" delta="+150 câu" tone="amber" />
      </div>

      <div className="hq-card">
        <Toolbar
          query={query}
          setQuery={setQuery}
          placeholder="Tìm theo tên gói, mã gói hoặc danh mục..."
          filters={[
            { value: 'all', label: 'Tất cả' },
            { value: 'active', label: 'Đang mở' },
            { value: 'draft', label: 'Bản nháp' },
          ]}
          activeFilter={filter}
          setFilter={setFilter}
          actionLabel="Tạo gói mới"
          actionIcon={<FiPlus />}
        />

        <div className="hq-table-wrap">
          <table className="hq-data-table">
            <thead className="hq-table-head">
              <tr>
                <th>Gói câu hỏi</th>
                <th>Quy mô</th>
                <th>Danh mục</th>
                <th>Trạng thái</th>
                <th>Tỷ lệ đạt</th>
                <th>Cập nhật</th>
                <th className="hq-actions-cell">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id} className="hq-table-row">
                  <td>
                    <div className="hq-package-title">{item.title}</div>
                    <div className="hq-package-date">{item.id}</div>
                  </td>
                  <td>
                    <span className="hq-scale-main">{item.sets} bộ</span>
                    <span className="hq-scale-sub">• {item.questions} câu</span>
                  </td>
                  <td><span className="hq-section-soft-tag">{item.category}</span></td>
                  <td><StatusBadge status={item.status} /></td>
                  <td><span className="hq-pass-rate">{item.passRate}</span></td>
                  <td><span className="hq-section-muted">{item.updated}</span></td>
                  <td className="hq-actions-cell"><TableActions /></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr className="hq-table-row">
                  <td colSpan="7">
                    <div className="hq-section-empty">Không tìm thấy gói câu hỏi phù hợp.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination total={rows.length} />
      </div>
    </div>
  );
}



function SetsPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const rows = useMemo(() => SETS.filter((item) => {
    const matchQuery = `${item.title} ${item.id} ${item.pack}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchFilter = filter === 'all' || item.difficulty === filter;
    return matchQuery && matchFilter;
  }), [query, filter]);

  return (
    <div className="hq-section-page">
      <SectionHead
        icon={<FiLayers />}
        eyebrow="Ngân hàng nội dung"
        title="Bộ câu hỏi"
        description="Quản lý từng bộ đề trong gói câu hỏi, thời lượng làm bài và độ khó của thử thách."
      >
        <button type="button" className="hq-btn-primary-tactile">
          <FiPlus /><span>Tạo bộ câu hỏi</span>
        </button>
        <button type="button" className="hq-btn-secondary">
          <FiRefreshCw /><span>Đồng bộ dữ liệu</span>
        </button>
      </SectionHead>

      <div className="hq-section-kpi-grid">
        <KpiCard icon={<FiLayers />} label="Tổng bộ câu hỏi" value="186" delta="+12 bộ" tone="primary" />
        <KpiCard icon={<FiBookOpen />} label="Bộ đang hoạt động" value="164" delta="88%" tone="teal" />
        <KpiCard icon={<FiActivity />} label="Lượt làm bài" value="38.420" delta="+9,2%" tone="violet" />
        <KpiCard icon={<FiClock />} label="Thời lượng trung bình" value="14 phút" delta="ổn định" tone="amber" />
      </div>

      <div className="hq-card">
        <Toolbar
          query={query}
          setQuery={setQuery}
          placeholder="Tìm theo tên bộ, mã bộ hoặc gói câu hỏi..."
          filters={[
            { value: 'all', label: 'Tất cả' },
            { value: 'easy', label: 'Dễ' },
            { value: 'medium', label: 'Trung bình' },
            { value: 'hard', label: 'Khó' },
          ]}
          activeFilter={filter}
          setFilter={setFilter}
          actionLabel="Tạo bộ mới"
          actionIcon={<FiPlus />}
        />

        <div className="hq-table-wrap">
          <table className="hq-data-table">
            <thead className="hq-table-head">
              <tr>
                <th>Bộ câu hỏi</th>
                <th>Thuộc gói</th>
                <th>Số câu</th>
                <th>Thời lượng</th>
                <th>Lượt làm</th>
                <th>Độ khó</th>
                <th>Trạng thái</th>
                <th className="hq-actions-cell">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id} className="hq-table-row">
                  <td>
                    <div className="hq-package-title">{item.title}</div>
                    <div className="hq-package-date">{item.id}</div>
                  </td>
                  <td><span className="hq-section-soft-tag">{item.pack}</span></td>
                  <td><span className="hq-scale-main">{item.questions} câu</span></td>
                  <td><span className="hq-section-muted">{item.duration}</span></td>
                  <td><span className="hq-scale-main">{item.attempts}</span></td>
                  <td><DifficultyBadge level={item.difficulty} /></td>
                  <td><StatusBadge status={item.status} /></td>
                  <td className="hq-actions-cell"><TableActions /></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr className="hq-table-row">
                  <td colSpan="8">
                    <div className="hq-section-empty">Không tìm thấy bộ câu hỏi phù hợp.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination total={rows.length} />
      </div>
    </div>
  );
}

function BankPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const rows = useMemo(() => QUESTIONS.filter((item) => {
    const matchQuery = `${item.content} ${item.id} ${item.topic} ${item.pack}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchFilter = filter === 'all' || item.difficulty === filter;
    return matchQuery && matchFilter;
  }), [query, filter]);

  return (
    <div className="hq-section-page">
      <SectionHead
        icon={<FiHelpCircle />}
        eyebrow="Kho tri thức"
        title="Ngân hàng câu hỏi"
        description="Tra cứu, thẩm định và tổ chức toàn bộ câu hỏi trắc nghiệm lịch sử theo chủ đề và độ khó."
      >
        <button type="button" className="hq-btn-primary-tactile">
          <FiPlus /><span>Thêm câu hỏi</span>
        </button>
        <button type="button" className="hq-btn-secondary">
          <FiDownload /><span>Nhập từ Excel</span>
        </button>
      </SectionHead>

      <div className="hq-section-kpi-grid">
        <KpiCard icon={<FiDatabase />} label="Tổng câu hỏi" value="2.450" delta="+150 câu" tone="primary" />
        <KpiCard icon={<FiCheckCircle />} label="Đã thẩm định" value="2.281" delta="93,1%" tone="teal" />
        <KpiCard icon={<FiClock />} label="Chờ duyệt" value="42" delta="cần xử lý" tone="amber" />
        <KpiCard icon={<FiTarget />} label="Độ phủ chủ đề" value="12/12" delta="đầy đủ" tone="violet" />
      </div>

      <div className="hq-card">
        <Toolbar
          query={query}
          setQuery={setQuery}
          placeholder="Tìm theo nội dung câu hỏi, mã câu, chủ đề..."
          filters={[
            { value: 'all', label: 'Tất cả' },
            { value: 'easy', label: 'Dễ' },
            { value: 'medium', label: 'Trung bình' },
            { value: 'hard', label: 'Khó' },
          ]}
          activeFilter={filter}
          setFilter={setFilter}
          actionLabel="Thêm câu hỏi"
          actionIcon={<FiPlus />}
        />

        <div className="hq-table-wrap">
          <table className="hq-data-table">
            <thead className="hq-table-head">
              <tr>
                <th>Câu hỏi</th>
                <th>Chủ đề</th>
                <th>Độ khó</th>
                <th>Thuộc gói</th>
                <th>Trạng thái</th>
                <th className="hq-actions-cell">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id} className="hq-table-row">
                  <td>
                    <div className="hq-question-content">{item.content}</div>
                    <div className="hq-package-date">{item.id}</div>
                  </td>
                  <td><span className="hq-section-soft-tag">{item.topic}</span></td>
                  <td><DifficultyBadge level={item.difficulty} /></td>
                  <td><span className="hq-section-soft-tag teal">{item.pack}</span></td>
                  <td><StatusBadge status={item.status} /></td>
                  <td className="hq-actions-cell"><TableActions /></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr className="hq-table-row">
                  <td colSpan="6">
                    <div className="hq-section-empty">Không tìm thấy câu hỏi phù hợp.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination total={rows.length} />
      </div>
    </div>
  );
}


function LeaderboardPage() {
  const [query, setQuery] = useState('');
  const [period, setPeriod] = useState('week');

  const rows = useMemo(() => RANKING.filter((item) => (
    `${item.name} ${item.school}`.toLowerCase().includes(query.toLowerCase())
  )), [query]);

  const podium = RANKING.slice(0, 3);

  return (
    <div className="hq-section-page">
      <SectionHead
        icon={<FiAward />}
        eyebrow="Thi đua học tập"
        title="Bảng xếp hạng học viên"
        description="Tôn vinh những học viên xuất sắc nhất theo điểm kinh nghiệm, số bộ đề hoàn thành và chuỗi ngày học."
      >
        <div className="hq-section-period">
          {[
            { value: 'week', label: 'Tuần này' },
            { value: 'month', label: 'Tháng này' },
            { value: 'all', label: 'Toàn thời gian' },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              className={`hq-section-pill ${period === item.value ? 'active' : ''}`}
              onClick={() => setPeriod(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </SectionHead>

      <div className="hq-lb-podium">
        {podium.map((item, index) => (
          <div key={item.rank} className={`hq-lb-podium-card place-${item.rank}`}>
            <div className="hq-lb-medal">{item.rank}</div>
            <div className="hq-lb-avatar">{item.name.split(' ').slice(-2).map((part) => part[0]).join('')}</div>
            <div className="hq-lb-name">{item.name}</div>
            <div className="hq-lb-school">{item.school}</div>
            <div className="hq-lb-xp">{item.xp} XP</div>
            <span className="hq-lb-badge">{index === 0 ? 'Quán quân' : index === 1 ? 'Á quân' : 'Hạng ba'}</span>
          </div>
        ))}
      </div>

      <div className="hq-card">
        <div className="hq-section-toolbar compact">
          <div className="hq-section-search">
            <FiSearch />
            <input
              type="search"
              value={query}
              placeholder="Tìm học viên theo tên hoặc trường..."
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <button type="button" className="hq-btn-secondary">
            <FiDownload /><span>Xuất bảng xếp hạng</span>
          </button>
        </div>

        <div className="hq-table-wrap">
          <table className="hq-data-table">
            <thead className="hq-table-head">
              <tr>
                <th>Hạng</th>
                <th>Học viên</th>
                <th>Trường học</th>
                <th>Điểm XP</th>
                <th>Bộ hoàn thành</th>
                <th>Chuỗi ngày</th>
                <th>Danh hiệu</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.rank} className="hq-table-row">
                  <td><span className={`hq-lb-rank rank-${item.rank}`}>#{item.rank}</span></td>
                  <td><div className="hq-package-title">{item.name}</div></td>
                  <td><span className="hq-section-muted">{item.school}</span></td>
                  <td><span className="hq-lb-xp-cell">{item.xp} XP</span></td>
                  <td><span className="hq-scale-main">{item.sets} bộ</span></td>
                  <td><span className="hq-section-soft-tag amber">{item.streak} ngày</span></td>
                  <td><span className="hq-section-soft-tag">{item.badge}</span></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr className="hq-table-row">
                  <td colSpan="7">
                    <div className="hq-section-empty">Không tìm thấy học viên phù hợp.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination total={rows.length} />
      </div>
    </div>
  );
}


function StatsPage() {
  const weekly = [
    { label: 'Thứ 2', level: 4, value: '3.120' },
    { label: 'Thứ 3', level: 5, value: '3.860' },
    { label: 'Thứ 4', level: 3, value: '2.740' },
    { label: 'Thứ 5', level: 6, value: '4.210' },
    { label: 'Thứ 6', level: 7, value: '5.480' },
    { label: 'Thứ 7', level: 6, value: '4.960' },
    { label: 'Chủ nhật', level: 5, value: '3.980' },
  ];

  return (
    <div className="hq-section-page">
      <SectionHead
        icon={<FiTrendingUp />}
        eyebrow="Báo cáo & phân tích"
        title="Thống kê hệ thống"
        description="Theo dõi hiệu suất học tập, độ phủ nội dung và mức độ tương tác của học viên trên toàn nền tảng."
      >
        <button type="button" className="hq-btn-primary-tactile">
          <FiDownload /><span>Xuất báo cáo</span>
        </button>
        <button type="button" className="hq-btn-secondary">
          <FiRefreshCw /><span>Làm mới</span>
        </button>
      </SectionHead>

      <div className="hq-section-kpi-grid">
        <KpiCard icon={<FiUsers />} label="Học viên hoạt động" value="42.850" delta="+8,4%" tone="primary" />
        <KpiCard icon={<FiActivity />} label="Lượt làm bài tuần này" value="28.540" delta="+12,6%" tone="teal" />
        <KpiCard icon={<FiTarget />} label="Tỷ lệ hoàn thành" value="87,3%" delta="+3,1%" tone="violet" />
        <KpiCard icon={<FiClock />} label="Thời gian học trung bình" value="26 phút" delta="+2 phút" tone="amber" />
      </div>

      <div className="hq-section-chart-grid">
        <div className="hq-card">
          <div className="hq-card-header">
            <div>
              <h3 className="hq-card-title">Lượt làm bài theo ngày</h3>
              <div className="hq-card-subtitle">Dữ liệu 7 ngày gần nhất</div>
            </div>
            <span className="hq-section-soft-tag teal">+12,6% so với tuần trước</span>
          </div>
          <div className="hq-stats-chart">
            {weekly.map((item) => (
              <div key={item.label} className="hq-stats-bar-col">
                <span className="hq-stats-bar-value">{item.value}</span>
                <div className={`hq-stats-bar hq-bar-${item.level}`} />
                <span className="hq-stats-bar-label">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hq-card">
          <div className="hq-card-header">
            <div>
              <h3 className="hq-card-title">Phân bổ câu hỏi theo chủ đề</h3>
              <div className="hq-card-subtitle">Độ phủ nội dung ngân hàng câu hỏi</div>
            </div>
            <span className="hq-section-muted">2.450 câu</span>
          </div>
          <div className="hq-section-topic-list">
            {TOPICS.map((topic) => (
              <div key={topic.label} className="hq-section-topic">
                <div className="hq-section-topic-top">
                  <span>{topic.label}</span>
                  <strong>{topic.count}</strong>
                </div>
                <div className="hq-progress-track">
                  <div className={`hq-progress-fill hq-topic-fill-${topic.value} ${topic.tone}`} />
                </div>
              </div>
            ))}
          </div>
          <div className="hq-insight-callout hq-section-callout">
            <FiHelpCircle className="hq-callout-icon" />
            <div className="hq-callout-text">
              Gợi ý: Bổ sung thêm 50 câu cho chủ đề{' '}
              <strong className="hq-callout-strong">Cận - Hiện đại</strong> để cân bằng lộ trình quest.
            </div>
          </div>
        </div>
      </div>

      <div className="hq-card">
        <div className="hq-card-header">
          <div>
            <h3 className="hq-card-title">Hiệu quả theo gói câu hỏi</h3>
            <div className="hq-card-subtitle">Xếp hạng theo tỷ lệ hoàn thành và lượt làm bài</div>
          </div>
          <button type="button" className="hq-link-viewall">
            <span>Xem báo cáo chi tiết</span>
            <FiArrowUpRight />
          </button>
        </div>
        <div className="hq-table-wrap">
          <table className="hq-data-table">
            <thead className="hq-table-head">
              <tr>
                <th>Gói câu hỏi</th>
                <th>Lượt làm bài</th>
                <th>Tỷ lệ hoàn thành</th>
                <th>Điểm trung bình</th>
                <th>Xu hướng</th>
              </tr>
            </thead>
            <tbody>
              {PACKAGES.filter((item) => item.status === 'active').slice(0, 4).map((item, index) => (
                <tr key={item.id} className="hq-table-row">
                  <td>
                    <div className="hq-package-title">{item.title}</div>
                    <div className="hq-package-date">{item.sets} bộ • {item.questions} câu</div>
                  </td>
                  <td><span className="hq-scale-main">{(5 - index) * 1240 + 800} lượt</span></td>
                  <td><span className="hq-pass-rate">{item.passRate}</span></td>
                  <td><span className="hq-scale-main">{(8.6 - index * 0.3).toFixed(1)}/10</span></td>
                  <td><span className="hq-section-soft-tag teal">+{8 - index}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminSectionPage({ section }) {
  if (section === 'packages') return <PackagesPage />;
  if (section === 'sets') return <SetsPage />;
  if (section === 'bank') return <BankPage />;
  if (section === 'leaderboard') return <LeaderboardPage />;
  if (section === 'stats') return <StatsPage />;
  return <PackagesPage />;
}
