import React, { useState, useEffect } from "react";
import Map, { Marker, Popup } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css"; // important for layout
import * as parkData from "./data/skateboard-parks.json"; // (typo: Data, not Date)

/* Make sure .env.local has:
   REACT_APP_MAPBOX_TOKEN=pk.ey...
   and you restarted `npm start` after creating/editing it.
*/

export default function App() {
  const [selectedPark, setSelectedPark] = useState(null);
  const [viewState, setViewState] = useState({
    latitude: 45.4211,
longitude: -75.6903,
    zoom: 10
});

  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && setSelectedPark(null);
    window.addEventListener("keydown", onEsc);
return () => window.removeEventListener("keydown", onEsc);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Map
        initialViewState={viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/ghernandezd/cmfabck50006201rw11b7d8fd"
        mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
      >
        {parkData.features.map((park) => (
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
      </Map>
    </div>
  );
}
