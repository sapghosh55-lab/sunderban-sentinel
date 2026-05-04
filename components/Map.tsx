'use client';

import React, { useState, useEffect, useRef } from 'react';
import Map, { Source, Layer, MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { motion, AnimatePresence } from 'framer-motion';
import MapLegend from './MapLegend';

interface MapComponentProps {
  year: number;
  analysisData: Record<string, unknown> | null;
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
  const [mode, setMode] = useState<'natural' | 'ndvi'>('natural');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [viewState, setViewState] = useState({
    longitude: 88.85, // Sundarbans longitude
    latitude: 21.9, // Sundarbans latitude
    zoom: 9
  });

  // Stadia Maps - Open Source Token-Free Style
  const styleUrl = `https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json`;

  // Update tiles when year or mode changes
  useEffect(() => {
    // Safety check 1: Ref must exist
    if (!mapRef.current) return;

    // Safety check 2: Get the underlying MapLibre instance
    const map = mapRef.current.getMap();
    if (!map) return;

    // Safety check 3: Wait until style is fully loaded
    if (!mapLoaded || !map.isStyleLoaded()) {
      console.log("Map or style not ready yet, skipping tile update");
      return;
    }

    const refreshTiles = async () => {
      try {
        console.log(`Frontend requesting tiles for year: ${year}, mode: ${mode}`);
        // Add cache-busting version parameter
        const response = await fetch(`http://localhost:8000/api/tiles?year=${year}&mode=${mode}&v=${Date.now()}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch tiles: ${response.statusText}`);
        }

        const data = await response.json();
        const tileUrl = data.url;

        if (!tileUrl) {
          console.error("No tile URL returned from backend");
          return;
        }

        // Nuclear Option: Remove existing layer and source to force refresh
        if (map.getLayer('satellite-layer')) {
          map.removeLayer('satellite-layer');
        }
        if (map.getSource('satellite-source')) {
          map.removeSource('satellite-source');
        }

        // Re-add source with new dynamic URL
        map.addSource('satellite-source', {
          type: 'raster',
          tiles: [tileUrl],
          tileSize: 256
        });

        // Re-add layer at the bottom (before erosion layer if it exists)
        map.addLayer({
          id: 'satellite-layer',
          type: 'raster',
          source: 'satellite-source',
          paint: { 'raster-opacity': 0.8 }
        }, map.getLayer('erosion-layer') ? 'erosion-layer' : undefined);

        console.log(`Successfully updated map tiles for year ${year}`);
        map.fire('yearchange', { year });
      } catch (err) {
        console.error("Error refreshing map data:", err);
      }
    };

    refreshTiles();
  }, [year, mode, mapLoaded]);

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onLoad={() => setMapLoaded(true)}
        onStyleData={() => {
          // Additional safety to ensure style-dependent operations are possible
          const map = mapRef.current?.getMap();
          if (map?.isStyleLoaded()) setMapLoaded(true);
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={styleUrl}
      >
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
                'fill-outline-color': '#fff'
              }}
            />
          </Source>
        )}
      </Map>

      {/* Mode Toggle Overlay */}
      <div className="absolute top-6 right-6 z-10 flex flex-col gap-4 pointer-events-auto">
        <div className="flex bg-slate-900/60 backdrop-blur-md p-1 rounded-lg border border-white/10 shadow-2xl">
          <button
            onClick={() => setMode('natural')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${mode === 'natural'
              ? 'bg-emerald-500 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            Natural
          </button>
          <button
            onClick={() => setMode('ndvi')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${mode === 'ndvi'
              ? 'bg-emerald-500 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            NDVI
          </button>
        </div>

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
    </div>
  );
};

export default MapComponent;
