const uuidSchema = { type: "string", format: "uuid" } as const;

const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Traza Backend API",
    version: "1.0.0",
    description: "HTTP API for Traza backend services.",
  },
  servers: [
    {
      url: "/api",
      description: "API base path",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string", example: "Datos inválidos" },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/auth/login": {
      post: {
        summary: "Login",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
              example: {
                email: "admin@traza.com",
                password: "123456",
              },
            },
          },
        },
        responses: {
          200: { description: "OK" },
          401: { description: "Credenciales inválidas" },
        },
      },
    },
    "/auth/register": {
      post: {
        summary: "Register user",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "nombre", "bodegaId"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                  nombre: { type: "string" },
                  bodegaId: uuidSchema,
                },
              },
              example: {
                email: "encargado@traza.com",
                password: "123456",
                nombre: "Encargado Bodega",
                bodegaId: "e5cafa84-bca6-417d-96b6-9f01995d2177",
              },
            },
          },
        },
        responses: { 201: { description: "Created" } },
      },
    },
    "/auth/refresh": {
      post: {
        summary: "Refresh token",
        security: [],
        responses: { 200: { description: "OK" } },
      },
    },
    "/auth/logout": {
      post: {
        summary: "Logout",
        responses: { 204: { description: "No content" } },
      },
    },
    "/auth/me": {
      get: {
        summary: "Current user",
        responses: { 200: { description: "OK" } },
      },
    },
    "/auth/me/bodegas": {
      get: {
        summary: "Current user bodegas",
        responses: { 200: { description: "OK" } },
      },
    },
    "/auth/users": {
      post: {
        summary: "Create user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "nombre", "bodegaId"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                  nombre: { type: "string" },
                  bodegaId: uuidSchema,
                },
              },
              example: {
                email: "tecnico@traza.com",
                password: "123456",
                nombre: "Tecnico Campo",
                bodegaId: "e5cafa84-bca6-417d-96b6-9f01995d2177",
              },
            },
          },
        },
        responses: { 201: { description: "Created" } },
      },
    },
    "/bodegas": {
      post: {
        summary: "Create bodega",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["nombre"],
                properties: {
                  nombre: { type: "string" },
                  razon_social: { type: "string" },
                  cuit: { type: "string" },
                  productorId: uuidSchema,
                  productorIds: {
                    type: "array",
                    items: uuidSchema,
                  },
                },
              },
              example: {
                nombre: "Bodega Los Andes",
                razon_social: "Los Andes SA",
                cuit: "30-12345678-9",
                productorId: "6aaf463f-45f0-4b80-8ed1-6f419dcf80d7",
                productorIds: [
                  "6aaf463f-45f0-4b80-8ed1-6f419dcf80d7",
                  "9a6f2f23-90b4-4b84-8ecb-29ca8f8c6dc3",
                ],
              },
            },
          },
        },
        responses: { 201: { description: "Created" } },
      },
    },
    "/bodegas/{bodegaId}/fincas": {
      get: {
        summary: "List fincas by bodega",
        parameters: [
          {
            name: "bodegaId",
            in: "path",
            required: true,
            schema: uuidSchema,
            example: "e5cafa84-bca6-417d-96b6-9f01995d2177",
          },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/bodegas/{bodegaId}/productores": {
      get: {
        summary: "List productores by bodega",
        parameters: [
          {
            name: "bodegaId",
            in: "path",
            required: true,
            schema: uuidSchema,
            example: "e5cafa84-bca6-417d-96b6-9f01995d2177",
          },
        ],
        responses: { 200: { description: "OK" } },
      },
      post: {
        summary: "Link productor to bodega",
        parameters: [
          {
            name: "bodegaId",
            in: "path",
            required: true,
            schema: uuidSchema,
            example: "e5cafa84-bca6-417d-96b6-9f01995d2177",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  productorId: uuidSchema,
                  razon_social: { type: "string" },
                  cuit: { type: "string" },
                  tipo_relacion: { type: "string", example: "proveedor_uva" },
                },
              },
              examples: {
                linkExisting: {
                  value: {
                    productorId: "6aaf463f-45f0-4b80-8ed1-6f419dcf80d7",
                    tipo_relacion: "proveedor_uva",
                  },
                },
                createAndLink: {
                  value: {
                    razon_social: "Productor Finca Sur",
                    cuit: "20-11223344-5",
                    tipo_relacion: "proveedor_uva",
                  },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Created" } },
      },
    },
    "/fincas": {
      post: {
        summary: "Create finca",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["bodegaId", "nombre_finca"],
                properties: {
                  bodegaId: uuidSchema,
                  nombre_finca: { type: "string" },
                  rut: { type: "string" },
                  renspa: { type: "string" },
                  catastro: { type: "string" },
                  ubicacion_texto: { type: "string" },
                },
              },
              example: {
                bodegaId: "e5cafa84-bca6-417d-96b6-9f01995d2177",
                nombre_finca: "Finca Norte",
                rut: "11.111.111",
                renspa: "12345678901",
                catastro: "CAT-2026-1",
                ubicacion_texto: "Tunuyan, Mendoza",
              },
            },
          },
        },
        responses: { 201: { description: "Created" } },
      },
    },
    "/fincas/bodega/{bodegaId}": {
      get: {
        summary: "List fincas by bodega",
        parameters: [
          {
            name: "bodegaId",
            in: "path",
            required: true,
            schema: uuidSchema,
            example: "e5cafa84-bca6-417d-96b6-9f01995d2177",
          },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/cuarteles": {
      post: {
        summary: "Create cuartel",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["fincaId", "codigo_cuartel"],
                properties: {
                  fincaId: uuidSchema,
                  codigo_cuartel: { type: "string" },
                  superficie_ha: { type: "number" },
                  cultivo: { type: "string" },
                  variedad: { type: "string" },
                  sistema_productivo: { type: "string" },
                  sistema_conduccion: { type: "string" },
                },
              },
              example: {
                fincaId: "efafdbf0-4902-4d52-853f-8415730c822d",
                codigo_cuartel: "C-01",
                superficie_ha: 12.5,
                cultivo: "Vid",
                variedad: "Malbec",
                sistema_productivo: "Convencional",
                sistema_conduccion: "Espaldera",
              },
            },
          },
        },
        responses: { 201: { description: "Created" } },
      },
    },
    "/cuarteles/finca/{fincaId}": {
      get: {
        summary: "List cuarteles by finca",
        parameters: [
          {
            name: "fincaId",
            in: "path",
            required: true,
            schema: uuidSchema,
            example: "efafdbf0-4902-4d52-853f-8415730c822d",
          },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/campanias": {
      get: {
        summary: "List campanias",
        parameters: [
          {
            name: "bodegaId",
            in: "query",
            required: false,
            schema: uuidSchema,
            example: "e5cafa84-bca6-417d-96b6-9f01995d2177",
          },
        ],
        responses: { 200: { description: "OK" } },
      },
      post: {
        summary: "Create campania",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["bodegaId", "nombre", "fecha_inicio", "fecha_fin"],
                properties: {
                  bodegaId: uuidSchema,
                  nombre: { type: "string" },
                  fecha_inicio: { type: "string", format: "date" },
                  fecha_fin: { type: "string", format: "date" },
                  estado: { type: "string" },
                },
              },
              example: {
                bodegaId: "e5cafa84-bca6-417d-96b6-9f01995d2177",
                nombre: "Campania 2025-2026",
                fecha_inicio: "2025-09-01",
                fecha_fin: "2026-04-30",
                estado: "abierta",
              },
            },
          },
        },
        responses: { 201: { description: "Created" } },
      },
    },
    "/protocolos": {
      get: {
        summary: "List protocolos",
        responses: { 200: { description: "OK" } },
      },
    },
    "/productores": {
      get: {
        summary: "List productores",
        parameters: [
          {
            name: "activo",
            in: "query",
            required: false,
            schema: { type: "boolean" },
            example: true,
          },
          {
            name: "search",
            in: "query",
            required: false,
            schema: { type: "string" },
            example: "andes",
          },
        ],
        responses: { 200: { description: "OK" } },
      },
      post: {
        summary: "Create productor",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["razon_social"],
                properties: {
                  razon_social: { type: "string" },
                  cuit: { type: "string" },
                  activo: { type: "boolean" },
                },
              },
              example: {
                razon_social: "Productor Finca Norte",
                cuit: "20-12345678-9",
                activo: true,
              },
            },
          },
        },
        responses: { 201: { description: "Created" } },
      },
    },
    "/productores/{productorId}": {
      get: {
        summary: "Get productor by id",
        parameters: [
          {
            name: "productorId",
            in: "path",
            required: true,
            schema: uuidSchema,
            example: "6aaf463f-45f0-4b80-8ed1-6f419dcf80d7",
          },
        ],
        responses: { 200: { description: "OK" } },
      },
      patch: {
        summary: "Update productor",
        parameters: [
          {
            name: "productorId",
            in: "path",
            required: true,
            schema: uuidSchema,
            example: "6aaf463f-45f0-4b80-8ed1-6f419dcf80d7",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  razon_social: { type: "string" },
                  cuit: { type: "string" },
                  activo: { type: "boolean" },
                },
              },
              example: {
                razon_social: "Productor Finca Norte SA",
                cuit: "20-12345678-9",
                activo: true,
              },
            },
          },
        },
        responses: { 200: { description: "OK" } },
      },
      delete: {
        summary: "Delete productor (baja lógica)",
        parameters: [
          {
            name: "productorId",
            in: "path",
            required: true,
            schema: uuidSchema,
            example: "6aaf463f-45f0-4b80-8ed1-6f419dcf80d7",
          },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/trazabilidades": {
      get: {
        summary: "List trazabilidades",
        parameters: [
          {
            name: "bodegaId",
            in: "query",
            required: false,
            schema: uuidSchema,
            example: "e5cafa84-bca6-417d-96b6-9f01995d2177",
          },
        ],
        responses: { 200: { description: "OK" } },
      },
      post: {
        summary: "Create trazabilidad",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["protocoloId", "bodegaId", "fincaId", "cuartelId", "campaniaId"],
                properties: {
                  protocoloId: uuidSchema,
                  bodegaId: uuidSchema,
                  fincaId: uuidSchema,
                  cuartelId: uuidSchema,
                  campaniaId: uuidSchema,
                  nombre_producto: { type: "string" },
                  imagen_producto: { type: "string" },
                },
              },
              example: {
                protocoloId: "7b0fc243-e95a-42bb-a16f-9de5f3dc9cb6",
                bodegaId: "e5cafa84-bca6-417d-96b6-9f01995d2177",
                fincaId: "efafdbf0-4902-4d52-853f-8415730c822d",
                cuartelId: "64de1c2f-4974-4b66-a876-fae29f48cb57",
                campaniaId: "315c3acf-70a8-4e2d-8781-aaec554fcd45",
                nombre_producto: "Malbec Reserva 2026",
                imagen_producto: "https://cdn.traza.com/productos/malbec-reserva.png",
              },
            },
          },
        },
        responses: { 201: { description: "Created" } },
      },
    },
    "/trazabilidades/{id}": {
      get: {
        summary: "Get trazabilidad",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: uuidSchema,
            example: "7f798f53-79f6-4689-98c3-0d6e9a3ce512",
          },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/trazabilidades/{id}/milestones": {
      get: {
        summary: "List milestones by trazabilidad",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: uuidSchema,
            example: "7f798f53-79f6-4689-98c3-0d6e9a3ce512",
          },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/eventos/{tipo}": {
      post: {
        summary: "Create evento",
        description:
          "El payload depende del tipo de evento. Todos requieren `milestoneId`.",
        parameters: [
          {
            name: "tipo",
            in: "path",
            required: true,
            schema: {
              type: "string",
              enum: [
                "riego",
                "cosecha",
                "fenologia",
                "fertilizacion",
                "labor_suelo",
                "canopia",
                "aplicacion_fitosanitaria",
                "monitoreo_enfermedad",
                "monitoreo_plaga",
                "analisis_suelo",
                "precipitacion",
                "energia",
                "accidente",
                "capacitacion",
                "entrega_epp",
                "limpieza_cosecha",
                "mantenimiento",
                "no_conforme",
                "reclamo",
                "residuo",
                "sanitizacion_banos",
                "sobrante_lavado",
              ],
            },
            example: "riego",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["milestoneId"],
                properties: {
                  milestoneId: uuidSchema,
                },
                additionalProperties: true,
              },
              examples: {
                riego: {
                  value: {
                    milestoneId: "01cdfd5f-0ca4-4a07-baa9-09c5d7e3d519",
                    fecha: "2026-01-10",
                    cuartelId: "64de1c2f-4974-4b66-a876-fae29f48cb57",
                    campaniaId: "315c3acf-70a8-4e2d-8781-aaec554fcd45",
                    volumen: 80,
                    unidad: "m3",
                    sistema_riego: "goteo",
                    responsable_persona_id: "23a9d95b-2421-42d0-aa87-4cb9e98fd281",
                  },
                },
                cosecha: {
                  value: {
                    milestoneId: "01cdfd5f-0ca4-4a07-baa9-09c5d7e3d519",
                    fecha_cosecha: "2026-03-20",
                    cuartelId: "64de1c2f-4974-4b66-a876-fae29f48cb57",
                    campaniaId: "315c3acf-70a8-4e2d-8781-aaec554fcd45",
                    cantidad: 12450,
                    unidad: "kg",
                    destino: "Bodega central",
                    responsable_persona_id: "23a9d95b-2421-42d0-aa87-4cb9e98fd281",
                  },
                },
                aplicacion_fitosanitaria: {
                  value: {
                    milestoneId: "01cdfd5f-0ca4-4a07-baa9-09c5d7e3d519",
                    fecha: "2026-01-25",
                    cuartelId: "64de1c2f-4974-4b66-a876-fae29f48cb57",
                    campaniaId: "315c3acf-70a8-4e2d-8781-aaec554fcd45",
                    insumo_lote_id: "e9d2411f-c5bb-47e9-9ea4-b8f06dc9e43f",
                    dosis: 2.5,
                    unidad: "L/ha",
                    carencia_dias: 14,
                    motivo: "Control preventivo",
                    responsable_persona_id: "23a9d95b-2421-42d0-aa87-4cb9e98fd281",
                  },
                },
                capacitacion: {
                  value: {
                    milestoneId: "01cdfd5f-0ca4-4a07-baa9-09c5d7e3d519",
                    fecha: "2026-01-05",
                    bodegaId: "e5cafa84-bca6-417d-96b6-9f01995d2177",
                    tema: "Uso de EPP en aplicaciones",
                  },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Created" } },
      },
    },
    "/milestones/me": {
      get: {
        summary: "List my milestones",
        responses: { 200: { description: "OK" } },
      },
    },
    "/milestones": {
      post: {
        summary: "Create milestone",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["trazabilidadId", "procesoId"],
                properties: {
                  trazabilidadId: uuidSchema,
                  procesoId: uuidSchema,
                },
              },
              example: {
                trazabilidadId: "7f798f53-79f6-4689-98c3-0d6e9a3ce512",
                procesoId: "56e55f88-1521-4488-bfc9-29e1785bb8ad",
              },
            },
          },
        },
        responses: { 201: { description: "Created" } },
      },
    },
    "/milestones/{id}": {
      patch: {
        summary: "Complete milestone",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: uuidSchema,
            example: "01cdfd5f-0ca4-4a07-baa9-09c5d7e3d519",
          },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/milestones/{id}/evidence": {
      post: {
        summary: "Upload milestone evidence",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: uuidSchema,
            example: "01cdfd5f-0ca4-4a07-baa9-09c5d7e3d519",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: { type: "string", format: "binary" },
                  tipo: {
                    type: "string",
                    enum: ["imagen", "pdf", "planilla", "otro"],
                    default: "imagen",
                  },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Created" } },
      },
    },
    "/cumplimiento/hallazgos": {
      get: {
        summary: "List hallazgos",
        parameters: [
          {
            name: "trazabilidadId",
            in: "query",
            required: false,
            schema: uuidSchema,
            example: "7f798f53-79f6-4689-98c3-0d6e9a3ce512",
          },
          {
            name: "severidad",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["bloqueo", "alerta", "info"] },
            example: "alerta",
          },
          {
            name: "estado",
            in: "query",
            required: false,
            schema: {
              type: "string",
              enum: ["abierto", "en_proceso", "resuelto", "aceptado", "anulado"],
            },
            example: "abierto",
          },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/cumplimiento/hallazgos/{id}/resolver": {
      post: {
        summary: "Resolver hallazgo",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: uuidSchema,
            example: "5f380c5f-8d2e-4df3-9ef0-f478c62fcbff",
          },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/cumplimiento/hallazgos/{id}/aceptar": {
      post: {
        summary: "Aceptar hallazgo",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: uuidSchema,
            example: "5f380c5f-8d2e-4df3-9ef0-f478c62fcbff",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["justificacionCategoria", "justificacionTexto"],
                properties: {
                  justificacionCategoria: { type: "string" },
                  justificacionTexto: { type: "string" },
                },
              },
              example: {
                justificacionCategoria: "riesgo_aceptado",
                justificacionTexto:
                  "No hay alternativa técnica en esta etapa; se compensa con control adicional.",
              },
            },
          },
        },
        responses: { 200: { description: "OK" } },
      },
    },
    "/cumplimiento/indicadores": {
      get: {
        summary: "Indicadores generales",
        parameters: [
          {
            name: "trazabilidadId",
            in: "query",
            required: false,
            schema: uuidSchema,
            example: "7f798f53-79f6-4689-98c3-0d6e9a3ce512",
          },
          {
            name: "campaniaId",
            in: "query",
            required: false,
            schema: uuidSchema,
            example: "315c3acf-70a8-4e2d-8781-aaec554fcd45",
          },
          {
            name: "cuartelId",
            in: "query",
            required: false,
            schema: uuidSchema,
            example: "64de1c2f-4974-4b66-a876-fae29f48cb57",
          },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/cumplimiento/indicadores/lote/{loteId}": {
      get: {
        summary: "Indicadores por lote",
        parameters: [
          {
            name: "loteId",
            in: "path",
            required: true,
            schema: uuidSchema,
            example: "8b890f88-f0f6-497d-8966-e750ac1f31ca",
          },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/cumplimiento/lotes/{loteId}/historia": {
      get: {
        summary: "Historia de lote",
        parameters: [
          {
            name: "loteId",
            in: "path",
            required: true,
            schema: uuidSchema,
            example: "8b890f88-f0f6-497d-8966-e750ac1f31ca",
          },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
  },
} as const;

export default openapiSpec;
