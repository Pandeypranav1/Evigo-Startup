"use client";

import { useEffect, useRef } from "react";
import type { Map, Marker } from "leaflet";
import {
  getTourismPlaceMapUrl,
  getVerifiedTourismCoordinates,
  TourismPlace,
} from "@/lib/constants";
import "leaflet/dist/leaflet.css";

interface Props {
  places: TourismPlace[];
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
}

export default function TourismMap({
  places,
  centerLat = 24.9278,
  centerLng = 86.2265,
  zoom = 10,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    let cancelled = false;

    // Dynamic import to prevent SSR breakages
    import("leaflet").then((L) => {
      if (cancelled || !mapContainerRef.current || mapInstanceRef.current) return;

      const map = L.map(mapContainerRef.current!, {
        center: [centerLat, centerLng],
        zoom,
        zoomControl: true,
        scrollWheelZoom: false, // Prevents hijack while scrolling page
        attributionControl: true,
      });

      mapInstanceRef.current = map;

      // Fast OpenStreetMap Tile Layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
      }).addTo(map);

      // Add markers for all places that have coordinates
      const validMarkers: Marker[] = [];

      places.forEach((place) => {
        const coordinates = getVerifiedTourismCoordinates(place);
        if (!coordinates) return;

        const isNature = place.category.toLowerCase().includes("nature");
        const isReligious = place.category.toLowerCase().includes("religious");
        const pinColor = isNature ? "#10b981" : isReligious ? "#f59e0b" : "#8b5cf6";
        const pinEmoji = isNature ? "🌲" : isReligious ? "🛕" : "🏛️";

        const customIcon = L.divIcon({
          className: "custom-tourism-pin",
          html: `
            <div style="
              background: ${pinColor};
              width: 32px;
              height: 32px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              display: flex;
              align-items: center;
              justify-content: center;
              border: 2px solid #ffffff;
              box-shadow: 0 4px 12px rgba(0,0,0,0.5);
              cursor: pointer;
            ">
              <span style="transform: rotate(45deg); font-size: 14px;">${pinEmoji}</span>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        });

        const marker = L.marker([coordinates.lat, coordinates.lng], { icon: customIcon }).addTo(map);
        const popupContent = document.createElement("div");
        popupContent.style.cssText = "font-family:sans-serif;min-width:180px;padding:4px;color:#111";

        const categoryLabel = document.createElement("div");
        categoryLabel.textContent = place.category;
        categoryLabel.style.cssText = `font-size:11px;font-weight:700;color:${pinColor};text-transform:uppercase`;

        const name = document.createElement("div");
        name.textContent = place.name;
        name.style.cssText = "font-size:14px;font-weight:800;margin:2px 0 4px;color:#000";

        const description = document.createElement("div");
        description.textContent = place.description.slice(0, 90);
        description.style.cssText = "font-size:11px;color:#555;line-height:1.3;margin-bottom:6px";

        const mapLink = document.createElement("a");
        mapLink.href = getTourismPlaceMapUrl(place);
        mapLink.target = "_blank";
        mapLink.rel = "noopener noreferrer";
        mapLink.textContent = "Get Directions →";
        mapLink.style.cssText = "display:inline-block;font-size:11px;font-weight:700;color:#0284c7;text-decoration:none";

        popupContent.append(categoryLabel, name, description, mapLink);
        marker.bindPopup(popupContent);
        validMarkers.push(marker);
      });

      // Fit bounds if multiple places exist
      if (validMarkers.length > 1) {
        const group = L.featureGroup(validMarkers);
        map.fitBounds(group.getBounds().pad(0.15));
      }
    });

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [places, centerLat, centerLng, zoom]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full rounded-3xl overflow-hidden"
      style={{ minHeight: "380px" }}
    />
  );
}
