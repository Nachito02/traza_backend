const uuidParam = (name: string, description?: string) => ({
  name,
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
  ...(description ? { description } : {}),
});

const genericJsonBody = {
  required: true,
  content: {
    "application/json": {
      schema: {
        type: "object",
        additionalProperties: true,
      },
    },
  },
} as const;

const createCrudCollectionPath = (tag: string, pluralLabel: string, singularLabel: string) => ({
  get: {
    summary: `Listar ${pluralLabel}`,
    tags: [tag],
    responses: { 200: { description: "OK" } },
  },
  post: {
    summary: `Crear ${singularLabel}`,
    tags: [tag],
    requestBody: genericJsonBody,
    responses: { 201: { description: "Creado" }, 400: { description: "Bad request" } },
  },
});

const createCrudItemPath = (
  tag: string,
  singularLabel: string,
  pathParamName = "id",
) => ({
  get: {
    summary: `Obtener ${singularLabel}`,
    tags: [tag],
    parameters: [uuidParam(pathParamName)],
    responses: { 200: { description: "OK" }, 404: { description: "No encontrado" } },
  },
  patch: {
    summary: `Actualizar ${singularLabel}`,
    tags: [tag],
    parameters: [uuidParam(pathParamName)],
    requestBody: genericJsonBody,
    responses: { 200: { description: "Actualizado" }, 404: { description: "No encontrado" } },
  },
  delete: {
    summary: `Eliminar ${singularLabel}`,
    tags: [tag],
    parameters: [uuidParam(pathParamName)],
    responses: { 200: { description: "Eliminado" }, 404: { description: "No encontrado" } },
  },
});

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
                required: ["username", "password"],
                properties: {
                  username: { type: "string", description: "Email del usuario" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "OK — puede devolver token o solicitar cambio de password",
            content: {
              "application/json": {
                schema: {
                  oneOf: [
                    {
                      type: "object",
                      description: "Login exitoso",
                      properties: {
                        access_token: { type: "string" },
                        refresh_token: { type: "string" },
                        user: {
                          type: "object",
                          properties: {
                            id: { type: "string", format: "uuid" },
                            email: { type: "string", format: "email", nullable: true },
                            nombre: { type: "string" },
                          },
                        },
                      },
                    },
                    {
                      type: "object",
                      description: "Usuario con password temporal — debe cambiarlo antes de continuar",
                      properties: {
                        must_change_password: { type: "boolean", enum: [true] },
                        userId: { type: "string", format: "uuid" },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    "/auth/change-password": {
      post: {
        summary: "Cambiar password temporal (primer login)",
        description: "Usar cuando el login devuelve `must_change_password: true`. No requiere token de sesión.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["userId", "currentPassword", "newPassword"],
                properties: {
                  userId: { type: "string", format: "uuid" },
                  currentPassword: { type: "string", description: "El password temporal recibido por WhatsApp" },
                  newPassword: { type: "string", description: "El nuevo password elegido por el usuario (mínimo 6 caracteres)" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Password cambiado — devuelve tokens de sesión",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    access_token: { type: "string" },
                    refresh_token: { type: "string" },
                  },
                },
              },
            },
          },
          400: { description: "Nuevo password muy corto" },
          401: { description: "Password actual incorrecto" },
          404: { description: "Usuario no encontrado" },
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
        summary: "Identidad del usuario autenticado",
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                example: {
                  id: "25f158ae-0000-0000-0000-000000000000",
                  email: "juan@bodega.com",
                  nombre: "Juan Pérez",
                  whatsapp: "+5491112345678",
                  is_active: true,
                  roles_globales: ["encargado_bodega"],
                  bodegas: [
                    {
                      bodega_id: "837bc9e4-0000-0000-0000-000000000000",
                      nombre: "Bodega Norte",
                      roles: ["encargado_bodega"],
                    },
                  ],
                },
              },
            },
          },
          401: { description: "No autenticado" },
        },
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
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["fincaId", "codigo_cuartel"],
                properties: {
                  fincaId: { type: "string", format: "uuid" },
                  codigo_cuartel: { type: "string", example: "C-01" },
                  superficie_ha: { type: "number", example: 3.5 },
                  cultivo: { type: "string", example: "Vid" },
                  variedad: { type: "string", example: "Malbec" },
                  sistema_riego: { type: "string", example: "goteo" },
                  sistema_productivo: { type: "string", example: "convencional" },
                  sistema_conduccion: { type: "string", example: "espaldera" },
                },
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
            schema: { type: "string" },
          },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/cuarteles/{cuartelId}": {
      get: {
        summary: "Obtener cuartel por ID",
        parameters: [uuidParam("cuartelId")],
        responses: { 200: { description: "OK" }, 404: { description: "No encontrado" } },
      },
      patch: {
        summary: "Actualizar cuartel",
        parameters: [uuidParam("cuartelId")],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  codigo_cuartel: { type: "string", example: "C-01" },
                  superficie_ha: { type: "number", example: 3.5 },
                  cultivo: { type: "string", example: "Vid" },
                  variedad: { type: "string", example: "Malbec" },
                  sistema_riego: { type: "string", example: "goteo" },
                  sistema_productivo: { type: "string", example: "convencional" },
                  sistema_conduccion: { type: "string", example: "espaldera" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "OK" }, 404: { description: "No encontrado" } },
      },
      delete: {
        summary: "Eliminar cuartel",
        parameters: [uuidParam("cuartelId")],
        responses: { 200: { description: "OK" }, 404: { description: "No encontrado" } },
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
    "/protocolos/{protocoloId}": {
      get: {
        summary: "Get protocolo por ID (incluye etapas, procesos y plantilla)",
        parameters: [
          {
            name: "protocoloId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          200: { description: "OK" },
          404: { description: "Protocolo no encontrado" },
        },
      },
    },
    "/protocolos/{protocoloId}/plantilla": {
      get: {
        summary: "Plantilla de campos obligatorios/opcionales por iteración del protocolo",
        parameters: [
          {
            name: "protocoloId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          200: { description: "OK" },
          404: { description: "Protocolo no encontrado" },
        },
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
    "/eventos/milestone/{milestoneId}": {
      get: {
        summary: "Listar eventos vinculados a un milestone",
        tags: ["Eventos"],
        parameters: [
          uuidParam("milestoneId", "ID del milestone"),
          {
            name: "tipo",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "Filtra por tipo de evento",
          },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/eventos/milestone/{milestoneId}/{tipo}/{eventoId}": {
      get: {
        summary: "Obtener un evento específico de un milestone",
        tags: ["Eventos"],
        parameters: [
          uuidParam("milestoneId"),
          { name: "tipo", in: "path", required: true, schema: { type: "string" } },
          uuidParam("eventoId", "ID del evento"),
        ],
        responses: { 200: { description: "OK" }, 404: { description: "No encontrado" } },
      },
      delete: {
        summary: "Eliminar un evento específico de un milestone",
        tags: ["Eventos"],
        parameters: [
          uuidParam("milestoneId"),
          { name: "tipo", in: "path", required: true, schema: { type: "string" } },
          uuidParam("eventoId", "ID del evento"),
        ],
        responses: { 200: { description: "Eliminado" }, 404: { description: "No encontrado" } },
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
                  descripcion: { type: "string" },
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
  },
} as const;

export default openapiSpec;
