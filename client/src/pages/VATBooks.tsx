import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Download, FileSpreadsheet, TrendingUp, TrendingDown } from "lucide-react";

interface VATSalesEntry {
  id: number;
  crn: string;
  voucherDate: string;
  invoiceNumber: string;
  invoiceDate: string;
  payorName: string;
  netAmount: string;
  vatAmount: string;
  grossAmount: string;
}

interface VATPurchaseEntry {
  id: number;
  cdn: string;
  voucherDate: string;
  supplierInvoiceNumber: string;
  supplierInvoiceDate: string;
  payeeName: string;
  netAmount: string;
  vatAmount: string;
  grossAmount: string;
}

interface VATTotals {
  month: string;
  outputVat: number;
  inputVat: number;
  netVat: number;
  isQuarterEnd: boolean;
  quarterlyOutput?: number;
  quarterlyInput?: number;
  quarterlyNet?: number;
}

export default function VATBooks() {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [activeTab, setActiveTab] = useState("sales");

  const queryClient = useQueryClient();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  const { data: salesEntries, isLoading: salesLoading } = useQuery<VATSalesEntry[]>({
    queryKey: ["/api/vat-sales-book", year],
    queryFn: () => fetch(`/api/vat-sales-book?year=${year}`).then(res => res.json()),
    staleTime: 0,
    refetchOnMount: true,
  });

  const { data: purchaseEntries, isLoading: purchaseLoading } = useQuery<VATPurchaseEntry[]>({
    queryKey: ["/api/vat-purchase-book", year],
    queryFn: () => fetch(`/api/vat-purchase-book?year=${year}`).then(res => res.json()),
    staleTime: 0,
    refetchOnMount: true,
  });

  const { data: totals } = useQuery<VATTotals[]>({
    queryKey: ["/api/vat-totals", year],
    queryFn: () => fetch(`/api/vat-totals?year=${year}`).then(res => res.json()),
    staleTime: 0,
    refetchOnMount: true,
  });

  // Refetch data when year changes
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/vat-sales-book", year] });
    queryClient.invalidateQueries({ queryKey: ["/api/vat-purchase-book", year] });
    queryClient.invalidateQueries({ queryKey: ["/api/vat-totals", year] });
  }, [year, queryClient]);

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

  const totalOutputVat = salesEntries?.reduce((sum, e) => sum + parseFloat(e.vatAmount || "0"), 0) || 0;
  const totalInputVat = purchaseEntries?.reduce((sum, e) => sum + parseFloat(e.vatAmount || "0"), 0) || 0;
  const netVatPayable = totalOutputVat - totalInputVat;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">VAT Books</h1>
          <p className="text-muted-foreground">
            VAT Sales and Purchase Books for BIR compliance
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

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Output VAT
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-semibold text-primary">
              {formatPHP(totalOutputVat)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Input VAT
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-semibold text-destructive">
              {formatPHP(totalInputVat)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net VAT Payable
            </CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className={`font-mono text-2xl font-semibold ${netVatPayable >= 0 ? "text-primary" : "text-destructive"}`}>
              {formatPHP(netVatPayable)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="sales" data-testid="tab-vat-sales">VAT Sales Book</TabsTrigger>
          <TabsTrigger value="purchases" data-testid="tab-vat-purchases">VAT Purchase Book</TabsTrigger>
          <TabsTrigger value="summary" data-testid="tab-vat-summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                VAT Sales Book (Output VAT)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {salesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : salesEntries && salesEntries.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>CRN</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Invoice No.</TableHead>
                        <TableHead>Invoice Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-right">Net Sales</TableHead>
                        <TableHead className="text-right">Output VAT</TableHead>
                        <TableHead className="text-right">Gross</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesEntries.map((entry) => (
                        <TableRow key={entry.id} data-testid={`row-vat-sales-${entry.id}`}>
                          <TableCell className="font-medium">{entry.crn}</TableCell>
                          <TableCell>{formatDate(entry.voucherDate)}</TableCell>
                          <TableCell>{entry.invoiceNumber || "-"}</TableCell>
                          <TableCell>{entry.invoiceDate ? formatDate(entry.invoiceDate) : "-"}</TableCell>
                          <TableCell>{entry.payorName}</TableCell>
                          <TableCell className="text-right font-mono">{formatPHP(entry.netAmount)}</TableCell>
                          <TableCell className="text-right font-mono text-primary">{formatPHP(entry.vatAmount)}</TableCell>
                          <TableCell className="text-right font-mono font-medium">{formatPHP(entry.grossAmount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileSpreadsheet className="h-16 w-16 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No vatable sales found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Create cash receipts with VAT to see them here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchases">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-destructive" />
                VAT Purchase Book (Input VAT)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {purchaseLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : purchaseEntries && purchaseEntries.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>CDN</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Supplier Inv.</TableHead>
                        <TableHead>Inv. Date</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead className="text-right">Net Purchase</TableHead>
                        <TableHead className="text-right">Input VAT</TableHead>
                        <TableHead className="text-right">Gross</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseEntries.map((entry) => (
                        <TableRow key={entry.id} data-testid={`row-vat-purchase-${entry.id}`}>
                          <TableCell className="font-medium">{entry.cdn}</TableCell>
                          <TableCell>{formatDate(entry.voucherDate)}</TableCell>
                          <TableCell>{entry.supplierInvoiceNumber || "-"}</TableCell>
                          <TableCell>{entry.supplierInvoiceDate ? formatDate(entry.supplierInvoiceDate) : "-"}</TableCell>
                          <TableCell>{entry.payeeName}</TableCell>
                          <TableCell className="text-right font-mono">{formatPHP(entry.netAmount)}</TableCell>
                          <TableCell className="text-right font-mono text-destructive">{formatPHP(entry.vatAmount)}</TableCell>
                          <TableCell className="text-right font-mono font-medium">{formatPHP(entry.grossAmount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileSpreadsheet className="h-16 w-16 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No vatable purchases found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Create cash disbursements with input VAT to see them here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Monthly VAT Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {totals && totals.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead className="text-right">Output VAT</TableHead>
                        <TableHead className="text-right">Input VAT</TableHead>
                        <TableHead className="text-right">Net Payable</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {totals.map((t, idx) => (
                        <React.Fragment key={`month-${idx}`}>
                          <TableRow>
                            <TableCell className="font-medium">{t.month}</TableCell>
                            <TableCell className="text-right font-mono text-primary">
                              {formatPHP(t.outputVat)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-destructive">
                              {formatPHP(t.inputVat)}
                            </TableCell>
                            <TableCell className={`text-right font-mono ${t.netVat >= 0 ? "text-primary" : "text-destructive"}`}>
                              {formatPHP(t.netVat)}
                            </TableCell>
                          </TableRow>
                          {t.isQuarterEnd && t.quarterlyOutput !== undefined && (
                            <TableRow className="bg-muted/50 font-semibold">
                              <TableCell>
                                <Badge variant="secondary">Quarter {Math.ceil((idx + 1) / 3)}</Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono text-primary">
                                {formatPHP(t.quarterlyOutput)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-destructive">
                                {formatPHP(t.quarterlyInput)}
                              </TableCell>
                              <TableCell className={`text-right font-mono ${(t.quarterlyNet || 0) >= 0 ? "text-primary" : "text-destructive"}`}>
                                {formatPHP(t.quarterlyNet)}
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileSpreadsheet className="h-16 w-16 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No VAT data available</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Create VAT transactions to see the summary
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
