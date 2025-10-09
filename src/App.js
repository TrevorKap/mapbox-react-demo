import React, { useState, useEffect, useRef } from "react";
import Map, { Marker, Popup } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css"; // keep this for proper map rendering
import parkData from "./data/skateboard-parks.json";

// Style configuration: try custom, fall back to baseline if it errors
const BASELINE_STYLE = "mapbox://styles/mapbox/streets-v11";
const STREETS_V12 = "mapbox://styles/mapbox/streets-v12";
const CUSTOM_STYLE = process.env.REACT_APP_MAPBOX_STYLE_URL;
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

// Preset custom styles for quick switching in the inspector sidebar
const PRESET_STYLES = [
  { label: "Streets v12", url: STREETS_V12, bg: "#9ca3af", fg: "#111827" },
  { label: "GreenNova", url: "mapbox://styles/ghernandezd/cmfa8j9l2005d01s5eagv0mru", bg: "#16a34a", fg: "#ffffff" },
  { label: "Velvet", url: "mapbox://styles/ghernandezd/cmfaa96su001u01qoeqft1zot", bg: "#7c3aed", fg: "#ffffff" },
  { label: "BloodyWaters", url: "mapbox://styles/ghernandezd/cmghesr1300it01sb77bb1iky", bg: "#ef4444", fg: "#ffffff" },
  { label: "Decimal 2.0", url: "mapbox://styles/ghernandezd/cmfabck50006201rw11b7d8fd", bg: "#0ea5e9", fg: "#04202e" }
];

// Convert a mapbox:// style URL into a direct Styles API URL so we can
// fetch it and inspect HTTP status / error payloads in the console.
function styleUrlToApiUrl(styleUrl, token) {
  if (!styleUrl || !token) return null;
  if (styleUrl.indexOf("mapbox://styles/") === 0) {
    const path = styleUrl.replace("mapbox://styles/", "");
    return `https://api.mapbox.com/styles/v1/${path}?access_token=${token}`;
  }
  if (styleUrl.indexOf("http") === 0) {
    try {
      const u = new URL(styleUrl);
      u.searchParams.set("access_token", token);
      return u.toString();
    } catch (e) {
      return null;
    }
  }
  return null;
}

