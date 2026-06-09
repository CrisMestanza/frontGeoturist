// src/Map.jsx
import React from "react";
import { withScriptjs, withGoogleMap, GoogleMap, Marker } from "react-google-maps";

function Mapa() {
  return (
    <GoogleMap
      defaultZoom={12}
      defaultCenter={{ lat: -12.0464, lng: -77.0428 }} // Ejemplo: Lima
    >
      <Marker position={{ lat: -12.0464, lng: -77.0428 }} />
    </GoogleMap>
  );
}

export default withScriptjs(withGoogleMap(Mapa));
