import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { calcularUsoMaquinaria } from "./maquinaria-cost.js";

describe("calcularUsoMaquinaria", () => {
  it("usa la tarifa de la máquina cuando no hay implemento", () => {
    assert.deepEqual(
      calcularUsoMaquinaria({ costoMaquina: 10, costoImplemento: null, horas: 3, cantidad: 1, consumoHora: 2 }),
      { costoHoraEfectivo: 10, costoTotal: 30, combustibleDerivado: 6 },
    );
  });

  it("reemplaza la tarifa de la máquina por la del implemento", () => {
    assert.deepEqual(
      calcularUsoMaquinaria({ costoMaquina: 10, costoImplemento: 12, horas: 3, cantidad: 1, consumoHora: 2 }),
      { costoHoraEfectivo: 12, costoTotal: 36, combustibleDerivado: 6 },
    );
  });

  it("multiplica costo y combustible derivado por cantidad", () => {
    assert.deepEqual(
      calcularUsoMaquinaria({ costoMaquina: 10, costoImplemento: 12, horas: 3, cantidad: 2, consumoHora: 2 }),
      { costoHoraEfectivo: 12, costoTotal: 72, combustibleDerivado: 12 },
    );
  });

  it("usa cantidad uno cuando no fue informada", () => {
    assert.equal(
      calcularUsoMaquinaria({ costoMaquina: 10, costoImplemento: null, horas: 3, cantidad: null, consumoHora: 0 }).costoTotal,
      30,
    );
  });
});
