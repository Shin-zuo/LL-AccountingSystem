import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import { formatPHP, formatNumber, calculateVAT, formatDateInput } from "@/lib/currency";
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
import type { ChartOfAccount, CashReceipt, User } from "@shared/schema";

const lineItemSchema = z.object({
  accountId: z.number().min(1, "Please select an account"),
  amount: z.string().min(1, "Amount is required"),
  description: z.string().optional(),
});

const formSchema = z.object({
  crn: z.string().min(1, "CRN is required"),
  voucherDate: z.string().min(1, "Date is required"),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().optional(),
  payorName: z.string().min(1, "Payor name is required"),
  particulars: z.string().optional(),
  cashAmount: z.string().min(1, "Cash amount is required"),
  isVatable: z.boolean().default(false),
  lines: z.array(lineItemSchema).min(1, "At least one account line is required"),
});

type FormData = z.infer<typeof formSchema>;

export default function CashReceiptForm() {
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const isEditing = !!params.id;
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      crn: "",
      voucherDate: formatDateInput(new Date()),
      invoiceNumber: "",
      invoiceDate: "",
      payorName: "",
      particulars: "",
      cashAmount: "",
      isVatable: false,
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

  const { data: approvers } = useQuery<User[]>({
    queryKey: ["/api/users/approvers"],
  });

  const { data: existingReceipt } = useQuery<CashReceipt & { lines: any[] }>({
    queryKey: ["/api/cash-receipts", params.id],
    enabled: isEditing,
  });

  useEffect(() => {
    if (existingReceipt) {
      form.reset({
        crn: existingReceipt.crn,
        voucherDate: formatDateInput(existingReceipt.voucherDate),
        invoiceNumber: existingReceipt.invoiceNumber || "",
        invoiceDate: existingReceipt.invoiceDate ? formatDateInput(existingReceipt.invoiceDate) : "",
        payorName: existingReceipt.payorName,
        particulars: existingReceipt.particulars || "",
        cashAmount: existingReceipt.cashAmount?.toString() || "",
        isVatable: existingReceipt.isVatable || false,
        lines: existingReceipt.lines?.map((l: any) => ({
          accountId: l.accountId,
          amount: l.amount?.toString() || "",
          description: l.description || "",
        })) || [{ accountId: 0, amount: "", description: "" }],
      });
    }
  }, [existingReceipt, form]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const cashAmount = parseFloat(data.cashAmount);
      const vatInfo = data.isVatable ? calculateVAT(cashAmount) : { net: cashAmount, vat: 0 };
      
      const payload = {
        crn: data.crn,
        voucherDate: data.voucherDate,
        invoiceNumber: data.invoiceNumber || null,
        invoiceDate: data.invoiceDate || null,
        payorName: data.payorName,
        particulars: data.particulars || null,
        cashAmount: cashAmount.toString(),
        isVatable: data.isVatable,
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
        await apiRequest("PATCH", `/api/cash-receipts/${params.id}`, payload);
      } else {
        await apiRequest("POST", "/api/cash-receipts", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cash-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: isEditing ? "Voucher updated" : "Voucher created",
        description: `The cash receipt voucher has been ${isEditing ? "updated" : "created"}.`,
      });
      navigate("/receipts");
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
  const watchIsVatable = form.watch("isVatable");
  const watchLines = form.watch("lines");

  const cashAmount = parseFloat(watchCashAmount) || 0;
  const vatInfo = watchIsVatable ? calculateVAT(cashAmount) : { net: cashAmount, vat: 0 };
  
  const totalCredits = watchLines.reduce((sum, line) => sum + (parseFloat(line.amount) || 0), 0);
  const balance = cashAmount - totalCredits;
  const isBalanced = Math.abs(balance) < 0.01;

  const activeAccounts = accounts?.filter((a) => a.isActive) || [];

  const onSubmit = (data: FormData) => {
    if (!isBalanced) {
      toast({
        title: "Balance Error",
        description: "Total credits must equal the cash amount (debit).",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/receipts")} data-testid="button-back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-semibold">
            {isEditing ? "Edit Cash Receipt" : "New Cash Receipt"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Update the voucher details" : "Create a new cash receipt voucher"}
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
                      name="crn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CRN (Cash Receipt Number)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., CR-2024-001" {...field} data-testid="input-crn" />
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
                      name="invoiceNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Invoice Number (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., INV-001" {...field} data-testid="input-invoice-number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="invoiceDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Invoice Date (Optional)</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-invoice-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="payorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payor Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Name of person or company paying" {...field} data-testid="input-payor-name" />
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
                  <CardTitle>Cash Amount (Debit)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="cashAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Cash Received (₱)</FormLabel>
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
                      name="isVatable"
                      render={({ field }) => (
                        <FormItem className="flex flex-col justify-end">
                          <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Subject to VAT</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                Apply 12% output VAT
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-is-vatable"
                              />
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  {watchIsVatable && cashAmount > 0 && (
                    <div className="rounded-lg bg-muted p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Net Amount:</span>
                        <span className="font-mono">{formatPHP(vatInfo.net)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Output VAT (12%):</span>
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
                  <CardTitle>Credited Accounts</CardTitle>
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
                      <span className="text-muted-foreground">Debit (Cash):</span>
                      <span className="font-mono text-primary">+{formatPHP(cashAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Credits (Accounts):</span>
                      <span className="font-mono text-destructive">-{formatPHP(totalCredits)}</span>
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
