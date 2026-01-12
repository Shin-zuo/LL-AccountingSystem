
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  FileSpreadsheet, 
  Receipt, 
  TrendingUp, 
  Shield, 
  Download, 
  Users,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { useLocation } from "wouter";

export default function Landing() {
  const [, navigate] = useLocation();
  const features = [
    {
      icon: Receipt,
      title: "Simple Voucher Entry",
      description: "Easy-to-use forms for cash receipts and disbursements with automatic VAT calculation",
    },
    {
      icon: FileSpreadsheet,
      title: "Excel Export",
      description: "Download complete Excel workbooks with all 7 sheets ready for BIR compliance",
    },
    {
      icon: TrendingUp,
      title: "Financial Reports",
      description: "Automatic Profit & Loss and Balance Sheet reports with monthly, quarterly, and annual summaries",
    },
    {
      icon: Shield,
      title: "BIR Compliant",
      description: "VAT Sales and Purchase Books automatically generated for easy tax filing",
    },
    {
      icon: Users,
      title: "Multi-User Access",
      description: "Admin controls for user privileges with prepare and approve workflow",
    },
    {
      icon: Download,
      title: "Anytime Access",
      description: "View and download your Excel files anytime, anywhere",
    },
  ];

  const benefits = [
    "Single-entry bookkeeping - no accounting degree needed",
    "Automatic 12% VAT segregation",
    "Zero-sum validation for accurate entries",
    "Monthly, quarterly, and annual subtotals",
    "Invoice tracking for receipts and disbursements",
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
            <span className="text-xl font-semibold">LLAS</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button data-testid="button-login" onClick={() => navigate("/login")}>Log In</Button>
          </div>
        </div>
      </header>

      <main>
        <section className="py-20 lg:py-32">
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl" data-testid="text-hero-title">
                Accounting made{" "}
                <span className="text-primary">simple and easy.</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground" data-testid="text-hero-subtitle">
                LLAccounting System introduces a single-entry bookkeeping method with Excel-based records. 
                Perfect for small to medium size enterprises, organizations and professionals who need BIR-compliant financial record-keeping.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Button size="lg" className="gap-2" data-testid="button-get-started" onClick={() => navigate("/login")}> 
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg" data-testid="button-learn-more">
                  Learn More
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground" data-testid="text-pricing-info">
                Subscription fee ranges for as low as ₱2,000 per month paid annually. Contact us for a quotation.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/30 py-20">
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold">Everything You Need</h2>
              <p className="mt-4 text-muted-foreground">
                Complete accounting tools designed specifically for Filipino small business owners
              </p>
            </div>
            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="border-card-border">
                  <CardContent className="p-6">
                    <feature.icon className="h-10 w-10 text-primary" />
                    <h3 className="mt-4 text-lg font-medium">{feature.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-4xl">
              <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
                <div>
                  <h2 className="text-3xl font-semibold">
                    Built for Filipino Entrepreneurs
                  </h2>
                  <p className="mt-4 text-muted-foreground">
                    No need for expensive accounting software or complicated systems. 
                    LLAS gives you professional financial records in familiar Excel format.
                  </p>
                  <ul className="mt-8 space-y-4">
                    {benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-3">
                        <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <span className="text-sm">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Card className="border-card-border">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-semibold">Excel Workbook Includes:</h3>
                    <ul className="mt-6 space-y-3">
                      <li className="flex items-center gap-3 text-sm">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">1</div>
                        Chart of Accounts
                      </li>
                      <li className="flex items-center gap-3 text-sm">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">2</div>
                        Cash Receipts Vouchers
                      </li>
                      <li className="flex items-center gap-3 text-sm">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">3</div>
                        Cash Disbursements Vouchers
                      </li>
                      <li className="flex items-center gap-3 text-sm">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">4</div>
                        Consolidated Journal-Ledger
                      </li>
                      <li className="flex items-center gap-3 text-sm">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">5</div>
                        VAT Sales Book
                      </li>
                      <li className="flex items-center gap-3 text-sm">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">6</div>
                        VAT Purchase Book
                      </li>
                      <li className="flex items-center gap-3 text-sm">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">7</div>
                        Financial Reports (P&L, Balance Sheet)
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t bg-primary py-16 text-primary-foreground">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl font-semibold">Ready to simplify your bookkeeping?</h2>
            <p className="mt-4 text-primary-foreground/80">
              Join hundreds of Philippine small businesses using LLAS
            </p>
            <a href="/api/login">
              <Button 
                variant="secondary" 
                size="lg" 
                className="mt-8 gap-2"
                data-testid="button-start-trial"
              >
                Start Your Free Trial
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <span className="font-medium">LLAccounting System</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 LLAS. Designed for Philippine small businesses.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
