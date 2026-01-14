import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Building2,
  Save,
} from "lucide-react";
import type { Company } from "@shared/schema";

const companyFormSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  address: z.string().optional(),
  tin: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companyFormSchema>;

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: company, isLoading } = useQuery<Company>({
    queryKey: ["/api/company"],
  });

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      address: "",
      tin: "",
    },
  });

  // Update form when company data loads
  useEffect(() => {
    if (company && !form.formState.isDirty) {
      form.reset({
        name: company.name,
        address: company.address || "",
        tin: company.tin || "",
      });
    }
  }, [company, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      await apiRequest("PATCH", "/api/company", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company"] });
      toast({
        title: "Settings saved",
        description: "Company information has been updated.",
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
        description: "Failed to save settings.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CompanyFormData) => {
    updateMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Manage your company settings and preferences</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Information
            </CardTitle>
            <CardDescription>
              This information will appear on your Excel reports and vouchers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Juan's Sari-Sari Store" 
                          {...field} 
                          disabled={!isAdmin}
                          data-testid="input-company-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., 123 Rizal St., Barangay Centro" 
                          {...field} 
                          disabled={!isAdmin}
                          data-testid="input-company-address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Identification Number (TIN)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., 123-456-789-000" 
                          {...field} 
                          disabled={!isAdmin}
                          data-testid="input-company-tin"
                        />
                      </FormControl>
                      <FormDescription>
                        Your BIR-registered TIN for tax compliance
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {isAdmin && (
                  <Button 
                    type="submit" 
                    className="gap-2"
                    disabled={updateMutation.isPending}
                    data-testid="button-save-company"
                  >
                    <Save className="h-4 w-4" />
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                )}
                {!isAdmin && (
                  <p className="text-sm text-muted-foreground">
                    Only administrators can edit company settings.
                  </p>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>
              Your personal account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <p className="text-sm text-muted-foreground">{user?.email || "Not set"}</p>
            </div>
            <Separator />
            <div>
              <label className="text-sm font-medium">Name</label>
              <p className="text-sm text-muted-foreground">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : "Not set"}
              </p>
            </div>
            <Separator />
            <div>
              <label className="text-sm font-medium">Role</label>
              <p className="text-sm text-muted-foreground capitalize">{user?.role || "User"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
