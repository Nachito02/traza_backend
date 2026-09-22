export const CLASE_MAQUINA = "maquina" as const;

export function esClaseMaquina(value: unknown): value is typeof CLASE_MAQUINA {
  return value === CLASE_MAQUINA;
}
