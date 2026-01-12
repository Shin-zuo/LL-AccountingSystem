import React, { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import CashReceipts from "@/pages/CashReceipts";
import CashReceiptForm from "@/pages/CashReceiptForm";
import CashDisbursements from "@/pages/CashDisbursements";
import CashDisbursementForm from "@/pages/CashDisbursementForm";
import ChartOfAccounts from "@/pages/ChartOfAccounts";
import JournalLedger from "@/pages/JournalLedger";
import VATBooks from "@/pages/VATBooks";
import FinancialReports from "@/pages/FinancialReports";
import BirReports from "@/pages/BirReports";
import Payroll from "@/pages/Payroll";
import Settings from "@/pages/Settings";
import Subscription from "@/pages/Subscription";
import UserManagement from "@/pages/UserManagement";

function AuthenticatedRoutes() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/receipts" component={CashReceipts} />
      <Route path="/receipts/new" component={CashReceiptForm} />
      <Route path="/receipts/:id/edit" component={CashReceiptForm} />
      <Route path="/disbursements" component={CashDisbursements} />
      <Route path="/disbursements/new" component={CashDisbursementForm} />
      <Route path="/disbursements/:id/edit" component={CashDisbursementForm} />
      <Route path="/accounts" component={ChartOfAccounts} />
      <Route path="/journal" component={JournalLedger} />
      <Route path="/vat-books" component={VATBooks} />
      <Route path="/reports" component={FinancialReports} />
      <Route path="/bir-reports" component={BirReports} />
      <Route path="/payroll" component={Payroll} />
      <Route path="/settings" component={Settings} />
      <Route path="/subscription" component={Subscription} />
      <Route path="/users" component={UserManagement} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedLayout() {
  const [location] = useLocation();
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b bg-background px-4">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6" key={location}>
            <AuthenticatedRoutes />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

// Session Manager Component
function SessionManager() {
  const { isAuthenticated, sessionError, refreshSession, isRefreshingSession } = useAuth();
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) return;

    // Set up session expiry warning (show warning 5 minutes before expiry)
    const warningTime = 5 * 60 * 1000; // 5 minutes
    const expiryTime = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000) - warningTime); // 7 days - 5 minutes

    const checkSessionExpiry = () => {
      const now = new Date();
      const timeUntilExpiry = expiryTime.getTime() - now.getTime();

      if (timeUntilExpiry <= 0) {
        // Session expired - let useAuth hook handle logout
        setShowSessionWarning(false);
      } else if (timeUntilExpiry <= warningTime) {
        // Show warning
        setShowSessionWarning(true);
      }
    };

    // Check immediately and then every minute
    checkSessionExpiry();
    const interval = setInterval(checkSessionExpiry, 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Handle session errors
  useEffect(() => {
    if (sessionError && (sessionError as any)?.status === 401) {
      setLocation("/login");
    }
  }, [sessionError, setLocation]);

  if (!showSessionWarning) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Alert className="border-orange-200 bg-orange-50">
        <AlertCircle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <div className="flex items-center justify-between">
            <span>Your session will expire soon. Please save your work.</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                refreshSession();
                setShowSessionWarning(false);
              }}
              disabled={isRefreshingSession}
              className="ml-2"
            >
              {isRefreshingSession ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}

function Router() {
  const { user, isAuthenticated, isLoading, sessionError } = useAuth();
  const [location] = useLocation();

  // Show the client login page when navigating to /login
  if (location === "/login") {
    return <Login />;
  }

  // Show the logout page when navigating to /logout
  if (location === "/logout") {
    const Logout = React.lazy(() => import("@/pages/Logout"));
    return (
      <React.Suspense fallback={<div>Loading...</div>}>
        <Logout />
      </React.Suspense>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Handle session errors
  if (sessionError && (sessionError as any)?.status === 401) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your session has expired. Please log in again.
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => window.location.href = "/login"}
            className="w-full"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return (
    <>
      <SessionManager />
      <AuthenticatedLayout />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
