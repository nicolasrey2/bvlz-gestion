// Tipos de los imports de imágenes estáticas (import logo from "*.png").
// Next los declara en next-env.d.ts, pero ese archivo está gitignoreado y solo
// se genera al correr `next dev`/`build`. En CI (tsc sin build previo) no
// existe, así que referenciamos las declaraciones acá, versionado, para que el
// typecheck no dependa de un build.
/// <reference types="next/image-types/global" />
