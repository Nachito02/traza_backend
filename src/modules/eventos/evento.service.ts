import { createHash } from "node:crypto";
import { prisma } from "../../config/prismaClient.js";
import type { Prisma } from "../../generated/prisma/index.js";
import {
  canManageBodega,
  hasAnyFincaRole,
  isSystemAdmin,
} from "../auth/scope-permissions.service.js";

type BaseInput = {
  milestoneId: string;
  userId: string;
};

type CreateEventoInput = BaseInput & {
  tipo: string;
  [key: string]: unknown;
};

type MilestoneContext = {
  milestoneId: string;
  trazabilidadId: string;
  bodegaId: string;
  fincaId: string;
  cuartelId: string;
  campaniaId: string;
};

export class EventoError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const DIAS_MONITOREO_PREVIO = 14;
const DIAS_HIGIENE_COSECHA = 7;
const MESES_ANALISIS_SUELO = 12;

const CUARTEL_EVENT_TYPES = new Set([
  "riego",
  "cosecha",
  "fenologia",
  "fertilizacion",
  "labor_suelo",
  "canopia",
  "aplicacion_fitosanitaria",
  "monitoreo_enfermedad",
  "monitoreo_plaga",
]);

const BODEGA_EVENT_TYPES = new Set([
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
]);

function startOfDay(date: Date) {
  const out = new Date(date);
  out.setHours(0, 0, 0, 0);
  return out;
}

function addDays(date: Date, days: number) {
  const out = new Date(date);
  out.setDate(out.getDate() + days);
  return out;
}

function subDays(date: Date, days: number) {
  const out = new Date(date);
  out.setDate(out.getDate() - days);
  return out;
}

function subMonths(date: Date, months: number) {
  const out = new Date(date);
  out.setMonth(out.getMonth() - months);
  return out;
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableSerialize(v)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b));
    return `{${entries
      .map(([k, v]) => `${JSON.stringify(k)}:${stableSerialize(v)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function buildEventHash(tipo: string, input: CreateEventoInput): string {
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (key === "tipo" || key === "milestoneId" || key === "userId") continue;
    payload[key] = value;
  }
  const raw = stableSerialize({ tipo, payload });
  return createHash("sha256").update(raw).digest("hex");
}

async function createHallazgo(params: {
  context: MilestoneContext;
  ruleCode: string;
  severity: "alerta" | "bloqueo" | "info";
  title: string;
  message: string;
  eventTable?: string;
  eventId?: string;
  detail?: Record<string, unknown>;
}) {
  const { context, ruleCode, severity, title, message, eventTable, eventId, detail } = params;

  const existing = await prisma.hallazgoCumplimiento.findFirst({
    where: {
      trazabilidad_id: context.trazabilidadId,
      regla_codigo: ruleCode,
      estado: { in: ["abierto", "en_proceso"] },
      ...(eventTable ? { evento_tabla: eventTable } : {}),
      ...(eventId ? { evento_id: eventId } : {}),
    },
    select: { hallazgo_id: true },
  });

  if (existing) return;

  await prisma.hallazgoCumplimiento.create({
    data: {
      trazabilidad_id: context.trazabilidadId,
      milestone_id: context.milestoneId,
      regla_codigo: ruleCode,
      severidad: severity,
      estado: "abierto",
      titulo: title,
      mensaje: message,
      detalle: (detail ?? {}) as Prisma.InputJsonValue,
      evento_tabla: eventTable ?? null,
      evento_id: eventId ?? null,
    },
  });
}

async function ensureUserMilestone(userId: string, milestoneId: string): Promise<MilestoneContext> {
  const milestone = await prisma.milestone.findUnique({
    where: { milestone_id: milestoneId },
    select: {
      milestone_id: true,
      trazabilidad_id: true,
      trazabilidad: {
        select: {
          bodega_id: true,
          finca_id: true,
          cuartel_id: true,
          campania_id: true,
        },
      },
    },
  });

  if (!milestone || !milestone.trazabilidad) {
    throw new EventoError("Milestone no encontrado", 404);
  }

  const [isAdminSistema, canManageBodegaRole, hasFincaRole] = await Promise.all([
    isSystemAdmin(userId),
    canManageBodega(userId, milestone.trazabilidad.bodega_id),
    milestone.trazabilidad.finca_id
      ? hasAnyFincaRole(userId, milestone.trazabilidad.finca_id)
      : Promise.resolve(false),
  ]);
  if (!isAdminSistema && !canManageBodegaRole && !hasFincaRole) {
    throw new EventoError("No autorizado", 403);
  }

  if (!milestone.trazabilidad.finca_id || !milestone.trazabilidad.cuartel_id) {
    throw new EventoError("La trazabilidad no tiene finca/cuartel principal definido", 400);
  }

  return {
    milestoneId: milestone.milestone_id,
    trazabilidadId: milestone.trazabilidad_id,
    bodegaId: milestone.trazabilidad.bodega_id,
    fincaId: milestone.trazabilidad.finca_id,
    cuartelId: milestone.trazabilidad.cuartel_id,
    campaniaId: milestone.trazabilidad.campania_id,
  };
}

