import { PDFCheckBox, PDFDropdown, PDFTextField, type PDFForm } from "pdf-lib";
import { fmtFechaDia } from "./fechas";
import { leerDetalle, ORGANISMOS_CONCURRENTES } from "./partesDetalle";
import {
  CUPO_CONCURRIO,
  CUPO_EN_CUARTEL,
  PERSONAL_VACIO,
  type PersonaParte,
  type PersonalParte,
} from "./partePersonal";

/// Relleno del formulario oficial del DTO 3 (`docs/parte-intervencion-DTO3.pdf`)
/// con los datos de un parte (P8).
///
/// El PDF oficial es un AcroForm real: en vez de dibujar un documento parecido
/// (lo que hacía `pdf/parte.tsx` con @react-pdf/renderer), se abre la plantilla
/// y se completan sus campos. La salida es idéntica al formulario en papel.
///
/// Los nombres de los campos se toman **literales del PDF**, con erratas y todo
/// ("Conuctor/a", "Descriprción", "Dotac"): son el identificador real dentro
/// del archivo, no un texto a corregir. Si el DTO 3 cambia la plantilla, esto
/// deja de matchear — por eso `llenarFormularioParte` devuelve los campos que
/// no encontró y hay un test que falla si aparece alguno.

/// Datos ya "planos" que necesita el formulario. El route handler los arma a
/// partir de la fila de Prisma; `detalle` viaja sin tipar (viene de un Json) y
/// se parsea acá con `leerDetalle`.
export type ParteParaFormulario = {
  servicioNro: string | null;
  rubaNro: string | null;
  certificadoNro: string | null;
  informeNro: string | null;
  cuartel: string | null;
  fecha: Date | null;
  objeto: string | null;
  direccion: string | null;
  localidad: string | null;
  jurisdiccionPolicial: string | null;
  pedidoEfectuado: string | null;
  ubicacion: string | null;
  panorama: string | null;
  horaAviso: string | null;
  horaLlegada: string | null;
  horaCircunscripto: string | null;
  horaDominado: string | null;
  horaExtinguido: string | null;
  horaFinalizacion: string | null;
  horaRegreso: string | null;
  dotaciones: number | null;
  bomberos: number | null;
  unidades: string | null;
  descripcion: string | null;
  personal: PersonalParte;
  datosTomadosPor: string | null;
  oficialActuante: string | null;
  dptoTecnico: string | null;
  jefeCuerpo: string | null;
  detalle?: unknown;
};

/// Campos de valor único. Nombres exactos del AcroForm oficial.
const CAMPO = {
  hoja: "nº",
  hojasTotales: "hojas totales",
  servicioNro: "Servicio nº",
  rubaNro: "RUBA nº",
  certificadoNro: "Certificado nº",
  informeNro: "Informe nº",
  fecha: "Fecha",
  oficialActuante: "Oficial actuante",
  direccion: "Dirección",
  pedidoEfectuado: "Pedido efectuado",
  // Rotulado "Ubicación" en el formulario impreso; el nombre interno del campo
  // describe lo que se espera (coordenadas o un link).
  ubicacion: "Descripción del lugar o link a Google Maps",
  horaAviso: "Hora recepción",
  horaLlegada: "Hora llegada",
  horaCircunscripto: "Hora circunscripto",
  horaDominado: "Hora dominado",
  horaExtinguido: "Hora extinguido",
  horaFinalizacion: "Hora finalización",
  horaRegreso: "Hora regreso",
  dotaciones: "Dotac",
  bomberos: "Bros./as",
  unidades: "Ingresar los números separados por comas",
  descripcion: "Descriprción de las tareas",
  datosTomadosPor: "Datos tomados por",
  dptoTecnico: "Dpto. Técnico",
  firmaOficial: "Firma oficial actuante",
  firmaJefe: "Firma Jefe del Cuerpo",
  // Análisis del incendio
  origen: "Origen",
  causa: "Causa",
  propagacion: "Propagación",
  evolucion: "Evolución de los deterioros",
  // Descripción del inmueble
  paredes: "Paredes de",
  techos: "Techos de",
  instElectrica: "Tipo de instalación eléctrica",
  instGas: "Tipo de instalación de gas",
  ambientes: "Cantidad de ambientes",
  pisos: "Cantidad de pisos",
  numeroPiso: "Número de piso",
  // Datos complementarios
  dcPropietario: "Propietario/a del inmueble",
  dcDni: "DNI propietario/a",
  dcDomicilio: "Domicilio propietario/a del inmueble",
  dcArrendatario: "Arrendatario/a",
  dcDniArrendatario: "DNI arrendatario/a",
  dcAseguradora: "Compañía aseguradora",
  dcPoliza: "Nº de póliza",
  dcRazonSocial: "Razón social",
  dcRamo: "Ramo",
  // Rescate de animal
  animalPropietario: "Propietario/a del animal",
  animalDni: "DNI propietario/a del animal",
  animalDomicilio: "Domicilio propietario/a del animal",
  animalEspecieRaza: "Especie y raza",
  // Siniestros ferroviarios
  ferroGuarda: "Guarda",
  ferroMaquinista: "Maquinista",
  ferroRecorrido: "Recorrido",
  ferroKmVia: "Km de vía",
  ferroNroTren: "Nº de tren",
  ferroNroCabina: "Nº de cabina",
} as const;

