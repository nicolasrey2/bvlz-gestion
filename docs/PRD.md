# PRD — Plataforma de Gestión para Bomberos de Lomas de Zamora

**Producto (nombre de trabajo):** BVLZ — Gestión de Destacamento
**Versión del documento:** 1.0
**Fecha:** 2026-07-23
**Autor:** Equipo de producto (nsrey@bancocredicoop.coop) + PM
**Alcance de esta versión:** MVP para el **Destacamento N°3 de Llavallol**

---

## 1. Resumen ejecutivo

Web app **mobile-first** para la gestión operativa diaria del Destacamento N°3 de Llavallol (Asociación de Bomberos Voluntarios de Lomas de Zamora). Centraliza personal y jerarquías, áreas, tareas, guardias, fichado, un cuaderno de novedades y los partes de intervención oficiales.

Es un **MVP**: se construye y valida primero con Llavallol y, si funciona, se amplía al resto de Lomas de Zamora (multi-destacamento). Por eso el modelo de datos se diseña **preparado para multi-destacamento** desde el inicio, aunque hoy opere con uno solo.

**Restricción clave:** debe usarse cómodamente **desde el celular** (no todos tienen/usan PC). Diseño responsive real, con vistas a una eventual **app nativa** a futuro.

**Objetivo de despliegue:** simple de desplegar en la nube.

---

## 2. Objetivos y métricas de éxito

### Objetivos
- Digitalizar la operación del destacamento hoy dispersa en papel/WhatsApp.
- Dar visibilidad de guardias, tareas y novedades a todo el personal.
- Formalizar y exportar los partes de intervención respetando el formulario oficial.

### Métricas de éxito del MVP
- % del personal del destacamento con cuenta activa y uso semanal.
- Cronograma mensual de guardias cargado y consultado desde la web.
- Tareas gestionadas 100% en la plataforma (creación → revisión → aprobación).
- Partes de intervención cargados y exportados a PDF desde la web.
- Novedades registradas en el cuaderno digital en vez de papel.

### No-objetivos (fuera de alcance del MVP)
- App nativa (se evalúa post-MVP).
- Gestión de cuarteleros como usuarios (se suma al extender a Lomas).
- Fichado con geolocalización o con PIN/QR en dispositivo fijo.
- Integraciones con sistemas externos de Lomas/Defensa Civil.
- Tareas recurrentes automáticas (planteadas como mejora futura).

---

## 3. Usuarios y roles

### 3.1 Jerarquías (rango institucional — dato de la persona, ~fijo)
Orden de menor a mayor:
1. Aspirante
2. Bombero
3. Cabo
4. Cabo Primero
5. Sargento
6. Sargento Primero
7. Suboficial Principal
8. Suboficial Mayor
9. Oficial Ayudante
10. Oficial Inspector
11. Oficial Principal
12. Subcomandante
13. Comandante
14. 2do Jefe del Cuerpo
15. Jefe del Cuerpo

> En Llavallol no existen todos estos rangos. Ej.: el encargado interno actual es **Suboficial Mayor**. El rango se guarda como atributo de la persona, independiente del rol funcional.

### 3.2 Roles funcionales (función en el destacamento — determina permisos)
- **Encargado Interno de Dto.** — máxima autoridad del destacamento en la web.
- **Sub-encargado de Dto.** — segundo; puede **asumir como encargado** si el titular se ausenta (delegación temporal).
- **Encargado de Área** — responsable de un área; gestiona su área y a sus miembros.
- **Miembro de Área** — bombero asignado a un área.

> Los roles **rotan** con normalidad: quién ocupa cada rol/área cambia con el tiempo. El sistema debe permitir reasignar roles sin perder el historial.

### 3.3 Áreas del destacamento
- Automotores
- Materiales de Incendio y Salvamento
- Oficina
- Edilicio
- Suministros

Cada área tiene **un encargado** y varios **miembros**. Una persona podría pertenecer a más de un área (rotación).

### 3.4 Cuarteleros
- Personal **externo** (dependen de Lomas, no del destacamento), pagos.
- **En el MVP no son usuarios**: se cargan solo como nombres de referencia en el cronograma y pueden figurar en partes. Cuando se extienda a Lomas, pasarán a ser usuarios con login.

### 3.5 Matriz de permisos