async function ensureNoDuplicateEventHash(tipo: string, input: CreateEventoInput) {
  const hash = buildEventHash(tipo, input);
  const duplicate = await prisma.eventoFingerprint.findUnique({
    where: { hash_contenido: hash },
    select: { evento_id: true },
  });

  if (duplicate) {
    throw new EventoError("Este evento ya fue cargado (duplicado)", 409);
  }

  return hash;
}

function validateAnchoring(input: CreateEventoInput, context: MilestoneContext) {
  const asString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

  if (CUARTEL_EVENT_TYPES.has(input.tipo)) {
    if (asString(input.cuartelId) !== context.cuartelId) {
      throw new EventoError("El cuartel del evento no coincide con la trazabilidad", 400);
    }
    if (asString(input.campaniaId) !== context.campaniaId) {
      throw new EventoError("La campaña del evento no coincide con la trazabilidad", 400);
    }
  }

  if (input.tipo === "precipitacion") {
    if (asString(input.fincaId) !== context.fincaId) {
      throw new EventoError("La finca del evento no coincide con la trazabilidad", 400);
    }
  }

  if (BODEGA_EVENT_TYPES.has(input.tipo)) {
    const bodegaId = asString(input.bodegaId);
    if (bodegaId && bodegaId !== context.bodegaId) {
      throw new EventoError("La bodega del evento no coincide con la trazabilidad", 400);
    }
  }
}

async function validateCarenciaAgainstCosecha(
  fechaCosecha: Date,
  cuartelId: string,
  campaniaId: string,
) {
  const aplicaciones = await prisma.eventoAplicacionFitosanitaria.findMany({
    where: {
      cuartel_id: cuartelId,
      campania_id: campaniaId,
      fecha: { lte: fechaCosecha },
    },
    select: {
      evento_fito_id: true,
      fecha: true,
      carencia_dias: true,
    },
  });

  const bloqueante = aplicaciones.find((a) => addDays(a.fecha, a.carencia_dias) > fechaCosecha);
  if (bloqueante) {
    throw new EventoError(
      "Cosecha bloqueada por carencia activa de fitosanitario",
      400,
    );
  }
}

async function validateInsumoLoteVigente(insumoLoteId: string | null, fecha: Date) {
  if (!insumoLoteId) return;

  const lote = await prisma.insumoLote.findUnique({
    where: { insumo_lote_id: insumoLoteId },
    select: { estado: true, fecha_vencimiento: true },
  });

  if (!lote) {
    throw new EventoError("Lote de insumo no encontrado", 404);
  }

  if (lote.estado === "vencido" || lote.fecha_vencimiento < startOfDay(fecha)) {
    throw new EventoError("No se puede usar un insumo vencido", 400);
  }
}

