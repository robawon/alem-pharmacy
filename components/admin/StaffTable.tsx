"use client";

import { Ban, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore } from "@/lib/store";
import { Role, StaffProfile } from "@/lib/types";

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "pharmacist", label: "Pharmacist" },
  { value: "cashier", label: "Cashier" },
  { value: "inventory", label: "Inventory Clerk" },
];

export function StaffTable({ staff }: { staff: StaffProfile[] }) {
  const { changeRole, toggleStaffStatus } = useStore();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {staff.map((s) => (
          <TableRow key={s.id}>
            <TableCell className="font-medium">{s.name}</TableCell>
            <TableCell className="text-muted">{s.email}</TableCell>
            <TableCell>
              <Select value={s.role} onValueChange={(v) => changeRole(s.id, v as Role)}>
                <SelectTrigger className="h-8 w-40 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <Badge variant={s.status === "active" ? "success" : "destructive"}>
                {s.status === "active" ? "Active" : "Suspended"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant={s.status === "active" ? "outline" : "success"}
                size="sm"
                className="gap-1.5"
                onClick={() => toggleStaffStatus(s.id)}
              >
                {s.status === "active" ? (
                  <>
                    <Ban className="h-3.5 w-3.5" /> Suspend
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Activate
                  </>
                )}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
