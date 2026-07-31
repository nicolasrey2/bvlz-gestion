/**
 * Genera un PDF de muestra rellenando el formulario oficial, para revisar a
 * ojo que cada dato caiga en su casillero. Herramienta de desarrollo.
 *   pnpm exec tsx scripts/probe-pdf.ts <salida.pdf>
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import {
  limpiarFormulario,
  llenarFormularioParte,
  type ParteParaFormulario,
} from "../lib/parteAcroForm";

const PARTE: ParteParaFormulario = {
  servicioNro: "0431",
  rubaNro: "R-2026-118",
  certificadoNro: "C-441",
  informeNro: "I-77",
  cuartel: "llavallol", // en minúscula a propósito: prueba el match de listas
  fecha: new Date("2026-07-30"), // fecha "día": medianoche UTC
  objeto: "Incendio chico de vivienda",
  direccion: "Av. Antártida Argentina 1234",
  localidad: "Llavallol",
  jurisdiccionPolicial: "4ta - Llavallol",
  pedidoEfectuado: "11 6034 7528",
  ubicacion: "-34.799493, -58.427864",
  panorama: "1",
  horaAviso: "03:12",
  horaLlegada: "03:19",
  horaCircunscripto: "03:25",
  horaDominado: "03:41",
  horaExtinguido: "03:58",
  horaFinalizacion: "04:20",
  horaRegreso: "04:40",
  dotaciones: 2,
  bomberos: 7,
  unidades: "16, 22",
  descripcion:
    "Al arribo se observa fuego en cocina de vivienda de material. Se extingue con línea de 38mm, se ventila y se entrega el inmueble al propietario. Sin víctimas.",
  personal: {
    concurrio: [
      { nombre: "Sargento Herrero", guardia: true },
      { nombre: "Cabo Moser", guardia: true },
      { nombre: "Cuartelero Chiesa", movil: "16", guardia: true },
      { nombre: "Bombero Álvarez", bp: true },
      { nombre: "Bombero Nuñez", movil: "22", guardia: true, bp: true },
    ],
    enCuartel: [
      { nombre: "Cabo Domínguez", guardia: true },
      { nombre: "Bombero Sosa", bp: true },
    ],
  },
  datosTomadosPor: "Cabo Moser",
  oficialActuante: "Sargento Herrero",
  dptoTecnico: "Of. Insp. Cabrera",
  jefeCuerpo: "Comandante Giménez",
  detalle: {
    condicionesClimaticas: "Soleado",
    incendio: {
      origen: "Cocina",
      causa: "Falla eléctrica en heladera",
      propagacion: "Mobiliario contiguo",
      evolucion: "Parciales",
    },
    inmueble: {
      paredes: "Mampostería",
      techos: "Chapa",
      instElectrica: "Embutida",
      instGas: "Natural",
      ambientes: "4",
      pisos: "1",
      numeroPiso: "PB",
      nichoHidrante: false,
      extintor: true,
    },
    datosComplementarios: {
      propietario: "Rodríguez, María",
      dni: "28.111.222",
      domicilio: "Av. Antártida Argentina 1234",
      arrendatario: "Ledesma, Carlos",
      dniArrendatario: "31.555.777",
      aseguradora: "La Segunda",
      poliza: "P-99887",
      razonSocial: "—",
      ramo: "Integral de comercio",
    },
    victimas: [
      { nombre: "Pérez, Juan", dni: "30.222.333", sexo: "M", edad: "42", vehiculoNro: "1", trasladoA: "Hospital Gandulfo" },
      { nombre: "Gómez, Ana", dni: "33.444.555", sexo: "F", edad: "35", trasladoA: "En el lugar" },
    ],
    victimasFatales: [{ nombre: "Sosa, Luis", dni: "20.111.000", sexo: "M" }],
    vehiculos: [
      {
        propietario: "Rodríguez, María",
        conductor: "Rodríguez, María",
        edad: "51",
        domicilio: "Av. Antártida Argentina 1234",
        dominio: "AB123CD",
        registro: "12345678 - Lomas de Zamora",
        rodado: "Utilitario",
        marca: "Renault",
        modelo: "Kangoo",
        anio: "2018",
        otrosDatos: "Baúl con herramientas",
        aseguradora: "La Segunda",
        poliza: "V-4455",
      },
    ],
    concurrentes: {
      movilPolicial: {
        numero: "445",
        aCargo: "Of. Díaz",
        matricula: "L-9921",
        observaciones: "Corte de calle",
      },
      ambulancia: { numero: "12", aCargo: "Dra. Ruiz" },
      defensaCivil: { observaciones: "Presente" },
      otros2: { observaciones: "Cooperativa eléctrica" },
    },
  },
};

async function main() {
  const salida = process.argv[2] ?? "muestra-parte.pdf";
  const doc = await PDFDocument.load(
    await readFile(
      path.join(process.cwd(), "docs", "parte-intervencion-DTO3.pdf"),
    ),
  );
  const form = doc.getForm();

  limpiarFormulario(form);
  const { camposFaltantes } = llenarFormularioParte(form, PARTE);
  console.log(
    camposFaltantes.length
      ? `FALTANTES (${camposFaltantes.length}): ${camposFaltantes.join(", ")}`
      : "mapeo OK: no falta ningún campo en la plantilla",
  );

  form.flatten();
  await writeFile(salida, await doc.save());
  console.log(`escrito: ${salida}`);
}

main();
