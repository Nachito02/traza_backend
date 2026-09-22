function round3(value: number) {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

export function parseInitialStock(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const quantity = Number(value);
  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new Error("Stock inicial debe ser un número mayor o igual a 0");
  }
  return quantity === 0 ? null : round3(quantity);
}
