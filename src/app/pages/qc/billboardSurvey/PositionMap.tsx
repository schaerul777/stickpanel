import { MapContainer, TileLayer, Circle, CircleMarker, Marker, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MAX_DRIFT_M, type Billboard } from './surveyData';
import { GRAY, PRIMARY } from './surveyUi';

export interface MapPhoto {
  label: string;
  color: string;
  lat: number | null;
  lng: number | null;
  heading: number | null;
}

function pointIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;background:${PRIMARY};border:2px solid white;border-radius:3px;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function photoIcon(color: string, heading: number | null) {
  const arrow = heading == null ? '' : `
    <div style="position:absolute;left:50%;top:50%;width:0;height:0;transform:translate(-50%,-50%) rotate(${heading}deg)">
      <div style="position:absolute;left:-6px;top:-30px;width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:14px solid ${color}"></div>
      <div style="position:absolute;left:-1.5px;top:-18px;width:3px;height:12px;background:${color}"></div>
    </div>`;
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:14px;height:14px">
      ${arrow}
      <div style="position:absolute;inset:0;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>
    </div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

export function PositionMap({ billboard, nearby, photos }: { billboard: Billboard; nearby: Billboard[]; photos: MapPhoto[] }) {
  const located = photos.filter(p => p.lat != null && p.lng != null);
  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer key={billboard.id} center={[billboard.lat, billboard.lng]} zoom={18} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Circle center={[billboard.lat, billboard.lng]} radius={MAX_DRIFT_M} pathOptions={{ color: PRIMARY, weight: 1.5, fillColor: PRIMARY, fillOpacity: 0.1, dashArray: '4 4' }} />
        {nearby.map(n => (
          <CircleMarker key={n.id} center={[n.lat, n.lng]} radius={6} pathOptions={{ color: GRAY, fillColor: GRAY, fillOpacity: 0.5, weight: 2 }}>
            <Tooltip direction="top">{n.code}</Tooltip>
          </CircleMarker>
        ))}
        {located.map(p => (
          <Polyline key={`line-${p.label}`} positions={[[billboard.lat, billboard.lng], [p.lat!, p.lng!]]} pathOptions={{ color: p.color, weight: 1.5, dashArray: '3 5' }} />
        ))}
        {located.map(p => (
          <Marker key={p.label} position={[p.lat!, p.lng!]} icon={photoIcon(p.color, p.heading)}>
            <Tooltip direction="top" offset={[0, -8]}>{p.label}</Tooltip>
          </Marker>
        ))}
        <Marker position={[billboard.lat, billboard.lng]} icon={pointIcon()}>
          <Tooltip direction="top" offset={[0, -8]}>{billboard.code}</Tooltip>
        </Marker>
      </MapContainer>
    </div>
  );
}
