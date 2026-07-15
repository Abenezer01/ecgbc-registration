"use client";

import React, { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";

const REGION_NAME_MAP: Record<string, string> = {
  "አዲስ አበባ ክልል": "Addis Ababa",
  "አፋር ክልል": "Afar",
  "አማራ ክልል": "Amhara",
  "ቤኒሻንጉል ክልል": "Benishangul Gumz",
  "ድሬዳዋ ክልል": "Dire Dawa",
  "ጋምቤላ ክልል": "Gambela",
  "ሐረር ክልል": "Harari",
  "ኦሮሚያ ክልል": "Oromia",
  "ሲዳማ ክልል": "Sidama",
  "ደቡብ ኢትዮጵያ ክልል": "SNNP",
  "ሶማሌ ክልል": "Somali",
  "ትግራይ ክልል": "Tigray",
  "ማዕከላዊ ኢትዮጵያ ክልል": "SNNP",
  "ደቡብ ምዕራብ ኢትዮጵያ ክልል": "SWEPR",
};

// A sleek sunset gradient for the choropleth map (from low to high data)
const COLOR_SCALE = [
  "#fef08a", // yellow-200 (low)
  "#fde047", // yellow-300
  "#facc15", // yellow-400
  "#fbbf24", // amber-400
  "#f59e0b", // amber-500
  "#ea580c", // orange-600
  "#e11d48", // rose-600
  "#be123c", // rose-700 (high)
];

interface EthiopiaMapProps {
  data: { name: string; value: number }[];
}

const geoUrl = "/data/ethiopia1.json";

export function EthiopiaMap({ data }: EthiopiaMapProps) {
  const [tooltip, setTooltip] = useState<{ content: string; x: number; y: number } | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const getDataForGeoName = (geoName: string) => {
    // Since some new regions are grouped under SNNP in GADM, we sum their values
    const groupedData = data.filter((d) => REGION_NAME_MAP[d.name] === geoName);
    if (groupedData.length === 0) return undefined;
    return {
      name: geoName,
      value: groupedData.reduce((sum, d) => sum + d.value, 0)
    };
  };

  // Find max value for the color scale
  // We use the aggregated values from our grouped logic to ensure accurate max calculation
  const aggregatedValues = Object.values(REGION_NAME_MAP)
    .map(geoName => getDataForGeoName(geoName)?.value ?? 0);
  const maxValue = Math.max(...aggregatedValues, 1);

  const getRegionColor = (value: number | undefined) => {
    // Return undefined so we can apply a default CSS class in the component if we want, 
    // but react-simple-maps uses inline styles. Let's return a nice neutral color based on theme.
    // Using a light grey with opacity works well across themes.
    if (!value) return "rgba(156, 163, 175, 0.3)"; // zinc-400 with 30% opacity
    
    // Use square root scale to prevent extreme outliers (e.g. Addis Ababa) from washing out all other regions
    const ratio = Math.sqrt(value) / Math.sqrt(maxValue);
    const bucketIndex = Math.min(
      COLOR_SCALE.length - 1,
      Math.floor(ratio * COLOR_SCALE.length)
    );
    return COLOR_SCALE[bucketIndex];
  };

  return (
    <div
    className="w-full h-full relative bg-transparent rounded-lg overflow-hidden"
      onMouseLeave={() => setTooltip(null)}
    >
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 2700, center: [39.5, 9.0] }}
        className="w-full h-full outline-none"
      >
        <ZoomableGroup zoom={1.1} maxZoom={6} minZoom={0.8} center={[39.5, 9.0]}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const geoName: string = geo.properties.ADM1_EN;
                const regionData = getDataForGeoName(geoName);
                const isSelected = selectedRegion === geoName;
                
                const color = getRegionColor(regionData?.value);
                const opacity = regionData ? 1 : 0.6;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={(e: React.MouseEvent) => {
                      // Pretty print name for tooltip (e.g. SNNP gets a descriptive label)
                      const displayGeoName = geoName === "SNNP" 
                        ? "South / Central Ethiopia" 
                        : geoName;
                        
                      setTooltip({
                        content: regionData
                          ? `${displayGeoName}: ${regionData.value.toLocaleString()} members`
                          : `${displayGeoName}: No data`,
                        x: e.clientX,
                        y: e.clientY,
                      });
                    }}
                    onMouseMove={(e: React.MouseEvent) => {
                      setTooltip((prev) =>
                        prev ? { ...prev, x: e.clientX, y: e.clientY } : null
                      );
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    onClick={() =>
                      setSelectedRegion(isSelected ? null : geoName)
                    }
                    style={{
                      default: {
                        fill: color,
                        fillOpacity: isSelected ? 1 : opacity,
                        stroke: "var(--background, #ffffff)",
                        strokeWidth: isSelected ? 1.5 : 0.6,
                        outline: "none",
                        transition: "all 200ms",
                      },
                      hover: {
                        fill: color,
                        fillOpacity: 1,
                        stroke: "var(--background, #ffffff)",
                        strokeWidth: 1.5,
                        outline: "none",
                        cursor: "pointer",
                        filter: "brightness(1.25)",
                        transition: "all 200ms",
                      },
                      pressed: {
                        fill: color,
                        fillOpacity: 1,
                        stroke: "var(--background, #ffffff)",
                        strokeWidth: 2,
                        outline: "none",
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed pointer-events-none z-50 bg-white dark:bg-zinc-800 shadow-xl rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-800 dark:text-zinc-100 whitespace-nowrap -translate-x-1/2 -translate-y-[calc(100%+10px)]"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.content}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 p-3 bg-zinc-900/80 backdrop-blur-md rounded-lg border border-zinc-700 shadow-lg">
        <span className="text-xs font-medium text-zinc-300 mb-1">Members</span>
        
        <div className="flex items-center gap-2">
          <div className="flex w-24 h-2.5 rounded-full overflow-hidden">
            {COLOR_SCALE.map((c, i) => (
              <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
        
        <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium px-0.5">
          <span>Low</span>
          <span>High</span>
        </div>

        <div className="flex items-center gap-1.5 mt-1 pt-2 border-t border-zinc-700/50">
          <div className="w-2.5 h-2.5 rounded-sm bg-zinc-300 dark:bg-zinc-700" />
          <span className="text-[10px] text-zinc-400">No data</span>
        </div>
      </div>
    </div>
  );
}
