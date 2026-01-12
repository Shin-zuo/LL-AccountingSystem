import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { formatPHP, formatDate } from "@/lib/currency";
import {
  Crown,
  CheckCircle,
  Calendar,
  AlertCircle,
  Smartphone,
  Mail,
  Phone,
} from "lucide-react";
import type { Company, Subscription as SubscriptionType } from "@shared/schema";

export default function Subscription() {
  const { toast } = useToast();
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast({
        title: "Payment Successful",
        description: "Your subscription has been activated. Thank you!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/company"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
    }
  }, [searchParams, toast]);

  const { data: company, isLoading: companyLoading } = useQuery<Company>({
    queryKey: ["/api/company"],
  });

  const { data: payments } = useQuery<SubscriptionType[]>({
    queryKey: ["/api/subscriptions"],
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-primary/10 text-primary"><CheckCircle className="mr-1 h-3 w-3" />Active</Badge>;
      case "trial":
        return <Badge variant="secondary"><Crown className="mr-1 h-3 w-3" />Trial</Badge>;
      default:
        return <Badge variant="destructive"><AlertCircle className="mr-1 h-3 w-3" />Expired</Badge>;
    }
  };

  const hasActiveSubscription = company?.subscriptionStatus === "active";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold" data-testid="text-subscription-title">Subscription</h1>
        <p className="text-muted-foreground">Manage your LLAS subscription</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Current Plan
              </CardTitle>
              {company && getStatusBadge(company.subscriptionStatus)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <h3 className="text-xl font-semibold">LLAS Annual Plan</h3>
              <p className="text-3xl font-bold text-primary mt-2" data-testid="text-subscription-price">
                As low as {formatPHP(2000)}
                <span className="text-sm font-normal text-muted-foreground">/month (paid annually)</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">Contact us for quotation</p>
            </div>

            {company && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Subscription Period</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-subscription-period">
                      {company.subscriptionStartDate && company.subscriptionEndDate
                        ? `${formatDate(company.subscriptionStartDate)} - ${formatDate(company.subscriptionEndDate)}`
                        : "No active subscription"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium">What's Included:</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Unlimited voucher entries
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Complete Excel workbook export
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  All 7 financial sheets
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Automatic VAT calculations
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Multi-user access
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  BIR-compliant reports
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment via GCash</CardTitle>
            <CardDescription>
              {hasActiveSubscription
                ? "Your subscription is active. Contact us for renewal."
                : "Contact us to subscribe and get a quotation"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500">
                  <Smartphone className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-lg">GCash Payment</p>
                  <p className="text-sm text-muted-foreground">Fast and secure mobile payment</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <p className="text-sm font-medium">Contact us for quotation:</p>
                
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href="mailto:support@llas.ph" 
                    className="text-primary hover:underline"
                    data-testid="link-contact-email"
                  >
                    support@llas.ph
                  </a>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Available upon request</span>
                </div>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={() => window.location.href = "mailto:support@llas.ph?subject=LLAS Subscription Inquiry"}
              data-testid="button-contact-subscription"
            >
              <Mail className="mr-2 h-4 w-4" />
              Contact for Subscription
            </Button>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              After contacting us, we will provide you with a quotation and GCash payment details. 
              Your subscription will be activated within 24 hours of confirmed payment.
            </p>
          </CardFooter>
        </Card>
      </div>

      {payments && payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between gap-2 rounded-lg border p-4" data-testid={`payment-history-${payment.id}`}>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      payment.status === "completed" ? "bg-primary/10" : "bg-muted"
                    }`}>
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium capitalize">{payment.paymentMethod} Payment</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.paymentDate ? formatDate(payment.paymentDate) : "Processing"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-medium">{formatPHP(payment.amountPaid)}</p>
                    <Badge variant={payment.status === "completed" ? "default" : "secondary"}>
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
