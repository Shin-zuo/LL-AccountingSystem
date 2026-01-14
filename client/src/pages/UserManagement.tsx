 import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { formatDate } from "@/lib/currency";
import {
  Users,
  Search,
  Shield,
  User,
  CheckCircle,
  Calculator,
  FileText,
  Wallet,
  Crown,
  UserPlus,
  RotateCcw,
} from "lucide-react";
import type { User as UserType } from "@shared/schema";
import { USER_ROLES } from "@shared/schema";

const createUserFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.string().min(1, "Please select a role"),
});

type CreateUserFormData = z.infer<typeof createUserFormSchema>;

export default function UserManagement() {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [newRole, setNewRole] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [userToReset, setUserToReset] = useState<UserType | null>(null);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const { checkPermission } = usePermissions();
  const canManageUsers = checkPermission("userManagement");

  const createUserForm = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      role: "",
    },
  });

  const onCreateUserSubmit = (data: CreateUserFormData) => {
    createUserMutation.mutate(data);
  };

  const { data: users, isLoading } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await apiRequest("PATCH", `/api/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsDialogOpen(false);
      setSelectedUser(null);
      toast({
        title: "Role updated",
        description: "User role has been updated successfully.",
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
        description: "Failed to update user role.",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("PATCH", `/api/users/${userId}/reset-password`);
    },
    onSuccess: () => {
      setIsResetPasswordDialogOpen(false);
      setUserToReset(null);
      toast({
        title: "Password reset",
        description: "User password has been reset to default successfully.",
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
        description: "Failed to reset user password.",
        variant: "destructive",
      });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserFormData) => {
      await apiRequest("POST", "/api/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsCreateUserDialogOpen(false);
      createUserForm.reset();
      toast({
        title: "User created",
        description: "New user has been created successfully.",
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
        description: "Failed to create user.",
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users?.filter(
    (u) =>
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      u.lastName?.toLowerCase().includes(search.toLowerCase())
  );

  const openRoleDialog = (user: UserType) => {
    setSelectedUser(user);
    setNewRole(user.role || USER_ROLES.ACCOUNTANT);
    setIsDialogOpen(true);
  };

  const openResetPasswordDialog = (user: UserType) => {
    setUserToReset(user);
    setIsResetPasswordDialogOpen(true);
  };

  const handleUpdateRole = () => {
    if (selectedUser && newRole) {
      updateRoleMutation.mutate({ userId: selectedUser.id, role: newRole });
    }
  };

  const handleResetPassword = () => {
    if (userToReset) {
      resetPasswordMutation.mutate(userToReset.id);
    }
  };

  const formatRoleName = (role: string) => {
    return role
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case USER_ROLES.GENERAL_MANAGER:
        return <Badge className="bg-primary/10 text-primary"><Crown className="mr-1 h-3 w-3" />General Manager</Badge>;
      case USER_ROLES.COMPTROLLER:
        return <Badge className="bg-primary/10 text-primary"><Shield className="mr-1 h-3 w-3" />Comptroller</Badge>;
      case USER_ROLES.ACCOUNTANT:
        return <Badge variant="secondary"><Calculator className="mr-1 h-3 w-3" />Accountant</Badge>;
      case USER_ROLES.TAX_COMPLIANCE_OFFICER:
        return <Badge variant="secondary"><FileText className="mr-1 h-3 w-3" />Tax Officer</Badge>;
      case USER_ROLES.PAYROLL_OFFICER:
        return <Badge variant="secondary"><Wallet className="mr-1 h-3 w-3" />Payroll Officer</Badge>;
      default:
        return <Badge variant="outline"><User className="mr-1 h-3 w-3" />{formatRoleName(role)}</Badge>;
    }
  };

  const getInitials = (user: UserType) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || "U";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">User Management</h1>
        <p className="text-muted-foreground">Manage user access and permissions</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Users
              </CardTitle>
              <CardDescription>
                {users?.length || 0} users in your company
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              {canManageUsers && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setIsCreateUserDialogOpen(true)}
                >
                  <UserPlus className="h-4 w-4" />
                  Add New User
                </Button>
              )}
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-users"
                />
              </div>
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
          ) : filteredUsers && filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={user.profileImageUrl || undefined} />
                            <AvatarFallback>{getInitials(user)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {user.firstName && user.lastName 
                                ? `${user.firstName} ${user.lastName}`
                                : "No name set"}
                            </p>
                            {user.id === currentUser?.id && (
                              <Badge variant="outline" className="text-xs">You</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email || "No email"}</TableCell>
                      <TableCell>{getRoleBadge(user.role || "user")}</TableCell>
                      <TableCell>{user.createdAt ? formatDate(user.createdAt) : "-"}</TableCell>
                      <TableCell>
                        {user.id !== currentUser?.id && (
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openRoleDialog(user)}
                              data-testid={`button-edit-role-${user.id}`}
                            >
                              Edit Role
                            </Button>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openResetPasswordDialog(user)}
                                    disabled={resetPasswordMutation.isPending}
                                    data-testid={`button-reset-password-${user.id}`}
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Reset Password</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-16 w-16 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No users found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Users will appear here when they sign up
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role Descriptions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">General Manager</p>
              <p className="text-sm text-muted-foreground">
                Full access to all features including user management, company settings, and subscription management. Can approve all transactions.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Comptroller</p>
              <p className="text-sm text-muted-foreground">
                Full access to all accounting functions, reports, and VAT books. Can approve transactions but cannot manage users.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">Accountant</p>
              <p className="text-sm text-muted-foreground">
                Can manage cash receipts, disbursements, chart of accounts, journal-ledger, and VAT books. Cannot approve transactions.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">Tax Compliance Officer</p>
              <p className="text-sm text-muted-foreground">
                Can view financial reports, BIR reports, and VAT books. Focus on tax compliance and reporting.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">Payroll Officer</p>
              <p className="text-sm text-muted-foreground">
                Can manage employee records, payroll periods, and payroll computations. Limited to payroll functions only.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedUser?.firstName || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">New Role</label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="mt-2" data-testid="select-new-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={USER_ROLES.GENERAL_MANAGER}>General Manager</SelectItem>
                <SelectItem value={USER_ROLES.COMPTROLLER}>Comptroller</SelectItem>
                <SelectItem value={USER_ROLES.ACCOUNTANT}>Accountant</SelectItem>
                <SelectItem value={USER_ROLES.TAX_COMPLIANCE_OFFICER}>Tax Compliance Officer</SelectItem>
                <SelectItem value={USER_ROLES.PAYROLL_OFFICER}>Payroll Officer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateRole}
              disabled={updateRoleMutation.isPending}
              data-testid="button-confirm-role-change"
            >
              {updateRoleMutation.isPending ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account for your company. They will receive an email invitation to set up their password.
            </DialogDescription>
          </DialogHeader>
          <Form {...createUserForm}>
            <form onSubmit={createUserForm.handleSubmit(onCreateUserSubmit)} className="space-y-4">
              <FormField
                control={createUserForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="user@example.com"
                        {...field}
                        data-testid="input-new-user-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createUserForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John"
                          {...field}
                          data-testid="input-new-user-firstname"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createUserForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Doe"
                          {...field}
                          data-testid="input-new-user-lastname"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={createUserForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-new-user-role">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={USER_ROLES.ACCOUNTANT}>Accountant</SelectItem>
                        <SelectItem value={USER_ROLES.TAX_COMPLIANCE_OFFICER}>Tax Compliance Officer</SelectItem>
                        <SelectItem value={USER_ROLES.PAYROLL_OFFICER}>Payroll Officer</SelectItem>
                        <SelectItem value={USER_ROLES.COMPTROLLER}>Comptroller</SelectItem>
                        <SelectItem value={USER_ROLES.GENERAL_MANAGER}>General Manager</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateUserDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  data-testid="button-create-user"
                >
                  {createUserMutation.isPending ? "Creating..." : "Create User"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset the password for {userToReset?.firstName || userToReset?.email}? 
              This will reset their password to the default and they will need to set a new one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetPassword}
              disabled={resetPasswordMutation.isPending}
              data-testid="button-confirm-reset-password"
            >
              {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
