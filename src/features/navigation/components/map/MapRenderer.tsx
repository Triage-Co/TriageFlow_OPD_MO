import React from "react";
import { SpringValue } from "@react-spring/three";
import { GeoJSONFeature, GeoJSONFeatureCollection } from "../../types/map.types";
import { Room } from "./architectural/Room";
import { Corridor } from "./architectural/Corridor";
import { Elevator } from "./architectural/Elevator";
import { Staircase } from "./architectural/Staircase";

interface MapRendererProps {
  featureCollection: GeoJSONFeatureCollection;
  opacity: SpringValue<number>;
  isActive: boolean;
}

/**
 * Loops through GeoJSON features and renders the corresponding 3D components.
 */
export function MapRenderer({ featureCollection, opacity, isActive }: MapRendererProps) {
  return (
    <group>
      {featureCollection.features.map((feature: GeoJSONFeature, index: number) => {
        const p = feature.properties;
        const featureType = p.type;
        const key = p.id ?? `${featureType}-${index}`;

        switch (featureType) {
          case "room":
            return (
              <Room
                key={key}
                id={p.id}
                position={p.position}
                size={(p.size as [number, number]) ?? [6, 6]}
                label={p.label}
                doorPosition={p.doorPosition ?? "bottom"}
                doorOffset={p.doorOffset ?? 0}
                color={p.color ?? "#ffffff"}
                pinColor={p.pinColor}
                pinIcon={p.pinIcon}
                opacity={opacity}
                isActive={isActive}
              />
            );

          case "corridor":
            return (
              <Corridor
                key={key}
                position={p.position}
                size={(p.size as [number, number]) ?? [10, 4]}
                rotation={p.rotation ?? [0, 0, 0]}
                opacity={opacity}
                isActive={isActive}
                label={p.label}
                color={p.color}
              />
            );

          case "elevator":
            return (
              <Elevator
                key={key}
                position={p.position}
                rotation={p.rotation ?? [0, 0, 0]}
                opacity={opacity}
                isActive={isActive}
              />
            );

          case "stairs":
            return (
              <Staircase
                key={key}
                position={p.position}
                rotation={p.rotation ?? [0, 0, 0]}
                opacity={opacity}
                isActive={isActive}
              />
            );

          default:
            return null;
        }
      })}
    </group>
  );
}
