"use client";

import React, { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";

export interface RegionData {
  name: string;
  value: number;
}

interface EthiopiaMapProps {
  data: RegionData[];
  className?: string;
}

// Use Natural Earth data from a reliable CDN - this includes world countries with admin-1 subdivisions
// We'll filter to show only Ethiopia
const WORLD_ATLAS_URL = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

// Color scale generator based on value
function getColorForValue(value: number, maxValue: number): string {
  if (value === 0) return "#e4e4e7"; // zinc-200
  const intensity = value / maxValue;
  
  // Blue gradient from light to dark
  if (intensity < 0.2) return "#dbeafe"; // blue-100
  if (intensity < 0.4) return "#93c5fd"; // blue-300
  if (intensity < 0.6) return "#60a5fa"; // blue-400
  if (intensity < 0.8) return "#3b82f6"; // blue-500
  return "#1d4ed8"; // blue-700
}

// Normalize region name for matching
function normalizeRegionName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function EthiopiaMap({ data, className }: EthiopiaMapProps) {
  const [tooltipContent, setTooltipContent] = useState<{ name: string; value: number } | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Map region names to data values
  const regionValues = new Map(
    data.map((d) => [normalizeRegionName(d.name), { name: d.name, value: d.value }])
  );
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  const handleMouseEnter = (geo: any, event: React.MouseEvent) => {
    const regionName = geo.properties.name || geo.properties.region;
    const normalizedName = normalizeRegionName(regionName || "");
    const regionData = regionValues.get(normalizedName);
    const value = regionData?.value || 0;
    const displayName = regionData?.name || regionName;

    if (displayName) {
      setTooltipContent({ name: displayName, value });
      setTooltipPos({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    setTooltipPos({ x: event.clientX, y: event.clientY });
  };

  const handleMouseLeave = () => {
    setTooltipContent(null);
  };

  return (
    <div className={className} style={{ position: "relative", width: "100%", height: "100%" }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          center: [40, 9],
          scale: 1800,
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <Geographies geography={WORLD_ATLAS_URL}>
          {({ geographies }: any) => {
            // Filter to show only Ethiopia (country code 231)
            const ethiopiaGeo = geographies.find((geo: any) => geo.id === "231");
            
            if (!ethiopiaGeo) {
              return null;
            }

            // Since we don't have regional subdivisions in this dataset,
            // show the whole country colored by total members
            const totalMembers = data.reduce((sum, region) => sum + region.value, 0);
            const fillColor = getColorForValue(totalMembers, totalMembers);

            return (
              <Geography
                key={ethiopiaGeo.rsmKey}
                geography={ethiopiaGeo}
                fill={fillColor}
                stroke="#FFFFFF"
                strokeWidth={0.75}
                style={{
                  default: {
                    fill: fillColor,
                    stroke: "#FFFFFF",
                    strokeWidth: 0.75,
                    outline: "none",
                  },
                  hover: {
                    fill: "#3b82f6",
                    stroke: "#FFFFFF",
                    strokeWidth: 1.5,
                    outline: "none",
                    cursor: "pointer",
                  },
                  pressed: {
                    fill: "#2563eb",
                    stroke: "#FFFFFF",
                    strokeWidth: 1.5,
                    outline: "none",
                  },
                }}
              />
            );
          }}
        </Geographies>
      </ComposableMap>

      {/* Regional Data Overlay - since we don't have regional boundaries */}
      <div className="absolute top-4 right-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-zinc-200 dark:border-zinc-800 max-h-[calc(100%-2rem)] overflow-y-auto max-w-[200px]">
        <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
          Regional Breakdown
        </div>
        <div className="space-y-1.5">
          {data
            .sort((a, b) => b.value - a.value)
            .map((region) => {
              const fillColor = getColorForValue(region.value, maxValue);
              return (
                <div key={region.name} className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <div
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: fillColor }}
                    />
                    <span className="text-zinc-700 dark:text-zinc-300 truncate text-[10px]">
                      {region.name}
                    </span>
                  </div>
                  <span className="text-zinc-900 dark:text-zinc-100 font-semibold shrink-0 text-[10px]">
                    {region.value}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Tooltip */}
      {tooltipContent && (
        <div
          className="fixed z-50 px-3 py-2 bg-zinc-900 text-white text-sm rounded-lg shadow-lg pointer-events-none"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            transform: "translate(-50%, -100%) translateY(-10px)",
          }}
        >
          <div className="font-semibold">{tooltipContent.name}</div>
          <div className="text-xs text-zinc-300">{tooltipContent.value} members</div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-zinc-900 rounded-lg shadow-md p-3 border border-zinc-200 dark:border-zinc-800">
        <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
          Members
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#e4e4e7" }} />
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#dbeafe" }} />
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#93c5fd" }} />
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#60a5fa" }} />
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#3b82f6" }} />
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#1d4ed8" }} />
          </div>
        </div>
        <div className="flex justify-between text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>
    </div>
  );
}
