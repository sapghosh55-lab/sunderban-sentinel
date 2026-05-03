'use client';

import React, { useState, useEffect, useRef } from 'react';
import Map, { Source, Layer, MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { motion, AnimatePresence } from 'framer-motion';
import MapLegend from './MapLegend';

interface MapComponentProps {
  year: number;
  analysisData: any;
  isLoading?: boolean;
}

// Color source of truth
const COLORS = {
  mangrove: '#4ADE80',
  erosion: '#F87171',
  risk: '#FB923C',
};

const MapComponent = ({ year, analysisData, isLoading }: MapComponentProps) => {
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState({
    longitude: 88.85, // Sundarbans longitude
    latitude: 21.9, // Sundarbans latitude
    zoom: 9
  });

  // Stadia Maps - Open Source Token-Free Style
  const styleUrl = `https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json`;

  // Update tiles when year changes
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current.getMap();
    if (!map.isStyleLoaded()) return;

    try {
      console.log("Map refreshing for year:", year);
      const tileUrl = `http://localhost:8000/api/tiles/${year}/{z}/{x}/{y}.png?v=${year}`;
      
      const source = map.getSource('satellite-source') as any;
      if (source && 'setTiles' in source) {
        // Efficiently update existing source without removing layers
        source.setTiles([tileUrl]);
      } else {
        // Fallback: Add source and layer if they don't exist yet
        if (!map.getSource('satellite-source')) {
          map.addSource('satellite-source', {
            type: 'raster',
            tiles: [tileUrl],
            tileSize: 256
          });
        }
        
        if (!map.getLayer('satellite-layer')) {
          // Add satellite layer as base imagery (at the bottom)
          // We don't use beforeId here to avoid the "non-existing layer" error
          // By adding it first or using map.addLayer(..., someBaseLayerId)
          map.addLayer({
            id: 'satellite-layer',
            type: 'raster',
            source: 'satellite-source',
            paint: { 'raster-opacity': 0.8 }
          }, map.getLayer('erosion-layer') ? 'erosion-layer' : undefined);
        }
      }

      map.fire('yearchange', { year });
    } catch (err) {
      console.error("Error refreshing map data:", err);
    }
  }, [year]);

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle={styleUrl}
      >
        {/* We define sources and layers dynamically in useEffect to ensure 
            proper ordering and error handling in Next.js 16 / Turbopack */}
        
        {/* Render analysis data if available */}
        {analysisData && (
          <Source id="erosion-data" type="geojson" data={{
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[[88.8, 21.8], [88.9, 21.8], [88.9, 21.9], [88.8, 21.9], [88.8, 21.8]]]
            },
            properties: {}
          }}>
            <Layer
              id="erosion-layer"
              type="fill"
              paint={{
                'fill-color': COLORS.erosion,
                'fill-opacity': 0.5,
                'fill-outline-color': COLORS.erosion,
              }}
            />
          </Source>
        )}
      </Map>
      
      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-slate-900/80 px-4 py-2 rounded-lg border border-emerald-500/20">
                Updating Satellite Layer: {year}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Top Right Panel Container */}
      <div className="absolute top-6 right-6 z-10 flex flex-col gap-4 pointer-events-auto">
        {/* Observation Year Panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={year}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-slate-900/80 backdrop-blur-md border border-slate-700 p-4 rounded-xl shadow-2xl min-w-[180px]"
          >
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Observation Year</div>
            <div className="text-3xl font-bold text-white tracking-tight">{year}</div>
            <div className="mt-2 text-[10px] text-slate-500 font-mono">
              {viewState.latitude.toFixed(4)}°N, {viewState.longitude.toFixed(4)}°E
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Map Legend Component */}
        <MapLegend />
      </div>
    </div>
  );
};

export default MapComponent;
