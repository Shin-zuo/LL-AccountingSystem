import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  BookOpen,
  FileSpreadsheet,
  BarChart3,
  Settings,
  Users,
  LogOut,
  Crown,
  FileText,
  Wallet,
} from "lucide-react";
import { hasPermission, type Permission, type UserRole } from "@shared/schema";

type NavItem = {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  permission?: Permission;
};

const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Cash Receipts",
    url: "/receipts",
    icon: Receipt,
    permission: "cashReceipts",
  },
  {
    title: "Cash Disbursements",
    url: "/disbursements",
    icon: CreditCard,
    permission: "cashDisbursements",
  },
  {
    title: "Chart of Accounts",
    url: "/accounts",
    icon: BookOpen,
    permission: "chartOfAccounts",
  },
];

const reportNavItems: NavItem[] = [
  {
    title: "Journal-Ledger",
    url: "/journal",
    icon: FileSpreadsheet,
    permission: "journalLedger",
  },
  {
    title: "VAT Books",
    url: "/vat-books",
    icon: FileSpreadsheet,
    permission: "vatBooks",
  },
  {
    title: "Financial Reports",
    url: "/reports",
    icon: BarChart3,
    permission: "financialReports",
  },
  {
    title: "BIR Reports",
    url: "/bir-reports",
    icon: FileText,
    permission: "birReports",
  },
];

const adminNavItems: NavItem[] = [
  {
    title: "Payroll",
    url: "/payroll",
    icon: Wallet,
    permission: "payroll",
  },
  {
    title: "User Management",
    url: "/users",
    icon: Users,
    permission: "userManagement",
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    permission: "settings",
  },
  {
    title: "Subscription",
    url: "/subscription",
    icon: Crown,
    permission: "settings",
  },
];

// Helper to format role name for display
function formatRoleName(role: string): string {
  return role
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const userRole = (user?.role || "accountant") as UserRole;
  
  // Filter nav items based on user permissions
  const canAccess = (item: NavItem) => {
    if (!item.permission) return true;
    return hasPermission(userRole, item.permission);
  };
  
  const visibleMainItems = mainNavItems.filter(canAccess);
  const visibleReportItems = reportNavItems.filter(canAccess);
  const visibleAdminItems = adminNavItems.filter(canAccess);
  
  const initials = user?.firstName && user?.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "U";

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-7 w-7 text-sidebar-primary" />
          <div className="flex flex-col">
            <span className="text-lg font-semibold">LLAS</span>
            <span className="text-xs text-muted-foreground">Accounting System</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {visibleMainItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleMainItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {visibleReportItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Reports</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleReportItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {visibleAdminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleAdminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user?.email || "User"}
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {formatRoleName(user?.role || "accountant")}
              </Badge>
            </div>
          </div>
          <Link href="/logout" data-testid="button-logout">
            <LogOut className="h-4 w-4 text-muted-foreground transition-colors hover:text-foreground" />
          </Link>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
