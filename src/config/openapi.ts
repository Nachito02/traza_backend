const uuidParam = (name: string, description?: string) => ({
  name,
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
  ...(description ? { description } : {}),
});

const stringPathParam = (name: string, description?: string) => ({
  name,
  in: "path",
  required: true,
  schema: { type: "string" },
  ...(description ? { description } : {}),
});

const queryParam = (name: string, description?: string) => ({
  name,
  in: "query",
  required: false,
  schema: { type: "string" },
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

const createReadonlyCollectionPath = (
  tag: string,
  pluralLabel: string,
  parameters: Record<string, unknown>[] = [],
) => ({
  get: {
    summary: `Listar ${pluralLabel}`,
    tags: [tag],
    parameters,
    responses: { 200: { description: "OK" } },
  },
});

const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Traza Backend API",
    version: "1.0.0",
    description:
      "HTTP API for Traza backend services.\n\n📄 [Versión Markdown de esta documentación](/docs/api.md) — para pegar directo en un chat con un bot/IA. Se genera a partir de este mismo spec, así que siempre está al día.",
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
      LoteGenealogiaNode: {
        type: "object",
        description: "Nodo de un árbol genealógico de lotes. La raíz es el lote consultado; `hijos` son sus lotes ANTECESORES (de dónde viene, no a dónde va) — un lote de ingreso es hoja (`hijos: []`), un lote de corte tiene un hijo por cada lote que lo compone.",
        properties: {
          lote_id: { type: "string", format: "uuid" },
          codigo: { type: "string" },
          origen: { type: "string", enum: ["ingreso", "corte"] },
          porcentaje_en_padre: { type: "number", nullable: true, description: "% que este lote aportó al lote padre (null en la raíz)" },
          cuartel: {
            type: "object",
            nullable: true,
            description: "Solo presente si `origen` es \"ingreso\": el cuartel del que salió la uva.",
            properties: {
              cuartel_id: { type: "string", format: "uuid" },
              codigo_cuartel: { type: "string" },
              finca: {
                type: "object",
                properties: { finca_id: { type: "string", format: "uuid" }, nombre_finca: { type: "string" } },
              },
            },
          },
          cius: {
            type: "array",
            items: { type: "object", properties: { ciu_id: { type: "string", format: "uuid" }, codigo_ciu: { type: "string" } } },
          },
          hijos: { type: "array", items: { $ref: "#/components/schemas/LoteGenealogiaNode" } },
        },
      },
      CiuContribucion: {
        type: "object",
        description: "Cuánto aportó un CIU (certificado de ingreso de uva) puntual al lote raíz consultado, arrastrando porcentajes a través de todos los cortes intermedios.",
        properties: {
          ciu_id: { type: "string", format: "uuid" },
          codigo_ciu: { type: "string" },
          lote_id: { type: "string", format: "uuid", description: "Lote de ingreso donde se originó este CIU" },
          lote_codigo: { type: "string" },
          porcentaje_efectivo: { type: "number", description: "% del lote raíz que proviene de este CIU específico" },
        },
      },
      LoteHistorialEvento: {
        type: "object",
        description: "Un evento en la vida de un lote dentro de la bodega. Discriminado por `kind`: origen_ingreso (llegó de finca), origen_corte (nació de un blend), movimiento_vasija (entró/salió/se transformó en una vasija), usado_en_corte (fue consumido por otro corte).",
        oneOf: [
          {
            type: "object",
            properties: {
              kind: { type: "string", enum: ["origen_ingreso"] },
              fecha: { type: "string", format: "date-time" },
              recepciones: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    codigo_ciu: { type: "string", nullable: true },
                    fecha_hora: { type: "string", format: "date-time" },
                    kg_pesados: { type: "number", nullable: true },
                  },
                },
              },
            },
          },
          {
            type: "object",
            properties: {
              kind: { type: "string", enum: ["origen_corte"] },
              fecha: { type: "string", format: "date-time" },
              corte_id: { type: "string", format: "uuid" },
              objetivo: { type: "string", nullable: true },
              componentes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    lote_id: { type: "string", format: "uuid" },
                    lote_codigo: { type: "string" },
                    porcentaje: { type: "number" },
                  },
                },
              },
            },
          },
          {
            type: "object",
            properties: {
              kind: { type: "string", enum: ["movimiento_vasija"] },
              fecha: { type: "string", format: "date-time" },
              vasija_codigo: { type: "string" },
              volumen_l: { type: "number" },
              cerrado: { type: "boolean", description: "true si ya no es el contenido activo de la vasija" },
              tipo_operacion: { type: "string", nullable: true, enum: ["ingreso", "fermentacion", "trasiego", "descube", "correccion", "corte_parcial", null] },
              observaciones: { type: "string", nullable: true },
              responsable: { type: "string", nullable: true },
              analisis: {
                type: "array",
                description: "Controles de fermentación (ControlFermentacion) tomados mientras este lote estuvo en esta vasija.",
                items: {
                  type: "object",
                  properties: {
                    fecha_hora: { type: "string", format: "date-time" },
                    densidad: { type: "number", nullable: true },
                    temperatura: { type: "number", nullable: true },
                    brix: { type: "number", nullable: true },
                    ph: { type: "number", nullable: true },
                    acidez: { type: "number", nullable: true },
                    estado_fermentacion: { type: "string", nullable: true },
                    observaciones: { type: "string", nullable: true },
                  },
                },
              },
              existencias: {
                type: "array",
                description: "Controles de existencia (ExistenciaVasija) tomados mientras este lote estuvo en esta vasija.",
                items: {
                  type: "object",
                  properties: {
                    fecha_hora: { type: "string", format: "date-time" },
                    volumen_l: { type: "number", nullable: true },
                    grado_alcohol: { type: "number", nullable: true },
                    azucar_residual_g_l: { type: "number", nullable: true },
                    observaciones: { type: "string", nullable: true },
                  },
                },
              },
            },
          },
          {
            type: "object",
            properties: {
              kind: { type: "string", enum: ["usado_en_corte"] },
              fecha: { type: "string", format: "date-time" },
              corte_id: { type: "string", format: "uuid" },
              lote_resultado_id: { type: "string", format: "uuid" },
              lote_resultado_codigo: { type: "string" },
              porcentaje: { type: "number" },
            },
          },
        ],
      },
      PublicAdjunto: {
        type: "object",
        description: "Archivo adjunto (foto, PDF, etc.) hosteado en IPFS.",
        properties: {
          cid: { type: "string" },
          url: { type: "string", format: "uri" },
          nombre: { type: "string" },
          tipo: { type: "string", description: "MIME type" },
          size: { type: "number" },
        },
      },
      PublicTarea: {
        type: "object",
        properties: {
          tarea_id: { type: "string", format: "uuid" },
          titulo: { type: "string" },
          descripcion: { type: "string", nullable: true },
          estado: { type: "string" },
          prioridad: { type: "string" },
          fecha_fin: { type: "string", format: "date-time", nullable: true },
          updated_at: { type: "string", format: "date-time" },
          created_at: { type: "string", format: "date-time" },
          proceso: {
            type: "object",
            nullable: true,
            properties: { nombre: { type: "string" }, tipo_evento: { type: "string" } },
          },
          asignaciones: {
            type: "array",
            items: {
              type: "object",
              properties: { estado: { type: "string" }, operario: { type: "string", nullable: true } },
            },
          },
          entradas: {
            type: "array",
            items: {
              type: "object",
              properties: {
                entrada_id: { type: "string", format: "uuid" },
                fecha: { type: "string", format: "date-time" },
                descripcion: { type: "string", nullable: true },
                registrado_por: { type: "string", nullable: true },
                adjuntos: { type: "array", items: { $ref: "#/components/schemas/PublicAdjunto" } },
              },
            },
          },
        },
      },
      PublicAnalisisRecepcion: {
        type: "object",
        description: "Análisis de laboratorio tomado en la recepción. `fuente` distingue el origen: carga manual (Análisis de recepción) vs. control de calidad/PCC (Control de calidad, con `estado_pcc`/`aprobado` en vez de `sanidad`).",
        properties: {
          fuente: { type: "string", enum: ["Análisis de recepción", "Control de calidad"] },
          brix: { type: "number", nullable: true },
          ph: { type: "number", nullable: true },
          acidez: { type: "number", nullable: true },
          temperatura_uva: { type: "number", nullable: true },
          sanidad: { type: "string", nullable: true, description: "Solo si fuente = Análisis de recepción" },
          estado_pcc: { type: "string", nullable: true, description: "Solo si fuente = Control de calidad" },
          aprobado: { type: "boolean", nullable: true, description: "Solo si fuente = Control de calidad" },
          observaciones: { type: "string", nullable: true },
        },
      },
      PublicRemitoUva: {
        type: "object",
        properties: {
          remito_uva_id: { type: "string", format: "uuid" },
          salida_finca: { type: "string", format: "date-time" },
          llegada_bodega: { type: "string", format: "date-time", nullable: true },
          kg_declarados: { type: "number", nullable: true },
          transportista: { type: "string", nullable: true },
          adjuntos: { type: "array", items: { $ref: "#/components/schemas/PublicAdjunto" } },
          recepciones: {
            type: "array",
            items: {
              type: "object",
              properties: {
                recepcion_bodega_id: { type: "string", format: "uuid" },
                fecha_hora: { type: "string", format: "date-time" },
                kg_pesados: { type: "number", nullable: true },
                clasificacion: { type: "string", nullable: true },
                analisis: { type: "array", items: { $ref: "#/components/schemas/PublicAnalisisRecepcion" } },
              },
            },
          },
        },
      },
      PublicCiu: {
        type: "object",
        properties: {
          ciu_id: { type: "string", format: "uuid" },
          codigo_ciu: { type: "string" },
          estado: { type: "string" },
          emitido_at: { type: "string", format: "date-time" },
          observaciones: { type: "string", nullable: true },
          variedad_nombre: { type: "string", nullable: true },
          tenor_azucarino_gl: { type: "number", nullable: true },
          uva_organica: { type: "boolean", nullable: true },
        },
      },
      PublicTrazabilidadCuartel: {
        type: "object",
        description: "Toda la actividad de campo registrada para un cuartel: sus características, sus tareas, los remitos de uva que salieron de él y los CIU emitidos.",
        properties: {
          cuartel: {
            type: "object",
            properties: {
              cuartel_id: { type: "string", format: "uuid" },
              codigo_cuartel: { type: "string" },
              cultivo: { type: "string", nullable: true },
              variedad: { type: "string", nullable: true },
              tipo_variedad: { type: "string", nullable: true },
              superficie_ha: { type: "number", nullable: true },
              sistema_riego: { type: "string", nullable: true },
              sistema_productivo: { type: "string", nullable: true },
              sistema_conduccion: { type: "string", nullable: true },
              poligono: { type: "object", nullable: true, description: "GeoJSON Polygon" },
              centroide: {
                type: "object",
                nullable: true,
                properties: { lat: { type: "number" }, lng: { type: "number" } },
              },
              finca: {
                type: "object",
                properties: {
                  finca_id: { type: "string", format: "uuid" },
                  nombre_finca: { type: "string" },
                  ubicacion_texto: { type: "string", nullable: true },
                  renspa: { type: "string", nullable: true },
                },
              },
            },
          },
          tareas: { type: "array", items: { $ref: "#/components/schemas/PublicTarea" } },
          remitos_uva: { type: "array", items: { $ref: "#/components/schemas/PublicRemitoUva" } },
          cius: { type: "array", items: { $ref: "#/components/schemas/PublicCiu" } },
        },
      },
      PublicProducto: {
        type: "object",
        description: "Trazabilidad pública completa de un producto embotellado, resuelta a partir del código QR de su envase: identifica el envase/lote de fraccionamiento, el corte del que salió, toda la genealogía de lotes que lo componen, las fincas/cuarteles de origen (con su actividad completa) y el historial de bodega.",
        properties: {
          codigo_envase_id: { type: "string", format: "uuid" },
          codigo_qr: { type: "string" },
          codigo_lote_impreso: { type: "string", nullable: true },
          lote_fraccionamiento: {
            type: "object",
            properties: {
              lote_fraccionamiento_id: { type: "string", format: "uuid" },
              fecha: { type: "string", format: "date-time" },
              botellas: { type: "number", nullable: true },
              formato: { type: "string", nullable: true },
            },
          },
          producto: {
            type: "object",
            properties: {
              producto_id: { type: "string", format: "uuid" },
              nombre_comercial: { type: "string" },
              varietal: { type: "string", nullable: true },
              anio: { type: "number", nullable: true },
              tipo: { type: "string", nullable: true },
            },
          },
          corte: {
            type: "object",
            properties: {
              corte_id: { type: "string", format: "uuid" },
              fecha: { type: "string", format: "date-time" },
              objetivo: { type: "string", nullable: true },
            },
          },
          genealogia: { type: "array", items: { $ref: "#/components/schemas/LoteGenealogiaNode" }, description: "Un árbol por cada lote raíz que compone el corte final." },
          cius: { type: "array", items: { $ref: "#/components/schemas/CiuContribucion" } },
          cuarteles: { type: "array", items: { $ref: "#/components/schemas/PublicTrazabilidadCuartel" }, description: "Una entrada por cada cuartel de origen involucrado en el blend." },
          historial: { type: "array", items: { $ref: "#/components/schemas/LoteHistorialEvento" }, description: "Qué pasó en la bodega con los lotes de origen y el corte resultante." },
        },
      },
      PublicLote: {
        type: "object",
        description: "Trazabilidad pública de un lote puntual (todavía no fraccionado en producto, o un lote intermedio del blend) — misma forma que PublicProducto pero sin envase.",
        properties: {
          lote_id: { type: "string", format: "uuid" },
          codigo: { type: "string" },
          origen: { type: "string", enum: ["ingreso", "corte"] },
          genealogia: { $ref: "#/components/schemas/LoteGenealogiaNode" },
          cius: { type: "array", items: { $ref: "#/components/schemas/CiuContribucion" } },
          cuarteles: { type: "array", items: { $ref: "#/components/schemas/PublicTrazabilidadCuartel" } },
          historial: { type: "array", items: { $ref: "#/components/schemas/LoteHistorialEvento" } },
          producto: {
            type: "object",
            nullable: true,
            description: "Si ya existe un Producto creado con este lote como origen, aunque todavía no se haya fraccionado en envases.",
            properties: {
              producto_id: { type: "string", format: "uuid" },
              nombre_comercial: { type: "string" },
              varietal: { type: "string", nullable: true },
              anio: { type: "number", nullable: true },
              tipo: { type: "string", nullable: true },
            },
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/auth/login": {
      post: {
        tags: ["Auth"],
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
        tags: ["Auth"],
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
        tags: ["Auth"],
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
        tags: ["Auth"],
        summary: "Refresh token",
        security: [],
        responses: { 200: { description: "OK" } },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout",
        responses: { 200: { description: "OK" } },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
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
        tags: ["Auth"],
        summary: "Current user bodegas",
        responses: { 200: { description: "OK" } },
      },
    },
    "/auth/me/roles": {
      get: {
        tags: ["Auth"],
        summary: "Current user roles",
        responses: { 200: { description: "OK" } },
      },
    },
    "/auth/users": {
      get: {
        tags: ["Auth"],
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
        tags: ["Auth"],
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
        tags: ["Auth"],
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
        tags: ["Auth"],
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
        tags: ["Auth"],
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
        tags: ["Auth"],
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
        tags: ["Auth"],
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
        tags: ["Auth"],
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
        tags: ["Auth"],
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
    "/bodegas/{bodegaId}/productores": {
      get: {
        summary: "Listar productores vinculados a una bodega",
        tags: ["Bodegas"],
        parameters: [uuidParam("bodegaId")],
        responses: { 200: { description: "OK" } },
      },
      post: {
        summary: "Vincular productor a una bodega",
        tags: ["Bodegas"],
        parameters: [uuidParam("bodegaId")],
        requestBody: genericJsonBody,
        responses: { 200: { description: "OK" }, 404: { description: "No encontrado" } },
      },
    },
    "/productores": createCrudCollectionPath("Productores", "productores", "productor"),
    "/productores/{productorId}": createCrudItemPath("Productores", "productor", "productorId"),
    "/fincas": {
      get: {
        tags: ["Fincas"],
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
        tags: ["Fincas"],
        summary: "Create finca",
        responses: { 201: { description: "Created" } },
      },
    },
    "/fincas/bodega/{bodegaId}": {
      get: {
        tags: ["Fincas"],
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
      get: {
        tags: ["Fincas"],
        summary: "Obtener finca por ID",
        parameters: [uuidParam("fincaId")],
        responses: { 200: { description: "OK" }, 404: { description: "Not found" } },
      },
      patch: {
        tags: ["Fincas"],
        summary: "Actualizar finca",
        parameters: [uuidParam("fincaId")],
        requestBody: genericJsonBody,
        responses: { 200: { description: "OK" }, 404: { description: "Not found" } },
      },
      delete: {
        tags: ["Fincas"],
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
        tags: ["Cuarteles"],
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
                  cultivo: { type: "string", enum: ["Vid"], example: "Vid" },
                  tipo_variedad: { type: "string", enum: ["tinta", "blanca", "rosada"], example: "tinta" },
                  variedad: { type: "string", enum: ["malbec", "bonarda", "cabernet_sauvignon", "syrah", "merlot", "tempranillo", "pinot_noir", "sangiovese", "aspiran_bouschet", "pedro_gimenez", "torrontes_riojano", "torrontes_sanjuanino", "chardonnay", "sauvignon_blanc", "chenin", "semillon", "viognier", "ugni_blanc", "cereza", "criolla_grande", "moscatel_rosado"], example: "malbec" },
                  sistema_riego: {
                    type: "string",
                    enum: ["goteo", "surco", "aspersion", "microaspersion", "secano"],
                    example: "goteo",
                  },
                  sistema_productivo: {
                    type: "string",
                    enum: ["convencional", "organico_ecologico", "regenerativo", "labranza_cero_cobertura_vegetal", "biodinamica"],
                    example: "organico_ecologico",
                    description: "Manejo de cultivo",
                  },
                  sistema_conduccion: {
                    type: "string",
                    enum: ["espaldera", "parral", "vaso", "guyot", "cordon_bilateral_doble_cordon", "cordon_unilateral"],
                    example: "espaldera",
                  },
                  cantidad_hileras: { type: "integer", example: 42 },
                  largo_hileras_m: { type: "number", example: 120 },
                  densidad_hileras: { type: "number", example: 2.5 },
                  distancia_plantacion: { type: "string", example: "2.5 x 1.2 m" },
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
        tags: ["Cuarteles"],
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
        tags: ["Cuarteles"],
        summary: "Obtener cuartel por ID",
        parameters: [uuidParam("cuartelId")],
        responses: { 200: { description: "OK" }, 404: { description: "No encontrado" } },
      },
      patch: {
        tags: ["Cuarteles"],
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
                  cultivo: { type: "string", enum: ["Vid"], example: "Vid" },
                  tipo_variedad: { type: "string", enum: ["tinta", "blanca", "rosada"], example: "tinta" },
                  variedad: { type: "string", enum: ["malbec", "bonarda", "cabernet_sauvignon", "syrah", "merlot", "tempranillo", "pinot_noir", "sangiovese", "aspiran_bouschet", "pedro_gimenez", "torrontes_riojano", "torrontes_sanjuanino", "chardonnay", "sauvignon_blanc", "chenin", "semillon", "viognier", "ugni_blanc", "cereza", "criolla_grande", "moscatel_rosado"], example: "malbec" },
                  sistema_riego: {
                    type: "string",
                    enum: ["goteo", "surco", "aspersion", "microaspersion", "secano"],
                    example: "goteo",
                  },
                  sistema_productivo: {
                    type: "string",
                    enum: ["convencional", "organico_ecologico", "regenerativo", "labranza_cero_cobertura_vegetal", "biodinamica"],
                    example: "organico_ecologico",
                    description: "Manejo de cultivo",
                  },
                  sistema_conduccion: {
                    type: "string",
                    enum: ["espaldera", "parral", "vaso", "guyot", "cordon_bilateral_doble_cordon", "cordon_unilateral"],
                    example: "espaldera",
                  },
                  cantidad_hileras: { type: "integer", example: 42 },
                  largo_hileras_m: { type: "number", example: 120 },
                  densidad_hileras: { type: "number", example: 2.5 },
                  distancia_plantacion: { type: "string", example: "2.5 x 1.2 m" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "OK" }, 404: { description: "No encontrado" } },
      },
      delete: {
        tags: ["Cuarteles"],
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
    "/campanias/{campaniaId}": {
      get: {
        summary: "Obtener campaña por ID",
        tags: ["Campañas"],
        parameters: [uuidParam("campaniaId")],
        responses: { 200: { description: "OK" }, 404: { description: "No encontrada" } },
      },
      patch: {
        summary: "Actualizar campaña",
        tags: ["Campañas"],
        parameters: [uuidParam("campaniaId")],
        requestBody: genericJsonBody,
        responses: { 200: { description: "OK" }, 404: { description: "No encontrada" } },
      },
      delete: {
        summary: "Eliminar campaña",
        tags: ["Campañas"],
        parameters: [uuidParam("campaniaId")],
        responses: { 200: { description: "OK" }, 404: { description: "No encontrada" } },
      },
    },
    "/protocolos": {
      get: {
        summary: "List protocolos",
        responses: { 200: { description: "OK" } },
      },
      post: {
        summary: "Crear protocolo",
        tags: ["Protocolos"],
        requestBody: genericJsonBody,
        responses: { 201: { description: "Creado" }, 400: { description: "Bad request" } },
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
      put: {
        summary: "Actualizar protocolo",
        tags: ["Protocolos"],
        parameters: [uuidParam("protocoloId")],
        requestBody: genericJsonBody,
        responses: {
          200: { description: "OK" },
          404: { description: "Protocolo no encontrado" },
        },
      },
      delete: {
        summary: "Eliminar protocolo",
        tags: ["Protocolos"],
        parameters: [uuidParam("protocoloId")],
        responses: {
          200: { description: "OK" },
          404: { description: "Protocolo no encontrado" },
          409: { description: "Conflicto: protocolo con datos relacionados" },
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
    "/protocolos/{protocoloId}/etapas": {
      post: {
        summary: "Crear etapa dentro de un protocolo",
        tags: ["Protocolos"],
        parameters: [uuidParam("protocoloId")],
        requestBody: genericJsonBody,
        responses: { 201: { description: "Creada" }, 404: { description: "Protocolo no encontrado" } },
      },
    },
    "/protocolos/etapas/{etapaId}": {
      put: {
        summary: "Actualizar etapa de protocolo",
        tags: ["Protocolos"],
        parameters: [uuidParam("etapaId")],
        requestBody: genericJsonBody,
        responses: { 200: { description: "OK" }, 404: { description: "Etapa no encontrada" } },
      },
      delete: {
        summary: "Eliminar etapa de protocolo",
        tags: ["Protocolos"],
        parameters: [uuidParam("etapaId")],
        responses: { 200: { description: "OK" }, 404: { description: "Etapa no encontrada" } },
      },
    },
    "/protocolos/etapas/{etapaId}/procesos": {
      post: {
        summary: "Crear proceso dentro de una etapa",
        tags: ["Protocolos"],
        parameters: [uuidParam("etapaId")],
        requestBody: genericJsonBody,
        responses: { 201: { description: "Creado" }, 404: { description: "Etapa no encontrada" } },
      },
    },
    "/protocolos/procesos/{procesoId}": {
      put: {
        summary: "Actualizar proceso de protocolo",
        tags: ["Protocolos"],
        parameters: [uuidParam("procesoId")],
        requestBody: genericJsonBody,
        responses: { 200: { description: "OK" }, 404: { description: "Proceso no encontrado" } },
      },
      delete: {
        summary: "Eliminar proceso de protocolo",
        tags: ["Protocolos"],
        parameters: [uuidParam("procesoId")],
        responses: { 200: { description: "OK" }, 404: { description: "Proceso no encontrado" } },
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
    "/trazabilidades/codigo-envase/{codigoQr}/inversa": {
      get: {
        summary: "Trazabilidad inversa por código de envase",
        tags: ["Trazabilidades"],
        parameters: [stringPathParam("codigoQr", "Código QR o identificador de envase")],
        responses: { 200: { description: "OK" }, 404: { description: "No encontrada" } },
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
    "/operarios/bodega/{bodegaId}": {
      get: {
        summary: "Listar operarios de una bodega",
        tags: ["Operarios"],
        parameters: [uuidParam("bodegaId")],
        responses: { 200: { description: "OK" } },
      },
      post: {
        summary: "Crear operario dentro de una bodega",
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
        summary: "Indica si el usuario puede gestionar órdenes de trabajo",
        tags: ["Tareas"],
        responses: { 200: { description: "OK" } },
      },
    },
    "/tareas/me/asignaciones": {
      get: {
        summary: "Listar asignaciones del usuario autenticado",
        tags: ["Tareas"],
        responses: { 200: { description: "OK" } },
      },
    },
    "/tareas/mis-pendientes": {
      get: {
        summary: "Listar órdenes pendientes del usuario autenticado",
        tags: ["Tareas"],
        responses: { 200: { description: "OK" } },
      },
    },
    "/tareas/bodega/{bodegaId}/pendientes": {
      get: {
        summary: "Listar órdenes pendientes de una bodega",
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
        requestBody: genericJsonBody,
        responses: { 200: { description: "OK" }, 404: { description: "No encontrada" } },
      },
    },
    "/tareas/me/asignaciones/{tareaAsignacionId}/entradas": {
      get: {
        summary: "Listar registros operativos de una asignación",
        tags: ["Tareas"],
        parameters: [uuidParam("tareaAsignacionId")],
        responses: { 200: { description: "OK" }, 404: { description: "No encontrada" } },
      },
      post: {
        summary: "Crear registro operativo para una asignación",
        tags: ["Tareas"],
        parameters: [uuidParam("tareaAsignacionId")],
        requestBody: genericJsonBody,
        responses: { 201: { description: "Creado" }, 404: { description: "No encontrada" } },
      },
    },
    "/tareas/me/asignaciones/{tareaAsignacionId}/finalizar": {
      post: {
        summary: "Finalizar asignación propia",
        tags: ["Tareas"],
        parameters: [uuidParam("tareaAsignacionId")],
        requestBody: genericJsonBody,
        responses: { 200: { description: "OK" }, 404: { description: "No encontrada" } },
      },
    },
    "/tareas": createCrudCollectionPath("Tareas", "órdenes de trabajo", "orden de trabajo"),
    "/tareas/{tareaId}/asignaciones": {
      post: {
        summary: "Agregar asignaciones a una orden de trabajo",
        tags: ["Tareas"],
        parameters: [uuidParam("tareaId")],
        requestBody: genericJsonBody,
        responses: { 201: { description: "Creado" }, 404: { description: "Tarea no encontrada" } },
      },
    },
    "/tareas/{tareaId}/asignar": {
      patch: {
        summary: "Asignar orden de trabajo (compatibilidad)",
        tags: ["Tareas"],
        parameters: [uuidParam("tareaId")],
        requestBody: genericJsonBody,
        responses: { 200: { description: "OK" }, 404: { description: "Tarea no encontrada" } },
      },
      post: {
        summary: "Asignar orden de trabajo",
        tags: ["Tareas"],
        parameters: [uuidParam("tareaId")],
        requestBody: genericJsonBody,
        responses: { 200: { description: "OK" }, 404: { description: "Tarea no encontrada" } },
      },
    },
    "/tareas/{tareaId}/cancelar": {
      patch: {
        summary: "Cancelar orden de trabajo",
        tags: ["Tareas"],
        parameters: [uuidParam("tareaId")],
        requestBody: genericJsonBody,
        responses: { 200: { description: "OK" }, 404: { description: "Tarea no encontrada" } },
      },
    },
    "/tareas/{tareaId}/completar": {
      patch: {
        summary: "Completar orden de trabajo",
        tags: ["Tareas"],
        parameters: [uuidParam("tareaId")],
        requestBody: genericJsonBody,
        responses: { 200: { description: "OK" }, 404: { description: "Tarea no encontrada" } },
      },
    },
    "/tareas/{tareaId}/validar": {
      patch: {
        summary: "Validar orden de trabajo completada",
        tags: ["Tareas"],
        parameters: [uuidParam("tareaId")],
        requestBody: genericJsonBody,
        responses: { 200: { description: "OK" }, 404: { description: "Tarea no encontrada" } },
      },
    },
    "/tareas/{tareaId}": {
      delete: {
        summary: "Eliminar orden de trabajo",
        tags: ["Tareas"],
        parameters: [uuidParam("tareaId")],
        responses: { 200: { description: "Eliminada" }, 404: { description: "Tarea no encontrada" } },
      },
    },
    "/tareas/registro": {
      post: {
        summary: "Registrar actividad libre (fuera del flujo de asignaciones)",
        tags: ["Tareas"],
        requestBody: genericJsonBody,
        responses: { 201: { description: "Creado" }, 400: { description: "Bad request" } },
      },
    },
    "/tareas/entradas/{entradaId}": {
      patch: {
        summary: "Corregir un registro operativo (tarea_entrada)",
        tags: ["Tareas"],
        parameters: [uuidParam("entradaId")],
        requestBody: genericJsonBody,
        responses: { 200: { description: "OK" }, 404: { description: "No encontrada" } },
      },
    },
    "/tareas/entradas/{entradaId}/adjuntos": {
      post: {
        summary: "Subir un adjunto (imagen/video/documento) a un registro operativo",
        description: "Sube el archivo a IPFS y guarda el CID en `adjuntos` de la tarea_entrada. `multipart/form-data`, campo `imagen`.",
        tags: ["Tareas"],
        parameters: [uuidParam("entradaId")],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: { imagen: { type: "string", format: "binary" } },
                required: ["imagen"],
              },
            },
          },
        },
        responses: { 201: { description: "Adjunto guardado" }, 400: { description: "Tipo de archivo no permitido" } },
      },
    },
    "/cumplimiento/hallazgos": {
      get: {
        summary: "Listar hallazgos de cumplimiento",
        tags: ["Cumplimiento"],
        parameters: [
          queryParam("bodegaId", "Filtra por bodega"),
          queryParam("estado", "Filtra por estado del hallazgo"),
          queryParam("severidad", "Filtra por severidad"),
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/cumplimiento/hallazgos/{id}/resolver": {
      post: {
        summary: "Resolver hallazgo de cumplimiento",
        tags: ["Cumplimiento"],
        parameters: [uuidParam("id", "ID del hallazgo")],
        requestBody: genericJsonBody,
        responses: { 200: { description: "OK" }, 404: { description: "No encontrado" } },
      },
    },
    "/cumplimiento/hallazgos/{id}/aceptar": {
      post: {
        summary: "Aceptar hallazgo de cumplimiento",
        tags: ["Cumplimiento"],
        parameters: [uuidParam("id", "ID del hallazgo")],
        requestBody: genericJsonBody,
        responses: { 200: { description: "OK" }, 404: { description: "No encontrado" } },
      },
    },
    "/cumplimiento/indicadores": {
      get: {
        summary: "Indicadores generales de cumplimiento",
        tags: ["Cumplimiento"],
        parameters: [queryParam("bodegaId", "Filtra por bodega")],
        responses: { 200: { description: "OK" } },
      },
    },
    "/cumplimiento/indicadores/lote/{loteId}": {
      get: {
        summary: "Indicadores de cumplimiento por lote de cosecha",
        tags: ["Cumplimiento"],
        parameters: [uuidParam("loteId", "ID del lote de cosecha")],
        responses: { 200: { description: "OK" }, 404: { description: "No encontrado" } },
      },
    },
    "/cumplimiento/lotes/{loteId}/historia": {
      get: {
        summary: "Historial trazable de un lote de cosecha",
        tags: ["Cumplimiento"],
        parameters: [uuidParam("loteId", "ID del lote de cosecha")],
        responses: { 200: { description: "OK" }, 404: { description: "No encontrado" } },
      },
    },
    "/elaboracion/vasijas": createCrudCollectionPath("Elaboración", "vasijas", "vasija"),
    "/elaboracion/vasijas/{id}": createCrudItemPath("Elaboración", "vasija"),
    "/elaboracion/vasijas/{id}/composicion-actual": {
      get: {
        summary: "Composición actual de la vasija (qué lotes tiene adentro y en qué proporción)",
        tags: ["Elaboración"],
        parameters: [uuidParam("id")],
        responses: { 200: { description: "OK" }, 404: { description: "No encontrada" } },
      },
    },
    "/elaboracion/cortes": createCrudCollectionPath("Elaboración", "cortes", "corte"),
    "/elaboracion/cortes/{id}": createCrudItemPath("Elaboración", "corte"),
    "/elaboracion/productos": createCrudCollectionPath("Elaboración", "productos", "producto"),
    "/elaboracion/productos/{id}": createCrudItemPath("Elaboración", "producto"),
    "/elaboracion/lotes-fraccionamiento": createCrudCollectionPath(
      "Elaboración",
      "lotes de fraccionamiento",
      "lote de fraccionamiento",
    ),
    "/elaboracion/lotes-fraccionamiento/{id}": createCrudItemPath(
      "Elaboración",
      "lote de fraccionamiento",
    ),
    "/elaboracion/codigos-envase": createCrudCollectionPath(
      "Elaboración",
      "códigos de envase",
      "código de envase",
    ),
    "/elaboracion/codigos-envase/{id}": createCrudItemPath("Elaboración", "código de envase"),
    "/elaboracion/lotes-cosecha": createReadonlyCollectionPath("Elaboración", "lotes de cosecha", [
      queryParam("bodegaId", "Filtra por bodega"),
      queryParam("fincaId", "Filtra por finca"),
      queryParam("cuartelId", "Filtra por cuartel"),
    ]),
    "/elaboracion/remitos-uva": createCrudCollectionPath("Elaboración", "remitos de uva", "remito de uva"),
    "/elaboracion/remitos-uva/{id}": createCrudItemPath("Elaboración", "remito de uva"),
    "/elaboracion/remitos-uva/{id}/impacto-borrado": {
      get: {
        summary: "Previsualizar impacto de eliminar un remito (registros relacionados que se perderían)",
        tags: ["Elaboración"],
        parameters: [uuidParam("id")],
        responses: { 200: { description: "OK" }, 404: { description: "No encontrado" } },
      },
    },
    "/elaboracion/remitos-uva/{id}/adjuntos": {
      post: {
        summary: "Subir una foto de comprobante a un remito de uva",
        description: "Sube la imagen a IPFS y la agrega a `adjuntos` del remito. `multipart/form-data`, campo `imagen`. Solo imágenes.",
        tags: ["Elaboración"],
        parameters: [uuidParam("id")],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: { imagen: { type: "string", format: "binary" } },
                required: ["imagen"],
              },
            },
          },
        },
        responses: { 201: { description: "Adjunto guardado" }, 400: { description: "Tipo de archivo no permitido" } },
      },
    },
    "/elaboracion/recepciones-bodega": createCrudCollectionPath(
      "Elaboración",
      "recepciones de bodega",
      "recepción de bodega",
    ),
    "/elaboracion/recepciones-bodega/{id}": createCrudItemPath("Elaboración", "recepción de bodega"),
    "/elaboracion/recepciones-bodega/{id}/impacto-borrado": {
      get: {
        summary: "Previsualizar impacto de eliminar una recepción de bodega",
        tags: ["Elaboración"],
        parameters: [uuidParam("id")],
        responses: { 200: { description: "OK" }, 404: { description: "No encontrada" } },
      },
    },
    "/elaboracion/analisis-recepcion": createCrudCollectionPath(
      "Elaboración",
      "análisis de recepción",
      "análisis de recepción",
    ),
    "/elaboracion/analisis-recepcion/{id}": createCrudItemPath("Elaboración", "análisis de recepción"),
    "/elaboracion/operaciones-vasija": createCrudCollectionPath(
      "Elaboración",
      "operaciones de vasija",
      "operación de vasija",
    ),
    "/elaboracion/operaciones-vasija/{id}": createCrudItemPath("Elaboración", "operación de vasija"),
    "/elaboracion/operaciones-vasija/{id}/impacto-borrado": {
      get: {
        summary: "Previsualizar impacto de eliminar una operación de vasija",
        tags: ["Elaboración"],
        parameters: [uuidParam("id")],
        responses: { 200: { description: "OK" }, 404: { description: "No encontrada" } },
      },
    },
    "/elaboracion/despachos": createCrudCollectionPath("Elaboración", "despachos", "despacho"),
    "/elaboracion/despachos/{id}": createCrudItemPath("Elaboración", "despacho"),
    "/elaboracion/cius": createCrudCollectionPath("Elaboración", "CIU", "CIU"),
    "/elaboracion/cius/{id}": createCrudItemPath("Elaboración", "CIU"),
    "/elaboracion/qc-ingreso-uva": createCrudCollectionPath(
      "Elaboración",
      "controles QC de ingreso de uva",
      "control QC de ingreso de uva",
    ),
    "/elaboracion/qc-ingreso-uva/{id}": createCrudItemPath("Elaboración", "control QC de ingreso de uva"),
    "/elaboracion/existencias-vasija": createCrudCollectionPath(
      "Elaboración",
      "existencias de vasija",
      "existencia de vasija",
    ),
    "/elaboracion/existencias-vasija/{id}": createCrudItemPath("Elaboración", "existencia de vasija"),
    "/elaboracion/controles-fermentacion": createCrudCollectionPath(
      "Elaboración",
      "controles de fermentación",
      "control de fermentación",
    ),
    "/elaboracion/controles-fermentacion/{id}": createCrudItemPath("Elaboración", "control de fermentación"),

    // ── Lotes (montado bajo el prefijo /elaboracion, ver routes/index.ts) ──
    "/elaboracion/lotes": {
      get: {
        summary: "Listar lotes de una bodega",
        tags: ["Lotes"],
        parameters: [queryParam("bodegaId", "Requerido")],
        responses: { 200: { description: "OK" }, 400: { description: "bodegaId requerido" } },
      },
      post: {
        summary: "Crear lote de ingreso (a partir de recepciones de bodega)",
        tags: ["Lotes"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["bodegaId", "campaniaId", "recepcionBodegaIds"],
                properties: {
                  bodegaId: { type: "string", format: "uuid" },
                  campaniaId: { type: "string", format: "uuid" },
                  recepcionBodegaIds: { type: "array", items: { type: "string", format: "uuid" } },
                  observaciones: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Creado" }, 400: { description: "Bad request" } },
      },
    },
    "/elaboracion/lotes/blend": {
      post: {
        summary: "Crear un corte/blend: consumir volumen de vasijas fuente y crear el lote resultado en una o más vasijas destino",
        description: "`fuentes` son las vasijas de las que se saca volumen (pueden pertenecer a distintos lotes de origen); `destinos` son una o más vasijas donde se deposita el lote nuevo — la suma de `destinos` debe igualar la suma de `fuentes` (con tolerancia de redondeo).",
        tags: ["Lotes"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["bodegaId", "fecha", "fuentes", "destinos"],
                properties: {
                  bodegaId: { type: "string", format: "uuid" },
                  fecha: { type: "string", format: "date-time" },
                  campaniaId: { type: "string", format: "uuid" },
                  objetivo: { type: "string" },
                  responsableUserId: { type: "string", format: "uuid" },
                  observaciones: { type: "string" },
                  fuentes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: { vasijaId: { type: "string", format: "uuid" }, volumenL: { type: "number" } },
                    },
                  },
                  destinos: {
                    type: "array",
                    description: "Al menos una vasija destino, vacía o compatible.",
                    items: {
                      type: "object",
                      properties: { vasijaId: { type: "string", format: "uuid" }, volumenL: { type: "number" } },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Corte creado, con el lote resultado" }, 400: { description: "Bad request" } },
      },
    },
    "/elaboracion/lotes/{id}": {
      get: {
        summary: "Obtener lote",
        tags: ["Lotes"],
        parameters: [uuidParam("id")],
        responses: { 200: { description: "OK" }, 404: { description: "No encontrado" } },
      },
      patch: {
        summary: "Actualizar lote (código, variedad, observaciones)",
        tags: ["Lotes"],
        parameters: [uuidParam("id")],
        requestBody: genericJsonBody,
        responses: { 200: { description: "OK" }, 404: { description: "No encontrado" } },
      },
      delete: {
        summary: "Eliminar lote",
        tags: ["Lotes"],
        parameters: [uuidParam("id")],
        responses: { 200: { description: "Eliminado" }, 404: { description: "No encontrado" } },
      },
    },
    "/elaboracion/lotes/{id}/genealogia": {
      get: {
        summary: "Árbol genealógico del lote (de dónde viene) y contribución de cada CIU",
        tags: ["Lotes"],
        parameters: [uuidParam("id")],
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    genealogia: { $ref: "#/components/schemas/LoteGenealogiaNode" },
                    cius: { type: "array", items: { $ref: "#/components/schemas/CiuContribucion" } },
                  },
                },
              },
            },
          },
          404: { description: "No encontrado" },
        },
      },
    },
    "/elaboracion/lotes/{id}/historial": {
      get: {
        summary: "Historial de eventos de bodega del lote (ingreso/corte de origen, movimientos de vasija, usos en otros cortes)",
        tags: ["Lotes"],
        parameters: [uuidParam("id")],
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/LoteHistorialEvento" } },
              },
            },
          },
          404: { description: "No encontrado" },
        },
      },
    },
    "/elaboracion/lotes/{id}/cius-export": {
      get: {
        summary: "Descargar el listado de CIU del lote (para reportar al INV)",
        description: "Devuelve un archivo de texto plano (`Content-Disposition: attachment`), no JSON.",
        tags: ["Lotes"],
        parameters: [uuidParam("id")],
        responses: { 200: { description: "OK", content: { "text/plain": { schema: { type: "string" } } } }, 404: { description: "No encontrado" } },
      },
    },
    "/elaboracion/lotes/{id}/impacto-borrado": {
      get: {
        summary: "Previsualizar impacto de eliminar un lote (registros relacionados que se perderían)",
        tags: ["Lotes"],
        parameters: [uuidParam("id")],
        responses: { 200: { description: "OK" }, 404: { description: "No encontrado" } },
      },
    },
    "/elaboracion/recepciones-bodega/para-lote": {
      get: {
        summary: "Listar recepciones de bodega disponibles para armar un lote de ingreso nuevo",
        tags: ["Lotes"],
        parameters: [queryParam("bodegaId", "Requerido")],
        responses: { 200: { description: "OK" }, 400: { description: "bodegaId requerido" } },
      },
    },

    // ── Público (sin auth — consumido desde la página de trazabilidad accedida por QR) ──
    "/public/trazabilidad/cuartel/{cuartelId}": {
      get: {
        summary: "Trazabilidad pública de un cuartel: sus características y toda su actividad de campo",
        tags: ["Público"],
        security: [],
        parameters: [uuidParam("cuartelId")],
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/PublicTrazabilidadCuartel" } } } },
          404: { description: "No encontrado" },
        },
      },
    },
    "/public/producto/{codigoQr}": {
      get: {
        summary: "Trazabilidad pública completa de un producto embotellado, a partir del código QR de su envase",
        description: "Punto de entrada de la página que se abre al escanear el QR de una botella. Combina genealogía de lotes, fincas/cuarteles de origen con toda su actividad, y el historial de bodega.",
        tags: ["Público"],
        security: [],
        parameters: [stringPathParam("codigoQr")],
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/PublicProducto" } } } },
          404: { description: "No encontrado" },
        },
      },
    },
    "/public/lote/{loteId}": {
      get: {
        summary: "Trazabilidad pública de un lote puntual (aún no fraccionado en producto, o un lote intermedio del blend)",
        description: "Misma forma que /public/producto/{codigoQr} pero identificado por lote en vez de por envase — un lote puede tener trazabilidad pública (y un Producto asociado vía `lote_origen_id`) desde antes de fraccionarse: fraccionamiento y despacho son solo un evento más en su historia.",
        tags: ["Público"],
        security: [],
        parameters: [uuidParam("loteId")],
        responses: {
          200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/PublicLote" } } } },
          404: { description: "No encontrado" },
        },
      },
    },

    // ── Costos ──
    "/costos/tarifas/maquinaria": createCrudCollectionPath("Costos", "tarifas de maquinaria", "tarifa de maquinaria"),
    "/costos/tarifas/maquinaria/{id}": createCrudItemPath("Costos", "tarifa de maquinaria"),
    "/costos/tarifas/combustible": createCrudCollectionPath("Costos", "tarifas de combustible", "tarifa de combustible"),
    "/costos/tarifas/combustible/{id}": createCrudItemPath("Costos", "tarifa de combustible"),
    "/costos/insumos": {
      get: { summary: "Catálogo de insumos con costo (para autocompletar)", tags: ["Costos"], responses: { 200: { description: "OK" } } },
    },
    "/costos/actividades/sugerencias": {
      get: { summary: "Matriz completa de sugerencias de costo por actividad", tags: ["Costos"], responses: { 200: { description: "OK" } } },
    },
    "/costos/actividades/{clave}/sugerencias": {
      get: {
        summary: "Sugerencia de costo para una actividad puntual",
        tags: ["Costos"],
        parameters: [stringPathParam("clave")],
        responses: { 200: { description: "OK" }, 404: { description: "No encontrada" } },
      },
    },
    "/costos/tareas/{tareaId}": {
      get: {
        summary: "Costos capturados de una tarea (mano de obra, máquinas, insumos, contratistas)",
        tags: ["Costos"],
        parameters: [uuidParam("tareaId")],
        responses: { 200: { description: "OK" }, 404: { description: "No encontrada" } },
      },
    },
    "/costos/tareas/{tareaId}/ejecucion": {
      put: {
        summary: "Guardar horas/jornales ejecutados de una tarea",
        tags: ["Costos"],
        parameters: [uuidParam("tareaId")],
        requestBody: genericJsonBody,
        responses: { 200: { description: "OK" }, 404: { description: "No encontrada" } },
      },
    },
    "/costos/tareas/{tareaId}/maquinas": {
      post: {
        summary: "Agregar uso de máquina a una tarea",
        tags: ["Costos"],
        parameters: [uuidParam("tareaId")],
        requestBody: genericJsonBody,
        responses: { 201: { description: "Creado" }, 404: { description: "No encontrada" } },
      },
    },
    "/costos/maquinas/{id}": {
      delete: {
        summary: "Quitar uso de máquina de una tarea",
        tags: ["Costos"],
        parameters: [uuidParam("id")],
        responses: { 200: { description: "Eliminado" }, 404: { description: "No encontrado" } },
      },
    },
    "/costos/tareas/{tareaId}/insumos": {
      post: {
        summary: "Agregar consumo de insumo a una tarea",
        tags: ["Costos"],
        parameters: [uuidParam("tareaId")],
        requestBody: genericJsonBody,
        responses: { 201: { description: "Creado" }, 404: { description: "No encontrada" } },
      },
    },
    "/costos/insumos/{id}": {
      delete: {
        summary: "Quitar consumo de insumo de una tarea",
        tags: ["Costos"],
        parameters: [uuidParam("id")],
        responses: { 200: { description: "Eliminado" }, 404: { description: "No encontrado" } },
      },
    },
    "/costos/tareas/{tareaId}/contratistas": {
      post: {
        summary: "Agregar costo de contratista a una tarea",
        tags: ["Costos"],
        parameters: [uuidParam("tareaId")],
        requestBody: genericJsonBody,
        responses: { 201: { description: "Creado" }, 404: { description: "No encontrada" } },
      },
    },
    "/costos/contratistas/{id}": {
      delete: {
        summary: "Quitar costo de contratista de una tarea",
        tags: ["Costos"],
        parameters: [uuidParam("id")],
        responses: { 200: { description: "Eliminado" }, 404: { description: "No encontrado" } },
      },
    },
    "/costos/tareas/{tareaId}/recalcular": {
      post: {
        summary: "Recalcular el costo total de una tarea",
        tags: ["Costos"],
        parameters: [uuidParam("tareaId")],
        responses: { 200: { description: "OK" }, 404: { description: "No encontrada" } },
      },
    },
    "/costos/resumen/bodega": {
      get: { summary: "Resumen de costos de toda la bodega", tags: ["Costos"], responses: { 200: { description: "OK" } } },
    },
    "/costos/resumen/cuartel/{cuartelId}": {
      get: {
        summary: "Resumen de costos de un cuartel",
        tags: ["Costos"],
        parameters: [uuidParam("cuartelId")],
        responses: { 200: { description: "OK" }, 404: { description: "No encontrado" } },
      },
    },
    "/costos/resumen/cuartel/{cuartelId}/actividades": {
      get: {
        summary: "Detalle de actividades y su costo en un cuartel",
        tags: ["Costos"],
        parameters: [uuidParam("cuartelId")],
        responses: { 200: { description: "OK" }, 404: { description: "No encontrado" } },
      },
    },
    "/costos/resumen/campania/{campaniaId}": {
      get: {
        summary: "Resumen de costos de una campaña",
        tags: ["Costos"],
        parameters: [uuidParam("campaniaId")],
        responses: { 200: { description: "OK" }, 404: { description: "No encontrada" } },
      },
    },

    // ── Inventario (insumos con stock) ──
    "/inventario/maestro/categorias": {
      get: { summary: "Categorías del catálogo maestro de insumos", tags: ["Inventario"], responses: { 200: { description: "OK" } } },
    },
    "/inventario/maestro": {
      get: { summary: "Catálogo maestro global de insumos (referencia para autocompletar)", tags: ["Inventario"], responses: { 200: { description: "OK" } } },
    },
    "/inventario/insumos": createCrudCollectionPath("Inventario", "insumos", "insumo"),
    "/inventario/insumos/{id}": createCrudItemPath("Inventario", "insumo"),
    "/inventario/existencias": {
      get: { summary: "Stock actual de insumos", tags: ["Inventario"], responses: { 200: { description: "OK" } } },
    },
    "/inventario/movimientos/ingreso": {
      post: {
        summary: "Registrar ingreso de stock (compra)",
        tags: ["Inventario"],
        requestBody: genericJsonBody,
        responses: { 201: { description: "Creado" }, 400: { description: "Bad request" } },
      },
    },
    "/inventario/movimientos/ajuste": {
      post: {
        summary: "Registrar ajuste de stock (corrección manual)",
        tags: ["Inventario"],
        requestBody: genericJsonBody,
        responses: { 201: { description: "Creado" }, 400: { description: "Bad request" } },
      },
    },
    "/inventario/movimientos/{insumoId}": {
      get: {
        summary: "Historial de movimientos de un insumo",
        tags: ["Inventario"],
        parameters: [uuidParam("insumoId")],
        responses: { 200: { description: "OK" }, 404: { description: "No encontrado" } },
      },
    },
    "/inventario/alertas": {
      get: { summary: "Insumos por debajo de su stock mínimo", tags: ["Inventario"], responses: { 200: { description: "OK" } } },
    },

    // ── Recursos (maquinaria, herramientas, etc. — no consumibles) ──
    "/recursos/maestro/clases": {
      get: { summary: "Clases del catálogo maestro de recursos", tags: ["Recursos"], responses: { 200: { description: "OK" } } },
    },
    "/recursos/maestro/categorias": {
      get: { summary: "Categorías del catálogo maestro de recursos", tags: ["Recursos"], responses: { 200: { description: "OK" } } },
    },
    "/recursos/maestro": {
      get: { summary: "Catálogo maestro global de recursos (referencia para autocompletar)", tags: ["Recursos"], responses: { 200: { description: "OK" } } },
    },
    "/recursos": createCrudCollectionPath("Recursos", "recursos", "recurso"),
    "/recursos/{id}": createCrudItemPath("Recursos", "recurso"),

    // ── Personal (dotación fija de la bodega, distinto de operarios sin credenciales) ──
    "/personal": createCrudCollectionPath("Personal", "personal", "empleado"),
    "/personal/{id}": createCrudItemPath("Personal", "empleado"),
  },
} as const;

export default openapiSpec;
