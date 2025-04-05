import React from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100%",
  height: "300px",
};

const defaultCenter = { lat: 20.5888, lng: -100.3899 }; // Coordenadas de Querétaro

const SensorMap = ({ coordinates }) => {
  const parsedCoordinates = coordinates
    ? coordinates.split(",").map((c) => parseFloat(c.trim()))
    : [defaultCenter.lat, defaultCenter.lng];

  return (
    <LoadScript googleMapsApiKey="AIzaSyAQgj9mQb3clXQHxQBthZPrFuupUFkUYU0">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={{ lat: parsedCoordinates[0], lng: parsedCoordinates[1] }}
        zoom={15}
      >
        <Marker position={{ lat: parsedCoordinates[0], lng: parsedCoordinates[1] }} />
      </GoogleMap>
    </LoadScript>
  );
};

export default SensorMap;
