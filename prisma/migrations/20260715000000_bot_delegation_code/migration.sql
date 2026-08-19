-- Códigos de vinculación de delegación, persistidos (antes en memoria).
CREATE TABLE "bot_delegation_code" (
  "code"                  TEXT PRIMARY KEY,
  "bot_user_id"           UUID NOT NULL,
  "on_behalf_user_id"     UUID NOT NULL,
  "bodega_id"             UUID,
  "scopes"                TEXT[] NOT NULL,
  "delegation_expires_at" TIMESTAMPTZ(6),
  "code_expires_at"       TIMESTAMPTZ(6) NOT NULL,
  "created_at"            TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX "idx_bot_delegation_code_expires" ON "bot_delegation_code" ("code_expires_at");
