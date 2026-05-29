import React from 'react';

function PlotMap({ plots }) {
  return (
    <div className="plot-map-container" style={{ marginTop: '30px' }}>
      <h3>Cartographie des Parcelles (Simulation)</h3>
      <div
        style={{
          width: '100%',
          height: '400px',
          background: '#e0e0e0',
          position: 'relative',
          borderRadius: '8px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dashed #999'
        }}
      >
        <p style={{ color: '#666', zIndex: 1 }}>[ Interface de Carte Interactive ]</p>

        {/* Simulating plot markers based on GPS-like coordinates */}
        {plots && plots.filter(p => p.latitude && p.longitude).map(p => (
          <div
            key={p.id}
            title={`${p.name} (${p.area_hectares} ha)`}
            style={{
              position: 'absolute',
              // Very basic mapping of lat/long to % for visualization
              left: `${((parseFloat(p.longitude) % 1) * 100).toFixed(0)}%`,
              top: `${((parseFloat(p.latitude) % 1) * 100).toFixed(0)}%`,
              width: '20px',
              height: '20px',
              background: p.status === 'Disponible' ? '#4CAF50' : '#FF9800',
              borderRadius: '50%',
              border: '2px solid white',
              cursor: 'pointer'
            }}
          />
        ))}
      </div>
      <div style={{ marginTop: '10px', fontSize: '0.9em' }}>
        <span style={{ marginRight: '15px' }}><span style={{ color: '#4CAF50' }}>●</span> Disponible</span>
        <span><span style={{ color: '#FF9800' }}>●</span> Occupé / En jachère</span>
      </div>
    </div>
  );
}

export default PlotMap;
