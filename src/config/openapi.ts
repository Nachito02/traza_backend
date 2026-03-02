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
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/auth/login": {
      post: {
        summary: "Login",
        security: [],
        responses: { 200: { description: "OK" } },
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
                required: ["email", "password", "nombre"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                  nombre: { type: "string" },
                  bodegaId: {
                    type: "string",
                    description:
                      "UUID de bodega. Alternativa a bodegaNombre.",
                  },
                  bodegaNombre: {
                    type: "string",
                    description:
                      "Nombre de bodega. Alternativa a bodegaId.",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Created" },
          400: { description: "Bad request" },
          404: { description: "Bodega no encontrada" },
          409: { description: "Conflicto (usuario existente o bodega ambigua)" },
        },
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
        responses: { 200: { description: "OK" } },
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
    "/auth/me/roles": {
      get: {
        summary: "Current user roles",
        responses: { 200: { description: "OK" } },
      },
    },
    "/auth/users": {
      post: {
        summary: "Create user",
        responses: { 200: { description: "OK" } },
      },
    },
    "/bodegas": {
      post: {
        summary: "Create bodega",
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
            schema: { type: "string" },
          },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/fincas": {
      post: {
        summary: "Create finca",
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
            schema: { type: "string" },
          },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/cuarteles": {
      post: {
        summary: "Create cuartel",
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
            schema: { type: "string" },
          },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/campanias": {
      get: {
        summary: "List campanias",
        responses: { 200: { description: "OK" } },
      },
      post: {
        summary: "Create campania",
        responses: { 201: { description: "Created" } },
      },
    },
    "/protocolos": {
      get: {
        summary: "List protocolos",
        responses: { 200: { description: "OK" } },
      },
    },
    "/trazabilidades": {
      get: {
        summary: "List trazabilidades",
        responses: { 200: { description: "OK" } },
      },
      post: {
        summary: "Create trazabilidad",
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
            schema: { type: "string" },
          },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/eventos/{tipo}": {
      post: {
        summary: "Create evento",
        parameters: [
          {
            name: "tipo",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
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
            schema: { type: "string" },
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
            schema: { type: "string" },
          },
        ],
        responses: { 201: { description: "Created" } },
      },
    },
    "/encargos/me/can-manage": {
      get: {
        summary: "Can current user manage encargos",
        responses: { 200: { description: "OK" } },
      },
    },
    "/encargos/me/asignaciones": {
      get: {
        summary: "List my encargo assignments",
        responses: { 200: { description: "OK" } },
      },
    },
    "/encargos/me/asignaciones/{encargoAsignacionId}/estado": {
      patch: {
        summary: "Update my encargo assignment status",
        parameters: [
          {
            name: "encargoAsignacionId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/encargos": {
      get: {
        summary: "List encargos",
        responses: { 200: { description: "OK" } },
      },
      post: {
        summary: "Create encargo",
        responses: { 201: { description: "Created" } },
      },
    },
    "/encargos/{encargoId}/asignaciones": {
      post: {
        summary: "Add assignees to encargo",
        parameters: [
          {
            name: "encargoId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/bot/delegaciones": {
      post: {
        summary: "Create bot delegation",
        responses: { 201: { description: "Created" } },
      },
    },
    "/bot/delegaciones/me": {
      get: {
        summary: "List my bot delegations",
        responses: { 200: { description: "OK" } },
      },
    },
    "/bot/delegaciones/{botDelegationId}": {
      delete: {
        summary: "Revoke bot delegation",
        parameters: [
          {
            name: "botDelegationId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/bot/asignaciones/{encargoAsignacionId}/contactar": {
      post: {
        summary: "Bot contacts assignee",
        parameters: [
          {
            name: "encargoAsignacionId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/bot/asignaciones/{encargoAsignacionId}/ayudar-carga": {
      post: {
        summary: "Bot helps with data load",
        parameters: [
          {
            name: "encargoAsignacionId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/cumplimiento/hallazgos": {
      get: {
        summary: "List hallazgos",
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
            schema: { type: "string" },
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
            schema: { type: "string" },
          },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/cumplimiento/indicadores": {
      get: {
        summary: "Indicadores generales",
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
            schema: { type: "string" },
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
            schema: { type: "string" },
          },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
  },
} as const;

export default openapiSpec;
