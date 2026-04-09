import { useMemo, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '400px',
  borderRadius: '0.75rem'
};

const defaultCenter = {
  lat: 13.0827,
  lng: 80.2707
};

function getNormalizedStatus(status) {
  return String(status || '').trim().toLowerCase();
}

function getMarkerIcon(status) {
  const normalizedStatus = getNormalizedStatus(status);

  if (normalizedStatus === 'resolved') {
    return 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
  }

  if (normalizedStatus === 'in progress' || normalizedStatus === 'in_progress') {
    return 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';
  }

  if (normalizedStatus === 'closed') {
    return 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png';
  }

  if (normalizedStatus === 'rejected') {
    return 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
  }

  return 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
}

function getStatusBadgeClass(status) {
  const normalizedStatus = getNormalizedStatus(status);

  if (normalizedStatus === 'resolved') return 'bg-green-500';
  if (normalizedStatus === 'in progress' || normalizedStatus === 'in_progress') return 'bg-blue-500';
  if (normalizedStatus === 'rejected') return 'bg-red-500';

  return 'bg-yellow-500';
}

export default function MapComponent({ complaints }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyA9Ql4W6X35d1clBvk5vtP0C9u7OYUjPw'
  });

  const [activeMarker, setActiveMarker] = useState(null);

  const center = useMemo(() => {
    if (complaints && complaints.length > 0) {
      const validComplaints = complaints.filter((complaint) => complaint.latitude && complaint.longitude);

      if (validComplaints.length > 0) {
        const avgLat = validComplaints.reduce((sum, complaint) => sum + Number(complaint.latitude), 0) / validComplaints.length;
        const avgLng = validComplaints.reduce((sum, complaint) => sum + Number(complaint.longitude), 0) / validComplaints.length;
        return { lat: avgLat, lng: avgLng };
      }
    }

    return defaultCenter;
  }, [complaints]);

  if (!isLoaded) {
    return (
      <div className="w-full h-full min-h-[400px] flex justify-center items-center bg-dark-bg/50 border border-white/5 rounded-xl">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[400px] z-0 rounded-xl overflow-hidden shadow-inner border border-white/10 filter brightness-90 hover:brightness-100 transition-all duration-500">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={12}
        options={{
          styles: [
            { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
            { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] }
          ],
          disableDefaultUI: true,
          zoomControl: true
        }}
      >
        {complaints?.map((complaint) => {
          if (!complaint.latitude || !complaint.longitude) return null;

          return (
            <Marker
              key={complaint.id}
              position={{ lat: Number(complaint.latitude), lng: Number(complaint.longitude) }}
              onClick={() => setActiveMarker(complaint)}
              icon={{ url: getMarkerIcon(complaint.status) }}
            />
          );
        })}

        {activeMarker && (
          <InfoWindow
            position={{ lat: Number(activeMarker.latitude), lng: Number(activeMarker.longitude) }}
            onCloseClick={() => setActiveMarker(null)}
          >
            <div className="text-gray-900 min-w-[200px] p-2">
              <h3 className="font-bold text-sm mb-1">{activeMarker.title}</h3>
              <div className="text-xs mb-2 text-gray-600 capitalize">
                {activeMarker.category} / <span className={`font-semibold ${
                  activeMarker.priority === 'critical' ? 'text-red-600' : 'text-orange-500'
                }`}>{activeMarker.priority}</span>
              </div>
              <div className="mt-2 text-xs">
                <span className={`inline-block px-2 py-1 rounded text-white font-medium ${getStatusBadgeClass(activeMarker.status)}`}>
                  {String(activeMarker.status || 'Pending').replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <a
                href={`/complaint/${activeMarker.id}`}
                className="block mt-3 text-center w-full py-1.5 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 transition"
              >
                View Details
              </a>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