async function createPostCreationAlerts(params: {
  tipo: string;
  context: MilestoneContext;
  eventId: string;
  eventTable: string;
  fecha: Date;
  responsablePersonaId?: string | null;
}) {
  const { tipo, context, eventId, eventTable, fecha, responsablePersonaId } = params;

  if (tipo === "aplicacion_fitosanitaria") {
    const since = subDays(fecha, DIAS_MONITOREO_PREVIO);

    const [monEnf, monPlaga] = await Promise.all([
      prisma.eventoMonitoreoEnfermedad.findFirst({
        where: {
          cuartel_id: context.cuartelId,
          campania_id: context.campaniaId,
          fecha: { gte: since, lte: fecha },
        },
        select: { evento_monitoreo_enfermedad_id: true },
      }),
      prisma.eventoMonitoreoPlaga.findFirst({
        where: {
          cuartel_id: context.cuartelId,
          campania_id: context.campaniaId,
          fecha: { gte: since, lte: fecha },
        },
        select: { evento_monitoreo_plaga_id: true },
      }),
    ]);

    if (!monEnf && !monPlaga) {
      await createHallazgo({
        context,
        ruleCode: "A-MIP-001",
        severity: "alerta",
        title: "Aplicación sin monitoreo previo",
        message:
          "Aplicación sin monitoreo previo registrado. Para BA/COVIAR se recomienda monitorear antes.",
        eventTable,
        eventId,
        detail: { ventana_dias: DIAS_MONITOREO_PREVIO },
      });
    }

    if (responsablePersonaId) {
      const campania = await prisma.campania.findUnique({
        where: { campania_id: context.campaniaId },
        select: { fecha_inicio: true, fecha_fin: true },
      });

      if (campania) {
        const epp = await prisma.eventoEntregaEpp.findFirst({
          where: {
            persona_id: responsablePersonaId,
            fecha: { gte: campania.fecha_inicio, lte: campania.fecha_fin },
          },
          select: { evento_entrega_epp_id: true },
        });

        if (!epp) {
          await createHallazgo({
            context,
            ruleCode: "A-SSO-001",
            severity: "alerta",
            title: "Aplicación sin EPP registrado",
            message: "Hay aplicaciones fitosanitarias sin entrega de EPP registrada.",
            eventTable,
            eventId,
          });
        }
      }
    }
  }

  if (tipo === "fertilizacion") {
    const vigencia = subMonths(fecha, MESES_ANALISIS_SUELO);
    const analisis = await prisma.eventoAnalisisDeSuelo.findFirst({
      where: {
        fecha: { gte: vigencia, lte: fecha },
        OR: [{ cuartel_id: context.cuartelId }, { cuartel_id: null }],
      },
      select: { evento_analisis_suelo_id: true },
    });

    if (!analisis) {
      await createHallazgo({
        context,
        ruleCode: "A-SUELO-001",
        severity: "alerta",
        title: "Fertilización sin análisis de suelo reciente",
        message:
          "Fertilización sin análisis de suelo reciente. Recomendado para evidencia técnica.",
        eventTable,
        eventId,
      });
    }
  }

  if (tipo === "riego") {
    const precipitacion = await prisma.eventoPrecipitacion.findFirst({
      where: {
        finca_id: context.fincaId,
        campania_id: context.campaniaId,
      },
      select: { evento_precipitacion_id: true },
    });

    if (!precipitacion) {
      await createHallazgo({
        context,
        ruleCode: "A-AGUA-001",
        severity: "alerta",
        title: "Riego sin precipitaciones registradas",
        message:
          "No hay precipitaciones registradas en la campaña. Esto mejora el balance hídrico.",
        eventTable,
        eventId,
      });
    }
  }

  if (tipo === "cosecha") {
    const since = subDays(fecha, DIAS_HIGIENE_COSECHA);

    const [limpieza, sanitizacion] = await Promise.all([
      prisma.eventoLimpiezaCosecha.findFirst({
        where: {
          bodega_id: context.bodegaId,
          fecha: { gte: since, lte: fecha },
        },
        select: { evento_limpieza_cosecha_id: true },
      }),
      prisma.eventoSanitizacionBanos.findFirst({
        where: {
          bodega_id: context.bodegaId,
          fecha: { gte: since, lte: fecha },
        },
        select: { evento_sanitizacion_banos_id: true },
      }),
    ]);

    if (!limpieza) {
      await createHallazgo({
        context,
        ruleCode: "A-HIG-LIMPIEZA-001",
        severity: "alerta",
        title: "Falta limpieza de elementos previa a cosecha",
        message:
          "No hay limpieza de elementos de cosecha registrada en el período previo.",
        eventTable,
        eventId,
      });
    }

    if (!sanitizacion) {
      await createHallazgo({
        context,
        ruleCode: "A-HIG-001",
        severity: "alerta",
        title: "Falta sanitización de baños en período activo",
        message:
          "No hay sanitización de baños registrada en el período. Recomendado para inocuidad.",
        eventTable,
        eventId,
      });
    }
  }
}

