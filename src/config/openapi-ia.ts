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
      "Superficie de integración para bots y agentes sobre Traza. Separa trabajo operativo, catálogos y consulta transversal.",
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
        responses: { 200: { description: "OK" } },
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
    "/trabajos/{encargoAsignacionId}/ayudar-carga": {
      post: {
        summary: "Registrar ayuda de carga o avance del bot",
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
                  tipo: "evento_riego",
                  fecha: "2026-03-09",
                  volumen: 12.5,
                  unidad: "m3",
                },
              },
            },
          },
        },
        responses: { 200: { description: "OK" } },
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
