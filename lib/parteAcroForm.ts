import { PDFCheckBox, PDFDropdown, PDFTextField, type PDFForm } from "pdf-lib";
import { leerDetalle } from "./partesDetalle";

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
  cuartel: string | null;
  fecha: Date | null;
  objeto: string | null;
  direccion: string | null;
  localidad: string | null;
  horaAviso: string | null;
  horaLlegada: string | null;
  horaRegreso: string | null;
  dotaciones: number | null;
  bomberos: number | null;
  unidades: string | null;
  descripcion: string | null;
  personal: string[];
  datosTomadosPor: string | null;
  oficialActuante: string | null;
  jefeCuerpo: string | null;
  detalle?: unknown;
};

/// Campos de valor único. Nombres exactos del AcroForm oficial.
const CAMPO = {
  hoja: "nº",
  hojasTotales: "hojas totales",
  servicioNro: "Servicio nº",
  fecha: "Fecha",
  oficialActuante: "Oficial actuante",
  direccion: "Dirección",
  horaAviso: "Hora recepción",
  horaLlegada: "Hora llegada",
  horaRegreso: "Hora regreso",
  dotaciones: "Dotac",
  bomberos: "Bros./as",
  unidades: "Ingresar los números separados por comas",
  descripcion: "Descriprción de las tareas",
  datosTomadosPor: "Datos tomados por",
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
  // Datos complementarios
  dcPropietario: "Propietario/a del inmueble",
  dcDni: "DNI propietario/a",
  dcDomicilio: "Domicilio propietario/a del inmueble",
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

/// Filas de la tabla CONCURRENTES, en el orden impreso en el formulario.
/// Las dos últimas son "Otros"; el dominio solo tiene una, así que la 5 queda
/// libre para completar a mano.
const FILA_CONCURRENTE = {
  movilPolicial: "0",
  ambulancia: "1",
  defensaCivil: "2",
  transito: "3",
  otros: "4",
} as const;

/// Tabla PERSONAL QUE CONCURRIÓ: 3 columnas × 12 filas. Se llena hacia abajo
/// por columna (igual que a mano), que es el orden del ejemplo de la plantilla.
const PERSONAL_COLUMNAS = 3;
const PERSONAL_FILAS = 12;

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

/// Fecha en el formato del formulario (dd/mm/aaaa), en hora argentina para que
/// un parte cargado cerca de medianoche no se corra de día.
function fmtFechaParte(fecha: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(fecha);
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
  if (parte.fecha) texto(ctx, CAMPO.fecha, fmtFechaParte(parte.fecha));
  lista(ctx, LISTA.cuartel, parte.cuartel);
  lista(ctx, LISTA.objeto, parte.objeto);
  texto(ctx, CAMPO.oficialActuante, parte.oficialActuante);
  texto(ctx, CAMPO.direccion, parte.direccion);
  lista(ctx, LISTA.localidad, parte.localidad);

  texto(ctx, CAMPO.horaAviso, parte.horaAviso);
  texto(ctx, CAMPO.horaLlegada, parte.horaLlegada);
  texto(ctx, CAMPO.horaRegreso, parte.horaRegreso);

  texto(ctx, CAMPO.dotaciones, parte.dotaciones);
  texto(ctx, CAMPO.bomberos, parte.bomberos);
  texto(ctx, CAMPO.unidades, parte.unidades);
  texto(ctx, CAMPO.descripcion, parte.descripcion);

  // --- Concurrentes: el dominio guarda un texto libre por organismo; en el
  // formulario cada uno es una fila con 4 columnas, así que va a Observaciones.
  const concurrentes = detalle.concurrentes;
  if (concurrentes) {
    for (const [clave, fila] of Object.entries(FILA_CONCURRENTE)) {
      const valor = concurrentes[clave as keyof typeof concurrentes];
      texto(ctx, `Observaciones móvil policial.${fila}`, valor);
    }
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
    texto(ctx, `Marca veh. 1.${n}`, veh.marca);
    texto(ctx, `Modelo vehículo 1.${n}`, veh.modelo);
    texto(ctx, `Año vehículo 1.${n}`, veh.anio);
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
    listaSiNo(ctx, LISTA.nichoHidrante, inmueble.nichoHidrante);
    listaSiNo(ctx, LISTA.extintor, inmueble.extintor);
  }

  // --- Datos complementarios ---
  const dc = detalle.datosComplementarios;
  if (dc) {
    texto(ctx, CAMPO.dcPropietario, dc.propietario);
    texto(ctx, CAMPO.dcDni, dc.dni);
    texto(ctx, CAMPO.dcDomicilio, dc.domicilio);
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

  // --- Personal que concurrió ---
  // Hoy el dominio guarda solo el texto de cada persona, así que se completa
  // la columna "Jerarquía y apellido". Las columnas Ch. (nº de móvil), G y BP
  // quedan en blanco hasta que P6 estructure el personal.
  parte.personal
    .slice(0, PERSONAL_COLUMNAS * PERSONAL_FILAS)
    .forEach((persona, i) => {
      const columna = Math.floor(i / PERSONAL_FILAS);
      const fila = i % PERSONAL_FILAS;
      texto(ctx, `Jerarquía y nombre.${columna}.${fila}`, persona);
    });

  // --- Firmas ---
  texto(ctx, CAMPO.datosTomadosPor, parte.datosTomadosPor);
  texto(ctx, CAMPO.firmaOficial, parte.oficialActuante);
  texto(ctx, CAMPO.firmaJefe, parte.jefeCuerpo);

  return { camposFaltantes: ctx.faltantes };
}

/// Marca un casillero de la tabla de personal (G / BP). Queda expuesto para
/// cuando P6 estructure el personal; hoy nadie lo llama.
export function marcarPersonal(
  form: PDFForm,
  tipo: "G" | "BP",
  columna: number,
  fila: number,
) {
  const ctx: Contexto = { form, faltantes: [] };
  const campo = tipo === "G" ? "Guardia" : "BP";
  marcar(ctx, `${campo}.${columna}.${fila}`);
  return { camposFaltantes: ctx.faltantes };
}
