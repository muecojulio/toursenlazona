import { sitios } from "./sitios.js";

export const PAIS_ISO = {
  Japón: "JP",
  México: "MX",
  Perú: "PE",
  Italia: "IT",
  Grecia: "GR",
  China: "CN",
  Egipto: "EG",
  India: "IN",
  España: "ES",
  "Reino Unido": "GB",
  Camboya: "KH",
  Jordania: "JO",
};

export const SITIO_BY_ID = Object.freeze(
  Object.fromEntries(sitios.map((s) => [s.id, s]))
);

export const SITIOS_BY_REGION = Object.freeze(
  sitios.reduce((acc, s) => {
    const key = s.region || "Otros";
    (acc[key] ||= []).push(s);
    return acc;
  }, {})
);

export const SITIOS_BY_CIUDAD = Object.freeze(
  sitios.reduce((acc, s) => {
    const key = (s.ciudad || "").toLowerCase();
    if (!key) return acc;
    (acc[key] ||= []).push(s);
    return acc;
  }, {})
);

export function getSitioById(id) {
  return SITIO_BY_ID[id] || null;
}

export function isoDePais(pais) {
  return PAIS_ISO[pais] || null;
}
