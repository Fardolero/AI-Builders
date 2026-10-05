// Distancias ENTRE CENTROIDES DE ZONA. El motor nunca ve coordenadas de vivienda.

import type { MatchConfig } from './config';
import type { Zona } from './types';

const R_TIERRA_KM = 6371;

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R_TIERRA_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Memoiza distancias zona-zona (hay pocas zonas: la matriz es chica). */
export class DistanciasZona {
  private cache = new Map<string, number>();
  private zonas: Map<string, Zona>;
  constructor(zonas: Map<string, Zona>) {
    this.zonas = zonas;
  }

  km(zonaA: string, zonaB: string): number {
    if (zonaA === zonaB) return 0;
    const k = zonaA < zonaB ? `${zonaA}|${zonaB}` : `${zonaB}|${zonaA}`;
    let d = this.cache.get(k);
    if (d === undefined) {
      const a = this.zonas.get(zonaA);
      const b = this.zonas.get(zonaB);
      d = a && b ? haversineKm(a, b) : Infinity; // zona desconocida => fuera de radio
      this.cache.set(k, d);
    }
    return d;
  }
}

/** 1 hasta `distanciaPlenaKm`, luego decae a la mitad cada `semividaKm`. null = fuera de radio. */
export function factorProximidad(distanciaKm: number, cfg: MatchConfig): number | null {
  if (!Number.isFinite(distanciaKm) || distanciaKm > cfg.radioMaximoKm) return null;
  if (distanciaKm <= cfg.distanciaPlenaKm) return 1;
  return Math.pow(0.5, (distanciaKm - cfg.distanciaPlenaKm) / cfg.semividaKm);
}

/** Distancia para mostrar: redondeada a 0,5 km para no revelar precisión. */
export function distanciaVisible(distanciaKm: number): string {
  if (distanciaKm < 1) return 'a menos de 1 km';
  const r = Math.round(distanciaKm * 2) / 2;
  return `a ~${r.toString().replace('.', ',')} km`;
}
