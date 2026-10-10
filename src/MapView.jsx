import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

// ======================================================
// TELANGANA MAP SETTINGS
// ======================================================

const TELANGANA_CENTER = [17.9, 79.1];

const TELANGANA_BOUNDS = [
  [15.8, 77.0],
  [19.0, 81.5],
];

// ======================================================
// FIT MAP TO ROUTE
// ======================================================

function RouteMapController({
  route,
  startCoords,
  destinationCoords,
}) {
  const map = useMap();

  useEffect(() => {
    if (route && route.length > 1) {
      map.fitBounds(route, {
        padding: [45, 45],
        maxZoom: 14,
      });
    } else if (startCoords && destinationCoords) {
      map.fitBounds(
        [startCoords, destinationCoords],
        {
          padding: [50, 50],
          maxZoom: 14,
        }
      );
    } else if (startCoords) {
      map.setView(startCoords, 14);
    } else if (destinationCoords) {
      map.setView(destinationCoords, 14);
    }
  }, [
    route,
    startCoords,
    destinationCoords,
    map,
  ]);

  return null;
}

// ======================================================
// NORMALIZE USER INPUT
// ======================================================

function cleanLocationInput(value) {
  return value
    .trim()
    .replace(/\s+/g, " ");
}

// ======================================================
// PICK BEST GEOCODING RESULT
// ======================================================

function chooseBestLocation(results, userInput) {
  if (!results || results.length === 0) {
    return null;
  }

  const input = cleanLocationInput(userInput).toLowerCase();

  // ----------------------------------------------------
  // 1. Exact display-name match
  // ----------------------------------------------------

  const exactDisplayMatch = results.find(
    (item) =>
      item.display_name &&
      item.display_name
        .toLowerCase()
        .startsWith(input)
  );

  if (exactDisplayMatch) {
    return exactDisplayMatch;
  }

  // ----------------------------------------------------
  // 2. Exact name match
  // Example:
  // ECIL -> ECIL
  // Sainikpuri -> Sainikpuri
  // ----------------------------------------------------

  const exactNameMatch = results.find(
    (item) =>
      item.name &&
      item.name.toLowerCase() === input
  );

  if (exactNameMatch) {
    return exactNameMatch;
  }

  // ----------------------------------------------------
  // 3. Match important address fields
  // ----------------------------------------------------

  const addressMatch = results.find((item) => {
    if (!item.address) {
      return false;
    }

    const addressValues = Object.values(
      item.address
    )
      .filter(Boolean)
      .map((value) =>
        String(value).toLowerCase()
      );

    return addressValues.some(
      (value) =>
        value === input ||
        value.includes(input)
    );
  });

  if (addressMatch) {
    return addressMatch;
  }

  // ----------------------------------------------------
  // 4. Otherwise use Nominatim's best-ranked result
  // ----------------------------------------------------

  return results[0];
}

// ======================================================
// MAIN MAP COMPONENT
// ======================================================

