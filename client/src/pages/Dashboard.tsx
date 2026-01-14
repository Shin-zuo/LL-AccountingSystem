import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { formatPHP, formatDate } from "@/lib/currency";
import { useAuth } from "@/hooks/useAuth";
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  CreditCard,
  FileSpreadsheet,
  Plus,
  Download,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import type { CashReceipt, CashDisbursement, Company } from "@shared/schema";

interface DashboardStats {
  totalReceipts: number;
  totalDisbursements: number;
  netCashFlow: number;
  pendingApprovals: number;
  monthlyReceipts: number;
  monthlyDisbursements: number;
}

interface RecentVoucher {
  id: number;
  type: "receipt" | "disbursement";
  number: string;
  date: string;
  name: string;
  amount: string;
  status: string;
}

export default function Dashboard() {
 const { user } = useAuth();

  // UPDATE 1: Add staleTime: 0 to stats query
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    refetchOnMount: true,
    staleTime: 0, // <--- Add this. Forces a refetch every time the component mounts.
  });

  // UPDATE 2: Add staleTime: 0 to recent vouchers query
  const { data: recentVouchers, isLoading: vouchersLoading } = useQuery<RecentVoucher[]>({
    queryKey: ["/api/dashboard/recent"],
    refetchOnMount: true,
    staleTime: 0, // <--- Add this. Forces a refetch every time the component mounts.
  });

  const { data: company } = useQuery<Company>({
    queryKey: ["/api/company"],
    // You might want to add it here too if subscription status changes often, 
    // otherwise you can leave this one as is.
  });

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
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.firstName || "User"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/receipts/new">
            <Button className="gap-2" data-testid="button-new-receipt">
              <Plus className="h-4 w-4" />
              New Receipt
            </Button>
          </Link>
          <Link href="/disbursements/new">
            <Button variant="outline" className="gap-2" data-testid="button-new-disbursement">
              <Plus className="h-4 w-4" />
              New Disbursement
            </Button>
          </Link>
        </div>
      </div>

      {/* {company && company.subscriptionStatus !== "active" && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium">Subscription {company.subscriptionStatus === "trial" ? "Trial" : "Expired"}</p>
                <p className="text-sm text-muted-foreground">
                  {company.subscriptionStatus === "trial" 
                    ? "Upgrade to unlock all features and continue using LLAS" 
                    : "Your subscription has expired. Renew to continue using LLAS"}
                </p>
              </div>
            </div>
            <Link href="/subscription">
              <Button variant="destructive" data-testid="button-upgrade-subscription">
                {company.subscriptionStatus === "trial" ? "Upgrade Now" : "Renew Now"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )} */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Receipts
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="font-mono text-2xl font-semibold text-primary">
                {formatPHP(stats?.monthlyReceipts || 0)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Disbursements
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="font-mono text-2xl font-semibold text-destructive">
                {formatPHP(stats?.monthlyDisbursements || 0)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Cash Flow
            </CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className={`font-mono text-2xl font-semibold ${(stats?.netCashFlow || 0) >= 0 ? "text-primary" : "text-destructive"}`}>
                {formatPHP(stats?.netCashFlow || 0)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Approvals
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="font-mono text-2xl font-semibold">
                {stats?.pendingApprovals || 0}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Recent Vouchers</CardTitle>
            <Link href="/journal">
              <Button variant="ghost" size="sm" className="gap-1" data-testid="link-view-all-vouchers">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {vouchersLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            ) : recentVouchers && recentVouchers.length > 0 ? (
              <div className="space-y-4">
                {recentVouchers.map((voucher) => (
                  <div key={`${voucher.type}-${voucher.id}`} className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${
                      voucher.type === "receipt" ? "bg-primary/10" : "bg-destructive/10"
                    }`}>
                      {voucher.type === "receipt" ? (
                        <Receipt className="h-5 w-5 text-primary" />
                      ) : (
                        <CreditCard className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{voucher.number}</p>
                        {getStatusBadge(voucher.status)}
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {voucher.name} • {formatDate(voucher.date)}
                      </p>
                    </div>
                    <p className={`font-mono text-sm font-medium ${
                      voucher.type === "receipt" ? "text-primary" : "text-destructive"
                    }`}>
                      {voucher.type === "receipt" ? "+" : "-"}{formatPHP(voucher.amount)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileSpreadsheet className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">No vouchers yet</p>
                <p className="text-xs text-muted-foreground">Create your first cash receipt or disbursement</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Link href="/receipts/new">
              <Button variant="outline" className="w-full justify-start gap-3" data-testid="button-quick-receipt">
                <Receipt className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium">New Cash Receipt</p>
                  <p className="text-xs text-muted-foreground">Record money received</p>
                </div>
              </Button>
            </Link>
            <Link href="/disbursements/new">
              <Button variant="outline" className="w-full justify-start gap-3" data-testid="button-quick-disbursement">
                <CreditCard className="h-5 w-5 text-destructive" />
                <div className="text-left">
                  <p className="font-medium">New Cash Disbursement</p>
                  <p className="text-xs text-muted-foreground">Record money spent</p>
                </div>
              </Button>
            </Link>
            <Link href="/reports">
              <Button variant="outline" className="w-full justify-start gap-3" data-testid="button-quick-reports">
                <FileSpreadsheet className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Download Excel Reports</p>
                  <p className="text-xs text-muted-foreground">Export complete workbook</p>
                </div>
              </Button>
            </Link>
            <Link href="/accounts">
              <Button variant="outline" className="w-full justify-start gap-3" data-testid="button-quick-accounts">
                <FileSpreadsheet className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Chart of Accounts</p>
                  <p className="text-xs text-muted-foreground">Manage account codes</p>
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