/// Campos que en el PDF son listas desplegables: no aceptan cualquier texto,
/// hay que elegir una de sus opciones (ver `elegirEnLista`).
const LISTA = {
  cuartel: "Cuartel",
  localidad: "Localidad",
  objeto: "Objeto",
  jurisdiccionPolicial: "Jurisdicción policial",
  panorama: "Panorama",
  condicionesClimaticas: "Condiciones climáticas",
  nichoHidrante: "Nicho hidrante",
  extintor: "Extintor",
} as const;

/// El formulario tiene lugar para 2 vehículos, 4 víctimas y 2 víctimas
/// fatales — justo la misma cantidad que ya modela `lib/partesDetalle.ts`.
const VEHICULOS = ["0", "1"] as const;
/// Las 4 víctimas se numeran por fila y columna: 1=(0,0) 2=(0,1) 3=(1,0) 4=(1,1).
const VICTIMAS = ["0.0", "0.1", "1.0", "1.1"] as const;
const VICTIMAS_FATALES = ["0", "1"] as const;

/// Columnas de la tabla CONCURRENTES. La fila es el índice del organismo en
/// `ORGANISMOS_CONCURRENTES`: el formulario imprime una fila por organismo, en
/// ese orden, incluida la segunda fila "Otros".
const COLUMNA_CONCURRENTE = {
  numero: "Nº móvil policial",
  aCargo: "A cargo - Policía",
  matricula: "Matrícula/legajo/DNI - Policía",
  observaciones: "Observaciones móvil policial",
} as const;

/// Las dos tablas de personal. Ambas se llenan hacia abajo por columna (igual
/// que a mano), que es el orden del ejemplo que trae la plantilla.
const TABLA_CONCURRIO = {
  filas: 12,
  nombre: (c: number, f: number) => `Jerarquía y nombre.${c}.${f}`,
  movil: (c: number, f: number) => `Chofer.${c}.${f}`,
  guardia: (c: number, f: number) => `Guardia.${c}.${f}`,
  bp: (c: number, f: number) => `BP.${c}.${f}`,
};

const TABLA_EN_CUARTEL = {
  filas: 7,
  nombre: (c: number, f: number) => `En el cuartel 1.0.${c}.${f}`,
  movil: null,
  guardia: (c: number, f: number) => `G 1.0.${c}.${f}`,
  bp: (c: number, f: number) => `BP en el cuartel.0.${c}.${f}`,
};

/// Acumula los campos que no se encontraron en la plantilla, para que el
/// llamador (y el test) se entere si el DTO 3 la cambió.
type Contexto = { form: PDFForm; faltantes: string[] };

function texto(ctx: Contexto, campo: string, valor: unknown) {
  if (valor === null || valor === undefined || valor === "") return;
  try {
    ctx.form.getTextField(campo).setText(String(valor));
  } catch {
    ctx.faltantes.push(campo);
  }
}

