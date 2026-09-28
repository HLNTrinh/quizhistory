import express from "express";
import { connectDatabase } from "./config/database.js";
import { seedDatabase } from "./app/Services/seedData.js";
import api from "./routes/api.js";
import auth from "./routes/auth.js";

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(express.json({ limit: "32kb" }));
app.get("/api/health", (_request, response) => response.json({ status: "ok" }));
app.use("/api/auth", auth);
app.use("/api", api);
app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ message: "Đã xảy ra lỗi máy chủ." });
});

await connectDatabase();
await seedDatabase();
app.listen(port, "0.0.0.0", () => console.log(`API listening on ${port}`));