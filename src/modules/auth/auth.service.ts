
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
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
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "15m" });
}

function getRefreshTtlDays() {
  const value = process.env.REFRESH_TOKEN_TTL_DAYS;
  const days = value ? Number(value) : 30;
  if (Number.isNaN(days) || days <= 0) {
    throw new AuthError("REFRESH_TOKEN_TTL_DAYS inválido", 500);
  }
  return days;
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function issueRefreshToken(userId: string) {
  const refreshToken = crypto.randomBytes(48).toString("base64url");
  const token_hash = hashToken(refreshToken);
  const expires_at = new Date(Date.now() + getRefreshTtlDays() * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      user_id: userId,
      token_hash,
      expires_at,
    },
  });

  return refreshToken;
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
  const refreshToken = await issueRefreshToken(user.user_id);
  return { token, refreshToken, user };
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

export async function refreshAccessToken(refreshToken: string) {
  if (!refreshToken) {
    throw new AuthError("Refresh token requerido", 400);
  }

  const token_hash = hashToken(refreshToken);
  const record = await prisma.refreshToken.findFirst({
    where: {
      token_hash,
      revoked_at: null,
      expires_at: { gt: new Date() },
    },
    include: { app_user: true },
  });

  if (!record) {
    throw new AuthError("Refresh token inválido", 401);
  }

  // Rotación: revoca el actual y emite uno nuevo
  await prisma.refreshToken.update({
    where: { token_id: record.token_id },
    data: { revoked_at: new Date() },
  });

  const newAccessToken = signToken({
    userId: record.app_user.user_id,
    email: record.app_user.email,
  });
  const newRefreshToken = await issueRefreshToken(record.app_user.user_id);

  return { token: newAccessToken, refreshToken: newRefreshToken };
}

export async function revokeRefreshToken(refreshToken: string) {
  if (!refreshToken) {
    throw new AuthError("Refresh token requerido", 400);
  }

  const token_hash = hashToken(refreshToken);
  const record = await prisma.refreshToken.findFirst({
    where: { token_hash, revoked_at: null },
  });

  if (!record) {
    return;
  }

  await prisma.refreshToken.update({
    where: { token_id: record.token_id },
    data: { revoked_at: new Date() },
  });
}
