const PDFDocument = require('pdfkit');

/**
 * Professional PDF Generation Service
 */
const generatePerformanceReport = async (res, data) => {
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=farm_performance_report.pdf');

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('Rapport de Performance Gestock-Ferme', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Généré le : ${new Date().toLocaleDateString()}`, { align: 'right' });
    doc.moveDown();

    // Strategic KPIs
    doc.fontSize(16).text('Indicateurs Stratégiques', { underline: true });
    doc.moveDown(0.5);

    const kpis = data.kpis || {};
    doc.fontSize(12).text(`Taux de Mortalité : ${kpis.mortality_rate || 'N/A'}`);
    doc.text(`Chiffre d'Affaires : ${kpis.total_sales || 0} FCFA`);
    doc.text(`Indice de Consommation (FCR) : ${kpis.fcr || 'N/A'}`);
    doc.text(`ROI Moyen : ${kpis.roi || 'N/A'}%`);
    doc.text(`Productivité Main d'œuvre : ${kpis.labor_productivity || 'N/A'} FCFA/Employé`);

    doc.moveDown();

    // Sections
    if (data.sections) {
        data.sections.forEach(section => {
            doc.fontSize(16).text(section.title, { underline: true });
            doc.moveDown(0.5);
            section.items.forEach(item => {
                doc.fontSize(10).text(`${item.label}: ${item.value}`);
            });
            doc.moveDown();
        });
    }

    doc.end();
};

module.exports = { generatePerformanceReport };
