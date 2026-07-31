import { readFile } from "node:fs/promises";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { PDFDocument, type PDFForm } from "pdf-lib";
import {
  limpiarFormulario,
  llenarFormularioParte,
  type ParteParaFormulario,
} from "./parteAcroForm";

/// Estos tests corren contra la plantilla oficial de verdad
/// (`docs/parte-intervencion-DTO3.pdf`), no contra un mock: el valor está
/// justamente en detectar que el DTO 3 cambió el formulario y el mapeo de
/// `parteAcroForm.ts` quedó viejo.
const RUTA = path.join(process.cwd(), "docs", "parte-intervencion-DTO3.pdf");

let plantilla: Buffer;

beforeAll(async () => {
  plantilla = await readFile(RUTA);
});

async function formularioLimpio(): Promise<PDFForm> {
  const doc = await PDFDocument.load(plantilla);
  const form = doc.getForm();
  limpiarFormulario(form);
  return form;
}

const PARTE_MINIMO: ParteParaFormulario = {
  servicioNro: null,
  cuartel: null,
  fecha: null,
  objeto: null,
  direccion: null,
  localidad: null,
  horaAviso: null,
  horaLlegada: null,
  horaRegreso: null,
  dotaciones: null,
  bomberos: null,
  unidades: null,
  descripcion: null,
  personal: [],
  datosTomadosPor: null,
  oficialActuante: null,
  jefeCuerpo: null,
};

function parteCon(extra: Partial<ParteParaFormulario>): ParteParaFormulario {
  return { ...PARTE_MINIMO, ...extra };
}

describe("limpiarFormulario", () => {
  it("borra el parte de ejemplo que trae la plantilla oficial", async () => {
    // La plantilla viene con datos cargados: si esto dejara de limpiarse,
    // cada PDF saldría con datos de otro parte en los campos vacíos.
    const doc = await PDFDocument.load(plantilla);
    const sucio = doc.getForm();
    expect(sucio.getTextField("Servicio nº").getText()).toBe("0424");
    expect(sucio.getTextField("Jerarquía y nombre.0.0").getText()).toBe(
      "Sargento Herrero",
    );
    expect(sucio.getCheckBox("Guardia.0.0").isChecked()).toBe(true);

    limpiarFormulario(sucio);

    expect(sucio.getTextField("Servicio nº").getText()).toBeUndefined();
    expect(sucio.getTextField("Jerarquía y nombre.0.0").getText()).toBeUndefined();
    expect(sucio.getCheckBox("Guardia.0.0").isChecked()).toBe(false);
    expect(sucio.getDropdown("Cuartel").getSelected()).toEqual([]);
  });
});

describe("llenarFormularioParte — el mapeo sigue vigente", () => {
  it("no reporta campos ausentes con un parte completo", async () => {
    const form = await formularioLimpio();
    const { camposFaltantes } = llenarFormularioParte(
      form,
      parteCon({
        servicioNro: "0431",
        cuartel: "Llavallol",
        objeto: "Incendio chico de vivienda",
        localidad: "Llavallol",
        direccion: "Av. Antártida Argentina 1234",
        personal: ["Sargento Herrero", "Cabo Moser"],
        detalle: {
          condicionesClimaticas: "Soleado",
          incendio: { origen: "Cocina", causa: "Falla eléctrica" },
          inmueble: { paredes: "Mampostería", nichoHidrante: true, extintor: false },
          datosComplementarios: { propietario: "Rodríguez, María", dni: "28.111.222" },
          victimas: [{ nombre: "Pérez, Juan" }, { nombre: "Gómez, Ana" }],
          victimasFatales: [{ nombre: "Sosa, Luis" }],
          animal: { especieRaza: "Canino mestizo" },
          ferroviario: { nroTren: "412" },
          vehiculos: [{ marca: "Renault", dominio: "AB123CD" }],
          concurrentes: { movilPolicial: "Móvil 445", ambulancia: "SAME 12" },
        },
      }),
    );
    expect(camposFaltantes).toEqual([]);
  });
});

