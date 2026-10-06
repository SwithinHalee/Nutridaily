'use client';

import React, { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

interface InteractivePinMapProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

export function InteractivePinMap({
  lat,
  lng,
  onChange,
}: InteractivePinMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;
    let resizeObserver: ResizeObserver | null = null;

    // Dynamically import Leaflet only on client side
    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Clean up previous instance if exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize map centered at given lat/lng
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 16,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // Add high-clarity OpenStreetMap street tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Custom physical NutriDaily terracotta pin marker
      // Exact geometry: 32x42px with anchor point at (16, 42) matching the pin bottom tip
      const customPinIcon = L.divIcon({
        className: 'nutridaily-custom-pin',
        html: `
          <div style="position:relative; width:32px; height:42px; display:flex; justify-content:center; pointer-events:none;">
            <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 3px 6px rgba(26,19,16,0.35)); pointer-events:auto; cursor:grab;">
              <ellipse cx="16" cy="41" rx="4" ry="1.5" fill="#1A1310" opacity="0.3"/>
              <path d="M16 40 C16 40 30 25.5 30 15 C30 7.268 23.732 1 16 1 C8.268 1 2 7.268 2 15 C2 25.5 16 40 16 40 Z" fill="#D96B43" stroke="#FDFBF7" stroke-width="2"/>
              <circle cx="16" cy="15" r="5" fill="#FDFBF7"/>
            </svg>
            <div style="position:absolute; bottom:44px; left:50%; transform:translateX(-50%); background:#1A1310; color:#FDFBF7; font-size:10px; font-weight:600; padding:2px 8px; border-radius:9999px; white-space:nowrap; box-shadow:0 2px 6px rgba(26,19,16,0.25); font-family:Manrope, sans-serif; pointer-events:none;">
              Titik pengantaran
            </div>
          </div>
        `,
        iconSize: [32, 42],
        iconAnchor: [16, 42],
      });

      // Add draggable pin marker
      const marker = L.marker([lat, lng], {
        icon: customPinIcon,
        draggable: true,
      }).addTo(map);

      // Handle direct click on map to move pin to exact cursor position
      map.on('click', (e: any) => {
        if (!e.latlng) return;
        const newLat = Number(e.latlng.lat.toFixed(5));
        const newLng = Number(e.latlng.lng.toFixed(5));
        marker.setLatLng([newLat, newLng]);
        onChange(newLat, newLng);
      });

      // Handle marker drag events
      marker.on('drag', () => {
        const position = marker.getLatLng();
        onChange(Number(position.lat.toFixed(5)), Number(position.lng.toFixed(5)));
      });

      marker.on('dragend', () => {
        const position = marker.getLatLng();
        onChange(Number(position.lat.toFixed(5)), Number(position.lng.toFixed(5)));
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Ensure container bounds are accurately computed across layout changes and animations
      if (mapContainerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        });
        resizeObserver.observe(mapContainerRef.current);
      }

      setTimeout(() => map.invalidateSize(), 100);
      setTimeout(() => map.invalidateSize(), 300);
    });

    return () => {
      isMounted = false;
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker and pan map when lat/lng props change externally (e.g. from GPS auto-track)
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      const currentLatLng = markerRef.current.getLatLng();
      const diffLat = Math.abs(currentLatLng.lat - lat);
      const diffLng = Math.abs(currentLatLng.lng - lng);
      // Only pan and reposition if position meaningfully changed
      if (diffLat > 0.00005 || diffLng > 0.00005) {
        markerRef.current.setLatLng([lat, lng]);
        if (typeof mapInstanceRef.current.flyTo === 'function') {
          mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 0.8 });
        } else {
          mapInstanceRef.current.panTo([lat, lng]);
        }
      }
    }
  }, [lat, lng]);

  return (
    <div className="relative w-full h-64 rounded-lg border border-warm-border overflow-hidden bg-tebu-100 shadow-inner">
      <style>{`
        .nutridaily-custom-pin {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-container {
          cursor: crosshair !important;
        }
      `}</style>

      <div ref={mapContainerRef} className="w-full h-full z-10 cursor-crosshair" />

      {/* Helper text overlay */}
      <div className="absolute top-2.5 right-2.5 z-20 px-2.5 py-1 rounded bg-warm-black/85 backdrop-blur-sm text-tebu-50 text-[10px] font-medium shadow-natural pointer-events-none">
        Klik atau geser pin untuk set lokasi
      </div>
    </div>
  );
}
