import express from "express";
import { connectDatabase } from "./config/database.js";
import { ensureCollections } from "./config/collections.js";
import { seedDatabase } from "./app/Services/seedData.js";
import { dropTopicModel } from "./database/migrations/002-drop-topic-model.js";
import api from "./routes/api.js";
import admin from "./routes/admin.js";
import auth from "./routes/auth.js";

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(express.json({ limit: "32kb" }));
app.get("/api/health", (_request, response) => response.json({ status: "ok" }));
app.use("/api/auth", auth);
app.use("/api/admin", admin);
app.use("/api", api);
app.use((error, _request, response, _next) => {
  const status = Number(error.status || error.statusCode) || 500;
  if (status >= 500) console.error(error);
  response.status(status).json({
    message: status >= 500 ? "Đã xảy ra lỗi máy chủ." : "Dữ liệu gửi lên chưa hợp lệ."
  });
});

await connectDatabase();
await ensureCollections();
await seedDatabase();
console.log("Drop legacy topic model:", await dropTopicModel());
app.listen(port, "0.0.0.0", () => console.log(`API listening on ${port}`));