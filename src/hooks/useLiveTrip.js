import { useCallback, useEffect, useRef, useState } from "react";

function formatGeoError(geoError) {
  if (!geoError) {
    return "Unable to read your location.";
  }

  switch (geoError.code) {
    case 1:
      return "Location permission was denied. Enable location access in your browser settings, then start the trip again.";
    case 2:
      return "GPS location is currently unavailable. Check that location services are turned on and try again.";
    case 3:
      return "Location request timed out. Move to an open area if possible, then try again.";
    default:
      return geoError.message || "Unable to update your location.";
  }
}

export default function useLiveTrip() {
  const [status, setStatus] = useState("idle");
  const [startTime, setStartTime] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [error, setError] = useState("");

  const watchIdRef = useRef(null);
  const timerRef = useRef(null);

  const clearWatching = useCallback(() => {
    if (watchIdRef.current != null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerRef.current != null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopTrip = useCallback(() => {
    clearWatching();
    setStatus("idle");
    setStartTime(null);
    setElapsedMs(0);
    setCurrentLocation(null);
    setError("");
  }, [clearWatching]);

  const startTrip = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("error");
      setError("Geolocation is not supported by this browser.");
      return;
    }

    clearWatching();
    setError("");
    setCurrentLocation(null);
    setElapsedMs(0);

    const startedAt = Date.now();
    setStartTime(startedAt);
    setStatus("requesting");

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCurrentLocation({
          lat: latitude,
          lon: longitude,
          accuracy,
        });
        setStatus("active");
        setError("");
      },
      (geoError) => {
        setError(formatGeoError(geoError));

        if (geoError?.code === 1) {
          clearWatching();
          setStatus("error");
          setStartTime(null);
          setElapsedMs(0);
          setCurrentLocation(null);
          return;
        }

        setStatus((prev) => (prev === "active" ? "active" : "requesting"));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );

    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 1000);
  }, [clearWatching]);

  useEffect(() => {
    return () => {
      clearWatching();
    };
  }, [clearWatching]);

  return {
    isActive: status === "active" || status === "requesting",
    status,
    startTime,
    elapsedMs,
    currentLocation,
    error,
    startTrip,
    stopTrip,
  };
}
