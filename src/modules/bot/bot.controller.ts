import type { Request, Response } from "express";
import { AuthError } from "../auth/auth.service.js";
import {
  botAyudarCarga,
  botContactarAsignacion,
  botLogin,
  BotError,
  createBotDelegation,
  createBotUser,
  listMyBotDelegations,
  revokeBotDelegation,
} from "./bot.service.js";

function handleError(res: Response, error: unknown) {
  if (error instanceof BotError) {
    return res.status(error.status).json({ error: error.message });
  }
  if (error instanceof AuthError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error("[bot]", error);
  return res.status(500).json({ error: "Error interno" });
}

export async function botRegisterHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const { email, password, nombre } = req.body ?? {};
    const user = await createBotUser(req.user.userId, { email, password, nombre });
    return res.status(201).json(user);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function botLoginHandler(req: Request, res: Response) {
  try {
    const { email, password } = req.body ?? {};
    const result = await botLogin(email, password);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createDelegationHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const { botUserId, bodegaId, scopes, expiresAt } = req.body ?? {};
    const row = await createBotDelegation(
      {
        botUserId,
        bodegaId,
        scopes: Array.isArray(scopes) ? scopes : [],
        expiresAt,
      },
      req.user.userId,
    );
    return res.status(201).json(row);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function myDelegationsHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const rows = await listMyBotDelegations(req.user.userId);
    return res.json(rows);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function revokeDelegationHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const botDelegationId = String(req.params.botDelegationId ?? "");
    const row = await revokeBotDelegation(botDelegationId, req.user.userId);
    return res.json(row);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function botContactarAsignacionHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const encargoAsignacionId = String(req.params.encargoAsignacionId ?? "");
    const message = typeof req.body?.message === "string" ? req.body.message : undefined;
    const row = await botContactarAsignacion(encargoAsignacionId, req.user.userId, message);
    return res.json(row);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function botAyudarCargaHandler(req: Request, res: Response) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    const encargoAsignacionId = String(req.params.encargoAsignacionId ?? "");
    const row = await botAyudarCarga(encargoAsignacionId, req.user.userId, req.body ?? {});
    return res.json(row);
  } catch (error) {
    return handleError(res, error);
  }
}
