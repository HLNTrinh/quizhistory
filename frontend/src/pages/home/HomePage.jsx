import { useEffect, useState } from "react";
import {
  ArrowDown, ArrowRight, BookOpen, CheckCircle2, ChevronRight,
  Compass, History, LockKeyhole, Medal, ShieldCheck, Target, TrendingUp
} from "lucide-react";
import BrandMark from "../../components/BrandMark.jsx";
import { api } from "../../lib/api.js";
import "./HomePage.css";

const demo = {
  tag: "Chuyên đề: Lịch sử Việt Nam 1945–1954",
  level: "Vận dụng",
  question: "Ý nghĩa lịch sử quan trọng nhất của thắng lợi Điện Biên Phủ năm 1954 đối với cuộc kháng chiến chống thực dân Pháp là gì?",
  options: [
    "Làm sụp đổ hoàn toàn chế độ thực dân của Pháp trên toàn thế giới.",
    "Đập tan kế hoạch Nava, giáng đòn quyết định vào ý chí xâm lược của Pháp và tạo thuận lợi cho việc ký Hiệp định Genève.",
    "Buộc Mỹ ký Hiệp định Paris và rút quân khỏi Việt Nam.",
    "Đánh dấu sự kết thúc của chế độ phong kiến Việt Nam."
  ],
  answer: 1,
  explanation: "Chiến thắng Điện Biên Phủ đập tan kế hoạch Nava, giáng đòn quyết định vào ý chí xâm lược của Pháp và góp phần tạo điều kiện ký Hiệp định Genève năm 1954."
};

const features = [
  { icon: Compass, tag: "HỌC THEO DÒNG THỜI GIAN", title: "Nối sự kiện thành câu chuyện", desc: "Ôn tập từng giai đoạn, đặt sự kiện vào đúng bối cảnh và hiểu mối liên hệ trước sau." },
  { icon: Target, tag: "TỰ LUYỆN", title: "Luyện câu hỏi theo chủ đề", desc: "Chọn chuyên đề, tự trả lời từng câu và xem kết quả ngay sau khi nộp bài." },
  { icon: BookOpen, tag: "GIẢI THÍCH ĐÁP ÁN", title: "Hiểu điều mình vừa học", desc: "Đối chiếu đáp án và đọc giải thích để củng cố kiến thức sau mỗi lần ôn tập." },
  { icon: Medal, tag: "HỒ SƠ CÁ NHÂN", title: "Theo dõi tiến độ của em", desc: "Lịch sử làm bài và độ chính xác được lưu riêng trong tài khoản học tập." }
];

const steps = [
  { number: "BƯỚC 01", title: "Chọn một chuyên đề", text: "Bắt đầu từ giai đoạn em muốn ôn lại." },
  { number: "BƯỚC 02", title: "Tự trả lời câu hỏi", text: "Đi qua từng câu theo nhịp độ của mình." },
  { number: "BƯỚC 03", title: "Xem lại và ghi nhớ", text: "Kiểm tra kết quả, đáp án và lời giải thích." }
];

