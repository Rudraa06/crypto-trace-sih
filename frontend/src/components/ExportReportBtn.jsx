import React, { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_BASE } from '../utils/constants.js';

export default function ExportReportBtn({ traceData }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!traceData) return;
    setLoading(true);

    try {
      // 1. Ask AI for the case brief
      const apiKey = import.meta.env.VITE_INTERNAL_API_KEY;
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) headers['X-API-Key'] = apiKey;

      const res = await fetch(`${API_BASE}/api/ai/generate-summary`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ traceData })
      });
      const aiResponse = await res.json();
      
      const doc = new jsPDF();
      let y = 20;

      // Header
      doc.setFontSize(10);
      doc.setTextColor(220, 38, 38);
      doc.text("CONFIDENTIAL - LAW ENFORCEMENT SENSITIVE", 14, y);
      y += 10;

      doc.setFontSize(22);
      doc.setTextColor(30, 64, 175); // Dark blue
      doc.text("BSA Section 63 Compliant Evidence Export", 14, y);
      y += 10;
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, y);
      y += 15;

      if (aiResponse.ok && aiResponse.brief) {
        const { executiveSummary, modusOperandi, cashOutEntity, subpoenaNotice } = aiResponse.brief;

        // Executive Summary
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("Executive Summary", 14, y);
        y += 6;
        doc.setFontSize(11);
        doc.setTextColor(50);
        const splitSummary = doc.splitTextToSize(executiveSummary, 180);
        doc.text(splitSummary, 14, y);
        y += splitSummary.length * 5 + 10;

        // Cash-Out Entity
        if (cashOutEntity) {
          doc.setFontSize(14);
          doc.setTextColor(220, 38, 38); // Red
          doc.text("Identified Cash-Out Point", 14, y);
          y += 6;
          doc.setFontSize(11);
          doc.setTextColor(0);
          doc.text(`Exchange: ${cashOutEntity.exchange}`, 14, y);
          y += 5;
          doc.text(`Deposit Address: ${cashOutEntity.depositAddress}`, 14, y);
          y += 5;
          doc.text(`Estimated Value: ${cashOutEntity.estimatedAmountUSD}`, 14, y);
          y += 10;
        }

        // Modus Operandi
        if (modusOperandi && modusOperandi.length > 0) {
          doc.setFontSize(14);
          doc.setTextColor(0);
          doc.text("Modus Operandi & Layering", 14, y);
          y += 6;
          doc.setFontSize(10);
          doc.setTextColor(50);
          modusOperandi.forEach((step, i) => {
            const splitStep = doc.splitTextToSize(`${i + 1}. ${step}`, 180);
            doc.text(splitStep, 14, y);
            y += splitStep.length * 5 + 2;
          });
          y += 8;
        }

        // Add a new page for Chain of Custody Table
        doc.addPage();
        y = 20;
      }

      // Chain of Custody Table
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text("Chain of Custody (Path Nodes)", 14, y);
      y += 5;

      const tableData = (traceData?.forceGraph?.nodes || []).map(n => [
        n.role.toUpperCase(),
        n.addressDisplay,
        n.hop || 0,
        n.riskScore ? `${n.riskScore}/100` : 'N/A',
        n.tags?.join(', ') || '-'
      ]);

      autoTable(doc, {
        startY: y,
        head: [['Role', 'Address', 'Hop', 'Risk Score', 'Tags']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [30, 64, 175] },
        styles: { fontSize: 9 }
      });

      // Subpoena Notice (if generated)
      if (aiResponse.ok && aiResponse.brief?.subpoenaNotice) {
        doc.addPage();
        y = 20;
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("Draft Subpoena / Preservation Notice", 14, y);
        y += 8;
        
        doc.setFontSize(10);
        doc.setFont("courier", "normal");
        const splitNotice = doc.splitTextToSize(aiResponse.brief.subpoenaNotice, 180);
        doc.text(splitNotice, 14, y);
      }

      doc.save('BSA_Section_63_Evidence.pdf');
    } catch (error) {
      if (!import.meta.env.PROD) console.error('Export failed', error);
      alert('Failed to generate export. Check console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="btn-liquid flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold tracking-wide uppercase transition-colors"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileText className="w-4 h-4" />
      )}
      {loading ? 'Generating Brief...' : 'Export Court PDF'}
    </button>
  );
}
