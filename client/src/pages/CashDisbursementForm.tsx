import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { formatPHP, calculateVAT, formatDateInput } from "@/lib/currency";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Save,
} from "lucide-react";
import type { ChartOfAccount, CashDisbursement } from "@shared/schema";

const lineItemSchema = z.object({
  accountId: z.number().min(1, "Please select an account"),
  amount: z.string().min(1, "Amount is required"),
  description: z.string().optional(),
});

const formSchema = z.object({
  cdn: z.string().min(1, "CDN is required"),
  voucherDate: z.string().min(1, "Date is required"),
  supplierInvoiceNumber: z.string().optional(),
  supplierInvoiceDate: z.string().optional(),
  payeeName: z.string().min(1, "Payee name is required"),
  particulars: z.string().optional(),
  cashAmount: z.string().min(1, "Cash amount is required"),
  hasInputVat: z.boolean().default(false),
  lines: z.array(lineItemSchema).min(1, "At least one account line is required"),
});

type FormData = z.infer<typeof formSchema>;

export default function CashDisbursementForm() {
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const isEditing = !!params.id;
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cdn: "",
      voucherDate: formatDateInput(new Date()),
      supplierInvoiceNumber: "",
      supplierInvoiceDate: "",
      payeeName: "",
      particulars: "",
      cashAmount: "",
      hasInputVat: false,
      lines: [{ accountId: 0, amount: "", description: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  const { data: accounts } = useQuery<ChartOfAccount[]>({
    queryKey: ["/api/chart-of-accounts"],
  });

  const { data: existingDisbursement } = useQuery<CashDisbursement & { lines: any[] }>({
    queryKey: ["/api/cash-disbursements", params.id],
    enabled: isEditing,
  });

  useEffect(() => {
    if (existingDisbursement) {
      form.reset({
        cdn: existingDisbursement.cdn,
        voucherDate: formatDateInput(existingDisbursement.voucherDate),
        supplierInvoiceNumber: existingDisbursement.supplierInvoiceNumber || "",
        supplierInvoiceDate: existingDisbursement.supplierInvoiceDate ? formatDateInput(existingDisbursement.supplierInvoiceDate) : "",
        payeeName: existingDisbursement.payeeName,
        particulars: existingDisbursement.particulars || "",
        cashAmount: existingDisbursement.cashAmount?.toString() || "",
        hasInputVat: existingDisbursement.hasInputVat || false,
        lines: existingDisbursement.lines?.map((l: any) => ({
          accountId: l.accountId,
          amount: l.amount?.toString() || "",
          description: l.description || "",
        })) || [{ accountId: 0, amount: "", description: "" }],
      });
    }
  }, [existingDisbursement, form]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const cashAmount = parseFloat(data.cashAmount);
      const vatInfo = data.hasInputVat ? calculateVAT(cashAmount) : { net: cashAmount, vat: 0 };
      
      const payload = {
        cdn: data.cdn,
        voucherDate: data.voucherDate,
        supplierInvoiceNumber: data.supplierInvoiceNumber || null,
        supplierInvoiceDate: data.supplierInvoiceDate || null,
        payeeName: data.payeeName,
        particulars: data.particulars || null,
        cashAmount: cashAmount.toString(),
        hasInputVat: data.hasInputVat,
        vatAmount: vatInfo.vat.toString(),
        netAmount: vatInfo.net.toString(),
        status: "draft",
        lines: data.lines.map((l) => ({
          accountId: l.accountId,
          amount: parseFloat(l.amount).toString(),
          description: l.description || null,
        })),
      };

      if (isEditing) {
        await apiRequest("PATCH", `/api/cash-disbursements/${params.id}`, payload);
      } else {
        await apiRequest("POST", "/api/cash-disbursements", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cash-disbursements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: isEditing ? "Voucher updated" : "Voucher created",
        description: `The cash disbursement voucher has been ${isEditing ? "updated" : "created"}.`,
      });
      navigate("/disbursements");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} the voucher.`,
        variant: "destructive",
      });
    },
  });

  const watchCashAmount = form.watch("cashAmount");
  const watchHasInputVat = form.watch("hasInputVat");
  const watchLines = form.watch("lines");

  const cashAmount = parseFloat(watchCashAmount) || 0;
  const vatInfo = watchHasInputVat ? calculateVAT(cashAmount) : { net: cashAmount, vat: 0 };
  
  const totalDebits = watchLines.reduce((sum, line) => sum + (parseFloat(line.amount) || 0), 0);
  const balance = totalDebits - cashAmount;
  const isBalanced = Math.abs(balance) < 0.01;

  const activeAccounts = accounts?.filter((a) => a.isActive) || [];

  const onSubmit = (data: FormData) => {
    if (!isBalanced) {
      toast({
        title: "Balance Error",
        description: "Total debits must equal the cash amount (credit).",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/disbursements")} data-testid="button-back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-semibold">
            {isEditing ? "Edit Cash Disbursement" : "New Cash Disbursement"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Update the voucher details" : "Create a new cash disbursement voucher"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Voucher Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="cdn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CDN (Cash Disbursement Number)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., CD-2024-001" {...field} data-testid="input-cdn" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="voucherDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Voucher Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-voucher-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="supplierInvoiceNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supplier Invoice Number (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., SUP-INV-001" {...field} data-testid="input-supplier-invoice-number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="supplierInvoiceDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supplier Invoice Date (Optional)</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-supplier-invoice-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="payeeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payee Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Name of person or company being paid" {...field} data-testid="input-payee-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="particulars"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Particulars / Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Description of the transaction" 
                            className="resize-none" 
                            {...field} 
                            data-testid="input-particulars"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cash Amount (Credit)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="cashAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Cash Disbursed (₱)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00" 
                              className="font-mono text-lg"
                              {...field} 
                              data-testid="input-cash-amount"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="hasInputVat"
                      render={({ field }) => (
                        <FormItem className="flex flex-col justify-end">
                          <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Has Input VAT</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                Claim 12% input VAT
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-has-input-vat"
                              />
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  {watchHasInputVat && cashAmount > 0 && (
                    <div className="rounded-lg bg-muted p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Net Amount:</span>
                        <span className="font-mono">{formatPHP(vatInfo.net)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Input VAT (12%):</span>
                        <span className="font-mono">{formatPHP(vatInfo.vat)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 font-medium">
                        <span>Total:</span>
                        <span className="font-mono">{formatPHP(cashAmount)}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <CardTitle>Debited Accounts</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ accountId: 0, amount: "", description: "" })}
                    data-testid="button-add-line"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Line
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-4 items-start rounded-lg border p-4">
                      <div className="flex-1 grid gap-4 sm:grid-cols-3">
                        <FormField
                          control={form.control}
                          name={`lines.${index}.accountId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Account</FormLabel>
                              <Select 
                                onValueChange={(v) => field.onChange(parseInt(v))} 
                                value={field.value?.toString() || ""}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid={`select-account-${index}`}>
                                    <SelectValue placeholder="Select account" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {activeAccounts.map((account) => (
                                    <SelectItem key={account.id} value={account.id.toString()}>
                                      {account.code} - {account.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`lines.${index}.amount`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Amount (₱)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  placeholder="0.00" 
                                  className="font-mono"
                                  {...field} 
                                  data-testid={`input-line-amount-${index}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`lines.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Optional" 
                                  {...field} 
                                  data-testid={`input-line-description-${index}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="mt-8"
                          onClick={() => remove(index)}
                          data-testid={`button-remove-line-${index}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Balance Check</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Debits (Accounts):</span>
                      <span className="font-mono text-primary">+{formatPHP(totalDebits)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Credit (Cash):</span>
                      <span className="font-mono text-destructive">-{formatPHP(cashAmount)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-medium">
                      <span>Balance:</span>
                      <span className={`font-mono ${isBalanced ? "text-primary" : "text-destructive"}`}>
                        {formatPHP(balance)}
                      </span>
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-2 rounded-lg p-3 ${isBalanced ? "bg-primary/10" : "bg-destructive/10"}`}>
                    {isBalanced ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium text-primary">Balanced</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        <span className="text-sm font-medium text-destructive">Not balanced</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Prepared By</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
                      {user?.firstName?.[0] || user?.email?.[0] || "U"}
                    </div>
                    <div>
                      <p className="font-medium">
                        {user?.firstName && user?.lastName 
                          ? `${user.firstName} ${user.lastName}`
                          : user?.email || "Current User"}
                      </p>
                      <p className="text-sm text-muted-foreground">{user?.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button 
                type="submit" 
                className="w-full gap-2" 
                disabled={createMutation.isPending}
                data-testid="button-save-voucher"
              >
                <Save className="h-4 w-4" />
                {createMutation.isPending ? "Saving..." : (isEditing ? "Update Voucher" : "Save Voucher")}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
