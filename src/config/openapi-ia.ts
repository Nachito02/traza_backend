const uuidParam = (name: string) => ({
  name,
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
});

const openapiIaSpec = {
  openapi: "3.0.3",
  info: {
    title: "Traza IA API",
    version: "1.1.0",
    description:
      "Superficie de integración para bots y agentes sobre Traza.",
  },
  servers: [
    {
      url: "/api/ia",
      description: "API IA base path",
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
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/auth/register": {
      post: {
        summary: "Crear usuario bot (requiere admin_sistema)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "nombre"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                  nombre: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Bot creado" } },
      },
    },
    "/auth/login": {
      post: {
        summary: "Login del bot — devuelve token en body",
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
            },
          },
        },
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    access_token: { type: "string" },
                    refresh_token: { type: "string" },
                    user: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        email: { type: "string" },
                        nombre: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/me": {
      get: {
        summary: "Identidad y delegaciones activas del bot",
        responses: { 200: { description: "OK" } },
      },
    },
    "/catalogos/bodegas": {
      get: {
        summary: "Bodegas visibles para el bot por delegación",
        responses: { 200: { description: "OK" } },
      },
    },
    "/catalogos/fincas": {
      get: {
        summary: "Fincas visibles por delegación",
        parameters: [
          {
            name: "bodegaId",
            in: "query",
            required: false,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/catalogos/cuarteles": {
      get: {
        summary: "Cuarteles visibles por delegación",
        parameters: [
          {
            name: "bodegaId",
            in: "query",
            required: false,
            schema: { type: "string", format: "uuid" },
          },
          {
            name: "fincaId",
            in: "query",
            required: false,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/catalogos/campanias": {
      get: {
        summary: "Campañas visibles por delegación",
        parameters: [
          {
            name: "bodegaId",
            in: "query",
            required: false,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/catalogos/personas": {
      get: {
        summary: "Personas visibles por delegación",
        parameters: [
          {
            name: "bodegaId",
            in: "query",
            required: false,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/catalogos/protocolos": {
      get: {
        summary: "Protocolos activos",
        responses: { 200: { description: "OK" } },
      },
    },
    "/catalogos/protocolos/{protocoloId}/procesos": {
      get: {
        summary: "Etapas y procesos de un protocolo",
        parameters: [uuidParam("protocoloId")],
        responses: { 200: { description: "OK" } },
      },
    },
    "/catalogos/insumos": {
      get: {
        summary: "Catálogo de insumos con lotes habilitados",
        parameters: [
          {
            name: "tipo",
            in: "query",
            required: false,
            schema: { type: "string" },
          },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/catalogos/eventos": {
      get: {
        summary: "Lista de tipos de evento disponibles para registrar",
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                example: ["riego", "cosecha", "fenologia", "fertilizacion", "aplicacion_fitosanitaria"],
              },
            },
          },
        },
      },
    },
    "/catalogos/eventos/{tipo}/schema": {
      get: {
        summary: "Schema de campos requeridos/opcionales para un tipo de evento",
        parameters: [
          {
            name: "tipo",
            in: "path",
            required: true,
            schema: { type: "string" },
            example: "riego",
          },
        ],
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                example: {
                  tipo: "riego",
                  schema: {
                    fecha: { type: "date", required: true },
                    volumen: { type: "number", required: true, unit: "m3" },
                    unidad: { type: "string", required: true, enum: ["m3", "litros", "mm"] },
                    sistema_riego: { type: "string", required: false, enum: ["goteo", "aspersion", "manto", "surco", "otro"] },
                    responsable_persona_id: { type: "string", required: false, description: "UUID de la persona responsable" },
                  },
                },
              },
            },
          },
          404: { description: "Tipo de evento desconocido" },
        },
      },
    },
    "/trabajos": {
      get: {
        summary: "Lista de trabajos visibles para el bot",
        parameters: [
          {
            name: "estado",
            in: "query",
            required: false,
            schema: { type: "string" },
          },
          {
            name: "bodegaId",
            in: "query",
            required: false,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/trabajos/{encargoAsignacionId}": {
      get: {
        summary: "Detalle resumido de un trabajo",
        parameters: [uuidParam("encargoAsignacionId")],
        responses: { 200: { description: "OK" } },
      },
    },
    "/trabajos/{encargoAsignacionId}/contexto": {
      get: {
        summary: "Contexto expandido para resolución del trabajo",
        parameters: [uuidParam("encargoAsignacionId")],
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    trabajo: { type: "object", description: "Resumen del trabajo" },
                    eventoTipo: { type: "string", nullable: true, description: "Tipo de evento inferido del título/descripción del encargo (o del milestone si existe)" },
                    inputSchema: { type: "object", nullable: true, description: "Schema de campos requeridos/opcionales para registrar el evento inferido. Null si no se pudo inferir el tipo." },
                    milestone: { type: "object", nullable: true },
                    trazabilidad: { type: "object", nullable: true },
                    hallazgosAbiertos: { type: "array" },
                    historialBot: { type: "array" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/trabajos/{encargoAsignacionId}/contactar": {
      post: {
        summary: "Registrar contacto del bot con el operario",
        parameters: [uuidParam("encargoAsignacionId")],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string" },
                },
              },
              example: {
                message: "Hola, necesito ayudarte a completar la carga del encargo.",
              },
            },
          },
        },
        responses: { 200: { description: "OK" } },
      },
    },
    "/trabajos/{encargoAsignacionId}/save-progress": {
      post: {
        summary: "Guardar progreso intermedio y validar contra el schema del evento",
        parameters: [uuidParam("encargoAsignacionId")],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                additionalProperties: true,
              },
              example: {
                draft: {
                  tipo: "riego",
                  fecha: "2026-03-09",
                  volumen: 12.5,
                  unidad: "m3",
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    botActionLog: { type: "object", description: "Registro de acción persistido" },
                    eventoTipo: { type: "string", nullable: true },
                    inputSchema: { type: "object", nullable: true },
                    validation: {
                      type: "object",
                      nullable: true,
                      properties: {
                        missingRequired: { type: "array", items: { type: "string" } },
                        invalidFields: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              field: { type: "string" },
                              reason: { type: "string" },
                              expectedType: { type: "string" },
                              enum: { type: "array", items: { type: "string" } },
                            },
                          },
                        },
                        requiredPresent: { type: "integer" },
                        requiredTotal: { type: "integer" },
                        canClose: { type: "boolean" },
                      },
                    },
                    nextAction: {
                      type: "string",
                      enum: [
                        "ask_missing_or_fix_invalid",
                        "ready_to_submit_result",
                        "schema_not_available",
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/trabajos/{encargoAsignacionId}/resultado": {
      post: {
        summary: "Cerrar o actualizar estado del trabajo del bot",
        parameters: [uuidParam("encargoAsignacionId")],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["estado"],
                properties: {
                  estado: {
                    type: "string",
                    enum: ["pendiente", "en_progreso", "completado", "cancelado"],
                  },
                  observaciones: { type: "string" },
                  outputPayload: {
                    type: "object",
                    additionalProperties: true,
                  },
                },
              },
              example: {
                estado: "completado",
                observaciones: "Datos capturados con confirmación del operario.",
                outputPayload: {
                  confidence: 0.93,
                  source: "whatsapp",
                },
              },
            },
          },
        },
        responses: { 200: { description: "OK" } },
      },
    },
    "/trazabilidades": {
      get: {
        summary: "Trazabilidades visibles por delegación",
        parameters: [
          { name: "bodegaId", in: "query", required: false, schema: { type: "string", format: "uuid" } },
          { name: "campaniaId", in: "query", required: false, schema: { type: "string", format: "uuid" } },
          { name: "fincaId", in: "query", required: false, schema: { type: "string", format: "uuid" } },
          { name: "cuartelId", in: "query", required: false, schema: { type: "string", format: "uuid" } },
          { name: "estado", in: "query", required: false, schema: { type: "string" } },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/trazabilidades/{trazabilidadId}": {
      get: {
        summary: "Detalle de una trazabilidad visible",
        parameters: [uuidParam("trazabilidadId")],
        responses: { 200: { description: "OK" } },
      },
    },
    "/trazabilidades/{trazabilidadId}/contexto": {
      get: {
        summary: "Contexto expandido de una trazabilidad",
        parameters: [uuidParam("trazabilidadId")],
        responses: { 200: { description: "OK" } },
      },
    },
    "/hallazgos": {
      get: {
        summary: "Hallazgos visibles por delegación",
        parameters: [
          { name: "trazabilidadId", in: "query", required: false, schema: { type: "string", format: "uuid" } },
          { name: "estado", in: "query", required: false, schema: { type: "string" } },
          { name: "severidad", in: "query", required: false, schema: { type: "string" } },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/hallazgos/{hallazgoId}": {
      get: {
        summary: "Detalle de un hallazgo",
        parameters: [uuidParam("hallazgoId")],
        responses: { 200: { description: "OK" } },
      },
    },
    "/eventos": {
      get: {
        summary: "Lectura de eventos para responder preguntas del bot",
        parameters: [
          { name: "tipo", in: "query", required: false, schema: { type: "string" } },
          { name: "trazabilidadId", in: "query", required: false, schema: { type: "string", format: "uuid" } },
          { name: "bodegaId", in: "query", required: false, schema: { type: "string", format: "uuid" } },
          { name: "campaniaId", in: "query", required: false, schema: { type: "string", format: "uuid" } },
          { name: "fincaId", in: "query", required: false, schema: { type: "string", format: "uuid" } },
          { name: "cuartelId", in: "query", required: false, schema: { type: "string", format: "uuid" } },
          { name: "limit", in: "query", required: false, schema: { type: "integer", minimum: 1, maximum: 200 } },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/usuarios/{userId}": {
      get: {
        summary: "Datos de un usuario por ID (incluye whatsapp)",
        parameters: [uuidParam("userId")],
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                example: {
                  user_id: "25f158ae-...",
                  nombre: "Juan Pérez",
                  email: "juan@bodega.com",
                  whatsapp_e164: "+5491112345678",
                  is_active: true,
                },
              },
            },
          },
          404: { description: "Usuario no encontrado o sin acceso" },
        },
      },
    },
    "/consultas": {
      post: {
        summary: "Búsqueda transversal para responder preguntas del bot",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["pregunta"],
                properties: {
                  pregunta: { type: "string" },
                  bodegaId: { type: "string", format: "uuid" },
                  trazabilidadId: { type: "string", format: "uuid" },
                  limit: { type: "integer", minimum: 1, maximum: 200 },
                },
              },
              example: {
                pregunta: "malbec reserva",
                bodegaId: "837bc9e4-8abe-4999-aaa2-15963e42f078",
                limit: 20,
              },
            },
          },
        },
        responses: { 200: { description: "OK" } },
      },
    },
  },
};

export default openapiIaSpec;
