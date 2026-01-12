import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Calendar, AlertCircle } from "lucide-react";
import { BIR_REPORTS, type BIRReportConfig } from "@shared/schema";

const currentYear = new Date().getFullYear();
const months = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const quarters = [
  { value: "1", label: "Q1 (Jan-Mar)" },
  { value: "2", label: "Q2 (Apr-Jun)" },
  { value: "3", label: "Q3 (Jul-Sep)" },
  { value: "4", label: "Q4 (Oct-Dec)" },
];

function ReportCard({ report, period }: { report: BIRReportConfig; period: { year: number; month?: string; quarter?: string } }) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      let url = `/api/bir-reports/${report.formNumber}/data?year=${period.year}`;
      if (period.month) url += `&month=${period.month}`;
      if (period.quarter) url += `&quarter=${period.quarter}`;

      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to generate report data");
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      toast({ title: "Failed to generate report data", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    try {
      let url = `/api/bir-reports/${report.formNumber}/export?year=${period.year}`;
      if (period.month) url += `&month=${period.month}`;
      if (period.quarter) url += `&quarter=${period.quarter}`;

      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to export");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `BIR-${report.formNumber}-${period.year}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      toast({ title: "Report exported successfully" });
    } catch (error) {
      toast({ title: "Failed to export report", variant: "destructive" });
    }
  };

  return (
    <Card className="mb-4" data-testid={`card-report-${report.formNumber}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">{report.formNumber}</CardTitle>
              <CardDescription>{report.formName}</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="shrink-0">
            <Calendar className="mr-1 h-3 w-3" />
            Due: {report.deadline}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating}
            data-testid={`button-generate-${report.formNumber}`}
          >
            {isGenerating ? "Generating..." : "Generate Data"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            data-testid={`button-export-${report.formNumber}`}
          >
            <Download className="mr-1 h-4 w-4" />
            Export Excel
          </Button>
        </div>

        {reportData && (
          <div className="mt-4 p-4 bg-muted/50 rounded-md">
            <h4 className="font-medium mb-2">Generated Data Summary</h4>
            <div className="text-sm space-y-1">
              <p><strong>Period:</strong> {reportData.period.startDate} to {reportData.period.endDate}</p>
              <p><strong>Generated:</strong> {new Date(reportData.generatedAt).toLocaleString()}</p>
              {reportData.data && (
                <div className="mt-3">
                  {report.formNumber.startsWith("2550") && reportData.data && (
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell>Vatable Sales</TableCell>
                          <TableCell className="text-right">{(reportData.data.vatableSales || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Output VAT</TableCell>
                          <TableCell className="text-right">{(reportData.data.outputVat || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Input VAT</TableCell>
                          <TableCell className="text-right">{(reportData.data.inputVat || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">VAT Payable</TableCell>
                          <TableCell className="text-right font-medium">{(reportData.data.vatPayable || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  )}
                  {report.formNumber.startsWith("1601") && reportData.data && (
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell>Employees</TableCell>
                          <TableCell className="text-right">{reportData.data.payrollSummary?.employeeCount || 0}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Total Compensation</TableCell>
                          <TableCell className="text-right">{(reportData.data.payrollSummary?.totalGrossCompensation || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Total Withholding Tax</TableCell>
                          <TableCell className="text-right font-medium">{(reportData.data.compensationWithholdingTax || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  )}
                  {report.formNumber.startsWith("1702") && reportData.data && (
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell>Gross Income</TableCell>
                          <TableCell className="text-right">{(reportData.data.grossIncome || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Deductions</TableCell>
                          <TableCell className="text-right">{(reportData.data.deductions || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Taxable Income</TableCell>
                          <TableCell className="text-right">{(reportData.data.taxableIncome || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Income Tax Due</TableCell>
                          <TableCell className="text-right font-medium">{(reportData.data.incomeTaxDue || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  )}
                  {report.formNumber.startsWith("1604") && reportData.data && (
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell>Total Employees</TableCell>
                          <TableCell className="text-right">{reportData.data.totalEmployees || 0}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Total Compensation</TableCell>
                          <TableCell className="text-right">{(reportData.data.totalCompensation || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Total Withholding Tax</TableCell>
                          <TableCell className="text-right font-medium">{(reportData.data.totalWithholdingTax || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  )}
                  {report.formNumber === "SLS" && reportData.data && (
                    <div>
                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell>Number of Transactions</TableCell>
                            <TableCell className="text-right">{reportData.data.summary?.transactionCount || 0}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Vatable Sales</TableCell>
                            <TableCell className="text-right">{(reportData.data.summary?.vatableSales || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Zero-Rated Sales</TableCell>
                            <TableCell className="text-right">{(reportData.data.summary?.zeroRatedSales || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Exempt Sales</TableCell>
                            <TableCell className="text-right">{(reportData.data.summary?.exemptSales || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Total Output VAT</TableCell>
                            <TableCell className="text-right font-medium">{(reportData.data.summary?.totalOutputVat || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                      <p className="text-xs text-muted-foreground mt-2">Export to Excel for detailed transaction list</p>
                    </div>
                  )}
                  {report.formNumber === "SLP" && reportData.data && (
                    <div>
                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell>Number of Transactions</TableCell>
                            <TableCell className="text-right">{reportData.data.summary?.transactionCount || 0}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Total Purchases</TableCell>
                            <TableCell className="text-right">{(reportData.data.summary?.totalPurchases || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Vatable Purchases</TableCell>
                            <TableCell className="text-right">{(reportData.data.summary?.vatablePurchases || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Total Input VAT</TableCell>
                            <TableCell className="text-right font-medium">{(reportData.data.summary?.totalInputVat || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                      <p className="text-xs text-muted-foreground mt-2">Export to Excel for detailed transaction list</p>
                    </div>
                  )}
                  {report.formNumber === "2307-Summary" && reportData.data && (
                    <div>
                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell>Number of 2307 Certificates</TableCell>
                            <TableCell className="text-right">{reportData.data.summary?.transactionCount || 0}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Withholding Agents</TableCell>
                            <TableCell className="text-right">{reportData.data.summary?.withholdingAgentCount || 0}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Total Income Payments</TableCell>
                            <TableCell className="text-right">{(reportData.data.summary?.totalIncomePayments || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Total Tax Withheld (Creditable)</TableCell>
                            <TableCell className="text-right font-medium">{(reportData.data.summary?.totalTaxWithheld || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                      <p className="text-xs text-muted-foreground mt-2">Export to Excel for detailed certificate list</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function BirReports() {
  const [activeTab, setActiveTab] = useState("monthly");
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState("1");
  const [selectedQuarter, setSelectedQuarter] = useState("1");

  const monthlyReports = BIR_REPORTS.filter((r) => r.frequency === "monthly");
  const quarterlyReports = BIR_REPORTS.filter((r) => r.frequency === "quarterly");
  const annualReports = BIR_REPORTS.filter((r) => r.frequency === "annual");

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" data-testid="text-page-title">BIR Tax Reports</h1>
        <p className="text-muted-foreground">Generate data for Philippine BIR tax forms from your accounting records</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="monthly" data-testid="tab-monthly">Monthly</TabsTrigger>
            <TabsTrigger value="quarterly" data-testid="tab-quarterly">Quarterly</TabsTrigger>
            <TabsTrigger value="annual" data-testid="tab-annual">Annual</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-28" data-testid="select-year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeTab === "monthly" && (
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-36" data-testid="select-month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {activeTab === "quarterly" && (
              <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                <SelectTrigger className="w-36" data-testid="select-quarter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {quarters.map((q) => (
                    <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <TabsContent value="monthly">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Monthly BIR Forms</CardTitle>
              <CardDescription>
                Withholding tax forms due on the 10th of the following month
              </CardDescription>
            </CardHeader>
          </Card>
          {monthlyReports.map((report) => (
            <ReportCard
              key={report.formNumber}
              report={report}
              period={{ year: parseInt(selectedYear), month: selectedMonth }}
            />
          ))}
        </TabsContent>

        <TabsContent value="quarterly">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Quarterly BIR Forms</CardTitle>
              <CardDescription>
                VAT, income tax, and percentage tax forms due within 25 days after quarter end
              </CardDescription>
            </CardHeader>
          </Card>
          {quarterlyReports.map((report) => (
            <ReportCard
              key={report.formNumber}
              report={report}
              period={{ year: parseInt(selectedYear), quarter: selectedQuarter }}
            />
          ))}
        </TabsContent>

        <TabsContent value="annual">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Annual BIR Forms</CardTitle>
              <CardDescription>
                Year-end tax returns and alphalists due on April 15th of the following year
              </CardDescription>
            </CardHeader>
          </Card>
          {annualReports.map((report) => (
            <ReportCard
              key={report.formNumber}
              report={report}
              period={{ year: parseInt(selectedYear) }}
            />
          ))}
        </TabsContent>
      </Tabs>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-base">Important Reminder</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The generated data is for reference only. Always verify the figures against your actual records 
            before filing with the BIR. Consult with your tax accountant for proper tax compliance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
