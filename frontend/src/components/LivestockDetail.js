import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';

function LivestockDetail({ user, batch, onBack }) {
  const [individuals, setIndividuals] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [locations, setLocations] = useState({ buildings: [], pens: [] });
  const [healthRecords, setHealthRecords] = useState([]);
  const [feedingRecords, setFeedingRecords] = useState([]);
  const [slaughterRecords, setSlaughterRecords] = useState([]);
  const [reproductionRecords, setReproductionRecords] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [activeTab, setActiveTab] = useState('individuals');
  const [showAddIndividual, setShowAddIndividual] = useState(false);
  const [newIndividual, setNewIndividual] = useState({
    identification_code: '',
    name: '',
    gender: 'Female',
    birth_date: '',
    breed_id: '',
    pen_id: '',
    provenance: '',
    status: 'Active'
  });

  const fetchBatchData = useCallback(async () => {
    try {
      const [indRes, healthRes, feedingRes, slaughterRes, perfRes, reproRes, breedRes, locRes, recRes, docRes] = await Promise.all([
        fetch(`/api/livestock/${batch.id}/individuals`, { headers: { 'X-User-ID': user?.id } }),
        fetch(`/api/livestock/${batch.id}/health`, { headers: { 'X-User-ID': user?.id } }),
        fetch(`/api/livestock/${batch.id}/feeding`, { headers: { 'X-User-ID': user?.id } }),
        fetch(`/api/livestock/${batch.id}/slaughter`, { headers: { 'X-User-ID': user?.id } }),
        fetch(`/api/livestock/${batch.id}/performance`, { headers: { 'X-User-ID': user?.id } }),
        fetch(`/api/livestock/${batch.id}/reproduction`, { headers: { 'X-User-ID': user?.id } }),
        fetch('/api/livestock/breeds', { headers: { 'X-User-ID': user?.id } }),
        fetch('/api/livestock/locations', { headers: { 'X-User-ID': user?.id } }),
        fetch(`/api/livestock/${batch.id}/recommendations`, { headers: { 'X-User-ID': user?.id } }),
        fetch(`/api/documents/Livestock/${batch.id}`, { headers: { 'X-User-ID': user?.id } })
      ]);

      const indData = await indRes.json();
      const healthData = await healthRes.json();
      const feedingData = await feedingRes.json();
      const slaughterData = await slaughterRes.json();
      const perfData = await perfRes.json();
      const reproData = await reproRes.json();
      const breedData = await breedRes.json();
      const locData = await locRes.json();

      setIndividuals(Array.isArray(indData) ? indData : []);
      setHealthRecords(Array.isArray(healthData) ? healthData : []);
      setFeedingRecords(Array.isArray(feedingData) ? feedingData : []);
      setSlaughterRecords(Array.isArray(slaughterData) ? slaughterData : []);
      setReproductionRecords(Array.isArray(reproData) ? reproData : []);
      setBreeds(Array.isArray(breedData) ? breedData : []);
      setLocations(locData);
      setPerformance(perfData.error ? null : perfData);
      const recData = await recRes.json();
      setRecommendations(Array.isArray(recData) ? recData : []);
      const docData = await docRes.json();
      setDocuments(Array.isArray(docData) ? docData : []);
    } catch (err) {
      console.error("Error fetching batch details", err);
    }
  }, [batch.id, user?.id]);

  useEffect(() => {
    fetchBatchData();
  }, [fetchBatchData]);

  const handleAddIndividual = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/livestock/individuals', {
        method: 'POST',
        headers: { 'X-User-ID': user?.id, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newIndividual, batch_id: batch.id })
      });
      if (response.ok) {
        fetchBatchData();
        setShowAddIndividual(false);
        setNewIndividual({
          identification_code: '',
          name: '',
          gender: 'Female',
          birth_date: '',
          breed_id: '',
          pen_id: '',
          provenance: '',
          status: 'Active'
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'individuals':
        return (
          <div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <h3>Individus</h3>
                <button onClick={() => setShowAddIndividual(!showAddIndividual)}>
                    {showAddIndividual ? 'Annuler' : 'Ajouter Individu'}
                </button>
            </div>

            {showAddIndividual && (
                <form onSubmit={handleAddIndividual} className="module-form" style={{marginBottom: '20px'}}>
                    <input type="text" placeholder="Code ID" value={newIndividual.identification_code} onChange={e => setNewIndividual({...newIndividual, identification_code: e.target.value})} required />
                    <input type="text" placeholder="Nom" value={newIndividual.name} onChange={e => setNewIndividual({...newIndividual, name: e.target.value})} />
                    <select value={newIndividual.gender} onChange={e => setNewIndividual({...newIndividual, gender: e.target.value})}>
                        <option value="Male">Mâle</option>
                        <option value="Female">Femelle</option>
                    </select>
                    <input type="date" value={newIndividual.birth_date} onChange={e => setNewIndividual({...newIndividual, birth_date: e.target.value})} required />
                    <select value={newIndividual.breed_id} onChange={e => setNewIndividual({...newIndividual, breed_id: e.target.value})}>
                        <option value="">Sélectionner une race</option>
                        {breeds.filter(b => b.species_id === batch.species_id).map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                    <select value={newIndividual.pen_id} onChange={e => setNewIndividual({...newIndividual, pen_id: e.target.value})}>
                        <option value="">Sélectionner un enclos</option>
                        {locations.pens.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <input type="text" placeholder="Provenance" value={newIndividual.provenance} onChange={e => setNewIndividual({...newIndividual, provenance: e.target.value})} />
                    <select value={newIndividual.status} onChange={e => setNewIndividual({...newIndividual, status: e.target.value})}>
                        <option value="Active">Actif</option>
                        <option value="Reproducteur">Reproducteur</option>
                        <option value="Engraissement">Engraissement</option>
                        <option value="Malade">Malade</option>
                        <option value="Réformé">Réformé</option>
                    </select>
                    <button type="submit">Enregistrer</button>
                </form>
            )}

            <table>
              <thead>
                <tr>
                  <th>ID / QR</th>
                  <th>Nom</th>
                  <th>Sexe</th>
                  <th>Date Naissance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {individuals.map(ind => (
                  <tr key={ind.id}>
                    <td>
                        <div style={{fontWeight: 'bold'}}>{ind.identification_code}</div>
                        <div style={{marginTop: '5px'}}>
                            <QRCodeSVG value={ind.identification_code} size={40} />
                        </div>
                    </td>
                    <td>{ind.name || '-'}</td>
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
      case 'reproduction':
          return (
            <div>
              <h3>Suivi de Reproduction</h3>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Événement</th>
                    <th>Partenaire</th>
                    <th>Date Mise Bas Prévue</th>
                    <th>Résultat</th>
                  </tr>
                </thead>
                <tbody>
                  {reproductionRecords.map(rec => (
                    <tr key={rec.id}>
                      <td>{rec.event_date}</td>
                      <td>{rec.event_type}</td>
                      <td>{rec.partner_id || '-'}</td>
                      <td>{rec.expected_birth_date || '-'}</td>
                      <td>{rec.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
      case 'documents':
          return (
              <div>
                  <h3>Gestion Documentaire</h3>
                  <table>
                      <thead>
                          <tr>
                              <th>Fichier</th>
                              <th>Type</th>
                              <th>Date</th>
                              <th>Notes</th>
                          </tr>
                      </thead>
                      <tbody>
                          {documents.map(doc => (
                              <tr key={doc.id}>
                                  <td><a href={doc.file_url} target="_blank" rel="noreferrer">{doc.file_name}</a></td>
                                  <td>{doc.document_type}</td>
                                  <td>{new Date(doc.uploaded_at).toLocaleDateString()}</td>
                                  <td>{doc.notes}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          );
      case 'performance':
        return (
          <div>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <h3>Performances & IA</h3>
                {recommendations.length > 0 && (
                    <div className="alerts-box" style={{background: '#fff4f4', padding: '10px', borderRadius: '8px', borderLeft: '4px solid #ef4444'}}>
                        <h4 style={{margin: 0, fontSize: '14px', color: '#ef4444'}}>Recommandations</h4>
                        <ul style={{margin: '5px 0 0 0', fontSize: '12px'}}>
                            {recommendations.map((r, i) => <li key={i}><strong>{r.type}:</strong> {r.reason}</li>)}
                        </ul>
                    </div>
                )}
            </div>
            {performance && (
              <div className="performance-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '15px'}}>
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
        <button onClick={() => setActiveTab('reproduction')} style={{fontWeight: activeTab === 'reproduction' ? 'bold' : 'normal'}}>Reproduction</button>
        <button onClick={() => setActiveTab('performance')} style={{fontWeight: activeTab === 'performance' ? 'bold' : 'normal'}}>Performance</button>
        <button onClick={() => setActiveTab('documents')} style={{fontWeight: activeTab === 'documents' ? 'bold' : 'normal'}}>Documents</button>
      </div>

      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
}

export default LivestockDetail;
