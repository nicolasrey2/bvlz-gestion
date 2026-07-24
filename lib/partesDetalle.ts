import type { TipoSiniestro } from "@/generated/prisma/client";

/// Secciones condicionales del parte de intervención (formulario oficial,
/// `docs/parte-intervencion-DTO3.pdf`). Cada tipo de siniestro habilita un
/// subconjunto — ver `SECCIONES_POR_SINIESTRO` más abajo.
export type SeccionParte =
  | "climaticas"
  | "vehiculos"
  | "incendio"
  | "inmueble"
  | "datosComplementarios"
  | "victimas"
  | "victimasFatales"
  | "animal"
  | "ferroviario";

export type Vehiculo = {
  propietario?: string;
  conductor?: string;
  edad?: string;
  domicilio?: string;
  dominio?: string;
  marca?: string;
  modelo?: string;
  anio?: string;
  aseguradora?: string;
  poliza?: string;
};

export type Incendio = {
  origen?: string;
  causa?: string;
  propagacion?: string;
  evolucion?: string;
};

export type Inmueble = {
  paredes?: string;
  techos?: string;
  instElectrica?: string;
  instGas?: string;
  ambientes?: string;
  pisos?: string;
  nichoHidrante?: boolean;
  extintor?: boolean;
};

export type DatosComplementarios = {
  propietario?: string;
  dni?: string;
  domicilio?: string;
  aseguradora?: string;
  poliza?: string;
  razonSocial?: string;
  ramo?: string;
};

export type Victima = {
  nombre?: string;
  dni?: string;
  sexo?: string;
  edad?: string;
  vehiculoNro?: string;
  trasladoA?: string;
};

export type VictimaFatal = {
  nombre?: string;
  dni?: string;
  sexo?: string;
};

export type Animal = {
  propietario?: string;
  dni?: string;
  domicilio?: string;
  especieRaza?: string;
};

export type Ferroviario = {
  guarda?: string;
  maquinista?: string;
  recorrido?: string;
  kmVia?: string;
  nroTren?: string;
  nroCabina?: string;
};

/// Todas las secciones son opcionales: un parte puede quedar incompleto y
/// completarse en ediciones posteriores. Se persiste tal cual en
/// `ParteIntervencion.detalle` (Json).
export type DetalleParte = {
  condicionesClimaticas?: string;
  vehiculos?: Vehiculo[];
  incendio?: Incendio;
  inmueble?: Inmueble;
  datosComplementarios?: DatosComplementarios;
  victimas?: Victima[];
  victimasFatales?: VictimaFatal[];
  animal?: Animal;
  ferroviario?: Ferroviario;
};

/// Etiquetas legibles de cada sección (UI y PDF).
export const NOMBRE_SECCION: Record<SeccionParte, string> = {
  climaticas: "Condiciones climáticas",
  vehiculos: "Vehículos",
  incendio: "Análisis del incendio",
  inmueble: "Descripción del inmueble",
  datosComplementarios: "Datos complementarios",
  victimas: "Víctimas",
  victimasFatales: "Víctimas fatales",
  animal: "Rescate de animal",
  ferroviario: "Siniestro ferroviario",
};

/// Qué secciones habilita cada tipo de siniestro (formulario oficial). Mapa
/// de configuración en vez de un switch: agregar un tipo nuevo no obliga a
/// tocar la lógica de parseo/render, solo esta tabla.
export const SECCIONES_POR_SINIESTRO: Record<TipoSiniestro, SeccionParte[]> = {
  ACCIDENTE_VIAL: ["climaticas", "vehiculos", "victimas", "victimasFatales"],
  INCENDIO: ["incendio", "inmueble", "datosComplementarios", "victimas", "victimasFatales"],
  FUGA_GAS: ["inmueble", "datosComplementarios", "victimas"],
  RESCATE: ["victimas", "victimasFatales"],
  RESCATE_ANIMAL: ["animal"],
  FERROVIARIO: ["ferroviario", "victimas", "victimasFatales"],
  OTRO: [],
};

const TODAS_LAS_SECCIONES = Object.keys(NOMBRE_SECCION) as SeccionParte[];

// --- Lectura de FormData ------------------------------------------------------

/// Texto de un campo, recortado; `undefined` si vino vacío (no se guarda
/// ruido en el Json).
function campoTexto(formData: FormData, nombre: string): string | undefined {
  const valor = formData.get(nombre);
  if (typeof valor !== "string") return undefined;
  const recortado = valor.trim();
  return recortado ? recortado : undefined;
}

