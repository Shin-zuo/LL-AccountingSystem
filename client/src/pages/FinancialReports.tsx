import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { formatPHP } from "@/lib/currency";
import { Download, FileSpreadsheet, BarChart3, TrendingUp, TrendingDown, DollarSign, Calculator, Save, Plus, Trash2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { usePermissions } from "@/hooks/usePermissions";
import type { TaxSettings, McitCredit, NolcoEntry, FinalWithholdingIncome } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

interface FinancialRow {
  accountCode: string;
  accountName: string;
  jan: number;
  feb: number;
  mar: number;
  q1: number;
  apr: number;
  may: number;
  jun: number;
  q2: number;
  jul: number;
  aug: number;
  sep: number;
  q3: number;
  oct: number;
  nov: number;
  dec: number;
  q4: number;
  annual: number;
}

interface FinancialSummary {
  totalRevenue: number;
  totalCost: number;
  totalExpenses: number;
  grossProfit: number;
  netIncome: number;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

interface TaxCalculation {
  grossIncome: number;
  taxableIncome: number;
  regularTax: number;
  mcit: number;
  taxDue: number;
  isMcitApplied: boolean;
  excessMcit: number;
  availableNolco: number;
  availableMcitCredits: number;
  otherCredits: number;
  totalCredits: number;
  finalTaxDue: number;
}

export default function FinancialReports() {
  const { checkPermission } = usePermissions();

  // Check if user has permission to access financial reports
  const hasFinancialReportsPermission = checkPermission("financialReports");

  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [activeTab, setActiveTab] = useState("pnl");
  const [incomeTaxRate, setIncomeTaxRate] = useState("25");
  const [mcitRate, setMcitRate] = useState("2");
  const [taxCredits, setTaxCredits] = useState("0");
  const [mcitDialogOpen, setMcitDialogOpen] = useState(false);
  const [nolcoDialogOpen, setNolcoDialogOpen] = useState(false);
  const [fwtDialogOpen, setFwtDialogOpen] = useState(false);
  const [newMcitYear, setNewMcitYear] = useState(new Date().getFullYear().toString());
  const [newMcitAmount, setNewMcitAmount] = useState("");
  const [newNolcoYear, setNewNolcoYear] = useState(new Date().getFullYear().toString());
  const [newNolcoAmount, setNewNolcoAmount] = useState("");
  const [newFwtYear, setNewFwtYear] = useState(new Date().getFullYear().toString());
  const [newFwtQuarter, setNewFwtQuarter] = useState("");
  const [newFwtType, setNewFwtType] = useState("bank_interest");
  const [newFwtGross, setNewFwtGross] = useState("");
  const [newFwtTax, setNewFwtTax] = useState("");
  const { toast } = useToast();
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  const { data: pnlData, isLoading: pnlLoading, isError: pnlError } = useQuery<FinancialRow[]>({
    queryKey: ["/api/reports/profit-loss", year],
  });

  const { data: bsData, isLoading: bsLoading, isError: bsError } = useQuery<FinancialRow[]>({
    queryKey: ["/api/reports/balance-sheet", year],
  });

  const { data: summary } = useQuery<FinancialSummary>({
    queryKey: ["/api/reports/summary", year],
  });

  const { data: taxSettings } = useQuery<TaxSettings | { taxYear: number; taxRate: string; mcitRate: string; creditsAvailable?: string }>({
    queryKey: ["/api/tax-settings", year],
  });

  useEffect(() => {
    if (taxSettings) {
      setIncomeTaxRate(taxSettings.taxRate ?? "25");
      setMcitRate(taxSettings.mcitRate ?? "2");
      if ("creditsAvailable" in taxSettings) {
        setTaxCredits(taxSettings.creditsAvailable ?? "0");
      }
    }
  }, [taxSettings]);

  const { data: mcitCredits } = useQuery<McitCredit[]>({
    queryKey: ["/api/mcit-credits"],
  });

  const { data: nolcoEntries } = useQuery<NolcoEntry[]>({
    queryKey: ["/api/nolco"],
  });

  const { data: finalWithholdingIncomes } = useQuery<FinalWithholdingIncome[]>({
    queryKey: ["/api/final-withholding-income"],
  });

  const saveTaxSettingsMutation = useMutation({
    mutationFn: async (settings: { taxYear: number; taxRate: string; mcitRate: string; creditsAvailable?: string }) => {
      return apiRequest("POST", "/api/tax-settings", settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tax-settings", year] });
      toast({ title: "Tax settings saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save tax settings", variant: "destructive" });
    },
  });

  const createMcitMutation = useMutation({
    mutationFn: async (data: { taxYear: number; excessAmount: string }) => {
      return apiRequest("POST", "/api/mcit-credits", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mcit-credits"] });
      setMcitDialogOpen(false);
      setNewMcitAmount("");
      toast({ title: "MCIT credit added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add MCIT credit", variant: "destructive" });
    },
  });

  const deleteMcitMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/mcit-credits/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mcit-credits"] });
      toast({ title: "MCIT credit deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete MCIT credit", variant: "destructive" });
    },
  });

  const createNolcoMutation = useMutation({
    mutationFn: async (data: { lossYear: number; originalAmount: string }) => {
      return apiRequest("POST", "/api/nolco", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nolco"] });
      setNolcoDialogOpen(false);
      setNewNolcoAmount("");
      toast({ title: "NOLCO entry added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add NOLCO entry", variant: "destructive" });
    },
  });

  const deleteNolcoMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/nolco/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nolco"] });
      toast({ title: "NOLCO entry deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete NOLCO entry", variant: "destructive" });
    },
  });

  const createFwtMutation = useMutation({
    mutationFn: async (data: { taxYear: number; quarter?: number; incomeType: string; grossAmount: string; taxWithheld: string }) => {
      return apiRequest("POST", "/api/final-withholding-income", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/final-withholding-income"] });
      setFwtDialogOpen(false);
      setNewFwtYear(new Date().getFullYear().toString());
      setNewFwtQuarter("");
      setNewFwtType("bank_interest");
      setNewFwtGross("");
      setNewFwtTax("");
      toast({ title: "Final withholding income added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add final withholding income", variant: "destructive" });
    },
  });

  const deleteFwtMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/final-withholding-income/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/final-withholding-income"] });
      toast({ title: "Final withholding income deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete final withholding income", variant: "destructive" });
    },
  });

  const incomeTypeLabels: Record<string, string> = {
    bank_interest: "Bank Interest",
    dividends: "Dividends",
    royalties: "Royalties",
    prizes: "Prizes & Winnings",
    other: "Other Passive Income",
  };

  const taxCalculation: TaxCalculation = useMemo(() => {
    const grossIncome = (summary?.totalRevenue || 0) - (summary?.totalCost || 0);
    const availableNolco = nolcoEntries?.filter(n => parseInt(n.expiryYear.toString()) >= parseInt(year)).reduce((sum, n) => sum + parseFloat(n.remainingAmount || "0"), 0) || 0;
    const taxableIncome = Math.max(0, grossIncome - (summary?.totalExpenses || 0) - availableNolco);
    const rate = parseFloat(incomeTaxRate) / 100;
    const mcitRateVal = parseFloat(mcitRate) / 100;
    const regularTax = Math.max(0, taxableIncome * rate);
    const mcit = grossIncome * mcitRateVal;
    const taxDue = Math.max(regularTax, mcit);
    const isMcitApplied = mcit > regularTax;
    const excessMcit = isMcitApplied ? 0 : mcit;
    const availableMcitCredits = mcitCredits?.filter(c => parseInt(c.expiryYear.toString()) >= parseInt(year)).reduce((sum, c) => sum + parseFloat(c.remainingAmount || "0"), 0) || 0;
    const otherCredits = parseFloat(taxCredits) || 0;
    const totalCredits = availableMcitCredits + otherCredits;
    const finalTaxDue = Math.max(0, taxDue - totalCredits);

    return {
      grossIncome,
      taxableIncome,
      regularTax,
      mcit,
      taxDue,
      isMcitApplied,
      excessMcit,
      availableNolco,
      availableMcitCredits,
      otherCredits,
      totalCredits,
      finalTaxDue,
    };
  }, [summary, incomeTaxRate, mcitRate, taxCredits, mcitCredits, nolcoEntries, year]);

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

  const months = ["Jan", "Feb", "Mar", "Q1", "Apr", "May", "Jun", "Q2", "Jul", "Aug", "Sep", "Q3", "Oct", "Nov", "Dec", "Q4", "Annual"];

  // If user doesn't have permission, show access denied message
  if (!hasFinancialReportsPermission) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-4">
          You don't have permission to access financial reports.
        </p>
        <p className="text-sm text-muted-foreground">
          Contact your administrator to request access to financial reports.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Financial Reports</h1>
          <p className="text-muted-foreground">
            Profit & Loss and Balance Sheet reports
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="font-mono text-xl font-semibold text-primary" data-testid="text-total-revenue">
              {formatPHP(summary?.totalRevenue || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cost of Sales
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <p className="font-mono text-xl font-semibold text-amber-600" data-testid="text-total-cost">
              {formatPHP(summary?.totalCost || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gross Profit
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className={`font-mono text-xl font-semibold ${(summary?.grossProfit || 0) >= 0 ? "text-primary" : "text-destructive"}`} data-testid="text-gross-profit">
              {formatPHP(summary?.grossProfit || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Operating Expenses
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <p className="font-mono text-xl font-semibold text-destructive" data-testid="text-total-expenses">
              {formatPHP(summary?.totalExpenses || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Income
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className={`font-mono text-xl font-semibold ${(summary?.netIncome || 0) >= 0 ? "text-primary" : "text-destructive"}`} data-testid="text-net-income">
              {formatPHP(summary?.netIncome || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Equity
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="font-mono text-xl font-semibold" data-testid="text-total-equity">
              {formatPHP(summary?.totalEquity || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pnl" data-testid="tab-profit-loss">Profit & Loss</TabsTrigger>
          <TabsTrigger value="bs" data-testid="tab-balance-sheet">Balance Sheet</TabsTrigger>
          <TabsTrigger value="tax" data-testid="tab-tax-computation">Tax Computation</TabsTrigger>
        </TabsList>

        <TabsContent value="pnl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Profit & Loss Statement - {year}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pnlLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : pnlError ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-16 w-16 text-destructive" />
                  <h3 className="mt-4 text-lg font-medium">Error loading P&L data</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Failed to load profit & loss data. Please try again.
                  </p>
                </div>
              ) : pnlData && pnlData.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-background">Account</TableHead>
                        {months.map((m) => (
                          <TableHead key={m} className={`text-right ${m.startsWith("Q") || m === "Annual" ? "bg-muted/50 font-semibold" : ""}`}>
                            {m}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pnlData.map((row) => (
                        <TableRow key={row.accountCode}>
                          <TableCell className="sticky left-0 bg-background font-medium">
                            <div>
                              <span className="font-mono text-xs text-muted-foreground">{row.accountCode}</span>
                              <p>{row.accountName}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono">{formatPHP(row.jan)}</TableCell>
                          <TableCell className="text-right font-mono">{formatPHP(row.feb)}</TableCell>
                          <TableCell className="text-right font-mono">{formatPHP(row.mar)}</TableCell>
                          <TableCell className="text-right font-mono bg-muted/50 font-semibold">{formatPHP(row.q1)}</TableCell>
                          <TableCell className="text-right font-mono">{formatPHP(row.apr)}</TableCell>
                          <TableCell className="text-right font-mono">{formatPHP(row.may)}</TableCell>
                          <TableCell className="text-right font-mono">{formatPHP(row.jun)}</TableCell>
                          <TableCell className="text-right font-mono bg-muted/50 font-semibold">{formatPHP(row.q2)}</TableCell>
                          <TableCell className="text-right font-mono">{formatPHP(row.jul)}</TableCell>
                          <TableCell className="text-right font-mono">{formatPHP(row.aug)}</TableCell>
                          <TableCell className="text-right font-mono">{formatPHP(row.sep)}</TableCell>
                          <TableCell className="text-right font-mono bg-muted/50 font-semibold">{formatPHP(row.q3)}</TableCell>
                          <TableCell className="text-right font-mono">{formatPHP(row.oct)}</TableCell>
                          <TableCell className="text-right font-mono">{formatPHP(row.nov)}</TableCell>
                          <TableCell className="text-right font-mono">{formatPHP(row.dec)}</TableCell>
                          <TableCell className="text-right font-mono bg-muted/50 font-semibold">{formatPHP(row.q4)}</TableCell>
                          <TableCell className="text-right font-mono bg-primary/10 font-bold">{formatPHP(row.annual)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileSpreadsheet className="h-16 w-16 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No P&L data available</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Create revenue and expense transactions to generate reports
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Balance Sheet - {year}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : bsError ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-16 w-16 text-destructive" />
                  <h3 className="mt-4 text-lg font-medium">Error loading balance sheet data</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Failed to load balance sheet data. Please try again.
                  </p>
                </div>
              ) : bsData && bsData.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-background">Account</TableHead>
                        {months.map((m) => (
                          <TableHead key={m} className={`text-right ${m.startsWith("Q") || m === "Annual" ? "bg-muted/50 font-semibold" : ""}`}>
                            {m}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bsData.map((row) => (
                        <TableRow key={row.accountCode}>
                          <TableCell className="sticky left-0 bg-background font-medium">
                            <div>
                              <span className="font-mono text-xs text-muted-foreground">{row.accountCode}</span>
                              <p>{row.accountName}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono">{formatPHP(row.jan)}</TableCell>
                          <TableCell className="text-right font-mono">{formatPHP(row.feb)}</TableCell>
                          <TableCell className="text-right font-mono">{formatPHP(row.mar)}</TableCell>
                          <TableCell className="text-right font-mono bg-muted/50 font-semibold">{formatPHP(row.q1)}</TableCell>
                          <TableCell className="text-right font-mono">{formatPHP(row.apr)}</TableCell>
                          <TableCell className="text-right font-mono">{formatPHP(row.may)}</TableCell>
                          <TableCell className="text-right font-mono">{formatPHP(row.jun)}</TableCell>
                          <TableCell className="text-right font-mono bg-muted/50 font-semibold">{formatPHP(row.q2)}</TableCell>
                          <TableCell className="text-right font-mono">{formatPHP(row.jul)}</TableCell>
                          <TableCell className="text-right font-mono">{formatPHP(row.aug)}</TableCell>
                          <TableCell className="text-right font-mono">{formatPHP(row.sep)}</TableCell>
                          <TableCell className="text-right font-mono bg-muted/50 font-semibold">{formatPHP(row.q3)}</TableCell>
                          <TableCell className="text-right font-mono">{formatPHP(row.oct)}</TableCell>
                          <TableCell className="text-right font-mono">{formatPHP(row.nov)}</TableCell>
                          <TableCell className="text-right font-mono">{formatPHP(row.dec)}</TableCell>
                          <TableCell className="text-right font-mono bg-muted/50 font-semibold">{formatPHP(row.q4)}</TableCell>
                          <TableCell className="text-right font-mono bg-primary/10 font-bold">{formatPHP(row.annual)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileSpreadsheet className="h-16 w-16 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No balance sheet data available</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Create asset and liability transactions to generate reports
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Tax Settings - {year}
                </CardTitle>
                <CardDescription>Configure tax rates for BIR compliance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="income-tax-rate">Income Tax Rate (%)</Label>
                    <Input
                      id="income-tax-rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={incomeTaxRate}
                      onChange={(e) => setIncomeTaxRate(e.target.value)}
                      data-testid="input-income-tax-rate"
                    />
                    <p className="text-xs text-muted-foreground">Standard corporate rate: 25%</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mcit-rate">MCIT Rate (%)</Label>
                    <Input
                      id="mcit-rate"
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      value={mcitRate}
                      onChange={(e) => setMcitRate(e.target.value)}
                      data-testid="input-mcit-rate"
                    />
                    <p className="text-xs text-muted-foreground">Minimum Corporate Income Tax: 2%</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax-credits">Other Tax Credits (PHP)</Label>
                  <Input
                    id="tax-credits"
                    type="number"
                    min="0"
                    step="0.01"
                    value={taxCredits}
                    onChange={(e) => setTaxCredits(e.target.value)}
                    data-testid="input-tax-credits"
                  />
                  <p className="text-xs text-muted-foreground">Creditable withholding taxes and other credits</p>
                </div>
                <Button
                  onClick={() => saveTaxSettingsMutation.mutate({
                    taxYear: parseInt(year),
                    taxRate: incomeTaxRate,
                    mcitRate,
                    creditsAvailable: taxCredits,
                  })}
                  disabled={saveTaxSettingsMutation.isPending}
                  className="gap-2"
                  data-testid="button-save-tax-settings"
                >
                  <Save className="h-4 w-4" />
                  Save Tax Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tax Computation Summary</CardTitle>
                <CardDescription>Based on {year} financial data</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Gross Revenue</TableCell>
                      <TableCell className="text-right font-mono" data-testid="text-tax-revenue">
                        {formatPHP(summary?.totalRevenue || 0)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Less: Cost of Sales</TableCell>
                      <TableCell className="text-right font-mono text-destructive" data-testid="text-tax-cost">
                        ({formatPHP(summary?.totalCost || 0)})
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-semibold">Gross Income (MCIT Base)</TableCell>
                      <TableCell className="text-right font-mono font-semibold" data-testid="text-gross-income">
                        {formatPHP(taxCalculation.grossIncome)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Less: Operating Expenses</TableCell>
                      <TableCell className="text-right font-mono text-destructive" data-testid="text-tax-expenses">
                        ({formatPHP(summary?.totalExpenses || 0)})
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-semibold">Taxable Income</TableCell>
                      <TableCell className="text-right font-mono font-semibold" data-testid="text-taxable-income">
                        {formatPHP(taxCalculation.taxableIncome)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Regular Tax ({incomeTaxRate}%)</TableCell>
                      <TableCell className="text-right font-mono" data-testid="text-regular-tax">
                        {formatPHP(taxCalculation.regularTax)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">MCIT ({mcitRate}% of Gross Income)</TableCell>
                      <TableCell className="text-right font-mono" data-testid="text-mcit">
                        {formatPHP(taxCalculation.mcit)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-primary/10">
                      <TableCell className="font-semibold">
                        Tax Due (Higher of Regular/MCIT)
                        {taxCalculation.isMcitApplied && (
                          <span className="ml-2 text-xs text-muted-foreground">(MCIT Applied)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold" data-testid="text-tax-due">
                        {formatPHP(taxCalculation.taxDue)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Less: MCIT Credits Available</TableCell>
                      <TableCell className="text-right font-mono text-green-600" data-testid="text-mcit-credits">
                        ({formatPHP(taxCalculation.availableMcitCredits)})
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Less: Other Tax Credits</TableCell>
                      <TableCell className="text-right font-mono text-green-600" data-testid="text-other-credits">
                        ({formatPHP(taxCalculation.otherCredits)})
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-primary/20">
                      <TableCell className="text-lg font-bold">Final Tax Payable</TableCell>
                      <TableCell className="text-right font-mono text-lg font-bold" data-testid="text-final-tax">
                        {formatPHP(taxCalculation.finalTaxDue)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle>MCIT Credit Schedule</CardTitle>
                  <CardDescription>Excess MCIT credits carried forward (3-year limit)</CardDescription>
                </div>
                <Dialog open={mcitDialogOpen} onOpenChange={setMcitDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="button-add-mcit">
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add MCIT Credit</DialogTitle>
                      <DialogDescription>
                        Record excess MCIT (when MCIT paid exceeds regular income tax due)
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="mcit-year">Tax Year</Label>
                        <Select value={newMcitYear} onValueChange={setNewMcitYear}>
                          <SelectTrigger id="mcit-year" data-testid="select-mcit-year">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((y) => (
                              <SelectItem key={y} value={y}>{y}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="mcit-amount">Excess MCIT Amount (PHP)</Label>
                        <Input
                          id="mcit-amount"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={newMcitAmount}
                          onChange={(e) => setNewMcitAmount(e.target.value)}
                          data-testid="input-mcit-amount"
                        />
                        <p className="text-xs text-muted-foreground">
                          Excess = MCIT Paid minus Regular Income Tax Due
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={() => createMcitMutation.mutate({
                          taxYear: parseInt(newMcitYear),
                          excessAmount: newMcitAmount,
                        })}
                        disabled={!newMcitAmount || createMcitMutation.isPending}
                        data-testid="button-save-mcit"
                      >
                        {createMcitMutation.isPending ? "Saving..." : "Save Credit"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {mcitCredits && mcitCredits.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Year</TableHead>
                        <TableHead className="text-right">Original Amount</TableHead>
                        <TableHead className="text-right">Used</TableHead>
                        <TableHead className="text-right">Remaining</TableHead>
                        <TableHead className="text-right">Expiry</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mcitCredits.map((credit) => (
                        <TableRow key={credit.id} data-testid={`row-mcit-${credit.id}`}>
                          <TableCell className="font-medium">{credit.taxYear}</TableCell>
                          <TableCell className="text-right font-mono">{formatPHP(parseFloat(credit.excessAmount || "0"))}</TableCell>
                          <TableCell className="text-right font-mono">{formatPHP(parseFloat(credit.usedAmount || "0"))}</TableCell>
                          <TableCell className="text-right font-mono font-semibold">{formatPHP(parseFloat(credit.remainingAmount || "0"))}</TableCell>
                          <TableCell className="text-right">{credit.expiryYear}</TableCell>
                          <TableCell>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteMcitMutation.mutate(credit.id)}
                              disabled={deleteMcitMutation.isPending}
                              data-testid={`button-delete-mcit-${credit.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-4">No MCIT credits recorded</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle>NOLCO Schedule</CardTitle>
                  <CardDescription>Net Operating Loss Carryover (3-5 year limit)</CardDescription>
                </div>
                <Dialog open={nolcoDialogOpen} onOpenChange={setNolcoDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="button-add-nolco">
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add NOLCO Entry</DialogTitle>
                      <DialogDescription>
                        Record net operating loss that can be carried forward to offset future income
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="nolco-year">Loss Year</Label>
                        <Select value={newNolcoYear} onValueChange={setNewNolcoYear}>
                          <SelectTrigger id="nolco-year" data-testid="select-nolco-year">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((y) => (
                              <SelectItem key={y} value={y}>{y}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          2020-2021 losses have 5-year carryover; others have 3 years
                        </p>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="nolco-amount">Net Operating Loss (PHP)</Label>
                        <Input
                          id="nolco-amount"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={newNolcoAmount}
                          onChange={(e) => setNewNolcoAmount(e.target.value)}
                          data-testid="input-nolco-amount"
                        />
                        <p className="text-xs text-muted-foreground">
                          The total net operating loss for the year
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={() => createNolcoMutation.mutate({
                          lossYear: parseInt(newNolcoYear),
                          originalAmount: newNolcoAmount,
                        })}
                        disabled={!newNolcoAmount || createNolcoMutation.isPending}
                        data-testid="button-save-nolco"
                      >
                        {createNolcoMutation.isPending ? "Saving..." : "Save Entry"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {nolcoEntries && nolcoEntries.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Loss Year</TableHead>
                        <TableHead className="text-right">Original Loss</TableHead>
                        <TableHead className="text-right">Applied</TableHead>
                        <TableHead className="text-right">Remaining</TableHead>
                        <TableHead className="text-right">Expiry</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {nolcoEntries.map((entry) => (
                        <TableRow key={entry.id} data-testid={`row-nolco-${entry.id}`}>
                          <TableCell className="font-medium">{entry.lossYear}</TableCell>
                          <TableCell className="text-right font-mono">{formatPHP(parseFloat(entry.originalAmount || "0"))}</TableCell>
                          <TableCell className="text-right font-mono">{formatPHP(parseFloat(entry.usedAmount || "0"))}</TableCell>
                          <TableCell className="text-right font-mono font-semibold">{formatPHP(parseFloat(entry.remainingAmount || "0"))}</TableCell>
                          <TableCell className="text-right">{entry.expiryYear}</TableCell>
                          <TableCell>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteNolcoMutation.mutate(entry.id)}
                              disabled={deleteNolcoMutation.isPending}
                              data-testid={`button-delete-nolco-${entry.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-4">No NOLCO entries recorded</p>
                )}
                <p className="mt-4 text-xs text-muted-foreground">
                  Note: Losses incurred in 2020-2021 have extended 5-year carryover under CREATE Act
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle>Income Subject to Final Tax</CardTitle>
                  <CardDescription>Income already taxed at source (excluded from regular income tax)</CardDescription>
                </div>
                <Dialog open={fwtDialogOpen} onOpenChange={setFwtDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="button-add-fwt">
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Final Withholding Income</DialogTitle>
                      <DialogDescription>
                        Record income that has already been subjected to final withholding tax
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="fwt-year">Tax Year</Label>
                          <Select value={newFwtYear} onValueChange={setNewFwtYear}>
                            <SelectTrigger id="fwt-year" data-testid="select-fwt-year">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {years.map((y) => (
                                <SelectItem key={y} value={y}>{y}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="fwt-quarter">Quarter (Optional)</Label>
                          <Select value={newFwtQuarter} onValueChange={setNewFwtQuarter}>
                            <SelectTrigger id="fwt-quarter" data-testid="select-fwt-quarter">
                              <SelectValue placeholder="Annual" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="annual">Annual</SelectItem>
                              <SelectItem value="1">Q1</SelectItem>
                              <SelectItem value="2">Q2</SelectItem>
                              <SelectItem value="3">Q3</SelectItem>
                              <SelectItem value="4">Q4</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="fwt-type">Income Type</Label>
                        <Select value={newFwtType} onValueChange={setNewFwtType}>
                          <SelectTrigger id="fwt-type" data-testid="select-fwt-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bank_interest">Bank Interest (20%)</SelectItem>
                            <SelectItem value="dividends">Dividends (10%)</SelectItem>
                            <SelectItem value="royalties">Royalties (20%)</SelectItem>
                            <SelectItem value="prizes">Prizes & Winnings (20%)</SelectItem>
                            <SelectItem value="other">Other Passive Income</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="fwt-gross">Gross Amount (PHP)</Label>
                        <Input
                          id="fwt-gross"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={newFwtGross}
                          onChange={(e) => setNewFwtGross(e.target.value)}
                          data-testid="input-fwt-gross"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="fwt-tax">Tax Withheld (PHP)</Label>
                        <Input
                          id="fwt-tax"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={newFwtTax}
                          onChange={(e) => setNewFwtTax(e.target.value)}
                          data-testid="input-fwt-tax"
                        />
                        <p className="text-xs text-muted-foreground">
                          The final tax already withheld at source
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={() => createFwtMutation.mutate({
                          taxYear: parseInt(newFwtYear),
                          quarter: newFwtQuarter && newFwtQuarter !== "annual" ? parseInt(newFwtQuarter) : undefined,
                          incomeType: newFwtType,
                          grossAmount: newFwtGross,
                          taxWithheld: newFwtTax,
                        })}
                        disabled={!newFwtGross || !newFwtTax || createFwtMutation.isPending}
                        data-testid="button-save-fwt"
                      >
                        {createFwtMutation.isPending ? "Saving..." : "Save Entry"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {finalWithholdingIncomes && finalWithholdingIncomes.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Gross Amount</TableHead>
                        <TableHead className="text-right">Tax Withheld</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {finalWithholdingIncomes.map((income) => (
                        <TableRow key={income.id} data-testid={`row-fwt-${income.id}`}>
                          <TableCell className="font-medium">
                            {income.taxYear}{income.quarter ? ` Q${income.quarter}` : ""}
                          </TableCell>
                          <TableCell>{incomeTypeLabels[income.incomeType] || income.incomeType}</TableCell>
                          <TableCell className="text-right font-mono">{formatPHP(parseFloat(income.grossAmount || "0"))}</TableCell>
                          <TableCell className="text-right font-mono">{formatPHP(parseFloat(income.taxWithheld || "0"))}</TableCell>
                          <TableCell>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteFwtMutation.mutate(income.id)}
                              disabled={deleteFwtMutation.isPending}
                              data-testid={`button-delete-fwt-${income.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-4">No final withholding income recorded</p>
                )}
                <p className="mt-4 text-xs text-muted-foreground">
                  Note: This income is excluded from regular taxable income as it has already been subjected to final tax
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
