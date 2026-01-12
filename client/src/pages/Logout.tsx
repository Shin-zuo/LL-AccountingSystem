import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, LogOut, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Logout() {
  const [, setLocation] = useLocation();
  const { logout, isLoggingOut, logoutError, user } = useAuth();
  const { toast } = useToast();
  const [showConfirmation, setShowConfirmation] = useState(true);
  const [logoutStatus, setLogoutStatus] = useState<'confirming' | 'logging-out' | 'success' | 'error'>('confirming');

  const handleConfirmLogout = async () => {
    setShowConfirmation(false);
    setLogoutStatus('logging-out');

    try {
      await logout();

      setLogoutStatus('success');

      // Show success toast
      toast({
        title: "Logged out successfully",
        description: "You have been securely logged out of LLAS.",
      });

      // Redirect after a short delay to show success message
      setTimeout(() => {
        setLocation("/login");
      }, 1500);

    } catch (error) {
      setLogoutStatus('error');

      // Show error toast
      toast({
        title: "Logout error",
        description: "There was an issue logging out. You may need to clear your browser data.",
        variant: "destructive",
      });

      // Still redirect to login after error
      setTimeout(() => {
        setLocation("/login");
      }, 3000);
    }
  };

  const handleCancelLogout = () => {
    setLocation("/");
  };

  // Auto-logout without confirmation if no user (session expired)
  useEffect(() => {
    if (!user && !showConfirmation) {
      setLogoutStatus('logging-out');
      // Simulate logout process
      setTimeout(() => {
        setLogoutStatus('success');
        setTimeout(() => {
          setLocation("/login");
        }, 1000);
      }, 1000);
    }
  }, [user, showConfirmation, setLocation]);

  if (logoutStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12 px-6">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-center mb-2">Logged Out Successfully</h2>
            <p className="text-muted-foreground text-center mb-6">
              You have been securely logged out of LLAS.
            </p>
            <p className="text-sm text-muted-foreground text-center">
              Redirecting to login page...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (logoutStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 px-6">
            <div className="flex flex-col items-center justify-center mb-6">
              <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-center mb-2">Logout Error</h2>
              <p className="text-muted-foreground text-center">
                There was an issue logging out. You may need to clear your browser data.
              </p>
            </div>
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {logoutError?.message || "Unknown error occurred during logout."}
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => setLocation("/login")}
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (logoutStatus === 'logging-out') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12 px-6">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <h2 className="text-2xl font-bold text-center mb-2">Logging Out</h2>
            <p className="text-muted-foreground text-center">
              Please wait while we securely log you out...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Confirmation dialog
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <LogOut className="h-12 w-12 text-orange-500" />
          </div>
          <CardTitle className="text-2xl">Confirm Logout</CardTitle>
          <CardDescription>
            Are you sure you want to log out of LLAS?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Logging out will:
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• End your current session</li>
              <li>• Clear all cached data</li>
              <li>• Require you to log in again to access the system</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCancelLogout}
              className="flex-1"
              disabled={isLoggingOut}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmLogout}
              className="flex-1"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
