import React, { useState, useEffect, useRef } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { loadLeaflet, geocodeAddress, reverseGeocode, getSearchZoom } from '../../lib/maps'

export default function EventLocationPicker({ address, location, onAddressInput, onLocationSelect }) {
  const [suggestions, setSuggestions] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [mapError, setMapError] = useState('')
  const [searchHint, setSearchHint] = useState('')
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const leafletRef = useRef(null)
  const addressRef = useRef(address)
  const onLocationSelectRef = useRef(onLocationSelect)
  const initialLocationRef = useRef(location)

  useEffect(() => {
    addressRef.current = address
  }, [address])

  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect
  }, [onLocationSelect])

  useEffect(() => {
    let active = true

    const initializeMap = async () => {
      try {
        const L = await loadLeaflet()
        if (!active || !L || !mapContainerRef.current || mapRef.current) return
        leafletRef.current = L

        const initialLocation = initialLocationRef.current
        const defaultCenter = initialLocation || { lat: 12.8797, lng: 121.774 }
        const map = L.map(mapContainerRef.current, {
          center: [defaultCenter.lat, defaultCenter.lng],
          zoom: initialLocation ? 15 : 6,
        })

        map.getContainer().style.zIndex = '0'

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map)

        if (initialLocation) {
          markerRef.current = L.marker([initialLocation.lat, initialLocation.lng]).addTo(map)
        }

        map.on('click', async e => {
          const nextLocation = { lat: Number(e.latlng.lat.toFixed(6)), lng: Number(e.latlng.lng.toFixed(6)) }
          if (markerRef.current) {
            markerRef.current.setLatLng([nextLocation.lat, nextLocation.lng])
          } else {
            markerRef.current = L.marker([nextLocation.lat, nextLocation.lng]).addTo(map)
          }
          map.setView([nextLocation.lat, nextLocation.lng], Math.max(15, map.getZoom()))

          let resolvedAddress = addressRef.current
          try {
            resolvedAddress = await reverseGeocode(nextLocation.lat, nextLocation.lng)
          } catch {
            resolvedAddress = addressRef.current || `${nextLocation.lat}, ${nextLocation.lng}`
          }
          onLocationSelectRef.current?.({ address: resolvedAddress, location: nextLocation })
        })

        mapRef.current = map
      } catch {
        if (active) setMapError('Map unavailable. Check network connection.')
      }
    }

    initializeMap()

    return () => {
      active = false
      if (mapRef.current) {
        try {
          mapRef.current.remove()
        } catch {
          // ignore leaflet cleanup errors
        }
        mapRef.current = null
      }
      markerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current || !leafletRef.current) return
    if (!location) {
      if (markerRef.current) {
        mapRef.current.removeLayer(markerRef.current)
        markerRef.current = null
      }
      return
    }

    if (markerRef.current) {
      markerRef.current.setLatLng([location.lat, location.lng])
    } else {
      markerRef.current = leafletRef.current.marker([location.lat, location.lng]).addTo(mapRef.current)
    }
    mapRef.current.flyTo([location.lat, location.lng], Math.max(15, mapRef.current.getZoom()), { duration: 0.45 })
  }, [location])

  useEffect(() => {
    const query = address.trim()
    if (query.length < 3) {
      setSuggestions([])
      setIsSearching(false)
      setSearchHint('')
      setActiveSuggestionIndex(-1)
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        setIsSearching(true)
        const results = await geocodeAddress(query, controller.signal)
        if (controller.signal.aborted) return

        setSuggestions(results)
        setActiveSuggestionIndex(results.length > 0 ? 0 : -1)
        if (results.length === 0) {
          setSearchHint('No results found. Try a more specific address.')
          if (!location && mapRef.current && markerRef.current) {
            mapRef.current.removeLayer(markerRef.current)
            markerRef.current = null
          }
          return
        }

        setSearchHint('Select a suggestion or press Enter to confirm location.')
        if (mapRef.current) {
          const first = results[0]
          const previewLat = Number(first.lat)
          const previewLng = Number(first.lon)
          mapRef.current.flyTo([previewLat, previewLng], getSearchZoom(query), { duration: 0.4 })
        }
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([])
          setSearchHint('Unable to search location right now.')
        }
      } finally {
        if (!controller.signal.aborted) setIsSearching(false)
      }
    }, 350)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [address, location])

  const selectSuggestion = item => {
    const nextLocation = { lat: Number(item.lat), lng: Number(item.lon) }
    onLocationSelect({ address: item.display_name, location: nextLocation })
    setShowSuggestions(false)
    setSuggestions([])
    setSearchHint('')
    setActiveSuggestionIndex(-1)
    if (mapRef.current) {
      mapRef.current.flyTo([nextLocation.lat, nextLocation.lng], getSearchZoom(item.display_name, true), {
        duration: 0.45,
      })
    }
  }

  const renderHighlightedAddress = (fullText, query) => {
    const q = query.trim()
    if (!q) return fullText
    const safeQuery = q.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')
    const regex = new RegExp(`(${safeQuery})`, 'ig')
    const parts = fullText.split(regex)
    return parts.map((part, index) =>
      index % 2 === 1 ? (
        <mark key={`${part}-${index}`} className="bg-red-100 text-red-700 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        <span key={`${part}-${index}`}>{part}</span>
      )
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <label htmlFor="event-location-address" className="block text-sm text-white/80 mb-2">Address</label>
        <div className="relative">
          <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-600" />
          <input
            id="event-location-address"
            name="address"
            type="text"
            value={address}
            onChange={e => {
              onAddressInput(e.target.value)
              setShowSuggestions(true)
              setActiveSuggestionIndex(-1)
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={e => {
              if (!showSuggestions) return

              if (e.key === 'ArrowDown' && suggestions.length > 0) {
                e.preventDefault()
                setActiveSuggestionIndex(prev => (prev + 1) % suggestions.length)
                return
              }

              if (e.key === 'ArrowUp' && suggestions.length > 0) {
                e.preventDefault()
                setActiveSuggestionIndex(prev => (prev <= 0 ? suggestions.length - 1 : prev - 1))
                return
              }

              if (e.key === 'Escape') {
                setShowSuggestions(false)
                return
              }

              if (e.key === 'Enter' && suggestions.length > 0) {
                e.preventDefault()
                const selected = suggestions[activeSuggestionIndex >= 0 ? activeSuggestionIndex : 0]
                selectSuggestion(selected)
              }
            }}
            placeholder="Search address"
            className="w-full rounded-lg border border-white/20 bg-white/10 pl-10 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500"
            required
            autoComplete="street-address"
          />
          {isSearching && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-yellow-600" />}
        </div>
        {showSuggestions && (isSearching || suggestions.length > 0 || searchHint) && (
          <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
            {isSearching && <p className="px-3 py-2 text-sm text-gray-500">Searching...</p>}
            {!isSearching && suggestions.length === 0 && searchHint && (
              <p className="px-3 py-2 text-sm text-gray-500">{searchHint}</p>
            )}
            {!isSearching &&
              suggestions.map((item, index) => (
                <button
                  key={`${item.place_id}-${item.lat}-${item.lon}`}
                  type="button"
                  onMouseEnter={() => setActiveSuggestionIndex(index)}
                  onClick={() => selectSuggestion(item)}
                  className={`w-full border-b border-gray-100 px-3 py-2 text-left text-sm transition-colors last:border-b-0 ${
                    activeSuggestionIndex === index ? 'bg-yellow-50 text-gray-900' : 'text-gray-800 hover:bg-gray-50'
                  }`}>
                  {renderHighlightedAddress(item.display_name, address)}
                </button>
              ))}
          </div>
        )}
      </div>

<div className="relative isolate z-0 rounded-2xl border border-white/20 shadow-sm overflow-hidden">
        <div ref={mapContainerRef} className="relative z-0 h-52 sm:h-64 md:h-72 w-full" />
      </div>
      {mapError && <p className="text-sm text-red-300">{mapError}</p>}
      <p className="text-xs text-white/65">Type partial or full address. Press Enter or choose a suggestion to pin exactly.</p>
    </div>
  )
}
