"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { 
  LayoutDashboard,
  Users,
  UserPlus,
  Briefcase,
  Clock,
  Calendar,
  DollarSign,
  TrendingUp,
  GraduationCap,
  Building2,
  Shield,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  Menu
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

// Menu items data
const menuItems = [
  {
    title: "Employee Management",
    icon: Users,
    items: [
      {
        title: "Employees",
        url: "/admin/employees",
        icon: Users,
      },
      {
        title: "Invites",
        url: "/admin/invites",
        icon: UserPlus,
      },
      {
        title: "Recruitment",
        url: "/admin/recruitment",
        icon: Briefcase,
      },
    ],
  },
  {
    title: "Time & Attendance",
    icon: Clock,
    items: [
      {
        title: "Time & Attendance",
        url: "/admin/time",
        icon: Clock,
      },
      {
        title: "Leave",
        url: "/admin/leave",
        icon: Calendar,
      },
    ],
  },
  {
    title: "Compensation",
    icon: DollarSign,
    items: [
      {
        title: "Payroll",
        url: "/admin/payroll",
        icon: DollarSign,
      },
    ],
  },
  {
    title: "Performance & Development",
    icon: TrendingUp,
    items: [
      {
        title: "Performance",
        url: "/admin/performance",
        icon: TrendingUp,
      },
      {
        title: "Learning & Development",
        url: "/admin/learning",
        icon: GraduationCap,
      },
    ],
  },
  {
    title: "Organization",
    icon: Building2,
    items: [
      {
        title: "Departments",
        url: "/admin/organization/departments",
        icon: Building2,
      },
      {
        title: "Roles",
        url: "/admin/roles",
        icon: Shield,
      },
    ],
  },
  {
    title: "Reports & Tools",
    icon: BarChart3,
    items: [
      {
        title: "Reports & Analytics",
        url: "/admin/reports",
        icon: BarChart3,
      },
      {
        title: "Templates",
        url: "/admin/templates",
        icon: FileText,
      },
    ],
  },
  {
    title: "Settings",
    icon: Settings,
    items: [
      {
        title: "Company Settings",
        url: "/admin/settings/company",
        icon: Settings,
      },
      {
        title: "System Administration",
        url: "/admin/settings/administration",
        icon: Shield,
      },
    ],
  },
];

// App sidebar component
function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedItem, setExpandedItem] = React.useState<string | null>(null);

  const toggleExpanded = (itemTitle: string) => {
    setExpandedItem(prev => {
      // If clicking the same item, collapse it
      if (prev === itemTitle) {
        return null;
      }
      // Otherwise, expand the new item (this will collapse the previous one)
      return itemTitle;
    });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-secondery text-primary-foreground">
                  <Image 
                    src="/images/logo/logo.png" 
                    alt="HRMSTech Logo" 
                    width={20} 
                    height={20} 
                    className="rounded" 
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">HRMSTech</span>
                  <span className="truncate text-xs">Admin Portal</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Dashboard - Standalone */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === "/admin"}
              >
                <Link href="/admin">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

         {/* Other Menu Groups */}
         <SidebarGroup>
           <SidebarMenu>
             {menuItems.map((item) => (
               <SidebarMenuItem key={item.title} className="mb-4">
                 <SidebarMenuButton onClick={() => toggleExpanded(item.title)}>
                   <item.icon />
                   <span>{item.title}</span>
                   <ChevronRight 
                     className={`ml-auto h-4 w-4 transition-transform ${
                       expandedItem === item.title ? 'rotate-90' : ''
                     }`} 
                   />
                 </SidebarMenuButton>
                 {expandedItem === item.title && (
                   <div className="ml-6 space-y-1 mt-2">
                     {item.items?.map((subItem) => (
                       <SidebarMenuButton 
                         key={subItem.title} 
                         asChild 
                         size="sm" 
                         className="h-8"
                         isActive={pathname === subItem.url}
                       >
                         <Link href={subItem.url}>
                           <subItem.icon />
                           <span>{subItem.title}</span>
                         </Link>
                       </SidebarMenuButton>
                     ))}
                   </div>
                 )}
               </SidebarMenuItem>
             ))}
           </SidebarMenu>
         </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-avatar.jpg" />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Admin User</span>
                  <span className="truncate text-xs">admin@company.com</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

// Main layout component
export function AdminSidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Admin Portal</h1>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}

// Mobile sidebar trigger component
export function MobileSidebarTrigger() {
  return (
    <Button variant="ghost" size="icon" className="md:hidden">
      <Menu className="h-5 w-5" />
      <span className="sr-only">Toggle sidebar</span>
    </Button>
  );
}

export default AppSidebar;
