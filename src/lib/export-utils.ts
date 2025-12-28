"use client";

/**
 * Export data to Excel (.xlsx) or CSV
 * Requires: npm install xlsx
 */

// Dynamically import xlsx to keep bundle size small
export async function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string,
  sheetName = "Sheet1"
) {
  const XLSX = await import("xlsx");
  
  // Flatten objects if needed
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Generate file
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export async function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string
) {
  const XLSX = await import("xlsx");
  
  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);
  
  // Download as file
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
}

/**
 * Simple JSON to PDF export (basic table layout)
 * For advanced PDF, use jspdf with autotable plugin
 */
export async function exportToPDF<T extends Record<string, any>>(
  data: T[],
  filename: string,
  title: string
) {
  // Dynamically import jspdf
  const { default: jsPDF } = await import("jspdf");
  // @ts-ignore - autotable extends jsPDF
  await import("jspdf-autotable");
  
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(16);
  doc.text(title, 14, 20);
  
  // Table
  if (data.length > 0) {
    const headers = Object.keys(data[0]);
    const rows = data.map(item => headers.map(h => String(item[h] ?? "")));
    
    // @ts-ignore
    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }, // Blue header
    });
  }
  
  doc.save(`${filename}.pdf`);
}

/**
 * Print-friendly table view
 */
export function printTable(elementId: string) {
  const content = document.getElementById(elementId);
  if (!content) return;
  
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f3f4f6; }
        @media print {
          button { display: none; }
        }
      </style>
    </head>
    <body>
      ${content.innerHTML}
      <script>window.print();</script>
    </body>
    </html>
  `);
  printWindow.document.close();
}
