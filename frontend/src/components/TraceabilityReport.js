import React, { useState, useEffect } from 'react';

function TraceabilityReport() {
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/livestock')
      .then(res => res.json())
      .then(data => setBatches(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error fetching batches:', err));
  }, []);

  const fetchReport = (id) => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/reports/traceability/batch/${id}`)
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

  return (
    <div className="traceability-report">
      <h2>Traçabilité des Lots</h2>
      <div className="selection-form" style={{marginBottom: '20px'}}>
        <label>Sélectionner un lot : </label>
        <select
          value={selectedBatchId}
          onChange={(e) => {
            setSelectedBatchId(e.target.value);
            fetchReport(e.target.value);
          }}
        >
          <option value="">-- Choisir un lot --</option>
          {batches.map(b => (
            <option key={b.id} value={b.id}>{b.batch_name} ({b.species_name})</option>
          ))}
        </select>
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
    </div>
  );
}

export default TraceabilityReport;