/// Campo booleano de un `<select>` Sí/No/(sin especificar). `undefined`
/// cuando no se eligió ninguna opción.
function campoBooleano(formData: FormData, nombre: string): boolean | undefined {
  const valor = formData.get(nombre);
  if (valor === "si") return true;
  if (valor === "no") return false;
  return undefined;
}

/// `undefined` si el objeto no tiene ningún valor cargado (para no guardar
/// secciones "vacías" en el detalle).
function objetoConDatos<T extends Record<string, unknown>>(obj: T): T | undefined {
  return Object.values(obj).some((v) => v !== undefined) ? obj : undefined;
}

function leerVehiculo(formData: FormData, prefijo: string): Vehiculo | undefined {
  return objetoConDatos<Vehiculo>({
    propietario: campoTexto(formData, `${prefijo}_propietario`),
    conductor: campoTexto(formData, `${prefijo}_conductor`),
    edad: campoTexto(formData, `${prefijo}_edad`),
    domicilio: campoTexto(formData, `${prefijo}_domicilio`),
    dominio: campoTexto(formData, `${prefijo}_dominio`),
    marca: campoTexto(formData, `${prefijo}_marca`),
    modelo: campoTexto(formData, `${prefijo}_modelo`),
    anio: campoTexto(formData, `${prefijo}_anio`),
    aseguradora: campoTexto(formData, `${prefijo}_aseguradora`),
    poliza: campoTexto(formData, `${prefijo}_poliza`),
  });
}

function leerVehiculos(formData: FormData): Vehiculo[] | undefined {
  const lista = [leerVehiculo(formData, "veh1"), leerVehiculo(formData, "veh2")].filter(
    (v): v is Vehiculo => v !== undefined,
  );
  return lista.length > 0 ? lista : undefined;
}

function leerVictima(formData: FormData, prefijo: string): Victima | undefined {
  return objetoConDatos<Victima>({
    nombre: campoTexto(formData, `${prefijo}_nombre`),
    dni: campoTexto(formData, `${prefijo}_dni`),
    sexo: campoTexto(formData, `${prefijo}_sexo`),
    edad: campoTexto(formData, `${prefijo}_edad`),
    vehiculoNro: campoTexto(formData, `${prefijo}_vehiculoNro`),
    trasladoA: campoTexto(formData, `${prefijo}_trasladoA`),
  });
}

function leerVictimas(formData: FormData): Victima[] | undefined {
  const lista = ["vic1", "vic2", "vic3", "vic4"]
    .map((prefijo) => leerVictima(formData, prefijo))
    .filter((v): v is Victima => v !== undefined);
  return lista.length > 0 ? lista : undefined;
}

function leerVictimaFatal(formData: FormData, prefijo: string): VictimaFatal | undefined {
  return objetoConDatos<VictimaFatal>({
    nombre: campoTexto(formData, `${prefijo}_nombre`),
    dni: campoTexto(formData, `${prefijo}_dni`),
    sexo: campoTexto(formData, `${prefijo}_sexo`),
  });
}

function leerVictimasFatales(formData: FormData): VictimaFatal[] | undefined {
  const lista = ["vf1", "vf2"]
    .map((prefijo) => leerVictimaFatal(formData, prefijo))
    .filter((v): v is VictimaFatal => v !== undefined);
  return lista.length > 0 ? lista : undefined;
}

function leerIncendio(formData: FormData): Incendio | undefined {
  return objetoConDatos<Incendio>({
    origen: campoTexto(formData, "incendio_origen"),
    causa: campoTexto(formData, "incendio_causa"),
    propagacion: campoTexto(formData, "incendio_propagacion"),
    evolucion: campoTexto(formData, "incendio_evolucion"),
  });
}

function leerInmueble(formData: FormData): Inmueble | undefined {
  return objetoConDatos<Inmueble>({
    paredes: campoTexto(formData, "inmueble_paredes"),
    techos: campoTexto(formData, "inmueble_techos"),
    instElectrica: campoTexto(formData, "inmueble_instElectrica"),
    instGas: campoTexto(formData, "inmueble_instGas"),
    ambientes: campoTexto(formData, "inmueble_ambientes"),
    pisos: campoTexto(formData, "inmueble_pisos"),
    nichoHidrante: campoBooleano(formData, "inmueble_nichoHidrante"),
    extintor: campoBooleano(formData, "inmueble_extintor"),
  });
}

