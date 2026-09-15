import assert from "node:assert/strict";
import { test } from "vitest";
import { normalizeManejoCultivo, normalizeSistemaConduccion, normalizeSistemaRiego, normalizeVariedad, isValidCustomDescription, isValidManejoCultivo, isValidSistemaConduccion, isValidSistemaRiego, isValidVariedad, getTipoVariedadForVariedad } from "./cuartel.catalog.js";

test("conserva códigos conocidos y alias", () => {
  assert.equal(normalizeManejoCultivo("Orgánico"), "organico_ecologico");
  assert.equal(normalizeSistemaConduccion("Gobelet"), "vaso");
  assert.equal(normalizeSistemaRiego("Micro aspersión"), "microaspersion");
  assert.equal(normalizeVariedad("Malbec"), "malbec");
  assert.equal(getTipoVariedadForVariedad("malbec"), "tinta");
});

test("preserva textos personalizados y acentos", () => {
  for (const [normalize, validate] of [
    [normalizeManejoCultivo, isValidManejoCultivo],
    [normalizeSistemaConduccion, isValidSistemaConduccion],
    [normalizeSistemaRiego, isValidSistemaRiego],
  ] as const) {
    assert.equal(normalize("  Técnica específica  "), "Técnica específica");
    assert.equal(validate(normalize("Técnica específica")), true);
    for (const bad of ["   ", "__custom__", "otro", "x".repeat(201)]) assert.equal(validate(normalize(bad)), false);
    assert.equal(validate(null), true);
  }
  assert.equal(normalizeVariedad("  Petit Verdot experimental  "), "Petit Verdot experimental");
  assert.equal(isValidCustomDescription(normalizeVariedad("Petit Verdot experimental")), true);
  assert.equal(isValidVariedad("Petit Verdot experimental"), false);
  assert.equal(isValidCustomDescription("x".repeat(200)), true);
  assert.equal(isValidCustomDescription("x".repeat(201)), false);
});
