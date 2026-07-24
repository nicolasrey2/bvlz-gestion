import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

/// Datos ya "planos" que necesita el documento — el route handler los arma a
/// partir de la fila de Prisma (traduce enums a etiquetas, Json a array, etc).
export type ParteParaPdf = {
  id: string;
  estado: "ABIERTO" | "CERRADO";
  tipoSiniestro: string;
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
  creadorNombre: string;
  cerradoPorNombre: string | null;
  cerradoEn: Date | null;
};

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#18181b",
  },
  header: {
    marginBottom: 16,
    paddingBottom: 10,
    borderBottom: "2pt solid #b91c1c",
  },
  institucion: { fontSize: 11, fontWeight: 700, textAlign: "center" },
  destacamento: { fontSize: 9, textAlign: "center", color: "#52525b", marginTop: 2 },
  titulo: { fontSize: 15, fontWeight: 700, textAlign: "center", marginTop: 8 },
  estadoFila: { flexDirection: "row", justifyContent: "center", marginTop: 4 },
  estado: { fontSize: 9, fontWeight: 700, paddingHorizontal: 8, paddingVertical: 2 },
  seccion: { marginBottom: 12 },
  seccionTitulo: {
    fontSize: 10,
    fontWeight: 700,
    backgroundColor: "#f4f4f5",
    padding: 4,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  filaCampos: { flexDirection: "row", flexWrap: "wrap", marginBottom: 2 },
  campo: { width: "50%", flexDirection: "row", marginBottom: 4, paddingRight: 6 },
  campoAncho: { width: "100%", flexDirection: "row", marginBottom: 4 },
  etiqueta: { width: 95, fontWeight: 700, color: "#3f3f46" },
  valor: { flex: 1 },
  parrafo: { lineHeight: 1.4 },
  listaItem: { marginBottom: 2 },
  sinDatos: { color: "#71717a", fontStyle: "italic" },
  firmasFila: { flexDirection: "row", justifyContent: "space-between", marginTop: 36 },
  firma: { width: "30%", textAlign: "center" },
  firmaLinea: { borderTop: "1pt solid #a1a1aa", paddingTop: 4, marginBottom: 2 },
  firmaNombre: { fontSize: 9 },
  pie: { marginTop: 20, fontSize: 8, color: "#a1a1aa", textAlign: "center" },
});

/// Formatea una fecha en formato argentino (dd/mm/aaaa).
function fecha(d: Date): string {
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/// Formatea fecha + hora en formato argentino.
function fechaHora(d: Date): string {
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/// Campo etiqueta/valor; se omite si no hay valor cargado.
function Campo({ etiqueta, valor, ancho }: { etiqueta: string; valor: string | null; ancho?: boolean }) {
  if (!valor) return null;
  return (
    <View style={ancho ? styles.campoAncho : styles.campo}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <Text style={styles.valor}>{valor}</Text>
    </View>
  );
}

/// Documento PDF del parte de intervención — replica el formulario oficial
/// de la Asociación de Bomberos Voluntarios de Lomas de Zamora, en un
/// formato legible y prolijo (no pixel-perfect).
export function ParteDocumento({ parte }: { parte: ParteParaPdf }) {
  const recursos = [
    parte.dotaciones !== null ? `${parte.dotaciones} dotación/es` : null,
    parte.bomberos !== null ? `${parte.bomberos} bombero/s` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Encabezado institucional */}
        <View style={styles.header}>
          <Text style={styles.institucion}>
            Asociación de Bomberos Voluntarios de Lomas de Zamora
          </Text>
          <Text style={styles.destacamento}>Destacamento N.º 3 — Llavallol</Text>
          <Text style={styles.titulo}>Parte de intervención</Text>
          <View style={styles.estadoFila}>
            <Text
              style={[
                styles.estado,
                parte.estado === "ABIERTO"
                  ? { backgroundColor: "#fde68a", color: "#78350f" }
                  : { backgroundColor: "#bbf7d0", color: "#14532d" },
              ]}
            >
              {parte.estado === "ABIERTO" ? "ABIERTO" : "CERRADO"}
            </Text>
          </View>
        </View>

        {/* Datos del servicio */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Datos del servicio</Text>
          <View style={styles.filaCampos}>
            <Campo etiqueta="Tipo de siniestro" valor={parte.tipoSiniestro} />
            <Campo etiqueta="N.º de servicio" valor={parte.servicioNro} />
            <Campo etiqueta="Fecha" valor={parte.fecha ? fecha(parte.fecha) : null} />
            <Campo etiqueta="Cuartel" valor={parte.cuartel} />
            <Campo etiqueta="Objeto" valor={parte.objeto} ancho />
            <Campo etiqueta="Dirección" valor={parte.direccion} />
            <Campo etiqueta="Localidad" valor={parte.localidad} />
          </View>
        </View>

        {/* Tiempos */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Tiempos</Text>
          <View style={styles.filaCampos}>
            <Campo etiqueta="Hora de aviso" valor={parte.horaAviso} />
            <Campo etiqueta="Hora de llegada" valor={parte.horaLlegada} />
            <Campo etiqueta="Hora de regreso" valor={parte.horaRegreso} />
          </View>
        </View>

        {/* Recursos */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Recursos afectados</Text>
          <View style={styles.filaCampos}>
            <Campo etiqueta="Dotaciones" valor={recursos || null} ancho />
            <Campo etiqueta="Unidades" valor={parte.unidades} ancho />
          </View>
          {!recursos && !parte.unidades && (
            <Text style={styles.sinDatos}>Sin datos cargados.</Text>
          )}
        </View>

        {/* Descripción */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Descripción de las tareas</Text>
          {parte.descripcion ? (
            <Text style={styles.parrafo}>{parte.descripcion}</Text>
          ) : (
            <Text style={styles.sinDatos}>Sin descripción cargada.</Text>
          )}
        </View>

        {/* Personal */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Personal que concurrió</Text>
          {parte.personal.length > 0 ? (
            parte.personal.map((p, i) => (
              <Text key={i} style={styles.listaItem}>
                • {p}
              </Text>
            ))
          ) : (
            <Text style={styles.sinDatos}>Sin personal cargado.</Text>
          )}
        </View>

        {/* Firmas */}
        <View style={styles.firmasFila}>
          <View style={styles.firma}>
            <View style={styles.firmaLinea} />
            <Text style={styles.firmaNombre}>{parte.datosTomadosPor || "—"}</Text>
            <Text style={styles.sinDatos}>Datos tomados por</Text>
          </View>
          <View style={styles.firma}>
            <View style={styles.firmaLinea} />
            <Text style={styles.firmaNombre}>{parte.oficialActuante || "—"}</Text>
            <Text style={styles.sinDatos}>Oficial actuante</Text>
          </View>
          <View style={styles.firma}>
            <View style={styles.firmaLinea} />
            <Text style={styles.firmaNombre}>{parte.jefeCuerpo || "—"}</Text>
            <Text style={styles.sinDatos}>Jefe del Cuerpo</Text>
          </View>
        </View>

        {/* Pie: trazabilidad del registro */}
        <Text style={styles.pie}>
          Parte {parte.id} · creado por {parte.creadorNombre}
          {parte.estado === "CERRADO" && parte.cerradoPorNombre && parte.cerradoEn
            ? ` · cerrado por ${parte.cerradoPorNombre} el ${fechaHora(parte.cerradoEn)}`
            : ""}
        </Text>
      </Page>
    </Document>
  );
}
