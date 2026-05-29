import React, { useState, useEffect } from 'react';

function TraceabilityReport({ user }) {
  const [batches, setBatches] = useState([]);
  const [cropCycles, setCropCycles] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedCycleId, setSelectedCycleId] = useState('');
  const [report, setReport] = useState(null);
  const [cropReport, setCropReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/livestock', { headers: { 'X-User-ID': user?.id } })
      .then(res => res.json())
      .then(data => setBatches(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error fetching batches:', err));

    fetch('/api/crops', { headers: { 'X-User-ID': user?.id } })
      .then(res => res.json())
      .then(data => setCropCycles(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error fetching crops:', err));
  }, []);

  const fetchReport = (id) => {
    if (!id) return;
    setLoading(true);
    setCropReport(null);
    fetch(`/api/reports/traceability/batch/${id}`, { headers: { 'X-User-ID': user?.id } })
      .then(res => res.json())
      .then(data => {
        setReport(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching traceability report:', err);
        setLoading(false);
      });
  };

  const fetchCropReport = (id) => {
    if (!id) return;
    setLoading(true);
    setReport(null);
    // Assuming backend endpoint exists or we use a more generic one
    fetch(`/api/crops/${id}`, { headers: { 'X-User-ID': user?.id } })
      .then(res => res.json())
      .then(cycle => {
        // Fetch tasks and sales related to the harvested batch
        Promise.all([
            fetch(`/api/crops/${id}/tasks`, { headers: { 'X-User-ID': user?.id } }).then(r => r.json()),
            cycle.harvest_batch_id ? fetch(`/api/reports/export/stock`, { headers: { 'X-User-ID': user?.id } }).then(r => r.json()) : Promise.resolve([])
        ]).then(([tasks, stock]) => {
            setCropReport({ cycle, tasks });
            setLoading(false);
        });
      })
      .catch(err => {
        console.error('Error fetching crop report:', err);
        setLoading(false);
      });
  };

  return (
    <div className="traceability-report">
      <h2>Traçabilité Complète (Élevage & Cultures)</h2>

      <div className="selection-container" style={{display: 'flex', gap: '20px', marginBottom: '20px'}}>
          <div className="selection-form">
            <label>Lot Élevage : </label>
            <select
              value={selectedBatchId}
              onChange={(e) => {
                setSelectedBatchId(e.target.value);
                setSelectedCycleId('');
                fetchReport(e.target.value);
              }}
            >
              <option value="">-- Choisir un lot --</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.batch_name} ({b.species_name})</option>
              ))}
            </select>
          </div>

          <div className="selection-form">
            <label>Cycle de Culture : </label>
            <select
              value={selectedCycleId}
              onChange={(e) => {
                setSelectedCycleId(e.target.value);
                setSelectedBatchId('');
                fetchCropReport(e.target.value);
              }}
            >
              <option value="">-- Choisir une culture --</option>
              {cropCycles.map(c => (
                <option key={c.id} value={c.id}>{c.crop_name} - {c.plot_name} ({c.planting_date})</option>
              ))}
            </select>
          </div>
      </div>

      {loading && <div>Génération du rapport...</div>}

      {report && (
        <div className="report-content">
          <section>
            <h3>Informations du Lot</h3>
            <p><strong>Nom:</strong> {report.batch.batch_name}</p>
            <p><strong>Espèce:</strong> {report.batch.species_name}</p>
            <p><strong>Date d'arrivée:</strong> {report.batch.arrival_date}</p>
            <p><strong>Effectif initial:</strong> {report.batch.initial_count}</p>
            <p><strong>Status actuel:</strong> {report.batch.status}</p>
          </section>

          <section>
            <h3>Parcours Sanitaire</h3>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Praticien</th>
                  <th>Lot Vaccin</th>
                </tr>
              </thead>
              <tbody>
                {report.history.health.map(h => (
                  <tr key={h.id}>
                    <td>{h.record_date}</td>
                    <td>{h.type}</td>
                    <td>{h.description}</td>
                    <td>{h.practitioner}</td>
                    <td>{h.vaccine_batch_number}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h3>Abattage / Conformité</h3>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Lieu</th>
                  <th>Certificat</th>
                  <th>Inspecteur</th>
                </tr>
              </thead>
              <tbody>
                {report.history.slaughter.map(s => (
                  <tr key={s.id}>
                    <td>{s.slaughter_date}</td>
                    <td>{s.location}</td>
                    <td>{s.health_certificate_ref}</td>
                    <td>{s.inspector_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h3>Sortie / Vente</h3>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Réf. Facture</th>
                  <th>Quantité</th>
                  <th>Statut Livraison</th>
                </tr>
              </thead>
              <tbody>
                {report.history.sales.map(s => (
                  <tr key={s.id}>
                    <td>{s.sale_date}</td>
                    <td>{s.reference_number}</td>
                    <td>{s.quantity}</td>
                    <td>{s.delivery_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}

      {cropReport && (
          <div className="report-content">
              <section>
                <h3>Informations de la Culture</h3>
                <p><strong>Produit:</strong> {cropReport.cycle.crop_name}</p>
                <p><strong>Parcelle:</strong> {cropReport.cycle.plot_name}</p>
                <p><strong>Date de semis:</strong> {cropReport.cycle.planting_date}</p>
                <p><strong>Date de récolte:</strong> {cropReport.cycle.harvest_date}</p>
                <p><strong>Rendement:</strong> {cropReport.cycle.actual_yield} kg</p>
                <p><strong>Batch ID Stock:</strong> {cropReport.cycle.harvest_batch_id || 'Non récolté'}</p>
              </section>

              <section>
                <h3>Interventions & Intrants</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Tâche</th>
                      <th>Description</th>
                      <th>Coût</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cropReport.tasks.map(t => (
                      <tr key={t.id}>
                        <td>{t.task_date}</td>
                        <td>{t.task_type}</td>
                        <td>{t.description}</td>
                        <td>{t.cost} FCFA</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
          </div>
      )}
    </div>
  );
}

export default TraceabilityReport;