| Acción | Encargado Interno | Sub-encargado | Encargado de Área | Miembro |
|---|:--:|:--:|:--:|:--:|
| Ver todo el destacamento | ✅ | ✅ | Su área + general | Su área + general |
| Crear/asignar tareas a cualquiera | ✅ | ✅ | Su área + reasignar lo recibido | ❌ |
| Recibir tareas y reasignarlas hacia abajo | ✅ | ✅ | ✅ | ❌ |
| Aprobar tareas (visto bueno) | ✅ | ✅ | ✅ (su área) | ❌ |
| Gestionar usuarios (altas, rango, rol, área) | ✅ | ✅ | ❌ | ❌ |
| Armar/editar cronograma de guardias | ✅ | ✅ (Oficina) | ❌ | ❌ |
| Reportar novedades | ✅ | ✅ | ✅ | ✅ |
| Reportar/crear parte de intervención | ✅ | ✅ | ✅ | ✅ |
| Cerrar/firmar parte de intervención | ✅ | ✅ | ✅ (según rango) | según rango |
| Fichar entrada/salida | ✅ | ✅ | ✅ | ✅ |
| Ver/controlar fichados | ✅ (Oficina y encargado) | ✅ | ❌ | ❌ |

> **Delegación:** cuando el encargado se ausenta, el sub-encargado puede activar el modo "encargado en funciones" y adquiere sus permisos temporalmente. Queda registrado en el cuaderno de novedades.

> **Nota sobre "rango adecuado":** la aprobación de tareas y el cierre de partes la realiza quien tenga el rol/rango habilitado. En el MVP: aprobación de tareas = encargado de área (para tareas de su área) o encargado/sub-encargado de dto.

---

## 4. Funcionalidades

### 4.1 Autenticación y acceso
- Login con usuario/email + contraseña.
- Recuperación de contraseña.
- Sesión persistente en el celular.
- Altas de usuario las hace el encargado/sub-encargado (no auto-registro abierto).
- Cada usuario tiene: nombre y apellido, rango, rol(es), área(s), datos de contacto, legajo/DNI (para partes).

### 4.2 Destacamento, personal y áreas
- Vista del destacamento con su organigrama actual: encargado, sub-encargado, y las 5 áreas con su encargado y miembros.
- ABM de personal (con permiso).
- Asignación/reasignación de roles y áreas con **historial de rotaciones** (quién ocupó qué y cuándo).

### 4.3 Tareas
Campos: **título, descripción, responsable(s), área, fecha límite, prioridad (alta/media/baja), estado**.
- **Estados:** `Pendiente` → `En revisión` → `Completa`.
  - Para pasar a `Completa`, alguien con el rol/rango adecuado debe **aprobar / dar el visto bueno**.
- Al pasar a `En revisión` (o al completar), se pueden **adjuntar fotos como evidencia** de que se realizó.
- Asignación:
  - Encargado/sub-encargado: a cualquiera.
  - Encargado de área: a miembros de su área **y** puede reasignar tareas que recibió del encargado de dto.
  - Miembro: ve y trabaja sus tareas; no crea/asigna.
- Vistas: "Mis tareas", "Tareas de mi área", "Todas" (según permiso), con filtros por estado/prioridad/fecha.
- **Mejora futura (planteada):** tareas **recurrentes** (ej. "revisar presión de mangueras todos los lunes") con generación automática según periodicidad.

### 4.4 Guardias
Dos tipos:

**a) Guardias internas del destacamento**
- Horario: **22:00 a 08:00**.
- ~2 por persona al mes.
- Puede haber **más de una persona** en la misma guardia (no individuales).
- Las arma **Oficina** (encargado/sub-encargado) **una vez al mes**.

**b) Cuarteleros**
- Externos, pagos, no dependen del destacamento.
- Turnos de **24 hs (07:00 a 07:00)** con 48 hs de descanso, mínimo 8 al mes.
- Siempre hay un cuartelero de guardia.
- En el MVP se muestran a título **informativo** (nombres); la web no los valida ni los asigna.

**Funcionalidades:**
- Calendario mensual de guardias, consultable por todos, optimizado para celular.
- Vista "Mis guardias".
- Armado/edición del cronograma por Oficina.
- **Intercambio/cobertura** de guardias internas: los bomberos lo arreglan **entre ellos** y queda **registrado sin aprobación** (y se refleja en el cuaderno de novedades).