function leerDatosComplementarios(formData: FormData): DatosComplementarios | undefined {
  return objetoConDatos<DatosComplementarios>({
    propietario: campoTexto(formData, "dc_propietario"),
    dni: campoTexto(formData, "dc_dni"),
    domicilio: campoTexto(formData, "dc_domicilio"),
    aseguradora: campoTexto(formData, "dc_aseguradora"),
    poliza: campoTexto(formData, "dc_poliza"),
    razonSocial: campoTexto(formData, "dc_razonSocial"),
    ramo: campoTexto(formData, "dc_ramo"),
  });
}

function leerAnimal(formData: FormData): Animal | undefined {
  return objetoConDatos<Animal>({
    propietario: campoTexto(formData, "animal_propietario"),
    dni: campoTexto(formData, "animal_dni"),
    domicilio: campoTexto(formData, "animal_domicilio"),
    especieRaza: campoTexto(formData, "animal_especieRaza"),
  });
}

function leerFerroviario(formData: FormData): Ferroviario | undefined {
  return objetoConDatos<Ferroviario>({
    guarda: campoTexto(formData, "ferro_guarda"),
    maquinista: campoTexto(formData, "ferro_maquinista"),
    recorrido: campoTexto(formData, "ferro_recorrido"),
    kmVia: campoTexto(formData, "ferro_kmVia"),
    nroTren: campoTexto(formData, "ferro_nroTren"),
    nroCabina: campoTexto(formData, "ferro_nroCabina"),
  });
}

/// Un parseador por sección: mapa de estrategias en vez de un switch que
/// crece con cada tipo de siniestro nuevo (ver tabla de patrones, clean-code).
const PARSEADOR_SECCION: Record<SeccionParte, (formData: FormData) => Partial<DetalleParte>> = {
  climaticas: (fd) => ({ condicionesClimaticas: campoTexto(fd, "condicionesClimaticas") }),
  vehiculos: (fd) => ({ vehiculos: leerVehiculos(fd) }),
  incendio: (fd) => ({ incendio: leerIncendio(fd) }),
  inmueble: (fd) => ({ inmueble: leerInmueble(fd) }),
  datosComplementarios: (fd) => ({ datosComplementarios: leerDatosComplementarios(fd) }),
  victimas: (fd) => ({ victimas: leerVictimas(fd) }),
  victimasFatales: (fd) => ({ victimasFatales: leerVictimasFatales(fd) }),
  animal: (fd) => ({ animal: leerAnimal(fd) }),
  ferroviario: (fd) => ({ ferroviario: leerFerroviario(fd) }),
};

/// Parsea el `FormData` a `DetalleParte`, tomando SOLO las secciones que
/// habilita el tipo de siniestro elegido — así un parte de incendio no puede
/// arrastrar, por ejemplo, datos de rescate de animal.
export function parsearDetalleFormData(formData: FormData, tipo: TipoSiniestro): DetalleParte {
  const secciones = SECCIONES_POR_SINIESTRO[tipo] ?? [];
  return secciones.reduce<DetalleParte>(
    (detalle, seccion) => ({ ...detalle, ...PARSEADOR_SECCION[seccion](formData) }),
    {},
  );
}

// --- Lectura del Json de la DB -------------------------------------------------

/// Type guard laxo: el `detalle` viene de un campo `Json?` de Prisma, así que
/// en runtime puede ser `null`, un array o cualquier cosa vieja. Si no tiene
/// la forma mínima esperada (objeto plano), se trata como "sin detalle".
export function leerDetalle(valor: unknown): DetalleParte {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return {};
  return valor as DetalleParte;
}

/// Qué secciones tienen datos cargados (para decidir qué tarjetas mostrar en
/// la vista de detalle y en el PDF). Mismo patrón de mapa de estrategias.
const TIENE_DATOS: Record<SeccionParte, (d: DetalleParte) => boolean> = {
  climaticas: (d) => Boolean(d.condicionesClimaticas),
  vehiculos: (d) => Boolean(d.vehiculos && d.vehiculos.length > 0),
  incendio: (d) => Boolean(d.incendio),
  inmueble: (d) => Boolean(d.inmueble),
  datosComplementarios: (d) => Boolean(d.datosComplementarios),
  victimas: (d) => Boolean(d.victimas && d.victimas.length > 0),
  victimasFatales: (d) => Boolean(d.victimasFatales && d.victimasFatales.length > 0),
  animal: (d) => Boolean(d.animal),
  ferroviario: (d) => Boolean(d.ferroviario),
};

export function seccionesPresentes(detalle: DetalleParte): SeccionParte[] {
  return TODAS_LAS_SECCIONES.filter((seccion) => TIENE_DATOS[seccion](detalle));
}