export default function LandingPage({ onLogin, onSignup, onStartFree }) {
  const [topics, setTopics] = useState([]);
  const [picked, setPicked] = useState(null);
  const [topicsLoaded, setTopicsLoaded] = useState(false);

  useEffect(() => {
    api("/topics").then(setTopics).catch(() => setTopics([])).finally(() => setTopicsLoaded(true));
  }, []);

  const questionCount = topics.reduce((total, topic) => total + (topic.questionCount || 0), 0);
  const optionClass = (index) => {
    if (picked === null) return "lp-opt";
    if (index === demo.answer) return "lp-opt right";
    if (index === picked) return "lp-opt wrong";
    return "lp-opt";
  };

  return (
    <div className="lp">
      <nav className="lp-nav">
        <div className="lp-wrap">
          <a href="#top" className="lp-logo" aria-label="Sử Ký, trang chủ"><BrandMark small /><span>Sử Ký<small>ÔN TẬP LỊCH SỬ VIỆT NAM</small></span></a>
          <div className="lp-links"><a href="#kham-pha">Khám phá</a><a href="#tinh-nang">Tính năng</a><a href="#chuyen-de">Chuyên đề</a><a href="#lo-trinh">Lộ trình</a></div>
          <div className="right"><button className="lp-login-link" onClick={onLogin}>Đăng nhập</button><button className="lp-btn amber sm" onClick={onStartFree}>Bắt đầu ôn tập <ArrowRight size={15} /></button></div>
        </div>
      </nav>

      <header className="lp-hero" id="top">
        <div className="lp-wrap">
          <span className="lp-pill"><History size={14} /> Không gian ôn tập Lịch sử Việt Nam</span>
          <div className="grid">
            <div className="lp-hero-copy" id="kham-pha">
              <span className="lp-eyebrow">TỪ NHỮNG DẤU MỐC, HIỂU MỘT DÒNG LỊCH SỬ</span>
              <h1>Chinh phục Sử Việt,<br /><em>vững bước cùng tri thức.</em></h1>
              <p>Biến những mốc thời gian thành hành trình khám phá: ôn theo chuyên đề, thử sức với câu hỏi và hiểu bối cảnh phía sau mỗi sự kiện.</p>
              <div className="cta"><button className="lp-btn amber" onClick={onStartFree}>Bắt đầu ôn tập <ArrowRight size={17} /></button><a className="lp-btn ghost" href="#thu-suc">Thử một câu hỏi <ArrowDown size={15} /></a></div>
              <div className="lp-note"><ShieldCheck size={14} /> Câu hỏi mẫu có thể thử ngay, không cần đăng nhập</div>
              <div className="lp-stats">
                <div className="lp-stat"><BookOpen size={18} /><span><b>{topicsLoaded ? topics.length : "..."}</b>chuyên đề lịch sử</span></div>
                <div className="lp-stat"><CheckCircle2 size={18} /><span><b>{topicsLoaded ? questionCount : "..."}</b>câu hỏi ôn tập</span></div>
                <div className="lp-stat"><TrendingUp size={18} /><span><b>Lưu riêng</b>tiến độ cá nhân</span></div>
              </div>
            </div>
            <div className="lp-preview" aria-label="Xem trước không gian ôn tập">
              <div className="top"><span>HÀNH TRÌNH LỊCH SỬ</span><span>01 / 04</span></div>
              <div className="lp-preview-image"><span className="lp-preview-caption"><small>MỘT DẤU MỐC</small><strong>Điện Biên Phủ<br />1954</strong></span></div>
              <div className="row"><span>Chuyên đề ôn tập</span><span>{topics[3]?.questionCount || 3} câu hỏi</span></div>
              <div className="lp-bar"><i style={{ width: "68%" }} /></div>
              <div className="quest"><CheckCircle2 size={15} /> Làm bài, xem đáp án và lời giải thích</div>
            </div>
          </div>
        </div>
      </header>

      <section className="lp-demo-section" id="thu-suc">
        <div className="lp-wrap lp-center">
          <span className="lp-eyebrow">THỬ SỨC NGAY · KHÔNG CẦN ĐĂNG NHẬP</span>
          <h2 className="lp-h2">Một câu hỏi, một dấu mốc</h2>
          <p className="lp-lead">Chọn đáp án để kiểm tra kiến thức và xem giải thích ngay sau đó.</p>
          <article className="lp-quiz">
            <div className="meta"><span><span className="tag">{demo.tag}</span> · Mức độ: {demo.level}</span><span>KIẾN THỨC LỊCH SỬ</span></div>
            <h3>{demo.question}</h3>
            {demo.options.map((text, index) => <button key={text} className={optionClass(index)} disabled={picked !== null} onClick={() => setPicked(index)}><span className="k">{String.fromCharCode(65 + index)}</span><span>{text}</span>{picked !== null && index === demo.answer && <CheckCircle2 className="lp-correct-icon" size={17} />}</button>)}
            {picked !== null ? <div className="lp-reward"><div className="ic"><CheckCircle2 size={21} /></div><div><b>{picked === demo.answer ? "Chính xác!" : "Mình cùng ghi nhớ nhé."}</b>{demo.explanation}</div><button className="lp-btn navy sm" onClick={onSignup}>Lưu tiến độ <ArrowRight size={14} /></button></div> : <div className="lp-quiz-footer"><span><LockKeyhole size={13} /> Câu trả lời thử không được lưu</span><button onClick={() => setPicked(-1)}>Bỏ qua <ChevronRight size={14} /></button></div>}
          </article>
        </div>
      </section>

      <section className="lp-section" id="tinh-nang">
        <div className="lp-wrap">
          <div className="lp-why"><div><span className="lp-eyebrow">ÔN TẬP CÓ MỤC TIÊU</span><h2>Không chỉ nhớ mốc thời gian, mà hiểu câu chuyện phía sau.</h2></div><p>Chọn một giai đoạn, tự kiểm tra kiến thức rồi xem lại phần giải thích. Mỗi kết quả được lưu vào hồ sơ của em.</p></div>
          <div className="lp-features">{features.map(({ icon: Icon, tag, title, desc }) => <article className="lp-feat" key={tag}><span className="ic"><Icon size={21} strokeWidth={1.7} /></span><small>{tag}</small><h3>{title}</h3><p>{desc}</p></article>)}</div>
        </div>
      </section>

      <section className="lp-topics-section" id="chuyen-de">
        <div className="lp-wrap">
          <div className="lp-why"><div><span className="lp-eyebrow">BẢN ĐỒ KIẾN THỨC</span><h2>Những chặng đường đang chờ khám phá.</h2></div><button className="lp-text-link" onClick={onStartFree}>Vào không gian học tập <ArrowRight size={15} /></button></div>
          {topics.length ? <div className="lp-topic-grid">{topics.map((topic, index) => <button className={`lp-topic lp-topic-${index % 4}`} key={topic._id} onClick={onStartFree}><span className="lp-topic-top"><span>0{index + 1}</span><ArrowRight size={16} /></span><small>{topic.period}</small><strong>{topic.title}</strong><p>{topic.summary}</p><span className="lp-topic-bottom"><span><BookOpen size={14} /> {topic.questionCount} câu hỏi</span><span>Ôn tập <ChevronRight size={14} /></span></span></button>)}</div> : <div className="lp-topics-empty">{topicsLoaded ? "Các chuyên đề đang được cập nhật." : "Đang tải chuyên đề..."}</div>}
        </div>
      </section>

      <section className="lp-steps-section" id="lo-trinh">
        <div className="lp-wrap lp-center"><span className="lp-eyebrow">BẮT ĐẦU THẬT ĐƠN GIẢN</span><h2 className="lp-h2">Ba bước để vào guồng ôn tập</h2><p className="lp-lead">Đi từ chuyên đề, qua từng câu hỏi, rồi xem lại điều vừa học.</p><div className="lp-steps">{steps.map((step) => <article className="lp-step" key={step.number}><div className="top"><span>{step.number}</span><ArrowRight size={16} /></div><h3>{step.title}</h3><p>{step.text}</p></article>)}</div></div>
      </section>

      <section className="lp-wrap"><div className="lp-final"><span className="lp-pill">HÀNH TRÌNH LỊCH SỬ CỦA RIÊNG EM</span><h2>Sẵn sàng bắt đầu ôn tập?</h2><p>Tạo tài khoản để lưu bài làm, kết quả và tiếp tục từ nơi em đã dừng lại.</p><div className="lp-final-actions"><button className="lp-btn amber" onClick={onSignup}>Tạo tài khoản <ArrowRight size={16} /></button><button className="lp-btn final-ghost" onClick={onLogin}>Đã có tài khoản? Đăng nhập</button></div></div></section>

      <footer className="lp-footer"><div className="lp-wrap lp-footer-row"><a href="#top" className="lp-logo"><BrandMark small /><span>Sử Ký<small>ÔN TẬP LỊCH SỬ VIỆT NAM</small></span></a><p>Học từ lịch sử. Hiểu thêm về hôm nay.</p><span>Ôn tập · Tiến độ cá nhân · Giải thích đáp án</span></div></footer>
    </div>
  );
}