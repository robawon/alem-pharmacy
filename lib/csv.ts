import { AuditLogEntry } from "./types";

export function auditLogsToCsv(logs: AuditLogEntry[]): string {
  const header = ["timestamp", "action_type", "user_id", "user_role", "payload_delta"];
  const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;
  const rows = logs.map((l) =>
    [l.timestamp, l.action_type, l.user_id, l.user_role, l.payload_delta].map(escape).join(",")
  );
  return [header.join(","), ...rows].join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
