# Tareas

- [x] Agregar pruebas de eventos desde progresos completos.
  - Acceptance: filtra y deduplica por tipo, finca, cuartel y campaña.
  - Verify: test focalizado.
- [x] Agregar pruebas de inferencia de consultas.
  - Acceptance: reconoce tipos y códigos/nombres de contexto.
  - Verify: test focalizado.
- [x] Implementar lectura unificada en `/eventos`.
  - Acceptance: conserva eventos tipados e incorpora progresos completos.
  - Verify: build y tests.
- [x] Incorporar eventos a `/consultas`.
  - Acceptance: `resultados.eventos` contiene datos relevantes.
  - Verify: build y tests.
- [x] Corregir cierre con asignaciones canceladas.
  - Acceptance: completado+cancelado cierra; todas canceladas cancela.
  - Verify: test de estados.
- [x] Crear reparación histórica parametrizada.
  - Acceptance: modo dry-run por defecto y escritura solo con flag explícito.
  - Verify: validación sintáctica y revisión manual.
