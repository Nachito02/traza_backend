import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { esClaseMaquina } from "./maquinaria-clase.js";

describe("esClaseMaquina", () => {
  it("reconoce la nueva clase maquina", () => {
    assert.equal(esClaseMaquina("maquina"), true);
  });

  it("deja de aceptar el nombre anterior motriz", () => {
    assert.equal(esClaseMaquina("motriz"), false);
  });
});
