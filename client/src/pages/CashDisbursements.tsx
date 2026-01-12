import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatPHP, formatDate } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import type { CashDisbursement } from "@shared/schema";

interface CashDisbursementWithUser extends CashDisbursement {
  preparedByName?: string;
  approvedByName?: string;
}

export default function CashDisbursements() {
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const { data: disbursements, isLoading } = useQuery<CashDisbursementWithUser[]>({
    queryKey: ["/api/cash-disbursements"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/cash-disbursements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cash-disbursements"] });
      toast({
        title: "Voucher deleted",
        description: "The cash disbursement voucher has been deleted.",
      });
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
        description: "Failed to delete the voucher.",
        variant: "destructive",
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/cash-disbursements/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cash-disbursements"] });
      toast({
        title: "Voucher approved",
        description: "The cash disbursement voucher has been approved.",
      });
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
        description: "Failed to approve the voucher.",
        variant: "destructive",
      });
    },
  });

  const filteredDisbursements = disbursements?.filter(
    (d) =>
      d.cdn.toLowerCase().includes(search.toLowerCase()) ||
      d.payeeName.toLowerCase().includes(search.toLowerCase()) ||
      d.particulars?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="default" className="bg-primary/10 text-primary"><CheckCircle className="mr-1 h-3 w-3" />Approved</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      default:
        return <Badge variant="outline"><AlertCircle className="mr-1 h-3 w-3" />Draft</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Cash Disbursements</h1>
          <p className="text-muted-foreground">Manage cash disbursement vouchers</p>
        </div>
        <Link href="/disbursements/new">
          <Button className="gap-2" data-testid="button-new-disbursement">
            <Plus className="h-4 w-4" />
            New Disbursement
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Cash Disbursements</CardTitle>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search vouchers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search-disbursements"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : filteredDisbursements && filteredDisbursements.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CDN</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Supplier Invoice</TableHead>
                    <TableHead>Payee</TableHead>
                    <TableHead>Particulars</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Input VAT</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDisbursements.map((disbursement) => (
                    <TableRow key={disbursement.id} data-testid={`row-disbursement-${disbursement.id}`}>
                      <TableCell className="font-medium">{disbursement.cdn}</TableCell>
                      <TableCell>{formatDate(disbursement.voucherDate)}</TableCell>
                      <TableCell>
                        {disbursement.supplierInvoiceNumber ? (
                          <div className="text-sm">
                            <p>{disbursement.supplierInvoiceNumber}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(disbursement.supplierInvoiceDate)}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{disbursement.payeeName}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{disbursement.particulars}</TableCell>
                      <TableCell className="text-right font-mono font-medium text-destructive">
                        {formatPHP(disbursement.cashAmount)}
                      </TableCell>
                      <TableCell>
                        {disbursement.hasInputVat ? (
                          <Badge variant="secondary" className="text-xs">
                            {formatPHP(disbursement.vatAmount)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(disbursement.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-actions-${disbursement.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <Link href={`/disbursements/${disbursement.id}/edit`}>
                              <DropdownMenuItem data-testid={`menu-edit-${disbursement.id}`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            </Link>
                            {disbursement.status !== "approved" && (
                              <DropdownMenuItem 
                                onClick={() => approveMutation.mutate(disbursement.id)}
                                data-testid={`menu-approve-${disbursement.id}`}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => deleteMutation.mutate(disbursement.id)}
                              data-testid={`menu-delete-${disbursement.id}`}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CreditCard className="h-16 w-16 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No cash disbursements yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first cash disbursement voucher to get started
              </p>
              <Link href="/disbursements/new">
                <Button className="mt-4 gap-2" data-testid="button-create-first-disbursement">
                  <Plus className="h-4 w-4" />
                  Create Disbursement
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
