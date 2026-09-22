import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { parseInitialStock } from "./initial-stock.js";

describe("parseInitialStock", () => {
  it("omite el movimiento cuando no se informó stock inicial", () => {
    assert.equal(parseInitialStock(undefined), null);
    assert.equal(parseInitialStock(""), null);
    assert.equal(parseInitialStock(0), null);
  });

  it("normaliza una cantidad positiva a tres decimales", () => {
    assert.equal(parseInitialStock("12.3456"), 12.346);
  });

  it("rechaza cantidades negativas o inválidas", () => {
    assert.throws(() => parseInitialStock(-1), /mayor o igual a 0/);
    assert.throws(() => parseInitialStock("abc"), /mayor o igual a 0/);
  });
});
