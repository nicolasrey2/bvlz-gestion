import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import {
  ctxEncargadoInterno,
  ctxMiembroAreaA,
  formDataDe,
  REDIRECT_ERROR,
} from "./_testutils";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    parteIntervencion: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({ getContextoAuth: vi.fn() }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error(REDIRECT_ERROR);
  }),
}));

import { prisma } from "@/lib/prisma";
import { getContextoAuth } from "@/lib/auth";
import { cerrarParte, editarParte } from "./partes";

const db = prisma as unknown as {
  parteIntervencion: { findFirst: Mock; create: Mock; update: Mock };
};
const auth = getContextoAuth as unknown as Mock;

/// Parte abierto, creado por "u1" (el usuario de los contextos de prueba).
const PARTE_ABIERTO = {
  id: "p1",
  estado: "ABIERTO",
  creadorId: "u1",
  destacamentoId: "d1",
};

/// Formulario mínimo válido de edición: el tipo de siniestro es el único campo
/// obligatorio (el parte se completa en varias pasadas).
function formEdicion(extra: Record<string, string> = {}) {
  return formDataDe({ parteId: "p1", tipoSiniestro: "INCENDIO", ...extra });
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue(ctxMiembroAreaA);
  db.parteIntervencion.findFirst.mockResolvedValue(PARTE_ABIERTO);
  db.parteIntervencion.update.mockResolvedValue(PARTE_ABIERTO);
});

describe("editarParte", () => {
  it("guarda los campos del formulario oficial y vuelve a la ficha", async () => {
    // Redirige al terminar, así que el éxito se comprueba por el redirect.
    await expect(
      editarParte(
        null,
        formEdicion({
          servicioNro: "0431",
          rubaNro: "R-118",
          horaDominado: "03:41",
          horaExtinguido: "03:58",
          horaFinalizacion: "04:20",
          dptoTecnico: "Of. Insp. Cabrera",
          inmueble_numeroPiso: "2",
        }),
      ),
    ).rejects.toThrow(REDIRECT_ERROR);

    const { data } = db.parteIntervencion.update.mock.calls[0][0];
    expect(data.servicioNro).toBe("0431");
    expect(data.rubaNro).toBe("R-118");
    expect(data.horaDominado).toBe("03:41");
    expect(data.horaExtinguido).toBe("03:58");
    expect(data.horaFinalizacion).toBe("04:20");
    expect(data.dptoTecnico).toBe("Of. Insp. Cabrera");
    // Los campos del detalle van al Json, no a columnas.
    expect(data.detalle.inmueble).toEqual({ numeroPiso: "2" });
  });

  it("deja en null los campos que se enviaron vacíos", async () => {
    await expect(
      editarParte(null, formEdicion({ servicioNro: "", rubaNro: "  " })),
    ).rejects.toThrow(REDIRECT_ERROR);

    const { data } = db.parteIntervencion.update.mock.calls[0][0];
    expect(data.servicioNro).toBeNull();
    expect(data.rubaNro).toBeNull();
  });

  it("no deja editar un parte cerrado y lo dice", async () => {
    db.parteIntervencion.findFirst.mockResolvedValue({
      ...PARTE_ABIERTO,
      estado: "CERRADO",
    });

    const estado = await editarParte(null, formEdicion());

    expect(estado).toEqual({ error: "El parte está cerrado: no se puede editar." });
    expect(db.parteIntervencion.update).not.toHaveBeenCalled();
  });

  it("no deja editar el parte de otra persona si no es conducción", async () => {
    db.parteIntervencion.findFirst.mockResolvedValue({
      ...PARTE_ABIERTO,
      creadorId: "otro",
    });

    const estado = await editarParte(null, formEdicion());

    expect(estado).toEqual({ error: "No tenés permisos para editar este parte." });
    expect(db.parteIntervencion.update).not.toHaveBeenCalled();
  });

  it("la conducción sí puede editar el parte de otra persona", async () => {
    auth.mockResolvedValue(ctxEncargadoInterno);
    db.parteIntervencion.findFirst.mockResolvedValue({
      ...PARTE_ABIERTO,
      creadorId: "otro",
    });

    await expect(editarParte(null, formEdicion())).rejects.toThrow(REDIRECT_ERROR);
    expect(db.parteIntervencion.update).toHaveBeenCalled();
  });

  it("no toca un parte de otro destacamento", async () => {
    // El findFirst filtra por destacamento: si no lo encuentra, no existe.
    db.parteIntervencion.findFirst.mockResolvedValue(null);

    const estado = await editarParte(null, formEdicion());

    expect(estado).toEqual({
      error: "El parte no existe o no es de tu destacamento.",
    });
    expect(db.parteIntervencion.update).not.toHaveBeenCalled();
  });

  it("rechaza un tipo de siniestro inventado", async () => {
    const estado = await editarParte(
      null,
      formDataDe({ parteId: "p1", tipoSiniestro: "METEORITO" }),
    );

    expect(estado).toEqual({ error: "Tipo de siniestro inválido." });
    expect(db.parteIntervencion.update).not.toHaveBeenCalled();
  });

  it("sin sesión no guarda nada", async () => {
    auth.mockResolvedValue(null);

    const estado = await editarParte(null, formEdicion());

    expect(estado).toEqual({ error: "Sesión no válida." });
    expect(db.parteIntervencion.update).not.toHaveBeenCalled();
  });
});

describe("cerrarParte", () => {
  it("cierra el parte propio y registra quién lo cerró", async () => {
    await cerrarParte(formDataDe({ parteId: "p1" }));

    const { data } = db.parteIntervencion.update.mock.calls[0][0];
    expect(data.estado).toBe("CERRADO");
    expect(data.cerradoPorId).toBe("u1");
    expect(data.cerradoEn).toBeInstanceOf(Date);
  });

  it("no vuelve a cerrar un parte ya cerrado", async () => {
    db.parteIntervencion.findFirst.mockResolvedValue({
      ...PARTE_ABIERTO,
      estado: "CERRADO",
    });

    await cerrarParte(formDataDe({ parteId: "p1" }));

    expect(db.parteIntervencion.update).not.toHaveBeenCalled();
  });
});