export async function createEvento(input: CreateEventoInput) {
  const context = await ensureUserMilestone(input.userId, input.milestoneId);
  validateAnchoring(input, context);

  const asString = (value: unknown) =>
    typeof value === "string" ? value.trim() : "";
  const asNumber = (value: unknown) => {
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim() !== "") return Number(value);
    return NaN;
  };
  const asNullableString = (value: unknown) => {
    const text = asString(value);
    return text ? text : null;
  };
  const asNullableNumber = (value: unknown) => {
    const num = asNumber(value);
    return Number.isFinite(num) ? num : null;
  };
  const requireString = (value: unknown, label: string) => {
    const text = asString(value);
    if (!text) throw new EventoError(`${label} es obligatorio`, 400);
    return text;
  };
  const requireNumber = (value: unknown, label: string) => {
    const num = asNumber(value);
    if (!Number.isFinite(num)) {
      throw new EventoError(`${label} es obligatorio`, 400);
    }
    return num;
  };
  const requirePositiveNumber = (value: unknown, label: string) => {
    const num = requireNumber(value, label);
    if (num <= 0) {
      throw new EventoError(`${label} debe ser mayor a 0`, 400);
    }
    return num;
  };
  const requireDate = (value: unknown, label: string) => {
    const text = requireString(value, label);
    const date = new Date(text);
    if (Number.isNaN(date.getTime())) {
      throw new EventoError(`${label} es inválida`, 400);
    }
    return date;
  };

  const eventHash = await ensureNoDuplicateEventHash(input.tipo, input);

  async function registerFingerprint(
    tipoEvento: string,
    eventoTabla: string,
    eventoId: string,
    fecha: Date,
    cuartelId?: string,
    fincaId?: string,
  ) {
    await prisma.eventoFingerprint.create({
      data: {
        tipo_evento: tipoEvento,
        hash_contenido: eventHash,
        evento_tabla: eventoTabla,
        evento_id: eventoId,
        fecha,
        cuartel_id: cuartelId ?? null,
        finca_id: fincaId ?? null,
      },
    });
  }

  switch (input.tipo) {
    case "riego": {
      const fecha = requireDate(input.fecha, "Fecha");
      const evento = await prisma.eventoRiego.create({
        data: {
          fecha,
          cuartel_id: requireString(input.cuartelId, "Cuartel"),
          campania_id: requireString(input.campaniaId, "Campaña"),
          volumen: requirePositiveNumber(input.volumen, "Volumen"),
          unidad: requireString(input.unidad, "Unidad"),
          sistema_riego: asNullableString(input.sistema_riego),
          responsable_persona_id: asNullableString(input.responsable_persona_id),
        },
      });
      await prisma.milestoneEvento.create({
        data: {
          milestone_id: input.milestoneId,
          evento_tabla: "evento_riego",
          evento_id: evento.evento_riego_id,
        },
      });
      await registerFingerprint(
        input.tipo,
        "evento_riego",
        evento.evento_riego_id,
        fecha,
        evento.cuartel_id,
      );
      await createPostCreationAlerts({
        tipo: input.tipo,
        context,
        eventId: evento.evento_riego_id,
        eventTable: "evento_riego",
        fecha,
      });
      return { tipo: "riego", evento };
    }
    case "cosecha": {
      const fechaCosecha = requireDate(input.fecha_cosecha, "Fecha de cosecha");
      const cuartelId = requireString(input.cuartelId, "Cuartel");
      const campaniaId = requireString(input.campaniaId, "Campaña");

      await validateCarenciaAgainstCosecha(fechaCosecha, cuartelId, campaniaId);

      const evento = await prisma.eventoCosecha.create({
        data: {
          fecha_cosecha: fechaCosecha,
          cuartel_id: cuartelId,
          campania_id: campaniaId,
          cantidad: requirePositiveNumber(input.cantidad, "Cantidad"),
          unidad: requireString(input.unidad, "Unidad"),
          destino: asNullableString(input.destino),
          responsable_persona_id: asNullableString(input.responsable_persona_id),
        },
      });
      await prisma.milestoneEvento.create({
        data: {
          milestone_id: input.milestoneId,
          evento_tabla: "evento_cosecha",
          evento_id: evento.lote_cosecha_id,
        },
      });
      await registerFingerprint(
        input.tipo,
        "evento_cosecha",
        evento.lote_cosecha_id,
        fechaCosecha,
        evento.cuartel_id,
      );
      await createPostCreationAlerts({
        tipo: input.tipo,
        context,
        eventId: evento.lote_cosecha_id,
        eventTable: "evento_cosecha",
        fecha: fechaCosecha,
      });
      return { tipo: "cosecha", evento };
    }
    case "fenologia": {
      const fecha = requireDate(input.fecha, "Fecha");
      const evento = await prisma.eventoFenologia.create({
        data: {
          fecha,
          cuartel_id: requireString(input.cuartelId, "Cuartel"),
          campania_id: requireString(input.campaniaId, "Campaña"),
          estado_fenologico: requireString(input.estado_fenologico, "Estado fenológico"),
          porcentaje_avance: asNullableNumber(input.porcentaje_avance),
          responsable_persona_id: asNullableString(input.responsable_persona_id),
        },
      });
      await prisma.milestoneEvento.create({
        data: {
          milestone_id: input.milestoneId,
          evento_tabla: "evento_fenologia",
          evento_id: evento.evento_fenologia_id,
        },
      });
      await registerFingerprint(
        input.tipo,
        "evento_fenologia",
        evento.evento_fenologia_id,
        fecha,
        evento.cuartel_id,
      );
      return { tipo: "fenologia", evento };
    }
    case "fertilizacion": {
      const fecha = requireDate(input.fecha, "Fecha");
      const evento = await prisma.eventoFertilizacion.create({
        data: {
          fecha,
          cuartel_id: requireString(input.cuartelId, "Cuartel"),
          campania_id: requireString(input.campaniaId, "Campaña"),
          insumo_id: asNullableString(input.insumo_id),
          dosis: requirePositiveNumber(input.dosis, "Dosis"),
          unidad: requireString(input.unidad, "Unidad"),
          cantidad_total: asNullableNumber(input.cantidad_total),
          responsable_persona_id: asNullableString(input.responsable_persona_id),
        },
      });
      await prisma.milestoneEvento.create({
        data: {
          milestone_id: input.milestoneId,
          evento_tabla: "evento_fertilizacion",
          evento_id: evento.evento_fertilizacion_id,
        },
      });
      await registerFingerprint(
        input.tipo,
        "evento_fertilizacion",
        evento.evento_fertilizacion_id,
        fecha,
        evento.cuartel_id,
      );
      await createPostCreationAlerts({
        tipo: input.tipo,
        context,
        eventId: evento.evento_fertilizacion_id,
        eventTable: "evento_fertilizacion",
        fecha,
      });
      return { tipo: "fertilizacion", evento };
    }
    case "labor_suelo": {
      const fecha = requireDate(input.fecha, "Fecha");
      const evento = await prisma.eventoLaborSuelo.create({
        data: {
          fecha,
          cuartel_id: requireString(input.cuartelId, "Cuartel"),
          campania_id: requireString(input.campaniaId, "Campaña"),
          tipo_labor: requireString(input.tipo_labor, "Tipo de labor"),
          horas: asNullableNumber(input.horas),
          hs_por_ha: asNullableNumber(input.hs_por_ha),
          total_horas_cuartel: asNullableNumber(input.total_horas_cuartel),
          responsable_persona_id: asNullableString(input.responsable_persona_id),
        },
      });
      await prisma.milestoneEvento.create({
        data: {
          milestone_id: input.milestoneId,
          evento_tabla: "evento_labor_suelo",
          evento_id: evento.evento_labor_suelo_id,
        },
      });
      await registerFingerprint(
        input.tipo,
        "evento_labor_suelo",
        evento.evento_labor_suelo_id,
        fecha,
        evento.cuartel_id,
      );
      return { tipo: "labor_suelo", evento };
    }
    case "canopia": {
      const fecha = requireDate(input.fecha, "Fecha");
      const evento = await prisma.eventoCanopia.create({
        data: {
          fecha,
          cuartel_id: requireString(input.cuartelId, "Cuartel"),
          campania_id: requireString(input.campaniaId, "Campaña"),
          tipo_practica: requireString(input.tipo_practica, "Tipo de práctica"),
          intensidad: asNullableString(input.intensidad),
          jornales: asNullableNumber(input.jornales),
          observaciones: asNullableString(input.observaciones),
          responsable_persona_id: asNullableString(input.responsable_persona_id),
        },
      });
      await prisma.milestoneEvento.create({
        data: {
          milestone_id: input.milestoneId,
          evento_tabla: "evento_canopia",
          evento_id: evento.evento_canopia_id,
        },
      });
      await registerFingerprint(
        input.tipo,
        "evento_canopia",
        evento.evento_canopia_id,
        fecha,
        evento.cuartel_id,
      );
      return { tipo: "canopia", evento };
    }
    case "aplicacion_fitosanitaria": {
      const fecha = requireDate(input.fecha, "Fecha");
      const insumoLoteId = asNullableString(input.insumo_lote_id);

      await validateInsumoLoteVigente(insumoLoteId, fecha);

      const evento = await prisma.eventoAplicacionFitosanitaria.create({
        data: {
          fecha,
          cuartel_id: requireString(input.cuartelId, "Cuartel"),
          campania_id: requireString(input.campaniaId, "Campaña"),
          insumo_lote_id: insumoLoteId,
          dosis: requirePositiveNumber(input.dosis, "Dosis"),
          unidad: requireString(input.unidad, "Unidad"),
          carencia_dias: Math.trunc(requirePositiveNumber(input.carencia_dias, "Carencia (días)")),
          motivo: asNullableString(input.motivo),
          responsable_persona_id: asNullableString(input.responsable_persona_id),
        },
      });
      await prisma.milestoneEvento.create({
        data: {
          milestone_id: input.milestoneId,
          evento_tabla: "evento_aplicacion_fitosanitaria",
          evento_id: evento.evento_fito_id,
        },
      });
      await registerFingerprint(
        input.tipo,
        "evento_aplicacion_fitosanitaria",
        evento.evento_fito_id,
        fecha,
        evento.cuartel_id,
      );
      await createPostCreationAlerts({
        tipo: input.tipo,
        context,
        eventId: evento.evento_fito_id,
        eventTable: "evento_aplicacion_fitosanitaria",
        fecha,
        responsablePersonaId: evento.responsable_persona_id,
      });
      return { tipo: "aplicacion_fitosanitaria", evento };
    }
    case "monitoreo_enfermedad": {
      const fecha = requireDate(input.fecha, "Fecha");
      const evento = await prisma.eventoMonitoreoEnfermedad.create({
        data: {
          fecha,
          cuartel_id: requireString(input.cuartelId, "Cuartel"),
          campania_id: requireString(input.campaniaId, "Campaña"),
          enfermedad: requireString(input.enfermedad, "Enfermedad"),
          incidencia: asNullableString(input.incidencia),
          responsable_persona_id: asNullableString(input.responsable_persona_id),
        },
      });
      await prisma.milestoneEvento.create({
        data: {
          milestone_id: input.milestoneId,
          evento_tabla: "evento_monitoreo_enfermedad",
          evento_id: evento.evento_monitoreo_enfermedad_id,
        },
      });
      await registerFingerprint(
        input.tipo,
        "evento_monitoreo_enfermedad",
        evento.evento_monitoreo_enfermedad_id,
        fecha,
        evento.cuartel_id,
      );
      return { tipo: "monitoreo_enfermedad", evento };
    }
    case "monitoreo_plaga": {
      const fecha = requireDate(input.fecha, "Fecha");
      const evento = await prisma.eventoMonitoreoPlaga.create({
        data: {
          fecha,
          cuartel_id: requireString(input.cuartelId, "Cuartel"),
          campania_id: requireString(input.campaniaId, "Campaña"),
          plaga: requireString(input.plaga, "Plaga"),
          nivel: asNullableString(input.nivel),
          responsable_persona_id: asNullableString(input.responsable_persona_id),
        },
      });
      await prisma.milestoneEvento.create({
        data: {
          milestone_id: input.milestoneId,
          evento_tabla: "evento_monitoreo_plaga",
          evento_id: evento.evento_monitoreo_plaga_id,
        },
      });
      await registerFingerprint(
        input.tipo,
        "evento_monitoreo_plaga",
        evento.evento_monitoreo_plaga_id,
        fecha,
        evento.cuartel_id,
      );
      return { tipo: "monitoreo_plaga", evento };
    }
    case "analisis_suelo": {
      const fecha = requireDate(input.fecha, "Fecha");
      const rawParametros = input.parametros;
      let parametros: Record<string, unknown> = {};
      if (typeof rawParametros === "string" && rawParametros.trim() !== "") {
        try {
          parametros = JSON.parse(rawParametros);
        } catch {
          throw new EventoError("Parámetros debe ser un JSON válido", 400);
        }
      } else if (rawParametros && typeof rawParametros === "object") {
        parametros = rawParametros as Record<string, unknown>;
      }
      const evento = await prisma.eventoAnalisisDeSuelo.create({
        data: {
          fecha,
          unidad_muestreada: requireString(input.unidad_muestreada, "Unidad muestreada"),
          cuartel_id: asNullableString(input.cuartelId),
          campania_id: asNullableString(input.campaniaId),
          laboratorio: asNullableString(input.laboratorio),
          parametros: parametros as Prisma.InputJsonValue,
        },
      });
      await prisma.milestoneEvento.create({
        data: {
          milestone_id: input.milestoneId,
          evento_tabla: "evento_analisis_suelo",
          evento_id: evento.evento_analisis_suelo_id,
        },
      });
      await registerFingerprint(
        input.tipo,
        "evento_analisis_suelo",
        evento.evento_analisis_suelo_id,
        fecha,
        evento.cuartel_id ?? undefined,
      );
      return { tipo: "analisis_suelo", evento };
    }
    case "precipitacion": {
      const fecha = requireDate(input.fecha, "Fecha");
      const evento = await prisma.eventoPrecipitacion.create({
        data: {
          fecha,
          finca_id: requireString(input.fincaId, "Finca"),
          campania_id: asNullableString(input.campaniaId),
          milimetros: requirePositiveNumber(input.milimetros, "Milímetros"),
        },
      });
      await prisma.milestoneEvento.create({
        data: {
          milestone_id: input.milestoneId,
          evento_tabla: "evento_precipitacion",
          evento_id: evento.evento_precipitacion_id,
        },
      });
      await registerFingerprint(
        input.tipo,
        "evento_precipitacion",
        evento.evento_precipitacion_id,
        fecha,
        undefined,
        evento.finca_id,
      );
      return { tipo: "precipitacion", evento };
    }
    case "energia": {
      const fecha = requireDate(input.fecha ?? new Date().toISOString(), "Fecha");
      const evento = await prisma.eventoEnergia.create({
        data: {
          periodo: requireString(input.periodo, "Periodo"),
          cuartel_id: asNullableString(input.cuartelId),
          campania_id: asNullableString(input.campaniaId),
          tipo: requireString(input.tipo_energia, "Tipo"),
          consumo: requirePositiveNumber(input.consumo, "Consumo"),
          unidad: requireString(input.unidad, "Unidad"),
        },
      });
      await prisma.milestoneEvento.create({
        data: {
          milestone_id: input.milestoneId,
          evento_tabla: "evento_energia",
          evento_id: evento.evento_energia_id,
        },
      });
      await registerFingerprint(
        input.tipo,
        "evento_energia",
        evento.evento_energia_id,
        fecha,
        evento.cuartel_id ?? undefined,
      );
      return { tipo: "energia", evento };
    }
    case "accidente": {
      const fecha = requireDate(input.fecha, "Fecha");
      const evento = await prisma.eventoAccidente.create({
        data: {
          fecha,
          bodega_id: asNullableString(input.bodegaId) ?? context.bodegaId,
          persona_id: requireString(input.persona_id, "Persona"),
          accion_correctiva: asNullableString(input.accion_correctiva),
        },
      });
      await prisma.milestoneEvento.create({
        data: {
          milestone_id: input.milestoneId,
          evento_tabla: "evento_accidente",
          evento_id: evento.evento_accidente_id,
        },
      });
      await registerFingerprint(input.tipo, "evento_accidente", evento.evento_accidente_id, fecha);
      return { tipo: "accidente", evento };
    }
    case "capacitacion": {
      const fecha = requireDate(input.fecha, "Fecha");
      const evento = await prisma.eventoCapacitacion.create({
        data: {
          fecha,
          bodega_id: asNullableString(input.bodegaId) ?? context.bodegaId,
          tema: requireString(input.tema, "Tema"),
        },
      });
      await prisma.milestoneEvento.create({
        data: {
          milestone_id: input.milestoneId,
          evento_tabla: "evento_capacitacion",
          evento_id: evento.evento_capacitacion_id,
        },
      });
      await registerFingerprint(input.tipo, "evento_capacitacion", evento.evento_capacitacion_id, fecha);
      return { tipo: "capacitacion", evento };
    }
    case "entrega_epp": {
      const fecha = requireDate(input.fecha, "Fecha");
      const evento = await prisma.eventoEntregaEpp.create({
        data: {
          fecha,
          bodega_id: asNullableString(input.bodegaId) ?? context.bodegaId,
          persona_id: requireString(input.persona_id, "Persona"),
          epp: requireString(input.epp, "EPP"),
        },
      });
      await prisma.milestoneEvento.create({
        data: {
          milestone_id: input.milestoneId,
          evento_tabla: "evento_entrega_epp",
          evento_id: evento.evento_entrega_epp_id,
        },
      });
      await registerFingerprint(input.tipo, "evento_entrega_epp", evento.evento_entrega_epp_id, fecha);
      return { tipo: "entrega_epp", evento };
    }
    case "limpieza_cosecha": {
      const fecha = requireDate(input.fecha, "Fecha");
      const evento = await prisma.eventoLimpiezaCosecha.create({
        data: {
          fecha,
          bodega_id: asNullableString(input.bodegaId) ?? context.bodegaId,
          elemento: requireString(input.elemento, "Elemento"),
          metodo: asNullableString(input.metodo),
          responsable_persona_id: asNullableString(input.responsable_persona_id),
        },
      });
      await prisma.milestoneEvento.create({
        data: {
          milestone_id: input.milestoneId,
          evento_tabla: "evento_limpieza_cosecha",
          evento_id: evento.evento_limpieza_cosecha_id,
        },
      });
      await registerFingerprint(
        input.tipo,
        "evento_limpieza_cosecha",
        evento.evento_limpieza_cosecha_id,
        fecha,
      );
      return { tipo: "limpieza_cosecha", evento };
    }
    case "mantenimiento": {
      const fecha = requireDate(input.fecha, "Fecha");
      const evento = await prisma.eventoMantenimiento.create({
        data: {
          fecha,
          bodega_id: asNullableString(input.bodegaId) ?? context.bodegaId,
          equipo: requireString(input.equipo, "Equipo"),
          tipo: requireString(input.tipo_mantenimiento, "Tipo"),
          responsable_persona_id: asNullableString(input.responsable_persona_id),
        },
      });
      await prisma.milestoneEvento.create({
        data: {
          milestone_id: input.milestoneId,
          evento_tabla: "evento_mantenimiento",
          evento_id: evento.evento_mantenimiento_id,
        },
      });
      await registerFingerprint(
        input.tipo,
        "evento_mantenimiento",
        evento.evento_mantenimiento_id,
        fecha,
      );
      return { tipo: "mantenimiento", evento };
    }
    case "no_conforme": {
      const fecha = requireDate(input.fecha, "Fecha");
      const estado = asNullableString(input.estado) ?? "abierta";
      const evento = await prisma.eventoNoConforme.create({
        data: {
          fecha,
          bodega_id: asNullableString(input.bodegaId) ?? context.bodegaId,
          descripcion: requireString(input.descripcion, "Descripción"),
          estado,
        },
      });
      await prisma.milestoneEvento.create({
        data: {
          milestone_id: input.milestoneId,
          evento_tabla: "evento_no_conforme",
          evento_id: evento.evento_no_conforme_id,
        },
      });
      await registerFingerprint(input.tipo, "evento_no_conforme", evento.evento_no_conforme_id, fecha);
      return { tipo: "no_conforme", evento };
    }
    case "reclamo": {
      const fecha = requireDate(input.fecha, "Fecha");
      const estado = asNullableString(input.estado) ?? "abierto";
      const evento = await prisma.eventoReclamo.create({
        data: {
          fecha,
          bodega_id: asNullableString(input.bodegaId) ?? context.bodegaId,
          origen: requireString(input.origen, "Origen"),
          descripcion: asNullableString(input.descripcion),
          estado,
        },
      });
      await prisma.milestoneEvento.create({
        data: {
          milestone_id: input.milestoneId,
          evento_tabla: "evento_reclamo",
          evento_id: evento.evento_reclamo_id,
        },
      });
      await registerFingerprint(input.tipo, "evento_reclamo", evento.evento_reclamo_id, fecha);
      return { tipo: "reclamo", evento };
    }
    case "residuo": {
      const fecha = requireDate(input.fecha, "Fecha");
      const evento = await prisma.eventoResiduo.create({
        data: {
          fecha,
          bodega_id: asNullableString(input.bodegaId) ?? context.bodegaId,
          tipo_residuo: requireString(input.tipo_residuo, "Tipo de residuo"),
          cantidad: asNullableNumber(input.cantidad),
          unidad: asNullableString(input.unidad),
          destino: requireString(input.destino, "Destino"),
          responsable_persona_id: asNullableString(input.responsable_persona_id),
        },
      });
      await prisma.milestoneEvento.create({
        data: {
          milestone_id: input.milestoneId,
          evento_tabla: "evento_residuo",
          evento_id: evento.evento_residuo_id,
        },
      });
      await registerFingerprint(input.tipo, "evento_residuo", evento.evento_residuo_id, fecha);
      return { tipo: "residuo", evento };
    }
    case "sanitizacion_banos": {
      const fecha = requireDate(input.fecha, "Fecha");
      const rawChecklist = input.checklist;
      let checklist: Record<string, unknown> = {};
      if (typeof rawChecklist === "string" && rawChecklist.trim() !== "") {
        try {
          checklist = JSON.parse(rawChecklist);
        } catch {
          throw new EventoError("Checklist debe ser un JSON válido", 400);
        }
      } else if (rawChecklist && typeof rawChecklist === "object") {
        checklist = rawChecklist as Record<string, unknown>;
      }
      const evento = await prisma.eventoSanitizacionBanos.create({
        data: {
          fecha,
          bodega_id: asNullableString(input.bodegaId) ?? context.bodegaId,
          tipo_bano: requireString(input.tipo_bano, "Tipo de baño"),
          checklist: checklist as Prisma.InputJsonValue,
          responsable_persona_id: asNullableString(input.responsable_persona_id),
        },
      });
      await prisma.milestoneEvento.create({
        data: {
          milestone_id: input.milestoneId,
          evento_tabla: "evento_sanitizacion_banos",
          evento_id: evento.evento_sanitizacion_banos_id,
        },
      });
      await registerFingerprint(
        input.tipo,
        "evento_sanitizacion_banos",
        evento.evento_sanitizacion_banos_id,
        fecha,
      );
      return { tipo: "sanitizacion_banos", evento };
    }
    case "sobrante_lavado": {
      const fecha = requireDate(input.fecha, "Fecha");
      const evento = await prisma.eventoSobranteLavado.create({
        data: {
          fecha,
          bodega_id: asNullableString(input.bodegaId) ?? context.bodegaId,
          tipo: requireString(input.tipo_sobrante, "Tipo"),
          volumen: asNullableNumber(input.volumen),
          disposicion: asNullableString(input.disposicion),
          responsable_persona_id: asNullableString(input.responsable_persona_id),
        },
      });
      await prisma.milestoneEvento.create({
        data: {
          milestone_id: input.milestoneId,
          evento_tabla: "evento_sobrante_lavado",
          evento_id: evento.evento_sobrante_lavado_id,
        },
      });
      await registerFingerprint(
        input.tipo,
        "evento_sobrante_lavado",
        evento.evento_sobrante_lavado_id,
        fecha,
      );
      return { tipo: "sobrante_lavado", evento };
    }
    default:
      throw new EventoError("Tipo de evento no soportado", 400);
  }
}
