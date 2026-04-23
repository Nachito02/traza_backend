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
    "/bot/usuarios/whatsapp/{whatsapp}": {
      get: {
        summary: "Perfil completo del usuario por WhatsApp (incluye tareas activas)",
        tags: ["IA"],
        parameters: [{ name: "whatsapp", in: "path", required: true, schema: { type: "string" }, example: "+5491112345678" }],
        responses: { 200: { description: "OK" }, 404: { description: "No encontrado" } },
      },
    },
    "/bot/tareas/whatsapp/{whatsapp}": {
      get: {
        summary: "Tareas asignadas al usuario identificado por WhatsApp",
        tags: ["IA"],
        parameters: [
          { name: "whatsapp", in: "path", required: true, schema: { type: "string" }, example: "+5491112345678" },
          { name: "estados", in: "query", required: false, schema: { type: "string" }, description: "Filtro por estados separados por coma: pendiente,en_progreso,completado,cancelado. Default: pendiente,en_progreso" },
        ],
        responses: { 200: { description: "OK" }, 404: { description: "No encontrado" } },
      },
    },
    "/bot/delegaciones": {
      post: {
        summary: "Crear delegación manualmente (desde la app web)",
        tags: ["Bot - Delegaciones"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["botUserId", "scopes"],
                properties: {
                  botUserId: { type: "string", format: "uuid" },
                  bodegaId: { type: "string", format: "uuid", description: "Opcional — limita la delegación a una bodega específica" },
                  scopes: { type: "array", items: { type: "string" }, example: ["tareas.crear", "tareas.actualizar_estado", "cuarteles.crear", "vasijas.crear"] },
                  expiresAt: { type: "string", format: "date-time", description: "Opcional" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Delegación creada" } },
      },
    },
    "/bot/delegaciones/me": {
      get: {
        summary: "Listar delegaciones activas otorgadas por el usuario autenticado",
        tags: ["Bot - Delegaciones"],
        responses: { 200: { description: "OK" } },
      },
    },
    "/bot/delegaciones/solicitar": {
      post: {
        summary: "Solicitar delegación desde el chat del bot — genera un código de confirmación",
        tags: ["Bot - Delegaciones"],
        description: "El bot llama a este endpoint cuando el encargado quiere habilitar el bot desde WhatsApp. Se genera un código de 6 dígitos válido por 10 minutos que el encargado debe confirmar.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["whatsapp", "scopes"],
                properties: {
                  whatsapp: { type: "string", example: "+5491112345678" },
                  scopes: { type: "array", items: { type: "string" }, example: ["tareas.crear", "tareas.actualizar_estado", "cuarteles.crear", "vasijas.crear"] },
                  bodegaId: { type: "string", format: "uuid", description: "Opcional" },
                  expiresAt: { type: "string", format: "date-time", description: "Opcional" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Código generado",
            content: {
              "application/json": {
                example: { codigo: "847291", nombre_usuario: "Juan Pérez", expira_en_minutos: 10, mensaje: "Enviá el código 847291 al encargado para confirmar la delegación" },
              },
            },
          },
          404: { description: "Usuario no encontrado con ese WhatsApp" },
        },
      },
    },
    "/bot/delegaciones/confirmar": {
      post: {
        summary: "Confirmar delegación con el código enviado por el encargado",
        tags: ["Bot - Delegaciones"],
        description: "El bot llama a este endpoint cuando el encargado responde con el código de 6 dígitos en el chat.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["whatsapp", "codigo"],
                properties: {
                  whatsapp: { type: "string", example: "+5491112345678" },
                  codigo: { type: "string", example: "847291" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Delegación activada" },
          400: { description: "Código inválido o expirado" },
          403: { description: "El código no corresponde a este usuario" },
        },
      },
    },
    "/bot/delegaciones/{botDelegationId}": {
      delete: {
        summary: "Revocar una delegación",
        tags: ["Bot - Delegaciones"],
        parameters: [{ name: "botDelegationId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Revocada" } },
      },
    },
    "/bot/tareas": {
      post: {
        summary: "Crear tarea en nombre de un encargado",
        tags: ["IA"],
        description: "Requiere delegación activa con scope `tareas.crear`.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["onBehalfUserId", "bodegaId", "procesoId"],
                properties: {
                  onBehalfUserId: { type: "string", format: "uuid" },
                  bodegaId: { type: "string", format: "uuid" },
                  procesoId: { type: "string", format: "uuid", description: "ID del proceso del protocolo — determina el tipo de tarea" },
                  fincaId: { type: "string", format: "uuid" },
                  cuartelId: { type: "string", format: "uuid" },
                  descripcion: { type: "string" },
                  prioridad: { type: "string", enum: ["baja", "media", "alta"] },
                  fechaFin: { type: "string", format: "date-time" },
                  imagenCid: { type: "string", description: "CID IPFS de la imagen principal (opcional)" },
                  imagenUrl: { type: "string", description: "URL de respaldo S3 (opcional)" },
                  assigneeUserIds: { type: "array", items: { type: "string", format: "uuid" } },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Tarea creada" } },
      },
    },
    "/bot/tareas/iniciar": {
      post: {
        summary: "Iniciar creación de tarea desde WhatsApp (con auto-delegación)",
        tags: ["IA"],
        description:
          "Verifica si el bot tiene delegación activa con scope `tareas.crear` para el usuario identificado por su WhatsApp.\n\n" +
          "- **Con delegación activa** → crea la tarea y devuelve `HTTP 201` con `status: \"created\"`.\n" +
          "- **Sin delegación** → solicita delegación automáticamente y devuelve `HTTP 202` con `status: \"delegacion_requerida\"`, el código de confirmación y los datos de la tarea pendiente para que el bot los reintente tras confirmar.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["whatsapp", "bodegaId", "procesoId"],
                properties: {
                  whatsapp: { type: "string", example: "+541134567890", description: "Número E.164 del usuario en WhatsApp" },
                  bodegaId: { type: "string", format: "uuid" },
                  procesoId: { type: "string", format: "uuid", description: "ID del proceso del protocolo — determina el tipo de tarea" },
                  fincaId: { type: "string", format: "uuid" },
                  cuartelId: { type: "string", format: "uuid" },
                  descripcion: { type: "string" },
                  prioridad: { type: "string", enum: ["baja", "media", "alta"] },
                  fechaFin: { type: "string", format: "date-time" },
                  imagenCid: { type: "string", description: "CID IPFS de la imagen principal (opcional)" },
                  imagenUrl: { type: "string", description: "URL de respaldo S3 (opcional)" },
                  assigneeUserIds: { type: "array", items: { type: "string", format: "uuid" } },
                  delegacionExpiresAt: { type: "string", format: "date-time", description: "Expiración de la delegación. Si se omite, la delegación no expira nunca." },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Tarea creada (delegación ya existía)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", enum: ["created"] },
                    tarea: { type: "object" },
                  },
                },
              },
            },
          },
          202: {
            description: "Delegación requerida — se generó un código de confirmación",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", enum: ["delegacion_requerida"] },
                    tarea_pendiente: {
                      type: "object",
                      description: "Datos de la tarea para reintentar tras confirmar la delegación",
                    },
                    delegacion: {
                      type: "object",
                      properties: {
                        codigo: { type: "string", example: "482931" },
                        nombre_usuario: { type: "string" },
                        expira_en_minutos: { type: "number", example: 10 },
                        mensaje: { type: "string" },
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
    "/bot/asignaciones/{tareaAsignacionId}/contactar": {
      post: {
        summary: "Registrar contacto del bot con el operario",
        tags: ["IA"],
        description: "Requiere scope `tareas.contactar`.",
        parameters: [{ name: "tareaAsignacionId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: false,
          content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" } } } } },
        },
        responses: { 200: { description: "OK" } },
      },
    },
    "/bot/asignaciones/{tareaAsignacionId}/ayudar-carga": {
      post: {
        summary: "Bot asiste con la carga de datos — marca la asignación como en_progreso",
        tags: ["IA"],
        description: "Requiere scope `tareas.cargar_datos`.",
        parameters: [{ name: "tareaAsignacionId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/bot/asignaciones/{tareaAsignacionId}/estado": {
      patch: {
        summary: "Actualizar estado de una asignación de tarea",
        tags: ["IA"],
        description: "Requiere scope `tareas.actualizar_estado`.",
        parameters: [{ name: "tareaAsignacionId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["estado"],
                properties: {
                  estado: { type: "string", enum: ["pendiente", "en_progreso", "completado", "cancelado"] },
                  observaciones: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "OK" } },
      },
    },
    "/bot/protocolos": {
      get: {
        summary: "Protocolos activos con etapas y procesos expandidos",
        tags: ["IA"],
        responses: { 200: { description: "OK" } },
      },
    },
    "/bot/bodegas/{bodegaId}/operarios": {
      get: {
        summary: "Miembros activos de una bodega con sus roles",
        tags: ["IA"],
        parameters: [{ name: "bodegaId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/bot/bodegas/{bodegaId}/vasijas": {
      post: {
        summary: "Crear vasija en una bodega en nombre de un encargado",
        tags: ["IA"],
        description: "Requiere delegación activa con scope `vasijas.crear`.",
        parameters: [{ name: "bodegaId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["onBehalfUserId", "codigo"],
                properties: {
                  onBehalfUserId: { type: "string", format: "uuid" },
                  codigo: { type: "string", example: "V-14" },
                  tipo: { type: "string", example: "tanque" },
                  capacidad_litros: { type: "number", example: 50000 },
                  estado: { type: "string", example: "libre" },
                  ubicacion: { type: "string", example: "Nave B" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Vasija creada" } },
      },
    },
    "/bot/fincas/{fincaId}/cuarteles": {
      post: {
        summary: "Crear cuartel en una finca en nombre de un encargado",
        tags: ["IA"],
        description: "Requiere delegación activa con scope `cuarteles.crear` (se valida contra la bodega dueña de la finca).",
        parameters: [{ name: "fincaId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["onBehalfUserId", "codigo_cuartel"],
                properties: {
                  onBehalfUserId: { type: "string", format: "uuid" },
                  codigo_cuartel: { type: "string", example: "C-03" },
                  superficie_ha: { type: "number", example: 4.5 },
                  cultivo: { type: "string", example: "vid" },
                  variedad: { type: "string", example: "Malbec" },
                  sistema_riego: { type: "string", example: "goteo" },
                  sistema_productivo: { type: "string", example: "espaldera" },
                  sistema_conduccion: { type: "string", example: "doble cordón" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Cuartel creado" } },
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
    "/operarios/bodega/{bodegaId}": {
      get: {
        summary: "Listar operarios de una bodega",
        tags: ["Operarios"],
        parameters: [uuidParam("bodegaId")],
        responses: { 200: { description: "OK" } },
      },
      post: {
        summary: "Crear operario en una bodega",
        tags: ["Operarios"],
        parameters: [uuidParam("bodegaId")],
        requestBody: genericJsonBody,
        responses: { 201: { description: "Creado" }, 400: { description: "Bad request" } },
      },
    },
    "/operarios/{userId}": {
      delete: {
        summary: "Desactivar operario",
        tags: ["Operarios"],
        parameters: [uuidParam("userId")],
        responses: { 200: { description: "OK" }, 404: { description: "No encontrado" } },
      },
    },
    "/tareas/me/can-manage": {
      get: {
        summary: "Verificar si el usuario puede gestionar tareas",
        tags: ["Tareas"],
        responses: { 200: { description: "OK" } },
      },
    },
    "/tareas/me/asignaciones": {
      get: {
        summary: "Listar asignaciones de tareas del usuario autenticado",
        tags: ["Tareas"],
        responses: { 200: { description: "OK" } },
      },
    },
    "/tareas/mis-pendientes": {
      get: {
        summary: "Listar pendientes del usuario autenticado",
        tags: ["Tareas"],
        responses: { 200: { description: "OK" } },
      },
    },
    "/tareas/bodega/{bodegaId}/pendientes": {
      get: {
        summary: "Listar pendientes por bodega",
        tags: ["Tareas"],
        parameters: [uuidParam("bodegaId")],
        responses: { 200: { description: "OK" } },
      },
    },
    "/tareas/me/asignaciones/{tareaAsignacionId}/estado": {
      patch: {
        summary: "Actualizar estado de una asignación propia",
        tags: ["Tareas"],
        parameters: [uuidParam("tareaAsignacionId")],
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
    "/tareas/me/asignaciones/{tareaAsignacionId}/entradas": {
      get: {
        summary: "Listar entradas de una asignación propia",
        tags: ["Tareas"],
        parameters: [uuidParam("tareaAsignacionId")],
        responses: { 200: { description: "OK" } },
      },
      post: {
        summary: "Agregar entrada a una asignación propia",
        tags: ["Tareas"],
        parameters: [uuidParam("tareaAsignacionId")],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  descripcion: { type: "string" },
                  notas: { type: "string" },
                  draft: { type: "object", additionalProperties: true },
                  adjuntos: {
                    type: "array",
                    items: { type: "string" },
                  },
                  documentos: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Creado" } },
      },
    },
    "/tareas/me/asignaciones/{tareaAsignacionId}/finalizar": {
      post: {
        summary: "Finalizar una asignación propia",
        tags: ["Tareas"],
        parameters: [uuidParam("tareaAsignacionId")],
        responses: { 200: { description: "OK" } },
      },
    },
    "/tareas": {
      get: {
        summary: "Listar tareas",
        tags: ["Tareas"],
        parameters: [
          { name: "bodegaId", in: "query", required: false, schema: { type: "string", format: "uuid" } },
          { name: "fincaId", in: "query", required: false, schema: { type: "string", format: "uuid" } },
          { name: "pendientes", in: "query", required: false, schema: { type: "boolean" } },
        ],
        responses: { 200: { description: "OK" } },
      },
      post: {
        summary: "Crear tarea",
        tags: ["Tareas"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["bodegaId"],
                properties: {
                  bodegaId: { type: "string", format: "uuid" },
                  procesoId: { type: "string", format: "uuid" },
                  fincaId: { type: "string", format: "uuid" },
                  cuartelId: { type: "string", format: "uuid" },
                  descripcion: { type: "string" },
                  fechaFin: { type: "string", format: "date-time" },
                  prioridad: { type: "string", enum: ["baja", "media", "alta"] },
                  imagenCid: { type: "string" },
                  imagenUrl: { type: "string" },
                  assigneeUserIds: {
                    type: "array",
                    items: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Creado" } },
      },
    },
    "/tareas/{tareaId}/asignaciones": {
      post: {
        summary: "Agregar asignaciones a una tarea",
        tags: ["Tareas"],
        parameters: [uuidParam("tareaId")],
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
                    items: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
        },
        responses: { 200: { description: "OK" } },
      },
    },
    "/tareas/{tareaId}/asignar": {
      patch: {
        summary: "Asignar usuarios a una tarea",
        tags: ["Tareas"],
        parameters: [uuidParam("tareaId")],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  userId: { type: "string", format: "uuid" },
                  assigneeUserId: { type: "string", format: "uuid" },
                  userIds: {
                    type: "array",
                    items: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
        },
        responses: { 200: { description: "OK" } },
      },
      post: {
        summary: "Asignar usuarios a una tarea (compatibilidad)",
        tags: ["Tareas"],
        parameters: [uuidParam("tareaId")],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  userId: { type: "string", format: "uuid" },
                  assigneeUserId: { type: "string", format: "uuid" },
                  userIds: {
                    type: "array",
                    items: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
        },
        responses: { 200: { description: "OK" } },
      },
    },
    "/tareas/{tareaId}/cancelar": {
      patch: {
        summary: "Cancelar tarea",
        tags: ["Tareas"],
        parameters: [uuidParam("tareaId")],
        responses: { 200: { description: "OK" } },
      },
    },
    "/elaboracion/vasijas": createCrudCollectionPath("Elaboración", "vasijas", "vasija"),
    "/elaboracion/vasijas/{id}": createCrudItemPath("Elaboración", "vasija"),
    "/elaboracion/cortes": createCrudCollectionPath("Elaboración", "cortes", "corte"),
    "/elaboracion/cortes/{id}": createCrudItemPath("Elaboración", "corte"),
    "/elaboracion/productos": createCrudCollectionPath("Elaboración", "productos", "producto"),
    "/elaboracion/productos/{id}": createCrudItemPath("Elaboración", "producto"),
    "/elaboracion/lotes-fraccionamiento": createCrudCollectionPath("Elaboración", "lotes de fraccionamiento", "lote de fraccionamiento"),
    "/elaboracion/lotes-fraccionamiento/{id}": createCrudItemPath("Elaboración", "lote de fraccionamiento"),
    "/elaboracion/codigos-envase": createCrudCollectionPath("Elaboración", "códigos de envase", "código de envase"),
    "/elaboracion/codigos-envase/{id}": createCrudItemPath("Elaboración", "código de envase"),
    "/elaboracion/remitos-uva": createCrudCollectionPath("Elaboración", "remitos de uva", "remito de uva"),
    "/elaboracion/remitos-uva/{id}": createCrudItemPath("Elaboración", "remito de uva"),
    "/elaboracion/recepciones-bodega": createCrudCollectionPath("Elaboración", "recepciones de bodega", "recepción de bodega"),
    "/elaboracion/recepciones-bodega/{id}": createCrudItemPath("Elaboración", "recepción de bodega"),
    "/elaboracion/analisis-recepcion": createCrudCollectionPath("Elaboración", "análisis de recepción", "análisis de recepción"),
    "/elaboracion/analisis-recepcion/{id}": createCrudItemPath("Elaboración", "análisis de recepción"),
    "/elaboracion/operaciones-vasija": createCrudCollectionPath("Elaboración", "operaciones de vasija", "operación de vasija"),
    "/elaboracion/operaciones-vasija/{id}": createCrudItemPath("Elaboración", "operación de vasija"),
    "/elaboracion/despachos": createCrudCollectionPath("Elaboración", "despachos", "despacho"),
    "/elaboracion/despachos/{id}": createCrudItemPath("Elaboración", "despacho"),
    "/elaboracion/cius": createCrudCollectionPath("Elaboración", "CIUs", "CIU"),
    "/elaboracion/cius/{id}": createCrudItemPath("Elaboración", "CIU"),
    "/elaboracion/ciu-recepciones": {
      get: {
        summary: "Listar relaciones CIU-Recepción",
        tags: ["Elaboración"],
        responses: { 200: { description: "OK" } },
      },
      post: {
        summary: "Crear relación CIU-Recepción",
        tags: ["Elaboración"],
        requestBody: genericJsonBody,
        responses: { 201: { description: "Creado" } },
      },
    },
    "/elaboracion/ciu-recepciones/{ciuId}/{recepcionBodegaId}": {
      get: {
        summary: "Obtener relación CIU-Recepción",
        tags: ["Elaboración"],
        parameters: [uuidParam("ciuId"), uuidParam("recepcionBodegaId")],
        responses: { 200: { description: "OK" }, 404: { description: "No encontrado" } },
      },
      patch: {
        summary: "Actualizar relación CIU-Recepción",
        tags: ["Elaboración"],
        parameters: [uuidParam("ciuId"), uuidParam("recepcionBodegaId")],
        requestBody: genericJsonBody,
        responses: { 200: { description: "Actualizado" } },
      },
      delete: {
        summary: "Eliminar relación CIU-Recepción",
        tags: ["Elaboración"],
        parameters: [uuidParam("ciuId"), uuidParam("recepcionBodegaId")],
        responses: { 200: { description: "Eliminado" } },
      },
    },
    "/elaboracion/qc-ingreso-uva": createCrudCollectionPath("Elaboración", "QC ingreso uva", "QC ingreso uva"),
    "/elaboracion/qc-ingreso-uva/{id}": createCrudItemPath("Elaboración", "QC ingreso uva"),
    "/elaboracion/existencias-vasija": createCrudCollectionPath("Elaboración", "existencias de vasija", "existencia de vasija"),
    "/elaboracion/existencias-vasija/{id}": createCrudItemPath("Elaboración", "existencia de vasija"),
    "/elaboracion/controles-fermentacion": createCrudCollectionPath("Elaboración", "controles de fermentación", "control de fermentación"),
    "/elaboracion/controles-fermentacion/{id}": createCrudItemPath("Elaboración", "control de fermentación"),

    // ── IA / Bot ─────────────────────────────────────────────────────────────
    "/ia/auth/register-agent": {
      post: {
        summary: "Crear super agente — sin email, actúa en nombre de cualquiera (requiere admin_sistema)",
        description: "Crea un usuario con rol `super_agent`. No necesita email ni delegación. Puede actuar en nombre de cualquier usuario pasando `onBehalfUserId`. Todo queda logueado en `BotActionLog`.",
        tags: ["IA - Agent"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["nombre", "password"],
                properties: {
                  nombre: { type: "string", description: "Username único del super agente" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Super agente creado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string", format: "uuid" },
                    nombre: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/ia/auth/login-agent": {
      post: {
        summary: "Login del super agente — nombre + password, sin email",
        tags: ["IA - Agent"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["nombre", "password"],
                properties: {
                  nombre: { type: "string" },
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
    "/bot/auth/register-agent": {
      post: {
        summary: "Crear super agente (bot route — requiere admin_sistema)",
        tags: ["Bot - Agent"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["nombre", "password"],
                properties: {
                  nombre: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Super agente creado" } },
      },
    },
    "/bot/auth/login-agent": {
      post: {
        summary: "Login del super agente (bot route)",
        tags: ["Bot - Agent"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["nombre", "password"],
                properties: {
                  nombre: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "OK — access_token + refresh_token" } },
      },
    },
    "/ia/auth/register": {
      post: {
        summary: "Crear usuario bot (requiere admin_sistema)",
        tags: ["IA"],
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
    "/ia/auth/login": {
      post: {
        summary: "Login del bot — bot_agent o super_agent",
        description: "`username` puede ser el email del bot_agent o el nombre del super_agent.",
        tags: ["IA"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password"],
                properties: {
                  username: { type: "string", description: "Email (bot_agent) o nombre (super_agent)" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "OK — access_token, refresh_token, user" } },
      },
    },
    "/ia/me": {
      get: {
        summary: "Identidad del bot autenticado y delegaciones activas",
        tags: ["IA"],
        responses: { 200: { description: "OK" } },
      },
    },
    "/ia/catalogos/bodegas": {
      get: { summary: "Bodegas visibles para el bot por delegación", tags: ["IA"], responses: { 200: { description: "OK" } } },
    },
    "/ia/catalogos/fincas": {
      get: {
        summary: "Fincas visibles por delegación",
        tags: ["IA"],
        parameters: [{ name: "bodegaId", in: "query", required: false, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/ia/catalogos/cuarteles": {
      get: {
        summary: "Cuarteles de una finca",
        tags: ["IA"],
        parameters: [
          { name: "fincaId", in: "query", required: false, schema: { type: "string", format: "uuid" } },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/ia/catalogos/campanias": {
      get: {
        summary: "Campañas visibles por delegación",
        tags: ["IA"],
        parameters: [{ name: "bodegaId", in: "query", required: false, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/ia/catalogos/personas": {
      get: {
        summary: "Personas visibles por delegación",
        tags: ["IA"],
        parameters: [{ name: "bodegaId", in: "query", required: false, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/ia/catalogos/protocolos": {
      get: { summary: "Protocolos activos", tags: ["IA"], responses: { 200: { description: "OK" } } },
    },
    "/ia/catalogos/protocolos/{protocoloId}/procesos": {
      get: {
        summary: "Etapas y procesos de un protocolo",
        tags: ["IA"],
        parameters: [{ name: "protocoloId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/ia/catalogos/insumos": {
      get: {
        summary: "Catálogo de insumos con lotes habilitados",
        tags: ["IA"],
        parameters: [{ name: "tipo", in: "query", required: false, schema: { type: "string" } }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/ia/catalogos/eventos": {
      get: { summary: "Lista de tipos de evento disponibles para registrar", tags: ["IA"], responses: { 200: { description: "OK" } } },
    },
    "/ia/catalogos/eventos/{tipo}/schema": {
      get: {
        summary: "Schema de campos requeridos/opcionales para un tipo de evento",
        tags: ["IA"],
        parameters: [{ name: "tipo", in: "path", required: true, schema: { type: "string" }, example: "riego" }],
        responses: { 200: { description: "OK" }, 404: { description: "Tipo de evento desconocido" } },
      },
    },
    "/ia/tareas": {
      get: {
        summary: "Lista de tareas visibles para el bot",
        tags: ["IA"],
        parameters: [
          { name: "estado", in: "query", required: false, schema: { type: "string" } },
          { name: "bodegaId", in: "query", required: false, schema: { type: "string", format: "uuid" } },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/ia/tareas/iniciar": {
      post: {
        summary: "Iniciar creación de tarea desde WhatsApp (con auto-delegación)",
        tags: ["IA"],
        description:
          "Verifica si el bot tiene delegación activa con scope `tareas.crear` para el usuario identificado por su WhatsApp.\n\n" +
          "- **Con delegación activa** → crea la tarea y devuelve `HTTP 201` con `status: \"created\"`.\n" +
          "- **Sin delegación** → solicita delegación automáticamente y devuelve `HTTP 202` con `status: \"delegacion_requerida\"`, el código de confirmación y los datos de la tarea pendiente para reintentar tras confirmar.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["whatsapp", "bodegaId", "procesoId"],
                properties: {
                  whatsapp: { type: "string", example: "+541134567890", description: "Número E.164 del usuario en WhatsApp" },
                  bodegaId: { type: "string", format: "uuid" },
                  procesoId: { type: "string", format: "uuid", description: "ID del proceso del protocolo — determina el tipo de tarea" },
                  fincaId: { type: "string", format: "uuid" },
                  cuartelId: { type: "string", format: "uuid" },
                  descripcion: { type: "string" },
                  prioridad: { type: "string", enum: ["baja", "media", "alta"] },
                  fechaFin: { type: "string", format: "date-time" },
                  imagenCid: { type: "string", description: "CID IPFS de la imagen principal (opcional)" },
                  imagenUrl: { type: "string", description: "URL de respaldo S3 (opcional)" },
                  assigneeUserIds: { type: "array", items: { type: "string", format: "uuid" } },
                  delegacionExpiresAt: { type: "string", format: "date-time", description: "Expiración de la delegación. Si se omite, la delegación no expira nunca." },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Tarea creada (delegación ya existía)" },
          202: { description: "Delegación requerida — se generó un código de confirmación" },
        },
      },
    },
    "/ia/tareas/{tareaAsignacionId}": {
      get: {
        summary: "Detalle resumido de una tarea",
        tags: ["IA"],
        parameters: [{ name: "tareaAsignacionId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/ia/tareas/{tareaAsignacionId}/contexto": {
      get: {
        summary: "Contexto expandido para resolución de la tarea",
        tags: ["IA"],
        parameters: [{ name: "tareaAsignacionId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/ia/tareas/{tareaAsignacionId}/contactar": {
      post: {
        summary: "Registrar contacto del bot con el operario",
        tags: ["IA"],
        parameters: [{ name: "tareaAsignacionId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: false,
          content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" } } } } },
        },
        responses: { 200: { description: "OK" } },
      },
    },
    "/ia/tareas/{tareaAsignacionId}/guardar-progreso": {
      post: {
        summary: "Guardar progreso intermedio, validar y persistir entrada estructurada",
        tags: ["IA"],
        parameters: [{ name: "tareaAsignacionId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                additionalProperties: true,
                properties: {
                  draft: { type: "object", additionalProperties: true, description: "Datos parciales o completos de la iteración" },
                  notas: { type: "string", description: "Notas opcionales del progreso" },
                  documentos: {
                    type: "array",
                    description: "Documentos opcionales (IPFS + bucket)",
                    items: {
                      type: "object",
                      properties: {
                        cid: { type: "string" },
                        url: { type: "string" },
                        nombre: { type: "string" },
                        mimeType: { type: "string" },
                      },
                    },
                  },
                  plantilla: {
                    type: "object",
                    nullable: true,
                    description: "Plantilla opcional enviada por cliente. Si no se envía, se deriva del schema del evento.",
                  },
                  descripcion: { type: "string", description: "Compatibilidad legacy: alias de notas" },
                  adjuntos: { type: "array", items: { type: "object" }, description: "Compatibilidad legacy: alias de documentos" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "OK" } },
      },
    },
    "/ia/tareas/{tareaAsignacionId}/entradas": {
      post: {
        summary: "Guardar entrada estructurada (notas, plantilla, documentos)",
        tags: ["IA"],
        parameters: [{ name: "tareaAsignacionId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  notas: { type: "string" },
                  plantilla: { type: "object", nullable: true },
                  documentos: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        cid: { type: "string" },
                        url: { type: "string" },
                        nombre: { type: "string" },
                        mimeType: { type: "string" },
                      },
                    },
                  },
                  descripcion: { type: "string", description: "Compatibilidad legacy: alias de notas" },
                  adjuntos: { type: "array", items: { type: "object" }, description: "Compatibilidad legacy: alias de documentos" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Created" } },
      },
    },
    "/ia/tareas/{tareaAsignacionId}/finalizar": {
      post: {
        summary: "Finalizar tarea — cierra o actualiza el estado",
        tags: ["IA"],
        parameters: [{ name: "tareaAsignacionId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["estado"],
                properties: {
                  estado: { type: "string", enum: ["pendiente", "en_progreso", "completado", "cancelado"] },
                  observaciones: { type: "string" },
                  outputPayload: { type: "object", additionalProperties: true },
                },
              },
            },
          },
        },
        responses: { 200: { description: "OK" } },
      },
    },
    "/ia/trazabilidades": {
      get: {
        summary: "Trazabilidades visibles por delegación",
        tags: ["IA"],
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
    "/ia/trazabilidades/{trazabilidadId}": {
      get: {
        summary: "Detalle de una trazabilidad visible",
        tags: ["IA"],
        parameters: [{ name: "trazabilidadId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/ia/trazabilidades/{trazabilidadId}/contexto": {
      get: {
        summary: "Contexto expandido de una trazabilidad",
        tags: ["IA"],
        parameters: [{ name: "trazabilidadId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/ia/hallazgos": {
      get: {
        summary: "Hallazgos visibles por delegación",
        tags: ["IA"],
        parameters: [
          { name: "trazabilidadId", in: "query", required: false, schema: { type: "string", format: "uuid" } },
          { name: "estado", in: "query", required: false, schema: { type: "string" } },
          { name: "severidad", in: "query", required: false, schema: { type: "string" } },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/ia/hallazgos/{hallazgoId}": {
      get: {
        summary: "Detalle de un hallazgo",
        tags: ["IA"],
        parameters: [{ name: "hallazgoId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/ia/eventos": {
      get: {
        summary: "Lectura de eventos para responder preguntas del bot",
        tags: ["IA"],
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
    "/ia/usuarios/whatsapp/{whatsapp}": {
      get: {
        summary: "Datos del usuario por WhatsApp + delegaciones activas del bot hacia ese usuario",
        tags: ["IA"],
        parameters: [
          { name: "whatsapp", in: "path", required: true, schema: { type: "string" }, example: "+5491112345678", description: "Número E.164" },
        ],
        responses: {
          200: { description: "OK — user_id, nombre, bodegas, delegaciones_activas, tiene_delegacion" },
          404: { description: "Usuario no encontrado con ese whatsapp" },
        },
      },
    },
    "/ia/usuarios/{userId}": {
      get: {
        summary: "Datos de un usuario por ID (incluye whatsapp)",
        tags: ["IA"],
        parameters: [{ name: "userId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "OK" }, 404: { description: "Usuario no encontrado o sin acceso" } },
      },
    },
    "/ia/consultas": {
      post: {
        summary: "Búsqueda transversal para responder preguntas del bot",
        tags: ["IA"],
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
            },
          },
        },
        responses: { 200: { description: "OK" } },
      },
    },
    "/ia/delegaciones": {
      post: {
        summary: "Crear delegación manualmente",
        tags: ["IA"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["botUserId", "scopes"],
                properties: {
                  botUserId: { type: "string", format: "uuid" },
                  bodegaId: { type: "string", format: "uuid" },
                  scopes: { type: "array", items: { type: "string" }, example: ["tareas.crear", "tareas.actualizar_estado"] },
                  expiresAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Delegación creada" } },
      },
    },
    "/ia/delegaciones/me": {
      get: {
        summary: "Listar delegaciones activas otorgadas por el usuario autenticado",
        tags: ["IA"],
        responses: { 200: { description: "OK" } },
      },
    },
    "/ia/delegaciones/solicitar": {
      post: {
        summary: "Solicitar delegación desde el chat — genera código de confirmación",
        tags: ["IA"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["whatsapp", "scopes"],
                properties: {
                  whatsapp: { type: "string", example: "+5491112345678" },
                  scopes: { type: "array", items: { type: "string" } },
                  bodegaId: { type: "string", format: "uuid" },
                  expiresAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Código generado" }, 404: { description: "Usuario no encontrado" } },
      },
    },
    "/ia/delegaciones/confirmar": {
      post: {
        summary: "Confirmar delegación con el código enviado por el encargado",
        tags: ["IA"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["whatsapp", "codigo"],
                properties: {
                  whatsapp: { type: "string", example: "+5491112345678" },
                  codigo: { type: "string", example: "847291" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Delegación creada" }, 400: { description: "Código inválido o expirado" } },
      },
    },
    "/ia/delegaciones/{botDelegationId}": {
      delete: {
        summary: "Revocar una delegación",
        tags: ["IA"],
        parameters: [{ name: "botDelegationId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Delegación revocada" }, 403: { description: "Sin permiso" }, 404: { description: "No encontrada" } },
      },
    },
  },
} as const;

export default openapiSpec;
