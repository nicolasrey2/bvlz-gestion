import { describe, expect, it } from "vitest";
import {
  CUPO_CONCURRIO,
  CUPO_EN_CUARTEL,
  PERSONAL_VACIO,
  excedeElFormulario,
  leerPersonal,
  leerPersonalDeFormulario,
} from "./partePersonal";

describe("leerPersonal — formato viejo (anterior a P6)", () => {
  it("convierte el array de strings del textarea a la forma nueva", () => {
    // Los partes ya cargados guardaban ["Cabo Pérez", "Bombero Gómez"]; tienen
    // que seguir abriéndose y exportándose sin migrar la columna Json.
    const personal = leerPersonal(["Cabo Pérez", "Bombero Gómez"]);
    expect(personal.concurrio).toEqual([
      { nombre: "Cabo Pérez" },
      { nombre: "Bombero Gómez" },
    ]);
    expect(personal.enCuartel).toEqual([]);
  });

  it("descarta líneas vacías y recorta espacios", () => {
    const personal = leerPersonal(["  Cabo Pérez ", "", "   "]);
    expect(personal.concurrio).toEqual([{ nombre: "Cabo Pérez" }]);
  });
});

describe("leerPersonal — formato nuevo", () => {
  it("lee las dos tablas con sus columnas", () => {
    const personal = leerPersonal({
      concurrio: [{ nombre: "Cuartelero Chiesa", movil: "16", guardia: true }],
      enCuartel: [{ nombre: "Cabo Domínguez", bp: true }],
    });
    expect(personal.concurrio).toEqual([
      { nombre: "Cuartelero Chiesa", movil: "16", guardia: true },
    ]);
    expect(personal.enCuartel).toEqual([{ nombre: "Cabo Domínguez", bp: true }]);
  });

  it("conserva el usuarioId cuando la persona es del cuartel", () => {
    const personal = leerPersonal({
      concurrio: [{ nombre: "Sargento Herrero", usuarioId: "u1" }],
      enCuartel: [],
    });
    expect(personal.concurrio[0].usuarioId).toBe("u1");
  });

  it("tolera que falte una de las dos listas", () => {
    const personal = leerPersonal({ concurrio: [{ nombre: "Cabo Moser" }] });
    expect(personal.concurrio).toHaveLength(1);
    expect(personal.enCuartel).toEqual([]);
  });
});

describe("leerPersonal — entradas inválidas", () => {
  it.each([
    ["null", null],
    ["undefined", undefined],
    ["un número", 42],
    ["un texto suelto", "Cabo Pérez"],
    ["una fila sin nombre", { concurrio: [{ movil: "16" }], enCuartel: [] }],
  ])("devuelve vacío con %s", (_caso, valor) => {
    expect(leerPersonal(valor)).toEqual(PERSONAL_VACIO);
  });
});

describe("leerPersonalDeFormulario", () => {
  it("parsea el JSON que manda el selector", () => {
    const json = JSON.stringify({
      concurrio: [{ nombre: "Cabo Moser", guardia: true }],
      enCuartel: [],
    });
    expect(leerPersonalDeFormulario(json).concurrio).toEqual([
      { nombre: "Cabo Moser", guardia: true },
    ]);
  });

  it("no explota con JSON roto ni con el campo vacío", () => {
    expect(leerPersonalDeFormulario("{no es json")).toEqual(PERSONAL_VACIO);
    expect(leerPersonalDeFormulario("")).toEqual(PERSONAL_VACIO);
    expect(leerPersonalDeFormulario(undefined)).toEqual(PERSONAL_VACIO);
  });

  it("descarta campos que el cliente no debería mandar", () => {
    // El JSON llega del navegador: se valida con zod, no se confía en la forma.
    const json = JSON.stringify({
      concurrio: [{ nombre: "Cabo Moser", rolSecreto: "admin" }],
      enCuartel: [],
    });
    expect(leerPersonalDeFormulario(json).concurrio[0]).toEqual({
      nombre: "Cabo Moser",
    });
  });
});

describe("excedeElFormulario", () => {
  it("avisa cuando no entra en los casilleros del formulario oficial", () => {
    const personas = (n: number) =>
      Array.from({ length: n }, (_, i) => ({ nombre: `P${i}` }));

    expect(
      excedeElFormulario({ concurrio: personas(CUPO_CONCURRIO), enCuartel: [] }),
    ).toBe(false);
    expect(
      excedeElFormulario({ concurrio: personas(CUPO_CONCURRIO + 1), enCuartel: [] }),
    ).toBe(true);
    expect(
      excedeElFormulario({ concurrio: [], enCuartel: personas(CUPO_EN_CUARTEL + 1) }),
    ).toBe(true);
  });
});
