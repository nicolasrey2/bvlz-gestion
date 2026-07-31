/// Opciones de las listas cerradas del formulario oficial del DTO 3
/// (`docs/parte-intervencion-DTO3.pdf`).
///
/// **Por qué existe este archivo.** Esos campos del PDF son desplegables: no
/// aceptan cualquier texto. Mientras la app los cargaba como texto libre, lo
/// escrito nunca matcheaba la opción oficial (`Objeto` tiene 65 valores
/// canónicos como "Incendio chico de residuos (cubiertas/ramas/residuos)") y
/// `lista()` terminaba **inventando una opción nueva** en el PDF archivado.
///
/// Las listas están **literales del PDF**, en su orden y con su redacción: son
/// un catálogo del DTO 3, no del dominio. Por eso se guardan como texto en la
/// DB en vez de enums — si el DTO 3 cambia una opción no queremos una
/// migración. `lib/parteOpciones.test.ts` compara estas listas contra las de la
/// plantilla real y falla si se desincronizan.
///
/// Todas incluyen la opción vacía del formulario (`-` o `N/A`) donde el PDF la
/// tiene; en la UI se ofrece además "Sin especificar" para no forzar una
/// elección en un parte que se está completando por partes.

/// Cuarteles de la Asociación (campo `Cuartel`).
export const CUARTELES = [
  "CC",
  "Banfield",
  "San José",
  "Llavallol",
  "Cuartel IX",
] as const;

/// Localidades del partido (campo `Localidad`).
export const LOCALIDADES = [
  "Banfield",
  "Llavallol",
  "Lomas de Zamora",
  "Parque Barón",
  "Ingeniero Budge",
  "San José",
  "Temperley",
  "Turdera",
  "Villa Centenario",
  "Villa Fiorito",
] as const;

/// Clasificación oficial del servicio (campo `Objeto`). No confundir con
/// `TipoSiniestro`: el tipo es del dominio y decide qué secciones se muestran;
/// el objeto es la categoría que el DTO 3 usa para estadística.
export const OBJETOS = [
  "Alarma de incendio",
  "Principio de incendio",
  "Prevención de incendio",
  "Incendio chico de fábrica",
  "Incendio mediano de fábrica",
  "Incendio grande de fábrica",
  "Gran incendio de fábrica",
  "Incendio chico de depósito",
  "Incendio mediano de depósito",
  "Incendio grande de depósito",
  "Gran incendio de depósito",
  "Incendio de comercio",
  "Incendio de oficina",
  "Incendio chico de vivienda",
  "Incendio mediano de vivienda",
  "Incendio grande de vivienda",
  "Gran incendio de vivienda",
  "Incendio chico de vehículo",
  "Incendio mediano de vehículo",
  "Incendio grande de vehículo",
  "Incendio chico forestal (pasto/campos/quinchos)",
  "Incendio mediano forestal (pasto/campos/quinchos)",
  "Incendio grande forestal (pasto/campos/quinchos)",
  "Incendio chico de residuos (cubiertas/ramas/residuos)",
  "Incendio mediano de residuos (cubiertas/ramas/residuos)",
  "Incendio de material ferroviario",
  "Incendio de cables",
  "Pedido por incendio",
  "Salvamento de persona",
  "Salvamento de animal",
  "Extracción de cadáver",
  "Accidente de tránsito",
  "Colisión de vehículos",
  "Accidente ferroviario",
  "Asistencia en vía pública",
  "Pedido de salvamento",
  "Colaboración con ambulancia",
  "Urgencia médica",
  "Intervención con Mat-Pel",
  "Agote",
  "Suministro de agua",
  "Suministro de energía",
  "Pedido por caída de cartel/cables/postes",
  "Caída de cartel/cables/postes",
  "Pedido de driza",
  "Driza",
  "Barrido de combustible",
  "Pedido por ascensor detenido",
  "Ascensor detenido",
  "Pedido de franqueo de puerta",
  "Franqueo de puerta",
  "Pedido por escape de gas",
  "Escape de gas",
  "Derrumbe",
  "Otros trabajos",
  "Artefacto explosivo",
  "Pedido de servicios varios",
  "Falsa alarma",
  "Salida especial",
  "Colaboración",
  "Inundación",
  "Salida especial (capacitación)",
  "Instrucción nivel inicial",
  "Instrucción niveles A y B",
  "Instrucción nivel A",
  "Instrucción nivel B",
  "Instrucción nivel C",
] as const;

/// Comisaría con jurisdicción en el lugar (campo `Jurisdicción policial`).
export const JURISDICCIONES_POLICIALES = [
  "1ra - Lomas de Zamora",
  "2da - Banfield",
  "3ra - Temperley",
  "4ta - Llavallol",
  "5ta - Villa Fiorito",
  "6ta - San José",
  "7ma - Villa Centenario",
  "8va - Villa Galicia",
  "9na - Parque Barón",
  "10ma - Ingeniero Budge",
  "-",
] as const;

/// Escala del panorama del siniestro (campo `Panorama`).
export const PANORAMAS = ["N/A", "1", "2", "3", "4"] as const;

/// Clima al momento del servicio (campo `Condiciones climáticas`). El
/// formulario lo pide sólo en siniestros viales.
export const CONDICIONES_CLIMATICAS = [
  "-",
  "Lluvia",
  "Neblina",
  "Noche",
  "Otros (detallar en la descripción de tareas)",
  "Soleado",
  "Ventoso",
] as const;

/// Tipo de rodado de cada vehículo (campo `Rodado tipo 1.n`).
export const RODADOS = [
  "Coupé",
  "Sedán 3 puertas",
  "Sedán 4 puertas",
  "Sedán 5 puertas",
  "Convertible",
  "Rural 5 puertas",
  "Limusina",
  "Todo terreno",
  "Pick-up",
  "Utilitario",
  "Camión",
  "Chasis con cabina",
  "Chasis sin cabina",
  "Acoplado",
  "Semirremolque",
  "Casa rodante",
  "Motor home",
  "Minibus",
  "Ómnibus",
  "Motovehículo",
  "Bicicleta",
  "-",
] as const;

/// Nombre del campo del AcroForm que corresponde a cada lista, para que el
/// test compare cada catálogo contra la plantilla real sin repetir el mapa.
export const LISTAS_OFICIALES = {
  Cuartel: CUARTELES,
  Localidad: LOCALIDADES,
  Objeto: OBJETOS,
  "Jurisdicción policial": JURISDICCIONES_POLICIALES,
  Panorama: PANORAMAS,
  "Condiciones climáticas": CONDICIONES_CLIMATICAS,
  "Rodado tipo 1.0": RODADOS,
} as const satisfies Record<string, readonly string[]>;
