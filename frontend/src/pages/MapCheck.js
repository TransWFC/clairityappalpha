import React, { useState } from "react";
import SensorMap from "../components/GoogleMap";

const MapScreen = () => {
  const [coordinates, setCoordinates] = useState("20.5888, -100.3899");  // Default coordinates

  const handleCoordinatesChange = (e) => {
    setCoordinates(e.target.value);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Sensor Location Map</h1>
      <div style={{ marginBottom: "10px" }}>
        <label htmlFor="coordinates">Enter Coordinates (lat, lng): </label>
        <input
          type="text"
          id="coordinates"
          value={coordinates}
          onChange={handleCoordinatesChange}
          placeholder="20.5888, -100.3899"
          style={{ padding: "5px", width: "250px" }}
        />
      </div>
      <div>
        <SensorMap coordinates={coordinates} />
      </div>
    </div>
  );
};

export default MapScreen;