### 4.5 Fichado de entrada/salida
- Aplica a **todos**.
- **MVP: opción (A)** — botón "Fichar entrada / Fichar salida" desde el celular (un toque), con timestamp del servidor.
- El fichado queda **atado a la guardia** correspondiente, contemplando el caso de que alguien trabaje una guardia **que no le tocaba** (permitir fichar guardia no programada, marcada como tal).
- Control/visualización: **Oficina y encargado** (cualquiera de los dos).
- Los fichados alimentan el **cuaderno de novedades** (entradas/salidas).
- **Futuro:** (C) PIN/QR en dispositivo fijo del cuartel y/o (B) geolocalización — se posterga por privacidad/practicidad; candidato para la app.

### 4.6 Cuaderno de novedades (bitácora interna) — Módulo A de incidencias
Registro cronológico tipo **línea de tiempo** de todo lo que sucede en el destacamento.
- **Cualquiera puede reportar.**
- Entradas manuales: roturas, pérdidas o faltantes de material, problemas edilicios, observaciones, quejas, etc.
- Entradas automáticas generadas por el sistema: fichados de entrada/salida, cambios/intercambios de guardia, salidas del cuartel (partes), delegaciones de mando.
- Cada entrada: autor, fecha/hora, tipo, texto, adjuntos opcionales (fotos).
- Filtros por fecha y tipo de novedad.

### 4.7 Partes de intervención (formulario oficial) — Módulo B de incidencias
Registro **formal** de siniestros, replicando el formulario oficial de la **Asociación de Bomberos Voluntarios de Lomas de Zamora — Departamento Técnico**.

- **Cualquiera puede reportar/crear** un parte (en una salida no se sabe de antemano quién saldrá ni su rango).
- Se completa **después** de la intervención.
- **Cierre:** una vez cerrado **no se edita** (se contempla que esta regla pueda flexibilizarse más adelante).
- **Exportable a PDF** con el formato oficial (para presentar a Lomas/superiores).

**Estructura del parte (según formulario oficial provisto):**

*Encabezado / identificación*
- Servicio N°, Ruba N°, Cuartel (Llavallol), Certificado, Informe, Hoja X de Y.
- Fecha, Objeto (descripción breve), Oficial actuante, Dirección, Localidad, Jurisdicción policial, P. efectuado (teléfono/contacto).
- Ubicación (coordenadas), Panorama.

*Tiempos*
- Hora recepción aviso, Hora de llegada, Hora circunscripción, Hora dominado, Hora extinguido, Hora finalización, Hora de regreso.

*Recursos*
- Dotaciones, Bomberos/as (cantidad), Unidades/móviles.

*Descripción de las tareas* (texto libre).

*Concurrentes* (tabla): Móvil policial, Ambulancia, Defensa Civil, Tránsito, Otros — con N°, A cargo, Matrícula/Legajo/DNI, Observaciones.

*Condiciones climáticas* (solo siniestros viales).

*Secciones condicionales según tipo de siniestro:*
- **Vehículos (1 y 2):** propietario, conductor, edad, domicilio, N° y origen de registro, rodado tipo, marca, modelo, año, chapa, otros datos, aseguradora, póliza.
- **Análisis del incendio:** origen, causa, propagación, evolución de los deterioros.
- **Descripción del inmueble:** paredes, techos, instalación eléctrica/gas, cantidad de ambientes/pisos, nicho hidrante (sí/no), extintor (sí/no), N° de piso.
- **Datos complementarios:** propietario del inmueble + DNI, domicilio, arrendatario + DNI, aseguradora, póliza, razón social, ramo.
- **Víctimas (1–4):** nombre, DNI, sexo, edad, vehículo N°, traslado a.
- **Víctimas fatales.**
- **Rescate de animal:** propietario, DNI, domicilio, especie y raza.
- **Siniestros ferroviarios:** guarda, maquinista, recorrido, km de vía, N° tren, N° cabina.

*Personal*
- **Personal que concurrió:** jerarquía y apellido, Chapa, columnas G / BP.
- **Personal en el cuartel:** jerarquía y apellido, columnas G / BP.

*Firmas*
- Datos tomados por, Oficial actuante, Dpto. Técnico, Jefe del cuerpo.

- **Fotos adjuntas** al parte.
- El UI debe mostrar/ocultar las secciones condicionales según el **tipo de siniestro** elegido, para que en el celular no sea abrumador.

---

