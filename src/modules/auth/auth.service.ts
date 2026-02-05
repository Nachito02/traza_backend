
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/prismaClient.js";

type LoginInput = {
  email: string;
  password: string;
};

type CreateUserInput = {
  email: string;
  password: string;
  nombre: string;
  bodegaId: string;
};

type JwtPayload = {
  userId: string;
  email: string | null;
};

export class AuthError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AuthError("JWT_SECRET no configurado", 500);
  }
  return secret;
}

function signToken(payload: JwtPayload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export async function login({ email, password }: LoginInput) {
  if (!email || !password) {
    throw new AuthError("Email y password son requeridos", 400);
  }

  const user = await prisma.appUser.findUnique({ where: { email } });
  if (!user || !user.password_hash) {
    throw new AuthError("Credenciales inválidas", 401);
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    throw new AuthError("Credenciales inválidas", 401);
  }

  const token = signToken({ userId: user.user_id, email: user.email });
  return { token, user };
}

export async function getUserById(userId: string) {
  const user = await prisma.appUser.findUnique({
    where: { user_id: userId },
  });
  if (!user) {
    throw new AuthError("Usuario no encontrado", 404);
  }
  return user;
}

export async function createUser({
  email,
  password,
  nombre,
  bodegaId,
}: CreateUserInput) {
  if (!email || !password || !nombre || !bodegaId) {
    throw new AuthError("Datos incompletos", 400);
  }

  const existing = await prisma.appUser.findUnique({ where: { email } });
  if (existing) {
    throw new AuthError("El usuario ya existe", 409);
  }

  const bodega = await prisma.bodega.findUnique({
    where: { bodega_id: bodegaId },
  });
  if (!bodega) {
    throw new AuthError("Bodega no encontrada", 404);
  }

  const password_hash = await bcrypt.hash(password, 10);
  const user = await prisma.appUser.create({
    data: {
      email,
      password_hash,
      nombre,
      bodega: { connect: { bodega_id: bodegaId } },
    },
  });

  return user;
}
