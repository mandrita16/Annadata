"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const fixLeafletIcons = () => {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl:
      "https://upload.wikimedia.org/wikipedia/commons/a/ad/Map-icon-truck.svg",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
};

interface LocationPickerProps {
  onLocationSelect: (location: {
    lat: number;
    lng: number;
    address?: {
      state?: string;
      city?: string;
      pincode?: string;
      display_name?: string;
      establishment?: string;
    };
  }) => void;
  initialPosition?: { lat: number; lng: number } | null;
  readOnly?: boolean;
  height?: string;
}

const MapEvents = ({
  onLocationFound,
  readOnly,
}: {
  onLocationFound: (lat: number, lng: number) => void;
  readOnly?: boolean;
}) => {
  useMapEvents({
    click(e) {
      if (!readOnly) {
        onLocationFound(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

const MapFlyTo = ({
  coords,
}: {
  coords: { lat: number; lng: number } | null;
}) => {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo([coords.lat, coords.lng], 16, { duration: 8 });
    }
  }, [coords, map]);
  return null;
};

const LocationPicker = ({
  onLocationSelect,
  initialPosition = null,
  readOnly = false,
}: LocationPickerProps) => {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    initialPosition,
  );
  const [addressLoading, setAddressLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const markerRef = useRef<L.Marker>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const { lat, lng } = marker.getLatLng();
          handleLocationFound(lat, lng);
        }
      },
    }),
    [],
  );

  useEffect(() => {
    fixLeafletIcons();
  }, []);

  const fetchAddress = async (lat: number, lng: number) => {
    setAddressLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      );
      const data = await response.json();

      if (data && data.address) {
        // Extract establishment name from various possible fields
        const establishment =
          data.name ||
          data.address.shop ||
          data.address.amenity ||
          data.address.building ||
          data.address.tourism ||
          data.address.office ||
          data.address.craft ||
          data.address.leisure ||
          "";

        const addressInfo = {
          state: data.address.state,
          city:
            data.address.city ||
            data.address.town ||
            data.address.village ||
            data.address.county,
          pincode: data.address.postcode,
          display_name: data.display_name,
          establishment: establishment,
        };

        onLocationSelect({
          lat,
          lng,
          address: addressInfo,
        });
        return addressInfo.display_name;
      } else {
        onLocationSelect({ lat, lng });
      }
    } catch (error) {
      console.error("Error fetching address:", error);
      onLocationSelect({ lat, lng });
    } finally {
      setAddressLoading(false);
    }
  };

  const handleLocationFound = (lat: number, lng: number) => {
    setPosition({ lat, lng });
    fetchAddress(lat, lng);
  };

  const searchLocation = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
      );
      const data = await response.json();
      setSearchResults(data);
      setShowResults(true);
    } catch (error) {
      console.error("Error searching location:", error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(value);
    }, 500);
  };

  const handleResultClick = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    handleLocationFound(lat, lng);
    setSearchQuery(result.display_name);
    setShowResults(false);
    setSearchResults([]);
  };

  return (
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border-2 border-black z-0">
      {/* Search Bar Overlay - Only show if not readOnly */}
      {!readOnly && (
        <div className="absolute top-4 left-4 right-4 z-1000 flex flex-col gap-2">
          <div className="relative">
            <div className="relative flex items-center gap-2 bg-white/95 backdrop-blur-md rounded-xl border border-black shadow-[0_10px_35px_rgba(0,0,0,0.06)] px-3 py-1.5 h-[48px]">
              <Search className="w-5 h-5 text-slate-450 shrink-0 ml-1" />
              <Input
                type="text"
                placeholder="Search for a location..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="flex-1 border-none focus-visible:ring-0 text-slate-800 focus-visible:ring-offset-0 placeholder:text-slate-400 text-sm font-medium bg-transparent h-full"
              />
              {searching && (
                <Loader2 className="w-5 h-5 animate-spin text-orange-500 shrink-0 mr-1" />
              )}
            </div>

            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md rounded-xl border-2 border-black shadow-[0_15px_50px_rgba(0,0,0,0.1)] max-h-[280px] overflow-y-auto overflow-x-hidden divide-y divide-slate-50">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    onClick={() => handleResultClick(result)}
                    className="p-3.5 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-2.5">
                      <Search className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {result.display_name}
                        </p>
                        {result.address && (
                          <p className="text-xs font-medium text-slate-400 mt-0.5 truncate">
                            {[
                              result.address.city,
                              result.address.state,
                              result.address.country,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Results Message */}
            {showResults &&
              searchResults.length === 0 &&
              searchQuery &&
              !searching && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-slate-100 rounded-xl shadow-[0_15px_50px_rgba(0,0,0,0.1)] p-4 text-center">
                  <p className="text-sm font-medium text-slate-500">
                    No results found
                  </p>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Map */}
      <MapContainer
        center={[41.8781, -87.6298]}
        zoom={16}
        className="w-full h-full"
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Draggable Marker */}
        {position && (
          <Marker
            position={[position.lat, position.lng]}
            draggable={!readOnly}
            ref={markerRef}
            eventHandlers={eventHandlers}
          />
        )}

        <MapEvents onLocationFound={handleLocationFound} readOnly={readOnly} />
        <MapFlyTo coords={position} />
      </MapContainer>

      {/* Status Overlay */}
      {addressLoading && (
        <div className="absolute bottom-4 left-4 right-4 z-1000 bg-slate-900/90 text-white p-3.5 rounded-xl backdrop-blur-md flex items-center gap-3 border-2 border-black shadow-lg">
          <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
          <span className="text-sm font-semibold tracking-tight">Fetching address details...</span>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
