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
  Menu,
  Search,
  CreditCard
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

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
  const { state, setOpen, setOpenMobile, isMobile } = useSidebar();

  const toggleExpanded = (itemTitle: string) => {
    // If sidebar is collapsed, expand it first
    if (state === "collapsed") {
      if (isMobile) {
        setOpenMobile(true);
      } else {
        setOpen(true);
      }
    }
    
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
    <Sidebar variant="inset" collapsible="icon">
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
                  <span className="truncate font-semibold group-data-[collapsible=icon]:hidden">HRMSTech</span>
                  <span className="truncate text-xs group-data-[collapsible=icon]:hidden">Admin Portal</span>
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
                  <span className="group-data-[collapsible=icon]:hidden">Dashboard</span>
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
                   <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                   <ChevronRight 
                     className={`ml-auto h-4 w-4 transition-transform group-data-[collapsible=icon]:hidden ${
                       expandedItem === item.title ? 'rotate-90' : ''
                     }`} 
                   />
                 </SidebarMenuButton>
                 {expandedItem === item.title && (
                   <div className="ml-6 space-y-1 mt-2 group-data-[collapsible=icon]:hidden">
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
                  <span className="truncate font-semibold group-data-[collapsible=icon]:hidden">Admin User</span>
                  <span className="truncate text-xs group-data-[collapsible=icon]:hidden">admin@company.com</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut />
              <span className="group-data-[collapsible=icon]:hidden">Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

// Command Menu Component
function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push("/admin"))}>
            <LayoutDashboard />
            <span>Dashboard</span>
            <CommandShortcut>⌘D</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/admin/employees"))}>
            <Users />
            <span>Employees</span>
            <CommandShortcut>⌘E</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/admin/employees/invite"))}>
            <UserPlus />
            <span>Invite Employee</span>
            <CommandShortcut>⌘I</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/admin/leave"))}>
            <Calendar />
            <span>Leave Management</span>
            <CommandShortcut>⌘L</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => runCommand(() => router.push("/admin/settings/company"))}>
            <Settings />
            <span>Company Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/admin/settings/administration"))}>
            <Shield />
            <span>System Administration</span>
            <CommandShortcut>⌘A</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Tools">
          <CommandItem onSelect={() => runCommand(() => router.push("/admin/reports"))}>
            <BarChart3 />
            <span>Reports & Analytics</span>
            <CommandShortcut>⌘R</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/admin/payroll"))}>
            <CreditCard />
            <span>Payroll</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

// Main layout component
export function AdminSidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="" />
          <Button
            variant="outline"
            className="relative h-8 w-full justify-start rounded-[0.5rem] bg-background text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64"
            onClick={() => {
              const event = new KeyboardEvent("keydown", {
                key: "k",
                metaKey: true,
              });
              document.dispatchEvent(event);
            }}
          >
            <Search className="mr-2 h-4 w-4" />
            <span className="hidden lg:inline-flex">Search...</span>
            <span className="inline-flex lg:hidden">Search</span>
            <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {children}
        </div>
        <CommandMenu />
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
