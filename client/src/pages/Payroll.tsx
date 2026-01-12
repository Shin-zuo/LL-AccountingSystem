import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, Calendar, Trash2, Download, Upload } from "lucide-react";
import type { Employee, PayrollPeriod } from "@shared/schema";

export default function Payroll() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("employees");
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);
  const [showPeriodDialog, setShowPeriodDialog] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);

  const { data: employees = [], isLoading: loadingEmployees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: periods = [], isLoading: loadingPeriods } = useQuery<PayrollPeriod[]>({
    queryKey: ["/api/payroll-periods"],
  });

  const { data: payrollRecords = [], isLoading: loadingRecords } = useQuery({
    queryKey: ["/api/payroll-periods", selectedPeriod, "records"],
    enabled: !!selectedPeriod,
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/employees", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setShowEmployeeDialog(false);
      toast({ title: "Employee added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add employee", variant: "destructive" });
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: "Employee deleted" });
    },
  });

  const createPeriodMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/payroll-periods", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll-periods"] });
      setShowPeriodDialog(false);
      toast({ title: "Payroll period created" });
    },
  });

  const handleEmployeeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createEmployeeMutation.mutate({
      employeeCode: formData.get("employeeCode"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      middleName: formData.get("middleName") || null,
      tin: formData.get("tin") || null,
      sssNumber: formData.get("sssNumber") || null,
      philhealthNumber: formData.get("philhealthNumber") || null,
      hdmfNumber: formData.get("hdmfNumber") || null,
      position: formData.get("position") || null,
      department: formData.get("department") || null,
      employmentStatus: formData.get("employmentStatus") || "active",
    });
  };

  const handlePeriodSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createPeriodMutation.mutate({
      periodName: formData.get("periodName"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      payDate: formData.get("payDate"),
      status: "draft",
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Payroll Management</h1>
        <p className="text-muted-foreground">Manage employee records and payroll data for BIR reporting</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="employees" data-testid="tab-employees">
            <Users className="mr-2 h-4 w-4" />
            Employees
          </TabsTrigger>
          <TabsTrigger value="periods" data-testid="tab-periods">
            <Calendar className="mr-2 h-4 w-4" />
            Payroll Periods
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>Employee Directory</CardTitle>
                <CardDescription>Manage employee records with TIN, SSS, PhilHealth, and HDMF numbers</CardDescription>
              </div>
              <Dialog open={showEmployeeDialog} onOpenChange={setShowEmployeeDialog}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-employee">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Employee
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Employee</DialogTitle>
                    <DialogDescription>Enter employee details for payroll and BIR reporting</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleEmployeeSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="employeeCode">Employee Code</Label>
                        <Input id="employeeCode" name="employeeCode" required data-testid="input-employee-code" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="position">Position</Label>
                        <Input id="position" name="position" data-testid="input-position" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" name="firstName" required data-testid="input-first-name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" name="lastName" required data-testid="input-last-name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="middleName">Middle Name</Label>
                        <Input id="middleName" name="middleName" data-testid="input-middle-name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Input id="department" name="department" data-testid="input-department" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tin">TIN</Label>
                        <Input id="tin" name="tin" placeholder="000-000-000-000" data-testid="input-tin" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sssNumber">SSS Number</Label>
                        <Input id="sssNumber" name="sssNumber" data-testid="input-sss" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="philhealthNumber">PhilHealth Number</Label>
                        <Input id="philhealthNumber" name="philhealthNumber" data-testid="input-philhealth" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hdmfNumber">HDMF/Pag-IBIG Number</Label>
                        <Input id="hdmfNumber" name="hdmfNumber" data-testid="input-hdmf" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="employmentStatus">Status</Label>
                        <Select name="employmentStatus" defaultValue="active">
                          <SelectTrigger data-testid="select-employment-status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="terminated">Terminated</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setShowEmployeeDialog(false)}>Cancel</Button>
                      <Button type="submit" disabled={createEmployeeMutation.isPending} data-testid="button-submit-employee">
                        Add Employee
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loadingEmployees ? (
                <p className="text-center py-8 text-muted-foreground">Loading employees...</p>
              ) : employees.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No employees found. Add your first employee to get started.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>TIN</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((emp) => (
                      <TableRow key={emp.id} data-testid={`row-employee-${emp.id}`}>
                        <TableCell className="font-medium">{emp.employeeCode}</TableCell>
                        <TableCell>{emp.lastName}, {emp.firstName} {emp.middleName || ""}</TableCell>
                        <TableCell>{emp.tin || "-"}</TableCell>
                        <TableCell>{emp.position || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={emp.employmentStatus === "active" ? "default" : "secondary"}>
                            {emp.employmentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteEmployeeMutation.mutate(emp.id)}
                            data-testid={`button-delete-employee-${emp.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="periods" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>Payroll Periods</CardTitle>
                <CardDescription>Create and manage payroll periods for compensation tracking</CardDescription>
              </div>
              <Dialog open={showPeriodDialog} onOpenChange={setShowPeriodDialog}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-period">
                    <Plus className="mr-2 h-4 w-4" />
                    New Period
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Payroll Period</DialogTitle>
                    <DialogDescription>Define the payroll period dates</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handlePeriodSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="periodName">Period Name</Label>
                      <Input id="periodName" name="periodName" placeholder="e.g., January 2025 1st Half" required data-testid="input-period-name" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input id="startDate" name="startDate" type="date" required data-testid="input-start-date" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input id="endDate" name="endDate" type="date" required data-testid="input-end-date" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payDate">Pay Date</Label>
                      <Input id="payDate" name="payDate" type="date" data-testid="input-pay-date" />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setShowPeriodDialog(false)}>Cancel</Button>
                      <Button type="submit" disabled={createPeriodMutation.isPending} data-testid="button-submit-period">
                        Create Period
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loadingPeriods ? (
                <p className="text-center py-8 text-muted-foreground">Loading payroll periods...</p>
              ) : periods.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No payroll periods found. Create your first period to start tracking payroll.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period Name</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Pay Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {periods.map((period) => (
                      <TableRow key={period.id} data-testid={`row-period-${period.id}`}>
                        <TableCell className="font-medium">{period.periodName}</TableCell>
                        <TableCell>{period.startDate}</TableCell>
                        <TableCell>{period.endDate}</TableCell>
                        <TableCell>{period.payDate || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={period.status === "finalized" ? "default" : "secondary"}>
                            {period.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedPeriod(period.id)}
                            data-testid={`button-view-records-${period.id}`}
                          >
                            View Records
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {selectedPeriod && (
            <Card>
              <CardHeader>
                <CardTitle>Payroll Records</CardTitle>
                <CardDescription>Employee compensation records for the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingRecords ? (
                  <p className="text-center py-8 text-muted-foreground">Loading records...</p>
                ) : (payrollRecords as any[]).length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No payroll records for this period. Add employee records to track compensation.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead className="text-right">Gross</TableHead>
                        <TableHead className="text-right">Withholding Tax</TableHead>
                        <TableHead className="text-right">SSS</TableHead>
                        <TableHead className="text-right">PhilHealth</TableHead>
                        <TableHead className="text-right">HDMF</TableHead>
                        <TableHead className="text-right">Net Pay</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(payrollRecords as any[]).map((record: any) => (
                        <TableRow key={record.id}>
                          <TableCell>{record.employee?.lastName}, {record.employee?.firstName}</TableCell>
                          <TableCell className="text-right">{parseFloat(record.grossCompensation || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</TableCell>
                          <TableCell className="text-right">{parseFloat(record.withholdingTax || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</TableCell>
                          <TableCell className="text-right">{parseFloat(record.sssEmployee || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</TableCell>
                          <TableCell className="text-right">{parseFloat(record.philhealthEmployee || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</TableCell>
                          <TableCell className="text-right">{parseFloat(record.hdmfEmployee || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</TableCell>
                          <TableCell className="text-right font-medium">{parseFloat(record.netPay || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
