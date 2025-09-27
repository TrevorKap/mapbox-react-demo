import React, { useState, useEffect, useRef } from "react";
import ReactMapGL, { Marker, Popup } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css"; // keep this for proper map rendering
import * as parkDate from "./data/skateboard-parks.json";

// Style configuration: try custom, fall back to baseline if it errors
const BASELINE_STYLE = "mapbox://styles/mapbox/streets-v11";
const CUSTOM_STYLE = process.env.REACT_APP_MAPBOX_STYLE_URL;

export default function App() {
  const mapRef = useRef();
  const [viewport, setViewport] = useState({
    latitude: 45.4211,
    longitude: -75.6903,
    width: "100vw",
    height: "100vh",
    zoom: 10
  });

  const [selectedPark, setSelectedPark] = useState(null);
  const [activeStyle, setActiveStyle] = useState(CUSTOM_STYLE || BASELINE_STYLE);

  useEffect(() => {
    const listener = (e) => {
      if (e.key === "Escape") setSelectedPark(null);
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  // Sanity check — should NOT be undefined if .env.local is set correctly
  //console.log("TOKEN", process.env.REACT_APP_MAPBOX_TOKEN);

  // If the custom style fails to load for any reason, switch to baseline once
  useEffect(() => {
    const map = mapRef.current && mapRef.current.getMap && mapRef.current.getMap();
    if (!map) return;
    const handleError = (e) => {
      // Only fallback if we are currently trying the custom style
      if (activeStyle === CUSTOM_STYLE) {
        setActiveStyle(BASELINE_STYLE);
      }
    };
    map.on("error", handleError);
    return () => {
      map.off("error", handleError);
    };
  }, [activeStyle]);

  return (
    <div>
      <ReactMapGL
        ref={mapRef}
        {...viewport}
        mapStyle={activeStyle}
        mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
        onViewportChange={(next) => setViewport(next)}
      >
        {parkDate.features && parkDate.features.map((park) => (
          <Marker
            key={park.properties.PARK_ID}
            latitude={park.geometry.coordinates[1]}
            longitude={park.geometry.coordinates[0]}
          >
            <button
              className="marker-btn"
              onClick={(e) => {
                e.preventDefault();
                setSelectedPark(park);
              }}
            >
              <img src="/skateboarding.svg" alt="Skate Park Icon" />
            </button>
          </Marker>
        ))}

        {selectedPark && (
          <Popup
            latitude={selectedPark.geometry.coordinates[1]}
            longitude={selectedPark.geometry.coordinates[0]}
            onClose={() => setSelectedPark(null)}
          >
            <div>
              <h2>{selectedPark.properties.NAME}</h2>
              <p>{selectedPark.properties.DESCRIPTIO}</p>
            </div>
          </Popup>
        )}
      </ReactMapGL>
    </div>
  );
}
