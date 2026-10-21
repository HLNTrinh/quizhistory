import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../Models/User.js";

const roles = ["student", "teacher", "parent"];

export function createToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, name: user.name },
    process.env.JWT_SECRET || "local-development-secret",
    { expiresIn: "7d" }
  );
}

export function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}

export async function register(request, response) {
  const { name, email, password, role } = request.body;
  if (typeof name !== "string" || name.trim().length < 2) {
    return response.status(400).json({ message: "Vui lòng nhập họ tên (ít nhất 2 ký tự)." });
  }
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return response.status(400).json({ message: "Địa chỉ email chưa hợp lệ." });
  }
  if (typeof password !== "string" || password.length < 8) {
    return response.status(400).json({ message: "Mật khẩu cần có ít nhất 8 ký tự." });
  }
  if (role && !roles.includes(role)) {
    return response.status(400).json({ message: "Vai trò tài khoản không hợp lệ." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail })) {
    return response.status(409).json({ message: "Email này đã được sử dụng." });
  }

  const user = await User.create({
    name: name.trim().slice(0, 80),
    email: normalizedEmail,
    passwordHash: await bcrypt.hash(password, 12),
    role: role || "student"
  });

  response.status(201).json({ token: createToken(user), user: publicUser(user) });
}

export async function login(request, response) {
  const { email, password, role } = request.body;
  if (typeof email !== "string" || typeof password !== "string") {
    return response.status(400).json({ message: "Vui lòng nhập email và mật khẩu." });
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+passwordHash");
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return response.status(401).json({ message: "Email hoặc mật khẩu chưa chính xác." });
  }
  if (role && user.role !== role) {
    return response.status(403).json({ message: "Tài khoản không thuộc nhóm đã chọn." });
  }

  response.json({ token: createToken(user), user: publicUser(user) });
}

export async function currentUser(request, response) {
  const user = await User.findById(request.user.sub);
  if (!user) return response.status(401).json({ message: "Tài khoản không còn tồn tại." });
  response.json({ user: publicUser(user) });
}