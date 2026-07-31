/**
 * Vuelca los nombres completamente calificados de los campos del formulario
 * oficial (`docs/parte-intervencion-DTO3.pdf`) para poder armar el mapa
 * dominio → AcroForm de `lib/parteAcroForm.ts` (P8).
 *
 * Es una herramienta de desarrollo: se corre a mano cuando el DTO 3 cambia la
 * plantilla, no en runtime. `pnpm dump:campos-pdf`
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown } from "pdf-lib";

function tipoDe(campo: unknown): string {
  if (campo instanceof PDFTextField) return "texto";
  if (campo instanceof PDFCheckBox) return "check";
  if (campo instanceof PDFRadioGroup) return "radio";
  if (campo instanceof PDFDropdown) return "lista";
  return "otro";
}

async function main() {
  const ruta = path.join(process.cwd(), "docs", "parte-intervencion-DTO3.pdf");
  const doc = await PDFDocument.load(await readFile(ruta));
  const campos = doc.getForm().getFields();

  console.log(`total: ${campos.length}\n`);
  for (const campo of campos) {
    const tipo = tipoDe(campo);
    const extra =
      campo instanceof PDFRadioGroup
        ? ` opciones=[${campo.getOptions().join("|")}]`
        : campo instanceof PDFDropdown
          ? ` opciones=[${campo.getOptions().join("|")}]`
          : "";
    console.log(`${tipo}\t${campo.getName()}${extra}`);
  }
}

main();
