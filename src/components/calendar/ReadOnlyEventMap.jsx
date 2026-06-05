import React, { useRef, useEffect } from 'react'
import { loadLeaflet, geocodeAddress } from '../../lib/maps'

export default function ReadOnlyEventMap({ address, location }) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)

  useEffect(() => {
    let active = true

    const mountMap = async () => {
      if (!address) return
      try {
        const L = await loadLeaflet()
        if (!active || !L || !mapContainerRef.current || mapRef.current) return

        let resolvedLocation = location
        if (!resolvedLocation) {
          const results = await geocodeAddress(address)
          if (results.length > 0) {
            resolvedLocation = { lat: Number(results[0].lat), lng: Number(results[0].lon) }
          }
        }
        if (!resolvedLocation) return

        const map = L.map(mapContainerRef.current, {
          center: [resolvedLocation.lat, resolvedLocation.lng],
          zoom: 15,
          dragging: false,
          scrollWheelZoom: false,
          touchZoom: false,
          doubleClickZoom: false,
          boxZoom: false,
          keyboard: false,
          zoomControl: false,
        })

        map.getContainer().style.zIndex = '0'

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map)

        markerRef.current = L.marker([resolvedLocation.lat, resolvedLocation.lng]).addTo(map)
        mapRef.current = map

        // Ensure proper tile/layout sizing after expand animation and responsive layout settle.
        requestAnimationFrame(() => map.invalidateSize())
        setTimeout(() => map.invalidateSize(), 220)
      } catch {
        // ignore
      }
    }

    mountMap()

    return () => {
      active = false
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      markerRef.current = null
    }
  }, [address, location])

  if (!address) return null

  return (
    <div className="relative isolate z-0 w-full rounded-xl border border-gray-200 shadow-sm overflow-hidden bg-white">
      <div ref={mapContainerRef} className="relative z-0 w-full h-[280px] sm:h-[320px] md:h-[340px]" />
    </div>
  )
}