/// Compara ignorando mayúsculas, acentos y espacios de más — el dominio guarda
/// texto libre ("llavallol", "Soleado ") y la lista del PDF tiene los valores
/// canónicos ("Llavallol").
function normalizar(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

/// Elige un valor en una lista desplegable. Si el texto libre del parte no
/// coincide con ninguna opción oficial, se agrega como opción y se selecciona
/// igual: preferimos mostrar lo que la persona cargó antes que perder el dato
/// silenciosamente en el PDF que se archiva.
function lista(ctx: Contexto, campo: string, valor: unknown) {
  if (valor === null || valor === undefined || valor === "") return;
  const buscado = String(valor);
  try {
    const desplegable = ctx.form.getDropdown(campo);
    const opcion = desplegable
      .getOptions()
      .find((o) => normalizar(o) === normalizar(buscado));
    if (opcion) {
      desplegable.select(opcion);
    } else {
      desplegable.addOptions(buscado);
      desplegable.select(buscado);
    }
  } catch {
    ctx.faltantes.push(campo);
  }
}

/// Listas Sí/No/- del inmueble (nicho hidrante, extintor).
function listaSiNo(ctx: Contexto, campo: string, valor: boolean | undefined) {
  if (valor === undefined) return;
  lista(ctx, campo, valor ? "Sí" : "No");
}

function marcar(ctx: Contexto, campo: string) {
  try {
    ctx.form.getCheckBox(campo).check();
  } catch {
    ctx.faltantes.push(campo);
  }
}

type TablaPersonal = {
  filas: number;
  nombre: (columna: number, fila: number) => string;
  /// Sólo la tabla de "concurrió" tiene columna Ch. (chofer: nº de móvil).
  movil: ((columna: number, fila: number) => string) | null;
  guardia: (columna: number, fila: number) => string;
  /// Columna BP: busca persona (ver `lib/partePersonal.ts`).
  bp: (columna: number, fila: number) => string;
};

/// Vuelca una lista de personas en una de las dos tablas del formulario,
/// llenando hacia abajo por columna. Lo que excede los casilleros no entra en
/// el PDF; la UI avisa antes de llegar acá (`excedeElFormulario`).
function llenarTablaPersonal(
  ctx: Contexto,
  tabla: TablaPersonal,
  personas: PersonaParte[],
  cupo: number,
) {
  personas.slice(0, cupo).forEach((persona, i) => {
    const columna = Math.floor(i / tabla.filas);
    const fila = i % tabla.filas;
    texto(ctx, tabla.nombre(columna, fila), persona.nombre);
    if (tabla.movil) texto(ctx, tabla.movil(columna, fila), persona.movil);
    if (persona.guardia) marcar(ctx, tabla.guardia(columna, fila));
    if (persona.bp) marcar(ctx, tabla.bp(columna, fila));
  });
}

/// Fecha en el formato del formulario (dd/mm/aaaa).
///
/// `ParteIntervencion.fecha` es una fecha "día", no un instante: se guarda como
/// medianoche UTC (ver `lib/fechas.ts`). Por eso se formatea en **UTC** igual
/// que en la ficha del parte; formatearla en hora argentina restaba un día y el
/// PDF salía fechado el día anterior.
function fmtFechaParte(fecha: Date): string {
  return fmtFechaDia(fecha);
}

/// Deja la plantilla en blanco. Es imprescindible: el PDF oficial que nos
/// pasaron viene con un parte de ejemplo cargado (servicio 0424, "Sargento
/// Herrero", etc.), así que sin limpiar quedarían datos de otro parte mezclados
/// con los nuestros en los campos que no completamos.
export function limpiarFormulario(form: PDFForm) {
  for (const campo of form.getFields()) {
    if (campo instanceof PDFTextField) campo.setText("");
    else if (campo instanceof PDFCheckBox) campo.uncheck();
    else if (campo instanceof PDFDropdown) campo.clear();
  }
}

/// Completa el formulario oficial con los datos del parte. Devuelve los campos
/// que no existían en la plantilla (vacío = el mapeo sigue vigente).
export function llenarFormularioParte(
  form: PDFForm,
  parte: ParteParaFormulario,
): { camposFaltantes: string[] } {
  const ctx: Contexto = { form, faltantes: [] };
  const detalle = leerDetalle(parte.detalle);

  // --- Encabezado ---
  texto(ctx, CAMPO.hoja, "1");
  texto(ctx, CAMPO.hojasTotales, "1");
  texto(ctx, CAMPO.servicioNro, parte.servicioNro);
  texto(ctx, CAMPO.rubaNro, parte.rubaNro);
  texto(ctx, CAMPO.certificadoNro, parte.certificadoNro);
  texto(ctx, CAMPO.informeNro, parte.informeNro);
  if (parte.fecha) texto(ctx, CAMPO.fecha, fmtFechaParte(parte.fecha));
  lista(ctx, LISTA.cuartel, parte.cuartel);
  lista(ctx, LISTA.objeto, parte.objeto);
  texto(ctx, CAMPO.oficialActuante, parte.oficialActuante);
  texto(ctx, CAMPO.direccion, parte.direccion);
  lista(ctx, LISTA.localidad, parte.localidad);
  lista(ctx, LISTA.jurisdiccionPolicial, parte.jurisdiccionPolicial);
  texto(ctx, CAMPO.pedidoEfectuado, parte.pedidoEfectuado);
  texto(ctx, CAMPO.ubicacion, parte.ubicacion);
  lista(ctx, LISTA.panorama, parte.panorama);

  // Tiempos, en el orden del formulario: del aviso al regreso.
  texto(ctx, CAMPO.horaAviso, parte.horaAviso);
  texto(ctx, CAMPO.horaLlegada, parte.horaLlegada);
  texto(ctx, CAMPO.horaCircunscripto, parte.horaCircunscripto);
  texto(ctx, CAMPO.horaDominado, parte.horaDominado);
  texto(ctx, CAMPO.horaExtinguido, parte.horaExtinguido);
  texto(ctx, CAMPO.horaFinalizacion, parte.horaFinalizacion);
  texto(ctx, CAMPO.horaRegreso, parte.horaRegreso);

  texto(ctx, CAMPO.dotaciones, parte.dotaciones);
  texto(ctx, CAMPO.bomberos, parte.bomberos);
  texto(ctx, CAMPO.unidades, parte.unidades);
  texto(ctx, CAMPO.descripcion, parte.descripcion);

  // --- Concurrentes: una fila por organismo, con sus 4 columnas.
  const concurrentes = detalle.concurrentes;
  if (concurrentes) {
    ORGANISMOS_CONCURRENTES.forEach(({ clave }, fila) => {
      const organismo = concurrentes[clave];
      if (!organismo) return;
      texto(ctx, `${COLUMNA_CONCURRENTE.numero}.${fila}`, organismo.numero);
      texto(ctx, `${COLUMNA_CONCURRENTE.aCargo}.${fila}`, organismo.aCargo);
      texto(ctx, `${COLUMNA_CONCURRENTE.matricula}.${fila}`, organismo.matricula);
      texto(
        ctx,
        `${COLUMNA_CONCURRENTE.observaciones}.${fila}`,
        organismo.observaciones,
      );
    });
  }

  lista(ctx, LISTA.condicionesClimaticas, detalle.condicionesClimaticas);

  // --- Vehículos (hasta 2) ---
  detalle.vehiculos?.slice(0, VEHICULOS.length).forEach((veh, i) => {
    const n = VEHICULOS[i];
    texto(ctx, `Propietario/a de vehículo 1.${n}`, veh.propietario);
    texto(ctx, `Conuctor/a de vehículo 1.${n}`, veh.conductor);
    texto(ctx, `Edad conductor/a veh. 1.${n}`, veh.edad);
    texto(ctx, `Domicilio de conductor/a del vehículo 1.${n}`, veh.domicilio);
    texto(ctx, `Chapa vehículo 1.${n}`, veh.dominio);
    texto(ctx, `Nº y origen del registro vehículo 1.${n}`, veh.registro);
    lista(ctx, `Rodado tipo 1.${n}`, veh.rodado);
    texto(ctx, `Marca veh. 1.${n}`, veh.marca);
    texto(ctx, `Modelo vehículo 1.${n}`, veh.modelo);
    texto(ctx, `Año vehículo 1.${n}`, veh.anio);
    texto(ctx, `Otros datos vehículo 1.${n}`, veh.otrosDatos);
    texto(ctx, `Compañía aseguradora vehículo 1.${n}`, veh.aseguradora);
    texto(ctx, `Póliza vehículo 1.${n}`, veh.poliza);
  });

  // --- Análisis del incendio ---
  const incendio = detalle.incendio;
  if (incendio) {
    texto(ctx, CAMPO.origen, incendio.origen);
    texto(ctx, CAMPO.causa, incendio.causa);
    texto(ctx, CAMPO.propagacion, incendio.propagacion);
    texto(ctx, CAMPO.evolucion, incendio.evolucion);
  }

  // --- Descripción del inmueble ---
  const inmueble = detalle.inmueble;
  if (inmueble) {
    texto(ctx, CAMPO.paredes, inmueble.paredes);
    texto(ctx, CAMPO.techos, inmueble.techos);
    texto(ctx, CAMPO.instElectrica, inmueble.instElectrica);
    texto(ctx, CAMPO.instGas, inmueble.instGas);
    texto(ctx, CAMPO.ambientes, inmueble.ambientes);
    texto(ctx, CAMPO.pisos, inmueble.pisos);
    texto(ctx, CAMPO.numeroPiso, inmueble.numeroPiso);
    listaSiNo(ctx, LISTA.nichoHidrante, inmueble.nichoHidrante);
    listaSiNo(ctx, LISTA.extintor, inmueble.extintor);
  }

  // --- Datos complementarios ---
  const dc = detalle.datosComplementarios;
  if (dc) {
    texto(ctx, CAMPO.dcPropietario, dc.propietario);
    texto(ctx, CAMPO.dcDni, dc.dni);
    texto(ctx, CAMPO.dcDomicilio, dc.domicilio);
    texto(ctx, CAMPO.dcArrendatario, dc.arrendatario);
    texto(ctx, CAMPO.dcDniArrendatario, dc.dniArrendatario);
    texto(ctx, CAMPO.dcAseguradora, dc.aseguradora);
    texto(ctx, CAMPO.dcPoliza, dc.poliza);
    texto(ctx, CAMPO.dcRazonSocial, dc.razonSocial);
    texto(ctx, CAMPO.dcRamo, dc.ramo);
  }

  // --- Víctimas (hasta 4) ---
  detalle.victimas?.slice(0, VICTIMAS.length).forEach((vic, i) => {
    const n = VICTIMAS[i];
    texto(ctx, `Nombre víctima 1.${n}`, vic.nombre);
    texto(ctx, `DNI víctima 1.${n}`, vic.dni);
    texto(ctx, `Sexo víctima 1.${n}`, vic.sexo);
    texto(ctx, `Edad víctima 1.${n}`, vic.edad);
    texto(ctx, `Vehículo víctima 1.${n}`, vic.vehiculoNro);
    texto(ctx, `Destino de traslado víctima 1.${n}`, vic.trasladoA);
  });

  // --- Víctimas fatales (hasta 2) ---
  detalle.victimasFatales?.slice(0, VICTIMAS_FATALES.length).forEach((vf, i) => {
    const n = VICTIMAS_FATALES[i];
    texto(ctx, `Nombre víctima fatal 1.${n}`, vf.nombre);
    texto(ctx, `DNI víctima fatal 1.${n}`, vf.dni);
    texto(ctx, `Sexo víctima fatal 1.${n}`, vf.sexo);
  });

  // --- Rescate de animal ---
  const animal = detalle.animal;
  if (animal) {
    texto(ctx, CAMPO.animalPropietario, animal.propietario);
    texto(ctx, CAMPO.animalDni, animal.dni);
    texto(ctx, CAMPO.animalDomicilio, animal.domicilio);
    texto(ctx, CAMPO.animalEspecieRaza, animal.especieRaza);
  }

  // --- Siniestros ferroviarios ---
  const ferro = detalle.ferroviario;
  if (ferro) {
    texto(ctx, CAMPO.ferroGuarda, ferro.guarda);
    texto(ctx, CAMPO.ferroMaquinista, ferro.maquinista);
    texto(ctx, CAMPO.ferroRecorrido, ferro.recorrido);
    texto(ctx, CAMPO.ferroKmVia, ferro.kmVia);
    texto(ctx, CAMPO.ferroNroTren, ferro.nroTren);
    texto(ctx, CAMPO.ferroNroCabina, ferro.nroCabina);
  }

  // --- Personal (las dos tablas del formulario) ---
  const personal = parte.personal ?? PERSONAL_VACIO;
  llenarTablaPersonal(ctx, TABLA_CONCURRIO, personal.concurrio, CUPO_CONCURRIO);
  llenarTablaPersonal(ctx, TABLA_EN_CUARTEL, personal.enCuartel, CUPO_EN_CUARTEL);

  // --- Firmas ---
  texto(ctx, CAMPO.datosTomadosPor, parte.datosTomadosPor);
  texto(ctx, CAMPO.dptoTecnico, parte.dptoTecnico);
  texto(ctx, CAMPO.firmaOficial, parte.oficialActuante);
  texto(ctx, CAMPO.firmaJefe, parte.jefeCuerpo);

  return { camposFaltantes: ctx.faltantes };
}