export default function App() {
  const mapRef = useRef();
  const [viewState, setViewState] = useState({
    latitude: 45.4211,
    longitude: -75.6903,
    zoom: 10
  });

  const [selectedPark, setSelectedPark] = useState(null);
  const [activeStyle, setActiveStyle] = useState(CUSTOM_STYLE || BASELINE_STYLE);
  const [showSidebar, setShowSidebar] = useState(true);
  const [customStyleOk, setCustomStyleOk] = useState(null); // null unknown, true ok, false failing

  useEffect(() => {
    const listener = (e) => {
      if (e.key === "Escape") setSelectedPark(null);
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);


  // If the custom style fails to load for any reason, switch to baseline once
  useEffect(() => {
    const map = mapRef.current && mapRef.current.getMap && mapRef.current.getMap();
    if (!map) return;
    const handleError = (e) => {
      // Log detailed error information from Mapbox GL
      // Helpful when styles or tokens are not accessible
      console.error("[Mapbox][map error]", e && e.error ? e.error : e);
      // Only fallback if we are on the custom style and it is known unhealthy
      if (activeStyle === CUSTOM_STYLE && customStyleOk === false) {
        setActiveStyle(BASELINE_STYLE);
      }
    };
    const handleStyleData = () => {
      try {
        const isLoaded = map.isStyleLoaded && map.isStyleLoaded();
        console.log("[Mapbox][styledata] isStyleLoaded=", isLoaded);
        const styleObj = map.getStyle && map.getStyle();
        if (styleObj) {
          const hasDem = styleObj.sources && Object.values(styleObj.sources).some((s) => s && s.type === "raster-dem");
          const hasInvalidTerrain = Object.prototype.hasOwnProperty.call(styleObj, "terrain") && styleObj.terrain === null;
          const sourceKeys = styleObj.sources ? Object.keys(styleObj.sources) : [];
          console.log("[Mapbox][terrain]", {
            terrain: styleObj.terrain,
            hasDem,
            hasInvalidTerrain,
            sourceKeys
          });
        }
      } catch (err) {
        console.warn("[Mapbox] styledata handler error", err);
      }
    };
    const handleSourceData = (ev) => {
      if (ev && ev.sourceId) {
        console.log("[Mapbox][sourcedata]", ev.sourceId, "isSourceLoaded=", ev.isSourceLoaded);
      }
    };
    const handleLoad = () => {
      console.log("[Mapbox][load] style fully loaded");
    };

    map.on("error", handleError);
    map.on("styledata", handleStyleData);
    map.on("sourcedata", handleSourceData);
    map.on("load", handleLoad);
    return () => {
      map.off("error", handleError);
      map.off("styledata", handleStyleData);
      map.off("sourcedata", handleSourceData);
      map.off("load", handleLoad);
    };
  }, [activeStyle, customStyleOk]);

  // Fetch the style JSON via the Styles API to surface HTTP status/errors
  useEffect(() => {
    const apiUrl = styleUrlToApiUrl(activeStyle, MAPBOX_TOKEN);
    if (!apiUrl) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiUrl);
        const text = await res.text();
        if (cancelled) return;
        console.log("[Mapbox][Styles API]", res.status, res.statusText, apiUrl);
        console.log("[Mapbox][Res]", res);
        try {
          const json = JSON.parse(text);
          // Log top-level keys and any error message field
          console.log("[Mapbox][Styles API JSON keys]", Object.keys(json));
          // Log terrain and source details to diagnose DEM/terrain issues
          console.log("[Mapbox][Styles API terrain]", json.terrain);
          const sourceKeys = json.sources ? Object.keys(json.sources) : [];
          console.log("[Mapbox][Styles API sources]", sourceKeys);
          const demSources = json.sources
            ? Object.entries(json.sources)
                .filter(([k, s]) => s && s.type === "raster-dem")
                .map(([k]) => k)
            : [];
          console.log("[Mapbox][Styles API raster-dem sources]", demSources);
          if (json && json.message) {
            console.warn("[Mapbox][Styles API message]", json.message);
          }
        } catch (_) {
          console.log("[Mapbox][Styles API raw]", text.slice(0, 500));
        }
        if (activeStyle === CUSTOM_STYLE) {
          setCustomStyleOk(res.ok);
        }
      } catch (err) {
        if (!cancelled) console.error("[Mapbox][Styles API fetch error]", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeStyle]);

  return (
    <div>
      {/* Floating toggle to show/hide the inspector sidebar */}
      {!showSidebar && (
        <button
          onClick={() => setShowSidebar(true)}
          style={{
            position: "fixed",
            top: 8,
            left: 8,
            zIndex: 10000,
            padding: "6px 10px",
            background: "#111",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer"
          }}
        >
          Open Inspector
        </button>
      )}

      {showSidebar && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: 340,
            height: "100vh",
            background: "linear-gradient(180deg, #0b1020 0%, #121a34 100%)",
            color: "#e5e7eb",
            boxShadow: "0 0 18px rgba(0,0,0,0.35)",
            zIndex: 10000,
            display: "flex",
            flexDirection: "column",
            pointerEvents: "auto",
            borderRight: "1px solid rgba(255,255,255,0.08)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", padding: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <strong style={{ flex: 1, letterSpacing: 0.4 }}>Map Inspector</strong>
            <button
              onClick={() => setShowSidebar(false)}
              style={{
                padding: "6px 10px",
                background: "#1f2a4a",
                color: "#cbd5e1",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 6,
                cursor: "pointer"
              }}
            >
              Hide
            </button>
          </div>
          <div style={{ padding: 12, overflow: "auto" }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: "#a3aed0" }}>Active Style</div>
              <div style={{ wordBreak: "break-all", fontSize: 12, color: "#e5e7eb" }}>{activeStyle}</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "#a3aed0", marginBottom: 6 }}>Presets</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {PRESET_STYLES.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => { setCustomStyleOk(null); setActiveStyle(s.url); }}
                    style={{
                      padding: "6px 10px",
                      background: s.bg,
                      color: s.fg,
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer"
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Removed standalone action buttons; use Presets above instead */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: "#a3aed0" }}>Token present</div>
              <div style={{ fontSize: 12 }}>{MAPBOX_TOKEN ? "Yes" : "No (check .env)"}</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ width: "100vw", height: "100vh" }}>
        <Map
          ref={mapRef}
          initialViewState={viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          style={{ width: "100%", height: "100%" }}
          mapStyle={activeStyle}
          mapboxAccessToken={MAPBOX_TOKEN}
          transformRequest={(url, resourceType) => {
            try { console.log("[Mapbox][Req]", resourceType, url); } catch (_) {}
            return { url };
          }}
        >
          {parkData.features && parkData.features.map((park) => (
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
    </div>
  );
}
