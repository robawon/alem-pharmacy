"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { auditLogsToCsv, downloadCsv } from "@/lib/csv";

export function ExportAuditLogsButton() {
  const { auditLogs, exportAuditLogs } = useStore();

  function handleExport() {
    const csv = auditLogsToCsv(auditLogs);
    downloadCsv(`alem-pharmacy-audit-log-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    exportAuditLogs();
  }

  return (
    <Button variant="outline" className="gap-2" onClick={handleExport}>
      <Download className="h-4 w-4" />
      Export Audit Logs
    </Button>
  );
}