describe("llenarFormularioParte — encabezado", () => {
  it("escribe los datos simples en su campo", async () => {
    const form = await formularioLimpio();
    llenarFormularioParte(
      form,
      parteCon({
        servicioNro: "0431",
        direccion: "Av. Antártida Argentina 1234",
        horaAviso: "03:12",
        horaRegreso: "04:40",
        dotaciones: 2,
        bomberos: 7,
        unidades: "16, 22",
        descripcion: "Se extingue con línea de 38mm.",
        oficialActuante: "Sargento Herrero",
      }),
    );

    expect(form.getTextField("Servicio nº").getText()).toBe("0431");
    expect(form.getTextField("Dirección").getText()).toBe(
      "Av. Antártida Argentina 1234",
    );
    expect(form.getTextField("Hora recepción").getText()).toBe("03:12");
    expect(form.getTextField("Hora regreso").getText()).toBe("04:40");
    expect(form.getTextField("Dotac").getText()).toBe("2");
    expect(form.getTextField("Bros./as").getText()).toBe("7");
    expect(form.getTextField("Descriprción de las tareas").getText()).toBe(
      "Se extingue con línea de 38mm.",
    );
    // El oficial actuante va también al renglón de firma.
    expect(form.getTextField("Firma oficial actuante").getText()).toBe(
      "Sargento Herrero",
    );
  });

  it("formatea la fecha como dd/mm/aaaa en hora argentina", async () => {
    const form = await formularioLimpio();
    // 03:00 UTC del 30/07 = 00:00 del 30/07 en Argentina: no se corre de día.
    llenarFormularioParte(
      form,
      parteCon({ fecha: new Date("2026-07-30T03:00:00.000Z") }),
    );
    expect(form.getTextField("Fecha").getText()).toBe("30/07/2026");
  });

  it("no escribe nada cuando el parte está vacío", async () => {
    const form = await formularioLimpio();
    llenarFormularioParte(form, PARTE_MINIMO);
    expect(form.getTextField("Servicio nº").getText()).toBeUndefined();
    expect(form.getTextField("Dirección").getText()).toBeUndefined();
    expect(form.getDropdown("Cuartel").getSelected()).toEqual([]);
  });
});

describe("llenarFormularioParte — listas desplegables", () => {
  it("matchea la opción oficial ignorando mayúsculas y acentos", async () => {
    const form = await formularioLimpio();
    llenarFormularioParte(
      form,
      parteCon({ cuartel: "  llavallol ", localidad: "lomas de zamora" }),
    );
    expect(form.getDropdown("Cuartel").getSelected()).toEqual(["Llavallol"]);
    expect(form.getDropdown("Localidad").getSelected()).toEqual([
      "Lomas de Zamora",
    ]);
  });

  it("conserva el texto libre que no está en la lista en vez de perderlo", async () => {
    const form = await formularioLimpio();
    llenarFormularioParte(form, parteCon({ localidad: "Monte Grande" }));
    expect(form.getDropdown("Localidad").getSelected()).toEqual([
      "Monte Grande",
    ]);
  });

  it("traduce los booleanos del inmueble a Sí/No", async () => {
    const form = await formularioLimpio();
    llenarFormularioParte(
      form,
      parteCon({ detalle: { inmueble: { nichoHidrante: true, extintor: false } } }),
    );
    expect(form.getDropdown("Nicho hidrante").getSelected()).toEqual(["Sí"]);
    expect(form.getDropdown("Extintor").getSelected()).toEqual(["No"]);
  });

  it("deja la lista vacía si el booleano no se cargó", async () => {
    const form = await formularioLimpio();
    llenarFormularioParte(form, parteCon({ detalle: { inmueble: { paredes: "Ladrillo" } } }));
    expect(form.getDropdown("Nicho hidrante").getSelected()).toEqual([]);
  });
});

