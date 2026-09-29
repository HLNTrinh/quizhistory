import Question from "../Models/Question.js";
import Topic from "../Models/Topic.js";

const lessons = [
  {
    slug: "vn-1930-1945",
    title: "Lịch sử Việt Nam 1930–1945",
    period: "1930 - 1945",
    summary: "Từ ngày thành lập Đảng Cộng sản Việt Nam, phong trào Xô Viết Nghệ Tĩnh đến đỉnh cao thắng lợi Cách mạng tháng Tám 1945.",
    accent: "#1e3a8a",
    grade: "Khối 12",
    difficulty: "Trọng tâm THPT",
    timeMinutes: 45,
    xpReward: 450,
    badgeName: "Huy chương Cờ Đỏ",
    thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuA-p0HrcZGU3WO3PDS4iHtCrQxy_FwGTcDiTqqJNjnqAKf5MVRBHbpiTWvagYRyCbSAWaaj8L5sYt1V37CvxesPx1UrJcSLbwQe00Iuy4x6Zvc9PApSfejONfISPPP_Dht2RSorIfdv4q18XWAMLJlW5wSQIOUjOYf6YCmBtrzWPNbq796yZpEjynB3cGsVIybEEWQx6ArFu9m4Mmz3bYFg1dSeR9J2HHAGx18xQYg3vgX0ASLQngNj",
    questions: [
      { prompt: "Đảng Cộng sản Việt Nam được thành lập vào ngày tháng năm nào?", options: ["3/2/1930", "2/9/1945", "19/5/1941", "1/5/1930"], answerIndex: 0, explanation: "Hội nghị thành lập Đảng diễn ra tại Cửu Long (Hương Cảng, Trung Quốc) từ 6/1 đến 7/2/1930, lấy ngày 3/2 làm ngày kỷ niệm thành lập Đảng." },
      { prompt: "Đỉnh cao của phong trào cách mạng 1930–1931 ở Việt Nam là sự kiện nào?", options: ["Khởi nghĩa Nam Kỳ", "Xô Viết Nghệ Tĩnh", "Tổng khởi nghĩa tháng Tám", "Bãi công Ba Son"], answerIndex: 1, explanation: "Chính quyền Xô Viết Công - Nông được thành lập tại Nghệ An và Hà Tĩnh là đỉnh cao của phong trào 1930-1931." },
      { prompt: "Mặt trận Việt Minh (Việt Nam Độc lập Đồng minh) được thành lập vào năm nào?", options: ["1939", "1941", "1943", "1945"], answerIndex: 1, explanation: "Hội nghị Trung ương Đảng lần 8 (tháng 5/1941) tại Pác Bó do Nguyễn Ái Quốc chủ trì quyết định thành lập Mặt trận Việt Minh." },
      { prompt: "Bản Tuyên ngôn Độc lập do Chủ tịch Hồ Chí Minh đọc tại Ba Đình ngày 2/9/1945 đã khai sinh ra nước nào?", options: ["Cộng hòa Xã hội Chủ nghĩa Việt Nam", "Việt Nam Dân chủ Cộng hòa", "Đại Nam", "Việt Nam Quảng Phục Hội"], answerIndex: 1, explanation: "Tuyên ngôn Độc lập khẳng định sự ra đời của nước Việt Nam Dân chủ Cộng hòa." }
    ]
  },
  {
    slug: "vn-1945-1954",
    title: "Lịch sử Việt Nam 1945–1954",
    period: "1945 - 1954",
    summary: "Xây dựng và bảo vệ chính quyền non trẻ, toàn quốc kháng chiến đến chiến thắng chấn động địa cầu Điện Biên Phủ.",
    accent: "#855300",
    grade: "Khối 12",
    difficulty: "Chiến dịch lớn",
    timeMinutes: 50,
    xpReward: 600,
    badgeName: "Huy hiệu Đồi A1",
    thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuB_8GQ-z4zNTGeS1sVPxGRfZzBp9e8GU_V7NGaLKbU4f11dL39ZFpOI5_UGjU-DRYHPsSM1_DRIpF1pu2__TXDCRsd7Lrk82t6Qi1aGO-WyQCVeHn7mFFvP5kwfVP4wUGORilBNBhpJWPIYizn7v8PsYvkY7QRE83JBc0RVGmIE_NKZNfE-l-O7cPmhsI3-zB4YkGrhLTuyC7NlBgFNN4PxQKYjtsgZDH4dkDIQTNA1yPuzzUI3qmS4",
    questions: [
      { prompt: "Lời kêu gọi Toàn quốc kháng chiến của Chủ tịch Hồ Chí Minh được phát động vào ngày nào?", options: ["19/12/1946", "23/9/1945", "6/3/1946", "7/5/1954"], answerIndex: 0, explanation: "Đêm 19/12/1946, Lời kêu gọi Toàn quốc kháng chiến được ban hành khi thực dân Pháp bội ước." },
      { prompt: "Chiến dịch Biên giới thu - đông 1950 nhằm mục đích chủ yếu nào?", options: ["Khai thông biên giới Việt - Trung", "Tiêu diệt cơ quan đầu não Pháp", "Giải phóng Tây Nguyên", "Phá tan kế hoạch Nơ-va"], answerIndex: 0, explanation: "Chiến dịch Biên giới 1950 đã khai thông con đường liên lạc của ta với các nước xã hội chủ nghĩa." },
      { prompt: "Chiến dịch Điện Biên Phủ toàn thắng sau bao nhiêu ngày đêm tiến công liên tục?", options: ["55 ngày đêm", "56 ngày đêm", "60 ngày đêm", "45 ngày đêm"], answerIndex: 1, explanation: "Chiến dịch Điện Biên Phủ kéo dài 56 ngày đêm (từ 13/3 đến 7/5/1954)." }
    ]
  },
  {
    slug: "vn-1954-1975",
    title: "Lịch sử Việt Nam 1954–1975",
    period: "1954 - 1975",
    summary: "Kháng chiến chống Mỹ cứu nước, phong trào Đồng khởi, Điện Biên Phủ trên không và Chiến dịch Hồ Chí Minh toàn thắng.",
    accent: "#ba1a1a",
    grade: "Khối 12",
    difficulty: "Chiến thần",
    timeMinutes: 60,
    xpReward: 850,
    badgeName: "Dũng Sĩ Giải Phóng",
    thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuBTSCmDjS9A__WqksPXEm4MkDUOEGVhlOQHgfwehdd379EWu3QrTLOEfgK0oCv_1rHWsLPXfMQvM8GHl790hsVkdjTx87OsmjhqikFZFmi5Rj8qUwThzR0sXBSqSfkg2bN2K3THAVvsaI3vpI4ipXDxm6F7ZBbChkqfC6znJMJg5S9_HUtCFxdh6FJe5W5XX-6ReGd3mp21hupMMFE-YNnnQV2dZQSlyQKU_R8byXfThXaflkdyuv58",
    questions: [
      { prompt: "Phong trào 'Đồng khởi' (1959–1960) nổ ra mạnh mẽ nhất tại tỉnh nào?", options: ["Bến Tre", "Mỹ Tho", "Gia Định", "Quảng Ngãi"], answerIndex: 0, explanation: "Phong trào Đồng khởi bắt đầu từ 3 xã Định Thủy, Phước Hiệp, Bình Khánh thuộc huyện Mỏ Cày, tỉnh Bến Tre." },
      { prompt: "Trận 'Điện Biên Phủ trên không' cuối năm 1972 diễn ra chủ yếu ở bầu trời thành phố nào?", options: ["Hà Nội", "Hải Phòng", "Vinh", "Đà Nẵng"], answerIndex: 0, explanation: "Quân dân Hà Nội cùng Hải Phòng và một số tỉnh miền Bắc đã đánh bại cuộc tập kích chiến lược bằng B52 của đế quốc Mỹ." },
      { prompt: "Chiến dịch giải phóng Sài Gòn - Gia Định được Bộ Chính trị quyết định đổi tên thành Chiến dịch gì?", options: ["Chiến dịch Hồ Chí Minh", "Chiến dịch Tây Nguyên", "Chiến dịch Huế - Đà Nẵng", "Chiến dịch Đường 9"], answerIndex: 0, explanation: "Ngày 14/4/1975, Bộ Chính trị quyết định đổi tên chiến dịch giải phóng Sài Gòn thành Chiến dịch Hồ Chí Minh." }
    ]
  },
  {
    slug: "world-history-modern",
    title: "Lịch sử thế giới hiện đại",
    period: "Thế kỷ XX",
    summary: "Trật tự hai cực I-an-ta, Chiến tranh lạnh, phong trào giải phóng dân tộc Á - Phi - Mỹ Latinh và xu thế toàn cầu hóa.",
    accent: "#004a31",
    grade: "Khối 12 & 11",
    difficulty: "Thông hiểu",
    timeMinutes: 35,
    xpReward: 300,
    badgeName: "Huy hiệu Toàn Cầu",
    thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuBtFzopi4Ajwmt0Q_jErUiKP2NHBA7f8II-yhLSg15lgCMGpBZ-pS2HNOc3EVxac_cCecCzIZbw3_nZNIfj3f4dwP4x_9pe8v4P1yYwU881QHhb3p8fbH1G3ieY2hzwxe9EgQzhgqEDunyLzrfw6oh_Sntnn9-Od4_RxIPXgAfBBbZKuHEd3PiBkYSxEIBw_89FqxnFnErNzpUd7uZo8Q3r3zuNN0bRMZndw8_OUdQpgqbVYacZWz1y",
    questions: [
      { prompt: "Hội nghị I-an-ta (tháng 2/1945) diễn ra với sự tham gia của nguyên thủ 3 cường quốc nào?", options: ["Liên Xô, Mỹ, Anh", "Mỹ, Anh, Pháp", "Liên Xô, Trung Quốc, Mỹ", "Anh, Pháp, Đức"], answerIndex: 0, explanation: "Hội nghị Ianta diễn ra với sự tham gia của Xta-lin (Liên Xô), Rút-zơ-ven (Mỹ), và Sơ-chill (Anh)." },
      { prompt: "Tổ chức Liên Hợp Quốc (UN) chính thức thành lập vào năm nào?", options: ["1945", "1947", "1950", "1939"], answerIndex: 0, explanation: "Hiến chương Liên Hợp Quốc có hiệu lực từ ngày 24/10/1945." }
    ]
  },
  {
    slug: "patriotism-1900-1930",
    title: "Phong trào yêu nước 1900–1930",
    period: "1900 - 1930",
    summary: "Hoạt động cứu nước của Phan Bội Châu, Phan Châu Trinh và bước ngoặt Nguyễn Ái Quốc tìm ra chân lý giải phóng dân tộc.",
    accent: "#855300",
    grade: "Khối 11",
    difficulty: "Tiền đề",
    timeMinutes: 40,
    xpReward: 350,
    badgeName: "Kỷ niệm chương Tân Thư",
    thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuBXExO2u2P9yFTwYUCViRolmBeLPhH_RL6wJFt60glErTTSrHHkZqawA4UUX1Rls64-LPpFR-LLyY8HROlZSe3CR9QTqJgHpKedKJCF0bGs1sjNJBAkiPPku_qMfVHiCANW9cNwzurKHuewQMPRgGuxu1PlZpoWU3Hf1jI4hnMupvcHKRy9-pMmbumF77XVzrQ0uPysEGniAI_pTShmm_Wu0A60g5spe0yKFzS-dcy_pWS-pzpDociX",
    questions: [
      { prompt: "Phan Bội Châu là thủ lĩnh tiêu biểu của xu hướng cứu nước nào đầu thế kỷ XX?", options: ["Xu hướng bạo động", "Xu hướng cải cách", "Xu hướng ôn hòa", "Xu hướng lập hiến"], answerIndex: 0, explanation: "Phan Bội Châu chủ trương bạo động vũ trang và tổ chức phong trào Đông Du." },
      { prompt: "Nguyễn Ái Quốc ra đi tìm đường cứu nước vào ngày tháng năm nào?", options: ["5/6/1911", "3/2/1930", "19/5/1890", "2/9/1945"], answerIndex: 0, explanation: "Ngày 5/6/1911, từ bến cảng Nhà Rồng, Người bước lên tàu Amiral Latouche-Tréville ra đi tìm đường cứu nước." }
    ]
  },
  {
    slug: "feudal-dynasties",
    title: "Bắc thuộc & Các triều đại phong kiến",
    period: "Thế kỷ X - thế kỷ XV",
    summary: "Ngàn năm chống Bắc thuộc, chiến thắng Bạch Đằng 938, các triều đại Lý - Trần - Lê sơ với hào khí Đông A bất tử.",
    accent: "#00236f",
    grade: "Khối 10",
    difficulty: "Cội nguồn",
    timeMinutes: 50,
    xpReward: 700,
    badgeName: "Bảo kiếm Lam Sơn",
    thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuBbWLFgEpKVuDrjDqgyL26tnb7siTY0NKYyNb7L8JphYL_7oaKFwS-UTPMejO35CLrmok-eZy5aPoQ55laA_jra-niFeip1T0x9EsS6HOx6IOiykSx1Db0BmFZK9VdmyuDj_50_X-17Q2smY5ngs4UbxIC_FNraaEpngwyJL4dSr5cbPqmJocMZIyJ6-82nx0RWRHmj0xyv7ZGqJxyKSXc4_NtTkFGJUgC9nzP_6im8X5KGDey-Oun6",
    questions: [
      { prompt: "Chiến thắng Bạch Đằng năm 938 do ai chỉ huy đã chấm dứt hơn 1000 năm Bắc thuộc?", options: ["Ngô Quyền", "Lý Thường Kiệt", "Trần Hưng Đạo", "Lê Lợi"], answerIndex: 0, explanation: "Ngô Quyền dùng cọc gỗ bọc sắt cắm xuống lòng sông Bạch Đằng đánh tan quân Nam Hán." },
      { prompt: "Hào khí 'Đông A' là biểu tượng tinh thần chiến đấu quật cường của triều đại nào?", options: ["Nhà Trần", "Nhà Lý", "Nhà Lê sơ", "Nhà Nguyễn"], answerIndex: 0, explanation: "Chữ 'Đông' và chữ 'A' ghép lại thành chữ 'Trần', biểu thị tinh thần quyết chiến ba lần thắng quân Nguyên-Mông." }
    ]
  }
];

export async function seedDatabase() {
  await Topic.deleteMany({});
  await Question.deleteMany({});

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