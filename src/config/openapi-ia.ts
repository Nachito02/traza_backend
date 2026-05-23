const uuidParam = (name: string) => ({
  name,
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
});

const apiBaseServer = [{ url: "/api", description: "API base path" }];

const openapiIaSpec = {
  openapi: "3.0.3",
  info: {
    title: "Traza IA API",
    version: "1.1.0",
    description: "API de integración para bots y agentes sobre Traza.",
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
  tags: [
    { name: "Autenticación", description: "Login y registro del bot. Todos los endpoints requieren `Authorization: Bearer <token>` excepto `/auth/login` y `/auth/login-agent`." },
    { name: "Agent", description: "Bot con permisos globales. Actúa en nombre de cualquier usuario sin necesitar delegación explícita. Todo se loguea con `on_behalf_user_id`." },
    { name: "Usuarios", description: "Buscar usuarios por WhatsApp o ID. `tiene_delegacion: true` indica que el bot ya tiene delegación activa para ese usuario." },
    { name: "Delegaciones", description: "Permiso que el encargado le da al bot para actuar en su nombre. Requerida para bots normales; el super agent no la necesita." },
    { name: "Catálogos", description: "Datos de referencia: bodegas, fincas, cuarteles, trabajadores, protocolos, insumos. Accesibles sin delegación, solo con el token del bot." },
    { name: "Tareas", description: "Crear, consultar y resolver tareas desde WhatsApp. Soporta notas iterativas (/entradas) y guardado de progreso (/guardar-progreso) antes de finalizar." },
    { name: "Trazabilidad", description: "⚠️ Esta sección no está activa por el momento. Incluye trazabilidades, hallazgos y eventos agronómicos." },
    { name: "Consultas", description: "Búsqueda transversal para responder preguntas libres del bot sobre datos de la bodega." },
  ],
  paths: {
    "/auth/register-agent": {
      post: {
        tags: ["Agent"],
        summary: "Crear super agente (requiere admin_sistema)",
        description: "Crea un usuario con rol `super_agent`. No requiere email, solo nombre (actúa como username único) y password.",
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
    "/auth/register": {
      post: {
        tags: ["Autenticación"],
        summary: "Crear usuario bot normal (requiere admin_sistema)",
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
        tags: ["Autenticación"],
        summary: "Login — bot_agent o super_agent",
        description: "`username` puede ser el email del bot_agent o el nombre del super_agent.",
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
        tags: ["Autenticación"],
        summary: "Identidad del bot autenticado y delegaciones activas",
        responses: { 200: { description: "OK" } },
      },
    },
    "/catalogos/bodegas": {
      get: {
        tags: ["Catálogos"],
        summary: "Bodegas visibles para el bot por delegación",
        responses: { 200: { description: "OK" } },
      },
    },
    "/catalogos/fincas": {
      get: {
        tags: ["Catálogos"],
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
        tags: ["Catálogos"],
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
        tags: ["Catálogos"],
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
                  sistemaRiego: { type: "string", example: "goteo" },
                  sistemaProductivo: { type: "string", example: "convencional" },
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
        tags: ["Catálogos"],
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
        tags: ["Catálogos"],
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
        tags: ["Catálogos"],
        summary: "Crear trabajador",
        description:
          "Crea un usuario trabajador en la bodega. " +
          "Si se provee `whatsapp`, se genera un `passwordTemporal` que el bot debe enviarle al trabajador para que pueda hacer login y cambiarlo (recibe `must_change_password: true`). " +
          "Si no se provee `whatsapp`, el usuario queda registrado sin acceso a la plataforma (`tieneAcceso: false`) y puede ser asignado a tareas que el encargado registrará en su nombre.",
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
        tags: ["Catálogos"],
        summary: "Protocolos activos",
        responses: { 200: { description: "OK" } },
      },
    },
    "/catalogos/protocolos/{protocoloId}/procesos": {
      get: {
        tags: ["Catálogos"],
        summary: "Etapas y procesos de un protocolo",
        parameters: [uuidParam("protocoloId")],
        responses: { 200: { description: "OK" } },
      },
    },
    "/catalogos/insumos": {
      get: {
        tags: ["Catálogos"],
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
        tags: ["Catálogos"],
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
        tags: ["Catálogos"],
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
        tags: ["Tareas"],
        summary: "Lista de tareas visibles para el bot",
        parameters: [
          { name: "estado", in: "query", required: false, schema: { type: "string", enum: ["pendiente", "en_progreso", "completado", "cancelado"] } },
          { name: "bodegaId", in: "query", required: false, schema: { type: "string", format: "uuid" } },
          { name: "whatsapp", in: "query", required: false, schema: { type: "string" }, description: "Filtra por WhatsApp del asignado (E.164)" },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/tareas/iniciar": {
      post: {
        tags: ["Tareas"],
        summary: "Iniciar creación de tarea desde WhatsApp (con auto-delegación)",
        description:
          "Nota de contrato: aunque el recurso tecnico sigue llamandose `tarea`, para producto representa una orden de trabajo. " +
          "Si el `procesoId` pertenece a un evento de finca (`cosecha`, `riego`, `fenologia`, `fertilizacion`, `labor_suelo`, `canopia`, `aplicacion_fitosanitaria`, `monitoreo_enfermedad`, `monitoreo_plaga`, `analisis_suelo` o `precipitacion`), el cliente debe enviar `fincaId` y `cuartelId`.\n\n" +
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
                  fincaId: { type: "string", format: "uuid", description: "Obligatorio junto con cuartelId para procesos de finca/cosecha" },
                  cuartelId: { type: "string", format: "uuid", description: "Obligatorio junto con fincaId para procesos de finca/cosecha" },
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
        tags: ["Tareas"],
        summary: "Detalle resumido de una tarea",
        parameters: [uuidParam("tareaAsignacionId")],
        responses: { 200: { description: "OK" } },
      },
    },
    "/tareas/{tareaAsignacionId}/contexto": {
      get: {
        tags: ["Tareas"],
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
                    eventoTipo: { type: "string", nullable: true, description: "Tipo de evento inferido del título/descripción de la tarea" },
                    inputSchema: { type: "object", nullable: true, description: "Schema de campos requeridos/opcionales para registrar el evento inferido. Null si no se pudo inferir el tipo." },
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
        tags: ["Tareas"],
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
    "/tareas/{tareaAsignacionId}/entradas": {
      post: {
        tags: ["Tareas"],
        summary: "Agregar nota/entrada a la tarea",
        description: "Registra una entrada estructurada de iteración. Soporta notas, plantilla y documentos (cid/url). Mantiene compatibilidad con descripcion/adjuntos. Para cosecha, el lote no se informa manualmente: se crea desde la orden de cosecha cuando se registra el draft completo en el flujo operativo.",
        parameters: [uuidParam("tareaAsignacionId")],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  notas: { type: "string", description: "Texto opcional de la entrada" },
                  plantilla: {
                    type: "object",
                    nullable: true,
                    description: "Plantilla de campos obligatorios/opcionales usada para la iteración",
                  },
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
                  descripcion: { type: "string", description: "Compatibilidad legacy: alias de notas" },
                  adjuntos: { type: "array", items: { type: "object" }, description: "Compatibilidad legacy: alias de documentos" },
                },
              },
              example: {
                notas: "Riego realizado en sector norte, 12m3 aplicados.",
                documentos: [
                  { cid: "bafy...", url: "https://bucket.example.com/doc1.pdf", nombre: "planilla-riego.pdf" },
                ],
              },
            },
          },
        },
        responses: {
          201: {
            description: "Entrada registrada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    entradaId: { type: "string", format: "uuid" },
                    descripcion: { type: "string", nullable: true },
                    adjuntos: { oneOf: [{ type: "array" }, { type: "object" }] },
                    notas: { type: "string", nullable: true },
                    plantilla: { type: "object", nullable: true },
                    documentos: { type: "array" },
                    fecha: { type: "string", format: "date-time" },
                    creadoPor: { type: "object", properties: { user_id: { type: "string" }, nombre: { type: "string" } } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/tareas/{tareaAsignacionId}/guardar-progreso": {
      post: {
        tags: ["Tareas"],
        summary: "Guardar progreso intermedio, validar y persistir entrada estructurada",
        description: "Llamar N veces con datos parciales. Cada respuesta incluye `validation.missingRequired` (campos que faltan), `validation.canClose` (si se puede finalizar) y `nextAction` (`ask_missing_or_fix_invalid` | `ready_to_submit_result`). Cuando `canClose: true`, llamar a `/finalizar`. Guardar progreso no reemplaza el cierre de la asignación.",
        parameters: [uuidParam("tareaAsignacionId")],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                additionalProperties: true,
                properties: {
                  draft: { type: "object", additionalProperties: true },
                  notas: { type: "string" },
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
                  plantilla: { type: "object", nullable: true },
                  descripcion: { type: "string", description: "Compatibilidad legacy: alias de notas" },
                  adjuntos: { type: "array", items: { type: "object" }, description: "Compatibilidad legacy: alias de documentos" },
                },
              },
              examples: {
                parcial: {
                  summary: "1° llamada — datos parciales (falta unidad)",
                  value: {
                    draft: {
                      fecha: "2026-03-18",
                      volumen: 150,
                    },
                  },
                },
                completo: {
                  summary: "2° llamada — completo (canClose: true)",
                  value: {
                    draft: {
                      fecha: "2026-03-18",
                      volumen: 150,
                      unidad: "m3",
                      sistema_riego: "goteo",
                    },
                  },
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
                    entrada: { type: "object", description: "Entrada persistida en tarea_entrada con formato estructurado" },
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
        tags: ["Tareas"],
        summary: "Finalizar tarea — cierra o actualiza el estado",
        description: "Finaliza la asignación cuando los datos ya fueron confirmados. No usar este endpoint como reemplazo de una entrada operativa; para datos parciales usar `/guardar-progreso` o `/entradas`.",
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
        tags: ["Trazabilidad"],
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
        tags: ["Trazabilidad"],
        summary: "Detalle de una trazabilidad visible",
        parameters: [uuidParam("trazabilidadId")],
        responses: { 200: { description: "OK" } },
      },
    },
    "/trazabilidades/{trazabilidadId}/contexto": {
      get: {
        tags: ["Trazabilidad"],
        summary: "Contexto expandido de una trazabilidad",
        parameters: [uuidParam("trazabilidadId")],
        responses: { 200: { description: "OK" } },
      },
    },
    "/hallazgos": {
      get: {
        tags: ["Trazabilidad"],
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
        tags: ["Trazabilidad"],
        summary: "Detalle de un hallazgo",
        parameters: [uuidParam("hallazgoId")],
        responses: { 200: { description: "OK" } },
      },
    },
    "/eventos": {
      get: {
        tags: ["Trazabilidad"],
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
        tags: ["Usuarios"],
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
        tags: ["Usuarios"],
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
        tags: ["Consultas"],
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
    "/bot/auth/register": {
      servers: apiBaseServer,
      post: {
        tags: ["Autenticación"],
        summary: "Crear usuario bot normal (ruta /bot)",
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
    "/bot/auth/register-agent": {
      servers: apiBaseServer,
      post: {
        tags: ["Agent"],
        summary: "Crear super agente (ruta /bot)",
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
    "/bot/auth/login": {
      servers: apiBaseServer,
      post: {
        tags: ["Autenticación"],
        summary: "Login del bot (ruta /bot)",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password"],
                properties: {
                  username: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "OK" } },
      },
    },
    "/bot/usuarios/whatsapp/{whatsapp}": {
      servers: apiBaseServer,
      get: {
        tags: ["Usuarios"],
        summary: "Perfil completo del usuario por WhatsApp",
        parameters: [{ name: "whatsapp", in: "path", required: true, schema: { type: "string" }, example: "+5491112345678" }],
        responses: { 200: { description: "OK" }, 404: { description: "No encontrado" } },
      },
    },
    "/bot/tareas/whatsapp/{whatsapp}": {
      servers: apiBaseServer,
      get: {
        tags: ["Tareas"],
        summary: "Tareas asignadas al usuario identificado por WhatsApp",
        parameters: [
          { name: "whatsapp", in: "path", required: true, schema: { type: "string" }, example: "+5491112345678" },
          { name: "estados", in: "query", required: false, schema: { type: "string" } },
        ],
        responses: { 200: { description: "OK" }, 404: { description: "No encontrado" } },
      },
    },
    "/bot/delegaciones": {
      servers: apiBaseServer,
      post: {
        tags: ["Delegaciones"],
        summary: "Crear delegación manualmente",
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
                  scopes: { type: "array", items: { type: "string" } },
                  expiresAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Delegación creada" } },
      },
    },
    "/bot/delegaciones/me": {
      servers: apiBaseServer,
      get: {
        tags: ["Delegaciones"],
        summary: "Listar delegaciones activas del usuario autenticado",
        responses: { 200: { description: "OK" } },
      },
    },
    "/bot/delegaciones/solicitar": {
      servers: apiBaseServer,
      post: {
        tags: ["Delegaciones"],
        summary: "Solicitar delegación desde el chat",
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
    "/bot/delegaciones/confirmar": {
      servers: apiBaseServer,
      post: {
        tags: ["Delegaciones"],
        summary: "Confirmar delegación",
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
    "/bot/delegaciones/{botDelegationId}": {
      servers: apiBaseServer,
      delete: {
        tags: ["Delegaciones"],
        summary: "Revocar una delegación",
        parameters: [{ name: "botDelegationId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Delegación revocada" }, 403: { description: "Sin permiso" }, 404: { description: "No encontrada" } },
      },
    },
    "/bot/tareas": {
      servers: apiBaseServer,
      post: {
        tags: ["Tareas"],
        summary: "Crear tarea en nombre de un encargado",
        description: "Endpoint legacy. Para nuevos desarrollos usar `/api/ia/tareas/iniciar`. Si el `procesoId` pertenece a un evento de finca, enviar `fincaId` y `cuartelId` para no crear ordenes incompletas.",
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
                  procesoId: { type: "string", format: "uuid" },
                  fincaId: { type: "string", format: "uuid", description: "Obligatorio junto con cuartelId para procesos de finca/cosecha" },
                  cuartelId: { type: "string", format: "uuid", description: "Obligatorio junto con fincaId para procesos de finca/cosecha" },
                  descripcion: { type: "string" },
                  prioridad: { type: "string", enum: ["baja", "media", "alta"] },
                  fechaFin: { type: "string", format: "date-time" },
                  imagenCid: { type: "string" },
                  imagenUrl: { type: "string" },
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
      servers: apiBaseServer,
      post: {
        tags: ["Tareas"],
        summary: "Iniciar creación de tarea desde WhatsApp",
        description: "Endpoint legacy equivalente al flujo IA. Aunque el recurso tecnico se llama tarea, para producto representa una orden de trabajo. Para procesos de finca/cosecha enviar siempre `fincaId` y `cuartelId`.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["whatsapp", "bodegaId", "procesoId"],
                properties: {
                  whatsapp: { type: "string", example: "+541134567890" },
                  bodegaId: { type: "string", format: "uuid" },
                  procesoId: { type: "string", format: "uuid" },
                  fincaId: { type: "string", format: "uuid", description: "Obligatorio junto con cuartelId para procesos de finca/cosecha" },
                  cuartelId: { type: "string", format: "uuid", description: "Obligatorio junto con fincaId para procesos de finca/cosecha" },
                  descripcion: { type: "string" },
                  prioridad: { type: "string", enum: ["baja", "media", "alta"] },
                  fechaFin: { type: "string", format: "date-time" },
                  imagenCid: { type: "string" },
                  imagenUrl: { type: "string" },
                  assigneeUserIds: { type: "array", items: { type: "string", format: "uuid" } },
                  delegacionExpiresAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Tarea creada" }, 202: { description: "Delegación requerida" } },
      },
    },
    "/bot/asignaciones/{tareaAsignacionId}/contactar": {
      servers: apiBaseServer,
      post: {
        tags: ["Tareas"],
        summary: "Registrar contacto del bot con el operario",
        parameters: [uuidParam("tareaAsignacionId")],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { message: { type: "string" } },
              },
            },
          },
        },
        responses: { 200: { description: "OK" } },
      },
    },
    "/bot/asignaciones/{tareaAsignacionId}/ayudar-carga": {
      servers: apiBaseServer,
      post: {
        tags: ["Tareas"],
        summary: "Marcar ayuda de carga del bot",
        parameters: [uuidParam("tareaAsignacionId")],
        responses: { 200: { description: "OK" } },
      },
    },
    "/bot/asignaciones/{tareaAsignacionId}/estado": {
      servers: apiBaseServer,
      patch: {
        tags: ["Tareas"],
        summary: "Actualizar estado de una asignación",
        parameters: [uuidParam("tareaAsignacionId")],
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
      servers: apiBaseServer,
      get: {
        tags: ["Catálogos"],
        summary: "Protocolos activos con etapas y procesos expandidos",
        responses: { 200: { description: "OK" } },
      },
    },
    "/bot/bodegas/{bodegaId}/operarios": {
      servers: apiBaseServer,
      get: {
        tags: ["Catálogos"],
        summary: "Miembros activos de una bodega con sus roles",
        parameters: [uuidParam("bodegaId")],
        responses: { 200: { description: "OK" } },
      },
    },
    "/bot/bodegas/{bodegaId}/vasijas": {
      servers: apiBaseServer,
      post: {
        tags: ["Catálogos"],
        summary: "Crear vasija en una bodega en nombre de un encargado",
        parameters: [uuidParam("bodegaId")],
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
      servers: apiBaseServer,
      post: {
        tags: ["Catálogos"],
        summary: "Crear cuartel en una finca en nombre de un encargado",
        parameters: [uuidParam("fincaId")],
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
                    example: "cordon_bilateral_doble_cordon",
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
        responses: { 201: { description: "Cuartel creado" } },
      },
    },
  },
};

export default openapiIaSpec;
