import React, { useState, useEffect, useCallback } from 'react';

function LivestockDetail({ user, batch, onBack }) {
  const [individuals, setIndividuals] = useState([]);
  const [healthRecords, setHealthRecords] = useState([]);
  const [feedingRecords, setFeedingRecords] = useState([]);
  const [slaughterRecords, setSlaughterRecords] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [activeTab, setActiveTab] = useState('individuals');

  const fetchBatchData = useCallback(async () => {
    try {
      const [indRes, healthRes, feedingRes, slaughterRes, perfRes] = await Promise.all([
        fetch(`/api/livestock/${batch.id}/individuals`, { headers: { 'X-User-ID': user?.id } }),
        fetch(`/api/livestock/${batch.id}/health`, { headers: { 'X-User-ID': user?.id } }),
        fetch(`/api/livestock/${batch.id}/feeding`, { headers: { 'X-User-ID': user?.id } }),
        fetch(`/api/livestock/${batch.id}/slaughter`, { headers: { 'X-User-ID': user?.id } }),
        fetch(`/api/livestock/${batch.id}/performance`, { headers: { 'X-User-ID': user?.id } })
      ]);

      const indData = await indRes.json();
      const healthData = await healthRes.json();
      const feedingData = await feedingRes.json();
      const slaughterData = await slaughterRes.json();
      const perfData = await perfRes.json();

      setIndividuals(Array.isArray(indData) ? indData : []);
      setHealthRecords(Array.isArray(healthData) ? healthData : []);
      setFeedingRecords(Array.isArray(feedingData) ? feedingData : []);
      setSlaughterRecords(Array.isArray(slaughterData) ? slaughterData : []);
      setPerformance(perfData.error ? null : perfData);
    } catch (err) {
      console.error("Error fetching batch details", err);
    }
  }, [batch.id]);

  useEffect(() => {
    fetchBatchData();
  }, [fetchBatchData]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'individuals':
        return (
          <div>
            <h3>Individus</h3>
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Sexe</th>
                  <th>Date Naissance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {individuals.map(ind => (
                  <tr key={ind.id}>
                    <td>{ind.identification_code}</td>
                    <td>{ind.gender}</td>
                    <td>{ind.birth_date}</td>
                    <td>{ind.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'health':
        return (
          <div>
            <h3>Suivi Sanitaire</h3>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Praticien</th>
                  <th>Lot Vaccin</th>
                  <th>Prochain Rappel</th>
                  <th>Coût</th>
                </tr>
              </thead>
              <tbody>
                {healthRecords.map(rec => (
                  <tr key={rec.id}>
                    <td>{rec.record_date}</td>
                    <td>{rec.type}</td>
                    <td>{rec.description}</td>
                    <td>{rec.practitioner}</td>
                    <td>{rec.vaccine_batch_number}</td>
                    <td>{rec.next_due_date}</td>
                    <td>{rec.cost} FCFA</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'feeding':
        return (
          <div>
            <h3>Alimentation</h3>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Aliment</th>
                  <th>Quantité</th>
                  <th>Coût</th>
                </tr>
              </thead>
              <tbody>
                {feedingRecords.map(rec => (
                  <tr key={rec.id}>
                    <td>{rec.record_date}</td>
                    <td>{rec.feed_type}</td>
                    <td>{rec.quantity} {rec.unit}</td>
                    <td>{rec.cost} FCFA</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'slaughter':
        return (
          <div>
            <h3>Abattage / Conformité</h3>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Lieu</th>
                  <th>Certificat</th>
                  <th>Inspecteur</th>
                  <th>Détails</th>
                </tr>
              </thead>
              <tbody>
                {slaughterRecords.map(rec => (
                  <tr key={rec.id}>
                    <td>{rec.slaughter_date}</td>
                    <td>{rec.location}</td>
                    <td>{rec.health_certificate_ref}</td>
                    <td>{rec.inspector_name}</td>
                    <td>{rec.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'performance':
        return (
          <div>
            <h3>Performances</h3>
            {performance && (
              <div className="performance-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px'}}>
                <div className="performance-card" style={{padding: '10px', border: '1px solid #ccc'}}>
                  <h5>GMQ</h5>
                  <p>{performance.gmq}</p>
                </div>
                <div className="performance-card" style={{padding: '10px', border: '1px solid #ccc'}}>
                  <h5>Indice de consommation</h5>
                  <p>{performance.feed_conversion}</p>
                </div>
                <div className="performance-card" style={{padding: '10px', border: '1px solid #ccc'}}>
                  <h5>Taux de mortalité</h5>
                  <p>{performance.mortality_rate}</p>
                </div>
                <div className="performance-card" style={{padding: '10px', border: '1px solid #ccc'}}>
                  <h5>Prolificité</h5>
                  <p>{performance.prolificity}</p>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="livestock-detail">
      <button onClick={onBack}>&larr; Retour</button>
      <h2>Détails du Lot: {batch.batch_name}</h2>

      <div className="tabs" style={{marginBottom: '20px'}}>
        <button onClick={() => setActiveTab('individuals')} style={{fontWeight: activeTab === 'individuals' ? 'bold' : 'normal'}}>Individus</button>
        <button onClick={() => setActiveTab('health')} style={{fontWeight: activeTab === 'health' ? 'bold' : 'normal'}}>Santé</button>
        <button onClick={() => setActiveTab('feeding')} style={{fontWeight: activeTab === 'feeding' ? 'bold' : 'normal'}}>Alimentation</button>
        <button onClick={() => setActiveTab('slaughter')} style={{fontWeight: activeTab === 'slaughter' ? 'bold' : 'normal'}}>Abattage</button>
        <button onClick={() => setActiveTab('performance')} style={{fontWeight: activeTab === 'performance' ? 'bold' : 'normal'}}>Performance</button>
      </div>

      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
}

export default LivestockDetail;
