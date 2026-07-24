import { describe, expect, it } from "vitest";
import type { TipoSiniestro } from "@/generated/prisma/client";
import {
  leerDetalle,
  parsearDetalleFormData,
  seccionesPresentes,
  type DetalleParte,
} from "@/lib/partesDetalle";

// --- parsearDetalleFormData --------------------------------------------------

describe("parsearDetalleFormData", () => {
  it("toma solo las secciones que habilita el tipo de siniestro", () => {
    const fd = new FormData();
    fd.set("condicionesClimaticas", "Lluvia intensa");
    fd.set("veh1_dominio", "AA123BB");
    fd.set("veh1_marca", "Ford");
    // Campo de una sección que ACCIDENTE_VIAL no habilita (incendio): debe
    // descartarse, aunque venga en el FormData.
    fd.set("incendio_origen", "Cortocircuito");

    const detalle = parsearDetalleFormData(fd, "ACCIDENTE_VIAL" as TipoSiniestro);

    expect(detalle.condicionesClimaticas).toBe("Lluvia intensa");
    expect(detalle.vehiculos).toEqual([{ dominio: "AA123BB", marca: "Ford" }]);
    expect(detalle.incendio).toBeUndefined();
  });

  it("descarta secciones sin ningún dato cargado (no guarda objetos vacíos)", () => {
    const fd = new FormData();
    fd.set("condicionesClimaticas", "");
    // Sin datos de víctimas ni vehículos.

    const detalle = parsearDetalleFormData(fd, "ACCIDENTE_VIAL" as TipoSiniestro);

    expect(detalle.condicionesClimaticas).toBeUndefined();
    expect(detalle.vehiculos).toBeUndefined();
    expect(detalle.victimas).toBeUndefined();
  });

  it("devuelve vacío para un tipo de siniestro sin secciones (OTRO)", () => {
    const fd = new FormData();
    fd.set("condicionesClimaticas", "Despejado");
    fd.set("incendio_origen", "Cortocircuito");

    const detalle = parsearDetalleFormData(fd, "OTRO" as TipoSiniestro);

    expect(detalle).toEqual({});
  });

  it("recorta espacios y descarta campos de texto vacíos", () => {
    const fd = new FormData();
    fd.set("incendio_origen", "   ");
    fd.set("incendio_causa", "  Falla eléctrica  ");

    const detalle = parsearDetalleFormData(fd, "INCENDIO" as TipoSiniestro);

    expect(detalle.incendio).toEqual({ causa: "Falla eléctrica" });
  });

  it("parsea listas de víctimas descartando las filas vacías", () => {
    const fd = new FormData();
    fd.set("vic1_nombre", "Juan Pérez");
    fd.set("vic1_dni", "30111222");
    // vic2, vic3, vic4 quedan sin completar.

    const detalle = parsearDetalleFormData(fd, "RESCATE" as TipoSiniestro);

    expect(detalle.victimas).toEqual([{ nombre: "Juan Pérez", dni: "30111222" }]);
  });

  it("parsea campos booleanos sí/no de inmueble", () => {
    const fd = new FormData();
    fd.set("inmueble_nichoHidrante", "si");
    fd.set("inmueble_extintor", "no");

    const detalle = parsearDetalleFormData(fd, "INCENDIO" as TipoSiniestro);

    expect(detalle.inmueble).toEqual({ nichoHidrante: true, extintor: false });
  });
});

// --- leerDetalle -------------------------------------------------------------

describe("leerDetalle", () => {
  it("devuelve {} cuando el valor es null", () => {
    expect(leerDetalle(null)).toEqual({});
  });

  it("devuelve {} cuando el valor es undefined", () => {
    expect(leerDetalle(undefined)).toEqual({});
  });

  it("devuelve {} cuando el valor es un array (forma inesperada del Json)", () => {
    expect(leerDetalle([1, 2, 3])).toEqual({});
  });

  it("devuelve {} cuando el valor es un primitivo (string/number)", () => {
    expect(leerDetalle("no es un detalle")).toEqual({});
    expect(leerDetalle(42)).toEqual({});
  });

  it("devuelve el objeto tal cual cuando tiene forma de objeto plano", () => {
    const valor = { condicionesClimaticas: "Nublado" };
    expect(leerDetalle(valor)).toEqual(valor);
  });
});

// --- seccionesPresentes -------------------------------------------------------

describe("seccionesPresentes", () => {
  it("devuelve vacío para un detalle sin datos", () => {
    expect(seccionesPresentes({})).toEqual([]);
  });

  it("detecta solo las secciones con datos cargados", () => {
    const detalle: DetalleParte = {
      condicionesClimaticas: "Lluvia",
      vehiculos: [{ dominio: "AA123BB" }],
      victimas: [],
      incendio: undefined,
    };

    expect(seccionesPresentes(detalle)).toEqual(["climaticas", "vehiculos"]);
  });

  it("no cuenta un array vacío como sección presente", () => {
    expect(seccionesPresentes({ victimas: [] })).toEqual([]);
  });
});
