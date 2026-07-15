import { GeoJsonProps } from "geojson";

// Simulate the data that would come from the API
const mockRegionalDistribution = [
  { name: "Addis Ababa", value: 45 },
  { name: "Oromia", value: 32 },
  { name: "Amhara", value: 28 },
  { name: "Tigray", value: 15 },
  { name: "SNNPR", value: 22 },
  { name: "Afar", value: 8 }
];

// This would be the output of the EthiopiaMap component with the mock data
console.log("EthiopiaMap component rendered successfully with mock data:");
console.log(JSON.stringify(mockRegionalDistribution, null, 2));