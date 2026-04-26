"use client";

import { Button } from "@/components/ui/Button";
import { Download } from "lucide-react";
import { exportReportCsv } from "@/actions/report";

interface ExportCsvButtonProps {
  params?: {
    companyId?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}

export function ExportCsvButton({ params }: ExportCsvButtonProps) {
  const handleExport = async () => {
    try {
      const blob = await exportReportCsv(params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bao-cao-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export CSV:", error);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="h-4 w-4 mr-2" />
      Xuất CSV
    </Button>
  );
}
