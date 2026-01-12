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
  Receipt,
  Download,
} from "lucide-react";
import type { CashReceipt } from "@shared/schema";

interface CashReceiptWithUser extends CashReceipt {
  preparedByName?: string;
  approvedByName?: string;
}

export default function CashReceipts() {
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const { data: receipts, isLoading } = useQuery<CashReceiptWithUser[]>({
    queryKey: ["/api/cash-receipts"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/cash-receipts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cash-receipts"] });
      toast({
        title: "Voucher deleted",
        description: "The cash receipt voucher has been deleted.",
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
      await apiRequest("POST", `/api/cash-receipts/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cash-receipts"] });
      toast({
        title: "Voucher approved",
        description: "The cash receipt voucher has been approved.",
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

  const filteredReceipts = receipts?.filter(
    (r) =>
      r.crn.toLowerCase().includes(search.toLowerCase()) ||
      r.payorName.toLowerCase().includes(search.toLowerCase()) ||
      r.particulars?.toLowerCase().includes(search.toLowerCase())
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
          <h1 className="text-3xl font-semibold">Cash Receipts</h1>
          <p className="text-muted-foreground">Manage cash receipt vouchers</p>
        </div>
        <Link href="/receipts/new">
          <Button className="gap-2" data-testid="button-new-receipt">
            <Plus className="h-4 w-4" />
            New Receipt
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Cash Receipts</CardTitle>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search vouchers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search-receipts"
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
          ) : filteredReceipts && filteredReceipts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CRN</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Payor</TableHead>
                    <TableHead>Particulars</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>VAT</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReceipts.map((receipt) => (
                    <TableRow key={receipt.id} data-testid={`row-receipt-${receipt.id}`}>
                      <TableCell className="font-medium">{receipt.crn}</TableCell>
                      <TableCell>{formatDate(receipt.voucherDate)}</TableCell>
                      <TableCell>
                        {receipt.invoiceNumber ? (
                          <div className="text-sm">
                            <p>{receipt.invoiceNumber}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(receipt.invoiceDate)}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{receipt.payorName}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{receipt.particulars}</TableCell>
                      <TableCell className="text-right font-mono font-medium text-primary">
                        {formatPHP(receipt.cashAmount)}
                      </TableCell>
                      <TableCell>
                        {receipt.isVatable ? (
                          <Badge variant="secondary" className="text-xs">
                            {formatPHP(receipt.vatAmount)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(receipt.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-actions-${receipt.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <Link href={`/receipts/${receipt.id}/edit`}>
                              <DropdownMenuItem data-testid={`menu-edit-${receipt.id}`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            </Link>
                            {receipt.status !== "approved" && (
                              <DropdownMenuItem 
                                onClick={() => approveMutation.mutate(receipt.id)}
                                data-testid={`menu-approve-${receipt.id}`}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => deleteMutation.mutate(receipt.id)}
                              data-testid={`menu-delete-${receipt.id}`}
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
              <Receipt className="h-16 w-16 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No cash receipts yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first cash receipt voucher to get started
              </p>
              <Link href="/receipts/new">
                <Button className="mt-4 gap-2" data-testid="button-create-first-receipt">
                  <Plus className="h-4 w-4" />
                  Create Receipt
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