describe("llenarFormularioParte — tablas repetidas", () => {
  it("ubica las 4 víctimas en su casillero (1 y 2 arriba, 3 y 4 abajo)", async () => {
    const form = await formularioLimpio();
    llenarFormularioParte(
      form,
      parteCon({
        detalle: {
          victimas: [
            { nombre: "Uno" },
            { nombre: "Dos" },
            { nombre: "Tres" },
            { nombre: "Cuatro" },
          ],
        },
      }),
    );
    expect(form.getTextField("Nombre víctima 1.0.0").getText()).toBe("Uno");
    expect(form.getTextField("Nombre víctima 1.0.1").getText()).toBe("Dos");
    expect(form.getTextField("Nombre víctima 1.1.0").getText()).toBe("Tres");
    expect(form.getTextField("Nombre víctima 1.1.1").getText()).toBe("Cuatro");
  });

  it("llena los dos vehículos y manda el dominio a 'Chapa'", async () => {
    const form = await formularioLimpio();
    llenarFormularioParte(
      form,
      parteCon({
        detalle: {
          vehiculos: [
            { marca: "Renault", dominio: "AB123CD" },
            { marca: "Ford", dominio: "XY987ZW" },
          ],
        },
      }),
    );
    expect(form.getTextField("Marca veh. 1.0").getText()).toBe("Renault");
    expect(form.getTextField("Chapa vehículo 1.0").getText()).toBe("AB123CD");
    expect(form.getTextField("Marca veh. 1.1").getText()).toBe("Ford");
    expect(form.getTextField("Chapa vehículo 1.1").getText()).toBe("XY987ZW");
  });

  it("manda cada organismo concurrente a su fila, en Observaciones", async () => {
    const form = await formularioLimpio();
    llenarFormularioParte(
      form,
      parteCon({
        detalle: {
          concurrentes: {
            movilPolicial: "Móvil 445",
            ambulancia: "SAME 12",
            defensaCivil: "Presente",
            transito: "2 agentes",
            otros: "Aguas",
          },
        },
      }),
    );
    expect(form.getTextField("Observaciones móvil policial.0").getText()).toBe("Móvil 445");
    expect(form.getTextField("Observaciones móvil policial.1").getText()).toBe("SAME 12");
    expect(form.getTextField("Observaciones móvil policial.2").getText()).toBe("Presente");
    expect(form.getTextField("Observaciones móvil policial.3").getText()).toBe("2 agentes");
    expect(form.getTextField("Observaciones móvil policial.4").getText()).toBe("Aguas");
  });

  it("llena el personal hacia abajo y salta a la columna siguiente en la fila 13", async () => {
    const form = await formularioLimpio();
    const personal = Array.from({ length: 14 }, (_, i) => `Bombero ${i + 1}`);
    llenarFormularioParte(form, parteCon({ personal }));

    expect(form.getTextField("Jerarquía y nombre.0.0").getText()).toBe("Bombero 1");
    expect(form.getTextField("Jerarquía y nombre.0.11").getText()).toBe("Bombero 12");
    expect(form.getTextField("Jerarquía y nombre.1.0").getText()).toBe("Bombero 13");
    expect(form.getTextField("Jerarquía y nombre.1.1").getText()).toBe("Bombero 14");
  });

  it("no explota si hay más personal que casilleros (36)", async () => {
    const form = await formularioLimpio();
    const personal = Array.from({ length: 50 }, (_, i) => `Bombero ${i + 1}`);
    const { camposFaltantes } = llenarFormularioParte(form, parteCon({ personal }));

    expect(camposFaltantes).toEqual([]);
    expect(form.getTextField("Jerarquía y nombre.2.11").getText()).toBe("Bombero 36");
  });

  it("no explota si hay más víctimas que casilleros", async () => {
    const form = await formularioLimpio();
    const victimas = Array.from({ length: 9 }, (_, i) => ({ nombre: `V${i}` }));
    const { camposFaltantes } = llenarFormularioParte(
      form,
      parteCon({ detalle: { victimas } }),
    );
    expect(camposFaltantes).toEqual([]);
  });
});

describe("el PDF resultante se puede generar", () => {
  it("aplana y guarda sin romper con acentos", async () => {
    const doc = await PDFDocument.load(plantilla);
    const form = doc.getForm();
    limpiarFormulario(form);
    llenarFormularioParte(
      form,
      parteCon({
        direccion: "Av. Antártida Argentina 1234",
        descripcion: "Línea de 38mm; ventilación. Nº 12.",
        personal: ["Sargento Herrero", "Bombero Álvarez"],
      }),
    );
    form.flatten();
    const bytes = await doc.save();
    expect(bytes.byteLength).toBeGreaterThan(1000);
  });
});