## 5. Requisitos no funcionales

- **Mobile-first:** diseño responsive real; prioridad absoluta a la experiencia en celular. Flujos frecuentes (fichar, ver guardia, ver tareas, cargar novedad) en pocos toques.
- **Despliegue simple en la nube:** contenedor único / stack estándar, variables de entorno, base de datos gestionada. Documentar deploy en un comando/servicio.
- **Multi-destacamento by design:** el modelo de datos incluye la entidad `Destacamento` desde el inicio; el MVP opera con Llavallol, pero se puede sumar destacamentos sin migración estructural.
- **Seguridad:** contraseñas hasheadas, control de acceso por rol en backend (no solo UI), sesiones seguras, HTTPS.
- **Auditoría/historial:** rotaciones de roles, cierres de parte, delegaciones y cambios de guardia quedan registrados.
- **Almacenamiento de imágenes:** para evidencia de tareas, novedades y partes (object storage en la nube).
- **Exportación PDF** fiel al formulario oficial.
- **Idioma:** español (Argentina).
- **Zona horaria:** America/Argentina/Buenos_Aires.

---

## 6. Modelo de datos (alto nivel)

- **Destacamento** (id, nombre, cuartel) — preparado para N destacamentos.
- **Usuario** (nombre, apellido, email, hash pass, rango, legajo/DNI, contacto, destacamento).
- **Rol** (encargado interno / sub-encargado / encargado de área / miembro) + **AsignaciónDeRol** (usuario, rol, área, vigencia_desde/hasta) → historial.
- **Área** (nombre, destacamento).
- **Tarea** (título, descripción, área, prioridad, fecha límite, estado, creador) + asignados (N) + adjuntos + aprobador/fecha de aprobación.
- **Guardia** (tipo: interna/cuartelero, fecha, horario, destacamento) + participantes (usuarios o nombre externo de cuartelero).
- **IntercambioDeGuardia** (guardia, de_usuario, a_usuario, fecha registro).
- **Fichada** (usuario, guardia (opcional), tipo entrada/salida, timestamp, flag "no programada").
- **Novedad** (tipo, autor, texto, fecha, adjuntos, origen manual/automático, referencia al evento).
- **ParteDeIntervención** (todos los campos de la sección 4.7, estado abierto/cerrado, tipo de siniestro, adjuntos, firmas).
- **CuarteleroExterno** (nombre) — sin login en el MVP.

---

## 7. Roadmap

### MVP (esta versión) — Llavallol
1. Auth + gestión de usuarios, rangos, roles y áreas.
2. Vista de destacamento / organigrama.
3. Tareas (con evidencia fotográfica y flujo de aprobación).
4. Guardias (calendario, armado por oficina, intercambios entre pares).
5. Fichado (opción A) atado a guardia.
6. Cuaderno de novedades (con eventos automáticos).
7. Partes de intervención + export PDF oficial.

### Post-MVP / Mejoras futuras planteadas
- Extensión **multi-destacamento** a todo Lomas de Zamora.
- **Cuarteleros como usuarios** (login, sus turnos, fichado).
- **App nativa** móvil.
- Fichado con **PIN/QR en dispositivo fijo** del cuartel y/o **geolocalización**.
- **Tareas recurrentes** automáticas.
- Validación automática de descansos de cuarteleros (48 hs) en el cronograma.
- Notificaciones push (nueva tarea, guardia próxima, aprobaciones).
- Reportes/estadísticas (intervenciones por mes, tipos de siniestro, carga de trabajo por área).

---

## 8. Supuestos y preguntas abiertas

- **Aprobación de tareas:** se asume encargado de área (su área) o encargado/sub-encargado de dto. Confirmar si algún rango mínimo adicional aplica.
- **Firmas del parte:** en el MVP se asume firma "digital" simple (nombre + registro de quién cerró); confirmar si se requiere firma manuscrita/escaneada.
- **Datos de cuarteleros externos:** confirmar de dónde se obtiene la lista mensual (¿la pega oficina a mano?).
- **Formato oficial del PDF:** se replicará el formulario provisto (`parte-intervencion-DTO3.pdf`); confirmar si hay más hojas/variantes.
- **Notificaciones:** definir si el MVP incluye avisos (email/push) o queda para después.

---

*Documento base para arrancar el desarrollo del MVP. Ajustable a medida que se valide con el personal de Llavallol.*
