import { useEffect, useState, useMemo } from "react";
import BrandMark from "../../components/BrandMark.jsx";
import { api } from "../../lib/api.js";
import QuestionPage from "../questions/QuestionPage.jsx";

export default function StudyHomePage({ user, onLogout }) {
  const [dashboard, setDashboard] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Filters & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("Tất cả");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả chủ đề");
  const [selectedDifficulty, setSelectedDifficulty] = useState("Tất cả mức độ");
  const [sortBy, setSortBy] = useState("Mới nhất");

  const userInitial = user?.name ? user.name.trim().split(/\s+/).at(-1)?.[0]?.toLocaleUpperCase("vi-VN") : "S";

  async function refresh() {
    try {
      const data = await api("/dashboard");
      setDashboard(data);
    } catch (err) {
      setError(err.message || "Không thể tải bảng điều khiển");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function startQuiz(topic) {
    setBusy(true);
    setError("");
    try {
      const quizData = await api(`/quizzes/${topic._id}`);
      setQuiz(quizData);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setBusy(false);
    }
  }

  function resetFilters() {
    setSearchTerm("");
    setSelectedGrade("Tất cả");
    setSelectedCategory("Tất cả chủ đề");
    setSelectedDifficulty("Tất cả mức độ");
    setSortBy("Mới nhất");
  }

  // Filter topics
  const filteredTopics = useMemo(() => {
    if (!dashboard?.topics) return [];
    return dashboard.topics.filter((topic) => {
      // Search
      const matchSearch =
        !searchTerm ||
        topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        topic.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        topic.period.toLowerCase().includes(searchTerm.toLowerCase());

      // Grade
      const matchGrade =
        selectedGrade === "Tất cả" ||
        (topic.grade && topic.grade.includes(selectedGrade));

      // Difficulty
      const matchDifficulty =
        selectedDifficulty === "Tất cả mức độ" ||
        (topic.difficulty && topic.difficulty.includes(selectedDifficulty));

      return matchSearch && matchGrade && matchDifficulty;
    });
  }, [dashboard?.topics, searchTerm, selectedGrade, selectedCategory, selectedDifficulty, sortBy]);

  if (!dashboard) {
    return (
      <div className="session-loading flex flex-col items-center justify-center min-h-screen bg-background text-on-surface-variant font-body-md gap-4">
        <BrandMark />
        <span className="text-body-md font-medium animate-pulse">
          Đang nạp chiến dịch & dữ liệu Lịch sử THPT...
        </span>
      </div>
    );
  }

  if (quiz) {
    return (
      <main className="min-h-screen bg-background text-on-surface flex flex-col font-body-md">
        <QuestionPage
          quiz={quiz}
          user={user}
          onBack={() => setQuiz(null)}
          onAttemptComplete={refresh}
        />
      </main>
    );
  }

  return (
    <div className="bg-background text-on-surface antialiased min-h-screen flex flex-col font-body-md">
      {/* 1. TOP NAVBAR COMPONENT */}
      <header className="sticky top-0 z-40 bg-surface-container-lowest border-b border-surface-container-high shadow-sm">
        <div className="w-full px-4 md:px-8 max-w-7xl mx-auto flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <a href="#" className="flex items-center gap-2.5">
              <BrandMark small />
            </a>
            {/* Desktop Search bar */}
            <div className="hidden lg:flex items-center ml-6 relative">
              <span className="material-symbols-outlined absolute left-3 text-outline text-lg">search</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm chủ đề, niên đại..."
                className="pl-9 pr-4 py-1.5 bg-surface-container-low border border-surface-container-high rounded-full text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container focus:bg-surface-container-lowest transition-all w-52 focus:w-64 placeholder:text-outline"
              />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <a href="#" className="text-on-surface-variant font-label-md text-label-md font-medium hover:text-primary transition-colors">
              Trang chủ
            </a>
            <a href="#" className="text-primary font-bold border-b-2 border-primary pb-1 font-label-md text-label-md flex items-center gap-1">
              Bài kiểm tra
              <span className="w-1.5 h-1.5 rounded-full bg-secondary-container animate-pulse"></span>
            </a>
            <a href="#" className="text-on-surface-variant font-label-md text-label-md font-medium hover:text-primary transition-colors">
              Hành trình
            </a>
            <a href="#" className="text-on-surface-variant font-label-md text-label-md font-medium hover:text-primary transition-colors">
              Thành tích
            </a>
            <a href="#" className="text-on-surface-variant font-label-md text-label-md font-medium hover:text-primary transition-colors">
              Bảng vàng
            </a>
          </nav>

          {/* Trailing Gamified Widgets & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Streak Widget */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-low border border-secondary-fixed rounded-full shadow-xs" title="Chuỗi 12 ngày học liên tục">
              <span className="material-symbols-outlined text-secondary-container fill-icon text-lg">local_fire_department</span>
              <span className="font-label-sm text-label-sm text-on-secondary-container font-extrabold">12</span>
            </div>
            {/* Hearts / Life Widget */}
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-error-container/30 border border-error-container rounded-full" title="5/5 Sinh mệnh">
              <span className="material-symbols-outlined text-error fill-icon text-lg">favorite</span>
              <span className="font-label-sm text-label-sm text-error font-bold">5/5</span>
            </div>
            {/* XP Badge */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-high rounded-full border border-surface-container-high" title="Điểm kinh nghiệm tích lũy">
              <span className="material-symbols-outlined text-secondary font-bold text-sm">bolt</span>
              <span className="font-label-sm text-label-sm text-primary font-extrabold">2,450 XP</span>
            </div>

            {/* User Profile Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-surface-container-high">
              <div className="relative cursor-pointer">
                <div className="w-9 h-9 rounded-full ring-2 ring-secondary-container bg-primary text-on-primary font-extrabold flex items-center justify-center text-sm shadow-xs">
                  {userInitial}
                </div>
                <span className="absolute -bottom-1 -right-1 bg-primary text-on-primary text-[9px] font-bold px-1 rounded-full border border-surface-container-lowest">
                  18
                </span>
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-label-sm font-label-sm text-on-surface leading-tight font-bold">{user.name}</span>
                <span className="text-[11px] text-on-surface-variant leading-none font-medium">Học sinh THPT</span>
              </div>
            </div>

            {/* Logout / CTA Button */}
            <button
              onClick={onLogout}
              className="ml-1 text-xs px-3 py-1.5 bg-surface-container-low hover:bg-surface-container text-on-surface-variant rounded-lg border border-surface-container-high transition-colors font-semibold"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CANVAS */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 bg-dong-son-watermark">
        {error && (
          <div className="mb-6 p-4 bg-error-container/40 border border-error text-error rounded-xl flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="font-bold underline">Đóng</button>
          </div>
        )}

        {/* 2. HERO / HEADER BANNER */}
        <section className="mb-8">
          <nav className="flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant mb-2">
            <a href="#" className="hover:text-primary transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">home</span>
              Trang chủ
            </a>
            <span className="text-outline-variant">/</span>
            <span className="text-primary font-bold">Bài kiểm tra</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-headline-lg font-headline-lg text-primary tracking-tight font-extrabold flex items-center gap-3">
                Bài kiểm tra
                <span className="text-label-sm font-label-sm bg-secondary-fixed text-on-secondary-fixed px-2.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold align-middle">
                  Kỳ thi Quốc Gia THPT
                </span>
              </h1>
              <p class="text-body-md font-body-md text-on-surface-variant mt-1">
                Chọn một hành trình để bắt đầu. Mỗi bài kiểm tra là một chiến dịch lịch sử mở rộng bản đồ kiến thức.
              </p>
            </div>

            {/* Live Campaign Tracker Pill */}
            <div className="flex items-center gap-3 self-start md:self-auto bg-surface-container-lowest border border-surface-container-high rounded-xl p-3 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-2xl">military_tech</span>
              </div>
              <div>
                <div className="flex items-center justify-between gap-4 mb-1">
                  <span className="text-label-sm font-label-sm text-on-surface font-bold">Tiến trình Chinh phục</span>
                  <span className="text-label-sm font-label-sm text-primary font-extrabold">
                    {dashboard.attempts} / {dashboard.topics.length} Bài ({dashboard.topics.length ? Math.round((dashboard.attempts / dashboard.topics.length) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-48 sm:w-56 h-2 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-container to-secondary-container rounded-full"
                    style={{ width: `${Math.min(100, Math.round(((dashboard.attempts || 1) / (dashboard.topics.length || 1)) * 100))}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Gamified Weekly Quest Banner */}
          <div className="mt-6 rounded-2xl bg-gradient-to-r from-primary-container via-primary to-primary-container text-on-primary p-4 md:p-5 shadow-sm relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="absolute -right-8 -top-12 w-48 h-48 rounded-full bg-secondary-container/10 blur-2xl pointer-events-none"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-2xl fill-icon">deployed_code</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider bg-secondary-container/20 text-secondary-fixed border border-secondary-fixed/30 px-2 py-0.5 rounded font-bold">
                    Thử thách tuần
                  </span>
                  <span className="text-label-sm font-label-sm text-primary-fixed">Còn 2 ngày 14 giờ</span>
                </div>
                <p className="font-title-md text-title-md font-bold text-surface-container-lowest mt-0.5">
                  Mùa thi 2025: Hoàn thành 3 bài kiểm tra điểm 8.5+ để nhận Rương Thần Tốc & +500 XP!
                </p>
              </div>
            </div>
            <button className="relative z-10 shrink-0 px-4 py-2 bg-secondary-container hover:bg-secondary-fixed-dim text-on-secondary-container font-label-md text-label-md font-bold rounded-xl btn-tactile-gold transition-all">
              Nhận nhiệm vụ
            </button>
          </div>
        </section>

        {/* 3. ADVANCED FILTER & SEARCH BAR SECTION */}
        <section className="mb-8 space-y-4">
          <div className="bg-surface-container-lowest border border-surface-container-high rounded-2xl p-4 md:p-5 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
              {/* Search input */}
              <div className="relative flex-grow">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-xl">search</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm bài kiểm tra, chiến dịch hoặc chủ đề lịch sử (ví dụ: Điện Biên Phủ, Xô Viết Nghệ Tĩnh)..."
                  className="w-full h-12 pl-11 pr-4 bg-surface-container-lowest border border-outline-variant focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 rounded-xl text-body-md font-body-md text-on-surface placeholder:text-outline transition-all"
                />
              </div>

              {/* Grade Level Filter Pills */}
              <div className="flex items-center gap-1.5 p-1 bg-surface-container-low rounded-xl border border-surface-container-high shrink-0 overflow-x-auto">
                {["Tất cả", "Khối 10", "Khối 11", "Khối 12"].map((grade) => (
                  <button
                    key={grade}
                    onClick={() => setSelectedGrade(grade)}
                    className={`px-3.5 py-1.5 rounded-lg text-label-md font-label-md transition-all flex items-center gap-1 ${
                      selectedGrade === grade
                        ? "bg-primary-container text-on-primary font-bold shadow-xs"
                        : "text-on-surface-variant font-medium hover:text-on-surface"
                    }`}
                  >
                    <span>{grade}</span>
                    {selectedGrade === grade && (
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed"></span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Dropdowns & Reset */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-3 border-t border-surface-container-low">
              <div>
                <label className="block text-label-sm font-label-sm text-outline mb-1 font-bold">Chủ đề</label>
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full appearance-none h-10 px-3 pr-8 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm font-body-sm text-on-surface focus:border-primary-container focus:outline-none"
                  >
                    <option>Tất cả chủ đề</option>
                    <option>Lịch sử Việt Nam</option>
                    <option>Lịch sử Thế giới</option>
                    <option>Kháng chiến chống Pháp</option>
                    <option>Kháng chiến chống Mỹ</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-2.5 text-outline pointer-events-none text-base">expand_more</span>
                </div>
              </div>

              <div>
                <label className="block text-label-sm font-label-sm text-outline mb-1 font-bold">Độ khó</label>
                <div className="relative">
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="w-full appearance-none h-10 px-3 pr-8 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm font-body-sm text-on-surface focus:border-primary-container focus:outline-none"
                  >
                    <option>Tất cả mức độ</option>
                    <option>Trọng tâm THPT</option>
                    <option>Chiến dịch lớn</option>
                    <option>Chiến thần</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-2.5 text-outline pointer-events-none text-base">expand_more</span>
                </div>
              </div>

              <div>
                <label className="block text-label-sm font-label-sm text-outline mb-1 font-bold">Trạng thái</label>
                <div className="relative">
                  <select className="w-full appearance-none h-10 px-3 pr-8 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm font-body-sm text-on-surface focus:border-primary-container focus:outline-none">
                    <option>Tất cả trạng thái</option>
                    <option>Chưa bắt đầu</option>
                    <option>Đang chinh phục</option>
                    <option>Đã hoàn thành</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-2.5 text-outline pointer-events-none text-base">expand_more</span>
                </div>
              </div>

              <div>
                <label className="block text-label-sm font-label-sm text-outline mb-1 font-bold">Sắp xếp theo</label>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full appearance-none h-10 px-3 pr-8 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm font-body-sm text-on-surface focus:border-primary-container focus:outline-none"
                  >
                    <option>Mới nhất</option>
                    <option>Nhiều người thi nhất</option>
                    <option>XP thưởng cao nhất</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-2.5 text-outline pointer-events-none text-base">swap_vert</span>
                </div>
              </div>

              <div className="col-span-2 md:col-span-4 lg:col-span-1 flex items-end">
                <button
                  onClick={resetFilters}
                  className="w-full h-10 flex items-center justify-center gap-1.5 px-3 bg-surface-container-low hover:bg-surface-container text-on-surface-variant font-label-md text-label-md rounded-lg border border-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-base">restart_alt</span>
                  <span>Đặt lại bộ lọc</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <p className="text-body-sm font-body-sm text-on-surface-variant font-medium">
              Hiển thị <strong class="text-primary font-bold">{filteredTopics.length} hành trình kiểm tra</strong> phù hợp với tiêu chuẩn Bộ GD&ĐT
            </p>
          </div>
        </section>

        {/* 4. EXAM CARDS GRID */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredTopics.map((topic) => (
            <div
              key={topic._id}
              className="bg-surface-container-lowest border border-surface-container-high rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex flex-col group"
            >
              {/* Thumbnail & Badges */}
              <div className="relative h-44 w-full overflow-hidden bg-surface-container">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  src={topic.thumbnail || "https://images.unsplash.com/photo-1447069387593-a5de0862481e?w=800&q=80"}
                  alt={topic.title}
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&q=80";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"></div>
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                  <span className="bg-primary/90 backdrop-blur-sm text-on-primary text-label-sm font-label-sm px-2.5 py-0.5 rounded-full font-bold">
                    {topic.grade || "Khối 12"}
                  </span>
                  <span className="bg-secondary-container text-on-secondary-container text-label-sm font-label-sm px-2.5 py-0.5 rounded-full font-bold shadow-xs">
                    {topic.difficulty || "Trọng tâm THPT"}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                  <div className="flex items-center gap-1.5 text-label-sm font-label-sm font-medium">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    <span>{topic.timeMinutes || 45} phút</span>
                    <span>•</span>
                    <span>{topic.questionCount} câu hỏi</span>
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="p-5 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="text-title-md font-title-md text-primary font-bold group-hover:text-primary-container transition-colors">
                    {topic.title}
                  </h3>
                  <p className="text-body-sm font-body-sm text-on-surface-variant mt-2 line-clamp-2">
                    {topic.summary}
                  </p>
                </div>

                {/* Gamified Progress & Reward Info */}
                <div className="mt-4 pt-4 border-t border-surface-container-high space-y-3">
                  <div className="flex items-center justify-between bg-surface-container-low px-3 py-2 rounded-xl">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-secondary-container fill-icon text-sm">military_tech</span>
                      <span className="text-label-sm font-label-sm font-bold text-on-surface">
                        {topic.badgeName || "Huy chương Cờ Đỏ"}
                      </span>
                    </div>
                    <span className="text-label-sm font-label-sm font-extrabold text-secondary">
                      +{topic.xpReward || 450} XP
                    </span>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => startQuiz(topic)}
                    disabled={busy}
                    className="w-full py-2.5 px-4 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-label-md text-label-md font-bold flex items-center justify-center gap-2 btn-tactile-primary transition-all cursor-pointer"
                  >
                    <span>{busy ? "Đang chuẩn bị..." : "Vào thi ngay"}</span>
                    <span className="material-symbols-outlined text-sm">play_arrow</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* 5. QUICK STUDY TIP BANNER */}
        <section className="mb-12 space-y-6">
          <div className="p-4 sm:p-5 rounded-2xl bg-surface-container border border-surface-variant flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">lightbulb</span>
            </div>
            <div className="flex-grow">
              <h4 className="font-title-md text-title-md font-bold text-primary">Mẹo thi điểm 10 THPT Quốc Gia</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                Rèn luyện 15 phút mỗi ngày với phương pháp ngắt quãng giúp tăng tỷ lệ ghi nhớ các mốc sự kiện dài hạn hơn 70%! Hãy giữ lửa streak 🔥 hàng ngày.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-surface-container-lowest border-t border-surface-container-high py-8 px-4 md:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-2">
            <BrandMark small />
            <span className="text-outline text-xs">• Nền tảng Ôn thi Lịch sử THPT Game hóa hàng đầu</span>
          </div>
          <p className="text-body-sm font-body-sm text-outline">
            © 2025 History Quest. Bám sát chương trình Giáo dục Phổ thông mới của Bộ GD&ĐT.
          </p>
        </div>
      </footer>
    </div>
  );
}