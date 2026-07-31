import { readFile } from "node:fs/promises";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { LISTAS_OFICIALES } from "./parteOpciones";

/// Los catálogos de `parteOpciones.ts` son una copia de las listas desplegables
/// del formulario oficial. Si el DTO 3 agrega, saca o reescribe una opción, la
/// app tiene que enterarse acá y no cuando alguien note que el desplegable del
/// PDF quedó con un valor inventado.
const RUTA = path.join(process.cwd(), "docs", "parte-intervencion-DTO3.pdf");

let plantilla: Buffer;

beforeAll(async () => {
  plantilla = await readFile(RUTA);
});

describe("las listas oficiales están sincronizadas con la plantilla", () => {
  it.for(Object.entries(LISTAS_OFICIALES))(
    "%s tiene las mismas opciones, en el mismo orden",
    async ([campo, opciones]) => {
      const doc = await PDFDocument.load(plantilla);
      const desplegable = doc.getForm().getDropdown(campo);
      expect(desplegable.getOptions()).toEqual([...opciones]);
    },
  );
});
