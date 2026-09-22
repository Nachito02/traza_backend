type UsoMaquinariaInput = {
  costoMaquina: number;
  costoImplemento: number | null;
  horas: number;
  cantidad: number | null;
  consumoHora: number;
};

const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function calcularUsoMaquinaria(input: UsoMaquinariaInput) {
  const cantidad = input.cantidad && input.cantidad > 0 ? input.cantidad : 1;
  const costoHoraEfectivo = input.costoImplemento ?? input.costoMaquina;
  return {
    costoHoraEfectivo,
    costoTotal: money(costoHoraEfectivo * input.horas * cantidad),
    combustibleDerivado: input.consumoHora * input.horas * cantidad,
  };
}
