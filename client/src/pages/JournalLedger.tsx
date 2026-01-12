import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPHP, formatDate } from "@/lib/currency";
import { Download, FileSpreadsheet, Receipt, CreditCard } from "lucide-react";

interface JournalEntry {
  id: number;
  type: "receipt" | "disbursement";
  voucherNumber: string;
  voucherDate: string;
  name: string;
  particulars: string;
  debit: string;
  credit: string;
}

interface JournalTotals {
  month: string;
  monthlyDebit: number;
  monthlyCredit: number;
  quarterlyDebit?: number;
  quarterlyCredit?: number;
  isQuarterEnd: boolean;
}

export default function JournalLedger() {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  const { data: entries, isLoading } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal-ledger", year],
    queryFn: () => fetch(`/api/journal-ledger?year=${year}`).then(res => res.json()),
    staleTime: 0,
    refetchOnMount: true,
  });

  const { data: totals } = useQuery<JournalTotals[]>({
    queryKey: ["/api/journal-ledger/totals", year],
    queryFn: () => fetch(`/api/journal-ledger/totals?year=${year}`).then(res => res.json()),
    staleTime: 0,
    refetchOnMount: true,
  });

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/export/excel?year=${year}`);
      if (!response.ok) throw new Error("Failed to download");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `LLAS-Workbook-${year}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Consolidated Journal-Ledger</h1>
          <p className="text-muted-foreground">
            Combined chronological view of all transactions
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-32" data-testid="select-year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2" onClick={handleDownload} data-testid="button-download-excel">
            <Download className="h-4 w-4" />
            Download Excel
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Transactions for {year}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : entries && entries.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Type</TableHead>
                    <TableHead>Voucher No.</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Particulars</TableHead>
                    <TableHead className="text-right">Debit (+)</TableHead>
                    <TableHead className="text-right">Credit (-)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={`${entry.type}-${entry.id}`} data-testid={`row-journal-${entry.type}-${entry.id}`}>
                      <TableCell>
                        {entry.type === "receipt" ? (
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                            <Receipt className="h-4 w-4 text-primary" />
                          </div>
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-destructive/10">
                            <CreditCard className="h-4 w-4 text-destructive" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{entry.voucherNumber}</TableCell>
                      <TableCell>{formatDate(entry.voucherDate)}</TableCell>
                      <TableCell>{entry.name}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{entry.particulars}</TableCell>
                      <TableCell className="text-right font-mono text-primary">
                        {parseFloat(entry.debit) > 0 ? formatPHP(entry.debit) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-destructive">
                        {parseFloat(entry.credit) > 0 ? formatPHP(entry.credit) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileSpreadsheet className="h-16 w-16 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No transactions found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create cash receipts or disbursements to see them here
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {totals && totals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly & Quarterly Totals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Debit Total</TableHead>
                    <TableHead className="text-right">Credit Total</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {totals.map((t, idx) => (
                    <>
                      <TableRow key={t.month} data-testid={`row-total-${t.month}`}>
                        <TableCell className="font-medium">{t.month}</TableCell>
                        <TableCell className="text-right font-mono text-primary">
                          {formatPHP(t.monthlyDebit)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-destructive">
                          {formatPHP(t.monthlyCredit)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatPHP(t.monthlyDebit - t.monthlyCredit)}
                        </TableCell>
                      </TableRow>
                      {t.isQuarterEnd && t.quarterlyDebit !== undefined && (
                        <TableRow key={`q-${idx}`} className="bg-muted/50 font-semibold">
                          <TableCell>
                            <Badge variant="secondary">Quarter {Math.ceil((idx + 1) / 3)}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-primary">
                            {formatPHP(t.quarterlyDebit)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-destructive">
                            {formatPHP(t.quarterlyCredit)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatPHP((t.quarterlyDebit || 0) - (t.quarterlyCredit || 0))}
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
