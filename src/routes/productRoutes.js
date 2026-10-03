const express = require("express");
const Product = require("../models/Product");

const router = express.Router();

// Chỉ nhận 4 trường Product và kiểm tra kiểu dữ liệu đầu vào.
function validateProduct(req, res, next) {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({
      message: "Body phải là một đối tượng JSON"
    });
  }

  const { pid, pname, price, quantity } = body;

  if (
    typeof pid !== "string" ||
    !pid.trim() ||
    typeof pname !== "string" ||
    !pname.trim() ||
    typeof price !== "number" ||
    !Number.isFinite(price) ||
    price < 0 ||
    !Number.isInteger(quantity) ||
    quantity < 0
  ) {
    return res.status(400).json({
      message:
        "pid, pname phải là chuỗi không rỗng; price ≥ 0; quantity là số nguyên ≥ 0"
    });
  }

  req.productData = {
    pid: pid.trim(),
    pname: pname.trim(),
    price,
    quantity
  };

  next();
}

// CREATE: thêm sản phẩm.
router.post("/", validateProduct, async (req, res) => {
  const product = await Product.create(req.productData);
  res.status(201).json(product);
});

// READ: xem tất cả sản phẩm.
router.get("/", async (req, res) => {
  const products = await Product.find().sort({ pid: 1 });
  res.json(products);
});

// READ: xem một sản phẩm theo pid.
router.get("/:pid", async (req, res) => {
  const product = await Product.findOne({ pid: req.params.pid });

  if (!product) {
    return res.status(404).json({
      message: "Không tìm thấy sản phẩm"
    });
  }

  res.json(product);
});

// UPDATE: thay đầy đủ 4 trường của sản phẩm.
router.put("/:pid", validateProduct, async (req, res) => {
  const product = await Product.findOneAndUpdate(
    { pid: req.params.pid },
    { $set: req.productData },
    { new: true, runValidators: true }
  );

  if (!product) {
    return res.status(404).json({
      message: "Không tìm thấy sản phẩm"
    });
  }

  res.json(product);
});

// DELETE: xóa sản phẩm theo pid.
router.delete("/:pid", async (req, res) => {
  const product = await Product.findOneAndDelete({
    pid: req.params.pid
  });

  if (!product) {
    return res.status(404).json({
      message: "Không tìm thấy sản phẩm"
    });
  }

  res.json({
    message: "Đã xóa sản phẩm",
    pid: product.pid
  });
});

module.exports = router;