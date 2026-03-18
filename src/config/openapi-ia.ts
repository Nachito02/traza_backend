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
        summary: "Identidad del bot autenticado y delegaciones activas",
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
        summary: "Cuarteles de una finca",
        parameters: [
          {
            name: "fincaId",
            in: "query",
            required: false,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { 200: { description: "OK" } },
      },
      post: {
        summary: "Crear cuartel en una finca (requiere delegación)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["fincaId", "codigoCuartel"],
                properties: {
                  fincaId: { type: "string", format: "uuid" },
                  codigoCuartel: { type: "string", example: "C-01", description: "Código único dentro de la finca" },
                  superficieHa: { type: "number", example: 3.5 },
                  cultivo: { type: "string", example: "Vid" },
                  variedad: { type: "string", example: "Malbec" },
                  sistemaProductivo: { type: "string", example: "Secano" },
                  sistemaConduccion: { type: "string", example: "Espaldera" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Cuartel creado" } },
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
    "/catalogos/trabajadores": {
      get: {
        summary: "Lista trabajadores de una bodega (usuarios registrados y sin acceso)",
        parameters: [
          {
            name: "bodegaId",
            in: "query",
            required: false,
            schema: { type: "string", format: "uuid" },
            description: "Filtra por bodega. Sin filtro devuelve todos.",
          },
        ],
        responses: {
          200: {
            description: "Lista de trabajadores",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string", format: "uuid" },
                      nombre: { type: "string" },
                      email: { type: "string", nullable: true },
                      whatsapp: { type: "string", nullable: true },
                      tieneAcceso: { type: "boolean", description: "true si puede hacer login" },
                      roles: { type: "array", items: { type: "string" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Crear trabajador con password temporal",
        description:
          "Crea un usuario con password aleatorio y `must_change_password: true`. " +
          "El bot debe enviarle el `passwordTemporal` al trabajador por WhatsApp para que pueda hacer su primer login y cambiarlo.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["nombre", "bodegaId", "rol"],
                properties: {
                  nombre: { type: "string" },
                  bodegaId: { type: "string", format: "uuid" },
                  rol: { type: "string", example: "operario_campo" },
                  whatsapp: { type: "string", example: "+5491112345678", description: "Formato E.164" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Trabajador creado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string", format: "uuid" },
                    nombre: { type: "string" },
                    email: { type: "string", nullable: true },
                    whatsapp: { type: "string", nullable: true },
                    tieneAcceso: { type: "boolean" },
                    must_change_password: { type: "boolean" },
                    passwordTemporal: { type: "string", description: "Enviar al trabajador por WhatsApp — deberá cambiarlo en el primer login" },
                    roles: { type: "array", items: { type: "string" } },
                  },
                },
              },
            },
          },
        },
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
    "/tareas": {
      get: {
        summary: "Lista de tareas visibles para el bot",
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
    "/tareas/iniciar": {
      post: {
        summary: "Iniciar creación de tarea desde WhatsApp (con auto-delegación)",
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
    "/tareas/{tareaAsignacionId}": {
      get: {
        summary: "Detalle resumido de una tarea",
        parameters: [uuidParam("tareaAsignacionId")],
        responses: { 200: { description: "OK" } },
      },
    },
    "/tareas/{tareaAsignacionId}/contexto": {
      get: {
        summary: "Contexto expandido para resolución de la tarea",
        parameters: [uuidParam("tareaAsignacionId")],
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    tarea: { type: "object", description: "Resumen de la tarea" },
                    eventoTipo: { type: "string", nullable: true, description: "Tipo de evento inferido del título/descripción de la tarea (o del milestone si existe)" },
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
    "/tareas/{tareaAsignacionId}/contactar": {
      post: {
        summary: "Registrar contacto del bot con el operario",
        parameters: [uuidParam("tareaAsignacionId")],
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
                message: "Hola, necesito ayudarte a completar la carga de la tarea.",
              },
            },
          },
        },
        responses: { 200: { description: "OK" } },
      },
    },
    "/tareas/{tareaAsignacionId}/guardar-progreso": {
      post: {
        summary: "Guardar progreso intermedio y validar contra el schema del evento",
        parameters: [uuidParam("tareaAsignacionId")],
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
    "/tareas/{tareaAsignacionId}/finalizar": {
      post: {
        summary: "Finalizar tarea — cierra o actualiza el estado",
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
    "/usuarios/whatsapp/{whatsapp}": {
      get: {
        summary: "Datos del usuario por WhatsApp + delegaciones activas del bot hacia ese usuario",
        parameters: [
          {
            name: "whatsapp",
            in: "path",
            required: true,
            schema: { type: "string" },
            example: "+5491112345678",
            description: "Número E.164",
          },
        ],
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                example: {
                  user_id: "25f158ae-...",
                  nombre: "Juan Pérez",
                  email: "juan@bodega.com",
                  whatsapp: "+5491112345678",
                  is_active: true,
                  bodegas: [{ bodega_id: "...", nombre: "Bodega Norte", roles: ["encargado_bodega"] }],
                  delegaciones_activas: [
                    {
                      bot_delegation_id: "...",
                      scopes: ["tareas.crear", "tareas.actualizar_estado"],
                      bodega: { bodega_id: "...", nombre: "Bodega Norte" },
                      expires_at: null,
                      created_at: "2026-03-17T10:00:00Z",
                    },
                  ],
                  tiene_delegacion: true,
                },
              },
            },
          },
          404: { description: "Usuario no encontrado con ese whatsapp" },
        },
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
    "/delegaciones": {
      post: {
        summary: "Crear delegación manualmente",
        tags: ["Delegaciones"],
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
    "/delegaciones/me": {
      get: {
        summary: "Listar delegaciones activas otorgadas por el usuario autenticado",
        tags: ["Delegaciones"],
        responses: { 200: { description: "OK" } },
      },
    },
    "/delegaciones/solicitar": {
      post: {
        summary: "Solicitar delegación desde el chat — genera código de confirmación",
        tags: ["Delegaciones"],
        description: "El bot llama a este endpoint cuando el encargado quiere habilitar el bot desde WhatsApp. Se genera un código de 6 dígitos válido por 10 minutos que el encargado debe confirmar respondiendo en el chat.",
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
    "/delegaciones/confirmar": {
      post: {
        summary: "Confirmar delegación con el código enviado por el encargado",
        tags: ["Delegaciones"],
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
          201: { description: "Delegación creada" },
          400: { description: "Código inválido o expirado" },
          404: { description: "No hay código pendiente para ese WhatsApp" },
        },
      },
    },
    "/delegaciones/{botDelegationId}": {
      delete: {
        summary: "Revocar una delegación",
        tags: ["Delegaciones"],
        parameters: [{ name: "botDelegationId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Delegación revocada" }, 403: { description: "Sin permiso" }, 404: { description: "No encontrada" } },
      },
    },
  },
};

export default openapiIaSpec;
