import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FileSpreadsheet, Store, ArrowRight, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Onboarding() {
  const [companyName, setCompanyName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createCompanyMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", "/api/onboarding", { companyName: name });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Welcome to LLAS!",
        description: "Your company has been created with a default Chart of Accounts.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create company. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (companyName.trim()) {
      createCompanyMutation.mutate(companyName.trim());
    }
  };

  const features = [
    "30-day free trial - no credit card required",
    "Default Philippine Chart of Accounts included",
    "Cash Receipts and Disbursements vouchers",
    "Automatic 12% VAT calculations",
    "Excel export with all 7 BIR-compliant sheets",
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FileSpreadsheet className="h-10 w-10 text-primary" />
            <span className="text-2xl font-semibold">LLAS</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Welcome to LLAccounting System</h1>
          <p className="mt-2 text-muted-foreground">
            Let's get your business set up in just a few seconds
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Set Up Your Business
            </CardTitle>
            <CardDescription>
              Enter your business name to get started. You'll get a complete accounting system 
              ready for Philippine tax compliance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="companyName">Business Name</Label>
                <Input
                  id="companyName"
                  placeholder="e.g., Juan's Sari-Sari Store"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  data-testid="input-company-name"
                  disabled={createCompanyMutation.isPending}
                />
              </div>

              <div className="space-y-3 rounded-md bg-muted/50 p-4">
                <p className="text-sm font-medium">What you'll get:</p>
                <ul className="space-y-2">
                  {features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <Button 
                type="submit" 
                className="w-full gap-2" 
                size="lg"
                disabled={!companyName.trim() || createCompanyMutation.isPending}
                data-testid="button-create-company"
              >
                {createCompanyMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  <>
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          After your 30-day trial, continue for only ₱2,999/year
        </p>
      </div>
    </div>
  );
}
