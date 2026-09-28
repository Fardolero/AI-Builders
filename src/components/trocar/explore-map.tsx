"use client";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { MEETING_POINTS } from "@/constants/routes";
import { cn } from "@/lib/cn";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER: [number, number] = [-38.05, -57.62];
const DEFAULT_ZOOM = 10;

function createPinIcon(active: boolean, count: number) {
  const bg = active ? "#0e3a2c" : "#ffffff";
  const fg = active ? "#a7d6c4" : "#0e3a2c";
  const border = active ? "#a7d6c4" : "#0e3a2c";
  return L.divIcon({
    className: "trocar-map-pin",
    html: `<div style="
      display:flex;align-items:center;justify-content:center;
      min-width:28px;height:28px;padding:0 8px;border-radius:999px;
      background:${bg};color:${fg};border:2px solid ${border};
      font:700 11px/1 system-ui,sans-serif;box-shadow:0 6px 16px rgba(14,58,44,.25);
    ">${count}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function FitBounds({
  selectedPointId,
}: {
  selectedPointId: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedPointId) {
      const point = MEETING_POINTS.find((item) => item.id === selectedPointId);
      if (point) {
        map.flyTo([point.lat, point.lng], 13, { duration: 0.6 });
        return;
      }
    }
    const bounds = L.latLngBounds(
      MEETING_POINTS.map((point) => [point.lat, point.lng] as [number, number]),
    );
    map.fitBounds(bounds.pad(0.18));
  }, [map, selectedPointId]);

  return null;
}

type ExploreMapProps = {
  counts: Record<string, number>;
  selectedPointId: string | null;
  onSelectPoint: (pointId: string | null) => void;
  userBarrio?: string | null;
};

export function ExploreMap({
  counts,
  selectedPointId,
  onSelectPoint,
  userBarrio,
}: ExploreMapProps) {
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const activeCount = MEETING_POINTS.filter(
    (point) => (counts[point.id] ?? 0) > 0,
  ).length;

  const icons = useMemo(() => {
    const map = new Map<string, L.DivIcon>();
    for (const point of MEETING_POINTS) {
      const count = counts[point.id] ?? 0;
      map.set(
        point.id,
        createPinIcon(selectedPointId === point.id, count),
      );
    }
    return map;
  }, [counts, selectedPointId]);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-trocar-paper sm:text-xl">
            Puntos de encuentro
          </h2>
          <p className="text-sm text-trocar-mute">
            Mar del Plata → Miramar · {total} pubs · {activeCount} puntos
            {userBarrio ? ` · tu zona: ${userBarrio}` : ""}
          </p>
        </div>
        {selectedPointId ? (
          <button
            type="button"
            className="text-xs font-semibold text-trocar-accent"
            onClick={() => onSelectPoint(null)}
          >
            Ver todos
          </button>
        ) : null}
      </div>

      <div className="trocar-card overflow-hidden p-0">
        <div className="h-56 w-full sm:h-72 md:h-80">
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
            scrollWheelZoom={false}
            className="size-full z-0"
            attributionControl
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBounds selectedPointId={selectedPointId} />
            {MEETING_POINTS.map((point) => {
              const count = counts[point.id] ?? 0;
              const icon = icons.get(point.id);
              if (!icon) return null;
              return (
                <Marker
                  key={point.id}
                  position={[point.lat, point.lng]}
                  icon={icon}
                  eventHandlers={{
                    click: () =>
                      onSelectPoint(
                        selectedPointId === point.id ? null : point.id,
                      ),
                  }}
                >
                  <Popup>
                    <strong>{point.label}</strong>
                    <br />
                    {point.barrio} · {count}{" "}
                    {count === 1 ? "publicación" : "publicaciones"}
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {MEETING_POINTS.map((point) => {
          const count = counts[point.id] ?? 0;
          const active = selectedPointId === point.id;
          return (
            <button
              key={point.id}
              type="button"
              onClick={() =>
                onSelectPoint(active ? null : point.id)
              }
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold",
                active
                  ? "bg-trocar-ink text-white"
                  : "border border-trocar-line bg-white text-trocar-paper",
                count === 0 && "opacity-50",
              )}
            >
              {point.label} ({count})
            </button>
          );
        })}
      </div>
    </section>
  );
}
