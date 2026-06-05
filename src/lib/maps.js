// Utilities for loading Leaflet and geocoding
let leafletLoaderPromise = null

export const loadLeaflet = () => {
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (window.L) return Promise.resolve(window.L)
  if (leafletLoaderPromise) return leafletLoaderPromise

  leafletLoaderPromise = new Promise((resolve, reject) => {
    if (!document.getElementById('leaflet-css-cdn')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css-cdn'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    const scriptExisting = document.getElementById('leaflet-js-cdn')
    if (scriptExisting && window.L) {
      resolve(window.L)
      return
    }

    if (!scriptExisting) {
      const script = document.createElement('script')
      script.id = 'leaflet-js-cdn'
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.async = true
      script.onload = () => resolve(window.L)
      script.onerror = () => reject(new Error('Failed to load Leaflet'))
      document.body.appendChild(script)
      return
    }

    scriptExisting.addEventListener('load', () => resolve(window.L))
    scriptExisting.addEventListener('error', () => reject(new Error('Failed to load Leaflet')))
  })

  return leafletLoaderPromise
}

export const geocodeAddress = async (query, signal) => {
  const PHILIPPINES_VIEWBOX = '116.8,21.3,126.6,4.5'
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&countrycodes=ph&bounded=1&viewbox=${PHILIPPINES_VIEWBOX}&q=${encodeURIComponent(query)}`,
    { signal }
  )
  if (!response.ok) throw new Error('Address search failed')
  const data = await response.json()
  return Array.isArray(data) ? data : []
}

export const reverseGeocode = async (lat, lng) => {
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
  if (!response.ok) throw new Error('Reverse geocode failed')
  const data = await response.json()
  return data?.display_name || ''
}

export const getSearchZoom = (query, selected = false) => {
  if (selected) return 16
  const normalized = query.trim()
  if (normalized.length >= 24) return 14
  if (normalized.length >= 12) return 13
  return 11
}
