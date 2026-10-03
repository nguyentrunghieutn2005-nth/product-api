require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const Product = require("./models/Product");
const productRoutes = require("./routes/productRoutes");

const app = express();
app.get("/health", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        status: "unhealthy",
        mongodb: "disconnected"
      });
    }

    await mongoose.connection.db.admin().command({ ping: 1 });

    return res.status(200).json({
      status: "healthy",
      mongodb: "connected"
    });
  } catch {
    return res.status(503).json({
      status: "unhealthy",
      mongodb: "unavailable"
    });
  }
});
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Product API đang hoạt động" });
});

app.use("/api/products", productRoutes);

// URL không tồn tại.
app.use((req, res) => {
  res.status(404).json({ message: "Không tìm thấy đường dẫn API" });
});

// Xử lý lỗi tập trung.
app.use((err, req, res, next) => {
  if (err.code === 11000) {
    return res.status(409).json({
      message: "pid đã tồn tại"
    });
  }

  if (
    err.name === "ValidationError" ||
    err.name === "CastError" ||
    err.type === "entity.parse.failed"
  ) {
    return res.status(400).json({
      message: "Dữ liệu không hợp lệ",
      detail: err.message
    });
  }

  console.error(err);

  res.status(500).json({
    message: "Lỗi xử lý trên máy chủ"
  });
});

async function start() {
  if (!process.env.MONGO_URI || !process.env.PORT) {
    throw new Error("Thiếu MONGO_URI hoặc PORT trong cấu hình");
  }

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000
  });

  // Chờ tạo index unique cho pid trước khi nhận yêu cầu.
  await Product.init();

  console.log("Đã kết nối MongoDB");

  const server = app.listen(process.env.PORT, "0.0.0.0", () => {
    console.log(`API chạy tại http://localhost:${process.env.PORT}`);
  });

  server.on("error", (err) => {
    console.error("Không thể mở cổng API:", err.message);
    process.exit(1);
  });
}

start().catch((err) => {
  console.error("Không thể khởi động API:", err.message);
  process.exit(1);
});