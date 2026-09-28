import Question from "../Models/Question.js";
import Topic from "../Models/Topic.js";

const lessons = [
  {
    slug: "early-states",
    title: "Buổi đầu dựng nước",
    period: "Thời Văn Lang - Âu Lạc",
    summary: "Từ nhà nước Văn Lang đến thành Cổ Loa và những dấu mốc đầu tiên.",
    accent: "#c65d3a",
    questions: [
      { prompt: "Nhà nước Văn Lang gắn với các vua nào?", options: ["Vua Hùng", "An Dương Vương", "Ngô Quyền", "Đinh Tiên Hoàng"], answerIndex: 0, explanation: "Các vua Hùng là những người đứng đầu nhà nước Văn Lang." },
      { prompt: "Kinh đô của nước Âu Lạc được đặt ở đâu?", options: ["Phong Châu", "Cổ Loa", "Hoa Lư", "Thăng Long"], answerIndex: 1, explanation: "An Dương Vương xây thành Cổ Loa và chọn nơi đây làm kinh đô Âu Lạc." },
      { prompt: "Thành Cổ Loa thuộc địa bàn Hà Nội ngày nay, tại huyện nào?", options: ["Đông Anh", "Ba Vì", "Gia Lâm", "Thanh Trì"], answerIndex: 0, explanation: "Di tích thành Cổ Loa hiện nằm ở huyện Đông Anh, Hà Nội." }
    ]
  },
  {
    slug: "independence",
    title: "Giành lại độc lập",
    period: "Thế kỷ I - thế kỷ X",
    summary: "Những cuộc khởi nghĩa và chiến thắng mở ra thời kỳ tự chủ lâu dài.",
    accent: "#42766a",
    questions: [
      { prompt: "Hai Bà Trưng phất cờ khởi nghĩa vào năm nào?", options: ["Năm 40", "Năm 248", "Năm 542", "Năm 938"], answerIndex: 0, explanation: "Cuộc khởi nghĩa Hai Bà Trưng bùng nổ vào mùa xuân năm 40." },
      { prompt: "Ai lãnh đạo chiến thắng Bạch Đằng năm 938?", options: ["Lý Bí", "Ngô Quyền", "Mai Thúc Loan", "Phùng Hưng"], answerIndex: 1, explanation: "Ngô Quyền lãnh đạo quân dân đánh bại quân Nam Hán trên sông Bạch Đằng năm 938." },
      { prompt: "Trận Bạch Đằng năm 938 đánh bại quân xâm lược nào?", options: ["Quân Tống", "Quân Nguyên", "Quân Nam Hán", "Quân Minh"], answerIndex: 2, explanation: "Chiến thắng Bạch Đằng năm 938 chấm dứt ách đô hộ của nhà Nam Hán." }
    ]
  },
  {
    slug: "ly-tran",
    title: "Đại Việt thời Lý - Trần",
    period: "Thế kỷ XI - thế kỷ XIV",
    summary: "Dời đô, xây dựng quốc gia và ba lần kháng chiến chống quân Nguyên.",
    accent: "#b78a3c",
    questions: [
      { prompt: "Lý Công Uẩn dời đô từ Hoa Lư ra Đại La vào năm nào?", options: ["Năm 968", "Năm 1009", "Năm 1010", "Năm 1054"], answerIndex: 2, explanation: "Năm 1010, Lý Công Uẩn ban Chiếu dời đô và đổi tên Đại La thành Thăng Long." },
      { prompt: "Ai là vị tướng chỉ huy tiêu biểu trong kháng chiến chống Nguyên - Mông thời Trần?", options: ["Trần Hưng Đạo", "Lê Hoàn", "Lý Thường Kiệt", "Nguyễn Trãi"], answerIndex: 0, explanation: "Trần Hưng Đạo, tức Trần Quốc Tuấn, là tổng chỉ huy quân đội nhà Trần." },
      { prompt: "Chiến thắng Bạch Đằng năm 1288 gắn với triều đại nào?", options: ["Nhà Ngô", "Nhà Lý", "Nhà Trần", "Nhà Lê sơ"], answerIndex: 2, explanation: "Quân dân nhà Trần đại thắng quân Nguyên trên sông Bạch Đằng năm 1288." }
    ]
  },
  {
    slug: "modern-vietnam",
    title: "Việt Nam hiện đại",
    period: "1945 - 1975",
    summary: "Cách mạng Tháng Tám, Điện Biên Phủ và ngày thống nhất đất nước.",
    accent: "#b34c51",
    questions: [
      { prompt: "Nước Việt Nam Dân chủ Cộng hòa ra đời vào ngày nào?", options: ["2/9/1945", "19/8/1945", "7/5/1954", "30/4/1975"], answerIndex: 0, explanation: "Ngày 2/9/1945, Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập tại Quảng trường Ba Đình." },
      { prompt: "Chiến thắng Điện Biên Phủ kết thúc vào ngày nào?", options: ["19/12/1946", "7/5/1954", "21/7/1954", "30/4/1975"], answerIndex: 1, explanation: "Chiến dịch Điện Biên Phủ toàn thắng ngày 7/5/1954." },
      { prompt: "Ngày giải phóng miền Nam, thống nhất đất nước là ngày nào?", options: ["2/9/1945", "7/5/1954", "27/1/1973", "30/4/1975"], answerIndex: 3, explanation: "Ngày 30/4/1975, chiến dịch Hồ Chí Minh toàn thắng, miền Nam được giải phóng." }
    ]
  }
];

export async function seedDatabase() {
  if (await Topic.exists({})) return;

  for (const [order, lesson] of lessons.entries()) {
    const { questions, ...topicData } = lesson;
    const topic = await Topic.create({ ...topicData, order });
    await Question.insertMany(questions.map((question, questionOrder) => ({
      ...question,
      topic: topic._id,
      order: questionOrder
    })));
  }
}