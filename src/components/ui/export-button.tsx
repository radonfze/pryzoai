"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";

interface ExportButtonProps {
  data: any[];
  filename?: string;
  className?: string;
  label?: string;
}

export function ExportButton({ 
  data, 
  filename = "export", 
  className,
  label = "Export to Excel" 
}: ExportButtonProps) {
  
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert("No data to export");
      return;
    }

    // Flattens nested objects for better Excel output (optional simple flatten)
    const flattenedData = data.map(item => {
        const flat: any = {};
        Object.keys(item).forEach(key => {
            if (typeof item[key] === 'object' && item[key] !== null && !Array.isArray(item[key])) {
                // simple single level flatten
                 Object.keys(item[key]).forEach(subKey => {
                     flat[`${key}_${subKey}`] = item[key][subKey];
                 });
            } else {
                flat[key] = item[key];
            }
        });
        return flat;
    });

    const worksheet = XLSX.utils.json_to_sheet(flattenedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    
    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className={className} 
      onClick={handleExport}
    >
      <Download className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