function MapView({
  currentLocation,
  destination,
}) {
  const [startCoords, setStartCoords] =
    useState(null);

  const [destinationCoords, setDestinationCoords] =
    useState(null);

  const [route, setRoute] =
    useState([]);

  const [routeInfo, setRouteInfo] =
    useState(null);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [startResult, setStartResult] =
    useState(null);

  const [destinationResult, setDestinationResult] =
    useState(null);

  // ====================================================
  // FIND ROUTE
  // ====================================================

  useEffect(() => {
    if (
      !currentLocation ||
      !destination
    ) {
      return;
    }

    const findRoute = async () => {
      try {
        setLoading(true);
        setError("");

        setStartCoords(null);
        setDestinationCoords(null);
        setRoute([]);
        setRouteInfo(null);

        setStartResult(null);
        setDestinationResult(null);

        // =================================================
        // CLEAN USER INPUT
        // =================================================

        const startQuery =
          cleanLocationInput(currentLocation);

        const destinationQuery =
          cleanLocationInput(destination);

        if (!startQuery) {
          setError(
            "Please enter a starting location."
          );
          return;
        }

        if (!destinationQuery) {
          setError(
            "Please enter a destination."
          );
          return;
        }

        // =================================================
        // 1. GEOCODE CURRENT LOCATION
        // =================================================

        console.log(
          "Searching current location:",
          startQuery
        );

        const startResponse =
          await fetch(
            `http://localhost:8080/api/geocode?q=${encodeURIComponent(
              startQuery
            )}`
          );

        if (!startResponse.ok) {
          throw new Error(
            "Current location could not be searched."
          );
        }

        const startData =
          await startResponse.json();

        console.log(
          "Current location results:",
          startData
        );

        if (
          !Array.isArray(startData) ||
          startData.length === 0
        ) {
          setError(
            `Could not find "${currentLocation}".`
          );
          return;
        }

        // =================================================
        // PICK BEST START RESULT
        // =================================================

        const bestStart =
          chooseBestLocation(
            startData,
            startQuery
          );

        if (
          !bestStart ||
          !bestStart.lat ||
          !bestStart.lon
        ) {
          setError(
            `Could not determine the location of "${currentLocation}".`
          );
          return;
        }

        const start = [
          Number(bestStart.lat),
          Number(bestStart.lon),
        ];

        console.log(
          "Selected start location:",
          bestStart
        );

        // =================================================
        // 2. GEOCODE DESTINATION
        // =================================================

        console.log(
          "Searching destination:",
          destinationQuery
        );

        const destinationResponse =
          await fetch(
            `http://localhost:8080/api/geocode?q=${encodeURIComponent(
              destinationQuery
            )}`
          );

        if (!destinationResponse.ok) {
          throw new Error(
            "Destination could not be searched."
          );
        }

        const destinationData =
          await destinationResponse.json();

        console.log(
          "Destination results:",
          destinationData
        );

        if (
          !Array.isArray(destinationData) ||
          destinationData.length === 0
        ) {
          setError(
            `Could not find "${destination}".`
          );
          return;
        }

        // =================================================
        // PICK BEST DESTINATION RESULT
        // =================================================

        const bestDestination =
          chooseBestLocation(
            destinationData,
            destinationQuery
          );

        if (
          !bestDestination ||
          !bestDestination.lat ||
          !bestDestination.lon
        ) {
          setError(
            `Could not determine the location of "${destination}".`
          );
          return;
        }

        const end = [
          Number(bestDestination.lat),
          Number(bestDestination.lon),
        ];

        console.log(
          "Selected destination:",
          bestDestination
        );

        // =================================================
        // SAVE LOCATION RESULTS
        // =================================================

        setStartResult(bestStart);
        setDestinationResult(
          bestDestination
        );

        setStartCoords(start);
        setDestinationCoords(end);

        // =================================================
        // 3. CALL SPRING BOOT ROUTE API
        // =================================================

        const routeUrl =
          `http://localhost:8080/api/route` +
          `?startLat=${start[0]}` +
          `&startLon=${start[1]}` +
          `&endLat=${end[0]}` +
          `&endLon=${end[1]}`;

        console.log(
          "Route API:",
          routeUrl
        );

        const routeResponse =
          await fetch(routeUrl);

        if (!routeResponse.ok) {
          throw new Error(
            "Routing service returned an error."
          );
        }

        const routeData =
          await routeResponse.json();

        console.log(
          "Route response:",
          routeData
        );

        // =================================================
        // 4. CHECK ROUTE
        // =================================================

        if (
          routeData.code !== "Ok" ||
          !routeData.routes ||
          routeData.routes.length === 0
        ) {
          setError(
            "Locations were found, but a road route could not be calculated."
          );
          return;
        }

        // =================================================
        // 5. FIRST ROUTE
        // =================================================

        const selectedRoute =
          routeData.routes[0];

        // =================================================
        // 6. CHECK ROUTE GEOMETRY
        // =================================================

        if (
          !selectedRoute.geometry ||
          !selectedRoute.geometry.coordinates
        ) {
          setError(
            "Route geometry was not returned."
          );
          return;
        }

        // =================================================
        // 7. GEOJSON -> LEAFLET
        // =================================================

        const coordinates =
          selectedRoute.geometry.coordinates.map(
            ([longitude, latitude]) => [
              latitude,
              longitude,
            ]
          );

        console.log(
          "Route points:",
          coordinates.length
        );

        setRoute(coordinates);

        // =================================================
        // 8. DISTANCE + TIME
        // =================================================

        setRouteInfo({
          distance: (
            selectedRoute.distance / 1000
          ).toFixed(1),

          time: Math.round(
            selectedRoute.duration / 60
          ),
        });
      } catch (err) {
        console.error(
          "Map route error:",
          err
        );

        setError(
          "Unable to calculate route. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    findRoute();
  }, [
    currentLocation,
    destination,
  ]);

  // ====================================================
  // UI
  // ====================================================

  return (
    <div
      style={{
        width: "100%",
        height: "550px",
        borderRadius: "17px",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <MapContainer
        center={TELANGANA_CENTER}
        zoom={8}
        minZoom={8}
        maxZoom={16}
        maxBounds={TELANGANA_BOUNDS}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={true}
        style={{
          width: "100%",
          height: "550px",
        }}
      >

        {/* ==================================================
            OPENSTREETMAP
        ================================================== */}

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {/* ==================================================
            AUTOMATIC MAP POSITION
        ================================================== */}

        <RouteMapController
          route={route}
          startCoords={startCoords}
          destinationCoords={
            destinationCoords
          }
        />

        {/* ==================================================
            START MARKER
        ================================================== */}

        {startCoords && (
          <Marker
            position={startCoords}
          >
            <Popup>
              <strong>
                Starting point
              </strong>

              <br />

              {currentLocation}

              {startResult?.display_name && (
                <>
                  <br />
                  <small>
                    {startResult.display_name}
                  </small>
                </>
              )}
            </Popup>
          </Marker>
        )}

        {/* ==================================================
            DESTINATION MARKER
        ================================================== */}

        {destinationCoords && (
          <Marker
            position={
              destinationCoords
            }
          >
            <Popup>
              <strong>
                Destination
              </strong>

              <br />

              {destination}

              {destinationResult?.display_name && (
                <>
                  <br />
                  <small>
                    {
                      destinationResult.display_name
                    }
                  </small>
                </>
              )}
            </Popup>
          </Marker>
        )}

        {/* ==================================================
            ACTUAL ROAD ROUTE
        ================================================== */}

        {route.length > 1 && (
          <Polyline
            positions={route}
            pathOptions={{
              color: "#1f7a4d",
              weight: 6,
              opacity: 0.85,
            }}
          />
        )}

      </MapContainer>

      {/* ====================================================
          LOADING
      ==================================================== */}

      {loading && (
        <div
          style={{
            position: "absolute",
            top: "15px",
            left: "50%",
            transform:
              "translateX(-50%)",
            zIndex: 1000,
            background: "white",
            padding: "10px 16px",
            borderRadius: "10px",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.15)",
            color: "#17211b",
            fontSize: "14px",
            fontWeight: "600",
          }}
        >
          Finding route...
        </div>
      )}

      {/* ====================================================
          ROUTE INFORMATION
      ==================================================== */}

      {routeInfo && !loading && (
        <div
          style={{
            position: "absolute",
            top: "15px",
            left: "15px",
            zIndex: 1000,
            background: "white",
            padding: "12px 16px",
            borderRadius: "10px",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.15)",
            color: "#17211b",
            fontSize: "14px",
          }}
        >
          <strong>
            Route
          </strong>

          <br />

          {routeInfo.distance} km ·{" "}
          {routeInfo.time} min
        </div>
      )}

      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && !loading && (
        <div
          style={{
            position: "absolute",
            bottom: "15px",
            left: "15px",
            right: "15px",
            zIndex: 1000,
            background: "white",
            padding: "12px",
            borderRadius: "10px",
            color: "#b42318",
            textAlign: "center",
            boxShadow:
              "0 2px 10px rgba(0,0,0,0.15)",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

export default MapView;