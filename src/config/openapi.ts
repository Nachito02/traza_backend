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
                  rolEnBodega: {
                    type: "string",
                    enum: [
                      "admin_bodega",
                      "encargado_bodega",
                      "productor",
                      "responsable_calidad_inocuidad",
                      "responsable_ssyo",
                      "enologo",
                    ],
                    description: "Rol del usuario dentro de la bodega",
                  },
                  rolesEnBodega: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: [
                        "admin_bodega",
                        "encargado_bodega",
                        "productor",
                        "responsable_calidad_inocuidad",
                        "responsable_ssyo",
                        "enologo",
                      ],
                    },
                    description: "Roles del usuario dentro de la bodega (recomendado)",
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
      get: {
        summary: "List users (admin_sistema: todos, admin_bodega/encargado_bodega: sus bodegas)",
        parameters: [
          {
            name: "name",
            in: "query",
            required: false,
            schema: { type: "string" },
          },
        ],
        responses: { 200: { description: "OK" } },
      },
      post: {
        summary: "Create user",
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
                  bodegaId: { type: "string" },
                  bodegaNombre: { type: "string" },
                  rolEnBodega: {
                    type: "string",
                    enum: [
                      "admin_bodega",
                      "encargado_bodega",
                      "productor",
                      "responsable_calidad_inocuidad",
                      "responsable_ssyo",
                      "enologo",
                    ],
                  },
                  rolesEnBodega: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: [
                        "admin_bodega",
                        "encargado_bodega",
                        "productor",
                        "responsable_calidad_inocuidad",
                        "responsable_ssyo",
                        "enologo",
                      ],
                    },
                  },
                },
              },
            },
          },
        },
        responses: { 200: { description: "OK" } },
      },
    },
    "/auth/users/{userId}": {
      get: {
        summary: "Get user detail (scoped by permissions)",
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { 200: { description: "OK" } },
      },
      patch: {
        summary: "Update user basic data",
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  nombre: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                  is_active: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "OK" } },
      },
      delete: {
        summary: "Soft delete user (set is_active=false)",
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/auth/users/{userId}/bodegas/{name}/role": {
      patch: {
        summary: "Assign or replace user roles in bodega by bodega name",
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "name",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  rolEnBodega: {
                    type: "string",
                    enum: [
                      "admin_bodega",
                      "encargado_bodega",
                      "productor",
                      "responsable_calidad_inocuidad",
                      "responsable_ssyo",
                      "enologo",
                    ],
                  },
                  rolesEnBodega: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: [
                        "admin_bodega",
                        "encargado_bodega",
                        "productor",
                        "responsable_calidad_inocuidad",
                        "responsable_ssyo",
                        "enologo",
                      ],
                    },
                    description: "Lista completa de roles locales a dejar asignados",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "OK" },
          403: { description: "Forbidden" },
          404: { description: "Not found" },
          409: { description: "Conflict" },
        },
      },
    },
    "/auth/users/{userId}/bodegas/id/{bodegaId}/role": {
      patch: {
        summary: "Assign or replace user roles in bodega by bodega id",
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "bodegaId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  rolEnBodega: {
                    type: "string",
                    enum: [
                      "admin_bodega",
                      "encargado_bodega",
                      "productor",
                      "responsable_calidad_inocuidad",
                      "responsable_ssyo",
                      "enologo",
                    ],
                  },
                  rolesEnBodega: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: [
                        "admin_bodega",
                        "encargado_bodega",
                        "productor",
                        "responsable_calidad_inocuidad",
                        "responsable_ssyo",
                        "enologo",
                      ],
                    },
                    description: "Lista completa de roles locales a dejar asignados",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "OK" },
          403: { description: "Forbidden" },
          404: { description: "Not found" },
          409: { description: "Conflict" },
        },
      },
    },
    "/auth/users/{userId}/fincas/{fincaId}/roles": {
      patch: {
        summary: "Assign or replace user roles in finca by finca id",
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "fincaId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  rolEnFinca: {
                    type: "string",
                    enum: ["encargado_finca", "operador_campo"],
                  },
                  rolesEnFinca: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: ["encargado_finca", "operador_campo"],
                    },
                    description: "Lista completa de roles por finca a dejar asignados",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "OK" },
          403: { description: "Forbidden" },
          404: { description: "Not found" },
        },
      },
    },
    "/auth/users/{userId}/global-role": {
      patch: {
        summary: "Assign or remove global role (solo admin_sistema)",
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["rolGlobal"],
                properties: {
                  rolGlobal: { type: "string", example: "auditor" },
                  enabled: {
                    type: "boolean",
                    description: "true para asignar, false para remover",
                    default: true,
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "OK" },
          403: { description: "Forbidden" },
          404: { description: "Not found" },
        },
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
    "/bodegas/{bodegaId}/fincas/vinculos": {
      get: {
        summary: "List bodega-finca links",
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
    "/bodegas/{bodegaId}/fincas/{fincaId}/vinculo": {
      put: {
        summary: "Create or update bodega-finca link",
        parameters: [
          {
            name: "bodegaId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "fincaId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  tipo_vinculo: {
                    type: "string",
                    enum: ["propia", "proveedor_tercero"],
                  },
                  activo: {
                    type: "boolean",
                  },
                },
              },
            },
          },
        },
        responses: { 200: { description: "OK" } },
      },
    },
    "/fincas": {
      get: {
        summary: "List fincas with details (optional by bodega)",
        parameters: [
          {
            name: "bodegaId",
            in: "query",
            required: false,
            schema: { type: "string" },
            description:
              "Si se envía, devuelve fincas del alcance de esa bodega (propias y vinculadas).",
          },
        ],
        responses: { 200: { description: "OK" } },
      },
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
    "/fincas/{fincaId}": {
      delete: {
        summary: "Delete finca",
        parameters: [
          {
            name: "fincaId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "OK" },
          403: { description: "Forbidden" },
          404: { description: "Not found" },
          409: { description: "Conflict: finca con registros relacionados" },
        },
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
        parameters: [
          {
            name: "bodegaId",
            in: "query",
            required: false,
            schema: { type: "string" },
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
                  bodegaId: { type: "string" },
                  nombre: { type: "string" },
                  fecha_inicio: {
                    type: "string",
                    description: "YYYY-MM-DD o DD/MM/YYYY",
                  },
                  fecha_fin: {
                    type: "string",
                    description: "YYYY-MM-DD o DD/MM/YYYY",
                  },
                  estado: { type: "string" },
                },
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
    "/protocolos/expanded": {
      get: {
        summary: "List protocolos expanded (etapas y procesos)",
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
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["protocoloId", "bodegaId", "campaniaId"],
                properties: {
                  protocoloId: { type: "string" },
                  bodegaId: { type: "string" },
                  campaniaId: { type: "string" },
                  fincaId: { type: "string" },
                  cuartelId: { type: "string" },
                  nombre_producto: { type: "string" },
                  imagen_producto: { type: "string" },
                },
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
            schema: { type: "string" },
          },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/trazabilidades/{id}/origenes": {
      post: {
        summary: "Add origen (finca/cuartel) to trazabilidad",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["fincaId", "cuartelId"],
                properties: {
                  fincaId: { type: "string" },
                  cuartelId: { type: "string" },
                },
              },
            },
          },
        },
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
    "/milestones/{id}/asignar": {
      patch: {
        summary: "Assign milestone to finca/cuartel and operario",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["fincaId", "cuartelId", "operarioUserId"],
                properties: {
                  fincaId: { type: "string" },
                  cuartelId: { type: "string" },
                  operarioUserId: { type: "string" },
                  titulo: { type: "string" },
                  descripcion: { type: "string" },
                  fechaObjetivo: { type: "string", description: "YYYY-MM-DD" },
                  prioridad: { type: "string" },
                },
              },
            },
          },
        },
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
    "/encargos/mis-pendientes": {
      get: {
        summary: "Compat route: list my pending encargo assignments",
        responses: { 200: { description: "OK" } },
      },
    },
    "/encargos/bodega/{bodegaId}/pendientes": {
      get: {
        summary: "Compat route: list pending encargos by bodega",
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
                },
              },
            },
          },
        },
        responses: { 200: { description: "OK" } },
      },
    },
    "/encargos": {
      get: {
        summary: "List encargos",
        parameters: [
          {
            name: "bodegaId",
            in: "query",
            required: false,
            schema: { type: "string" },
          },
          {
            name: "fincaId",
            in: "query",
            required: false,
            schema: { type: "string" },
          },
          {
            name: "pendientes",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["1", "true"] },
          },
        ],
        responses: { 200: { description: "OK" } },
      },
      post: {
        summary: "Create encargo",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["bodegaId", "titulo"],
                properties: {
                  bodegaId: { type: "string" },
                  fincaId: { type: "string" },
                  cuartelId: { type: "string" },
                  milestoneId: { type: "string" },
                  titulo: { type: "string" },
                  descripcion: { type: "string" },
                  fechaObjetivo: { type: "string", description: "YYYY-MM-DD" },
                  prioridad: { type: "string" },
                  assigneeUserIds: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
              },
            },
          },
        },
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
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["userIds"],
                properties: {
                  userIds: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
              },
            },
          },
        },
        responses: { 200: { description: "OK" } },
      },
    },
    "/encargos/{encargoId}/asignar": {
      patch: {
        summary: "Compat route: assign one or many users to encargo",
        parameters: [
          {
            name: "encargoId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  userId: { type: "string" },
                  assigneeUserId: { type: "string" },
                  userIds: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
              },
            },
          },
        },
        responses: { 200: { description: "OK" } },
      },
      post: {
        summary: "Compat route: assign one or many users to encargo (POST)",
        parameters: [
          {
            name: "encargoId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  userId: { type: "string" },
                  assigneeUserId: { type: "string" },
                  userIds: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
              },
            },
          },
        },
        responses: { 200: { description: "OK" } },
      },
    },
    "/encargos/{encargoId}/cancelar": {
      patch: {
        summary: "Cancel encargo (soft delete)",
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
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["botUserId", "scopes"],
                properties: {
                  botUserId: { type: "string" },
                  bodegaId: { type: "string" },
                  scopes: {
                    type: "array",
                    items: { type: "string" },
                  },
                  expiresAt: { type: "string", description: "ISO datetime" },
                },
              },
            },
          },
        },
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
            },
          },
        },
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
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                additionalProperties: true,
              },
            },
          },
        },
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
