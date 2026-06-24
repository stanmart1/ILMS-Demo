import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  ArrowRightLeft,
  BookMarked,
  ShoppingCart,
  Newspaper,
  Search,
  FileBarChart,
  Settings,
  Library,
  Moon,
  Sun,
  Bell,
  LogOut,
  User,
  CheckCheck,
  BookOpen,
} from "lucide-react";

import appCss from "../styles.css?url";
import { reportError } from "../lib/error-reporting";
import { AuthProvider, useAuth } from "../lib/auth";
import { ThemeProvider, useTheme } from "../lib/theme";
import { notifications as initialNotifications } from "../lib/mock-data";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { GlossaryDialog } from "./glossary";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link to="/" className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn&apos;t load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong.</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Athenaeum — Library Management System" },
      { name: "description", content: "Integrated library system: circulation, cataloging, acquisitions, serials, OPAC, reports, and admin." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/circulation", label: "Circulation", icon: ArrowRightLeft },
  { to: "/cataloging", label: "Cataloging", icon: BookMarked },
  { to: "/acquisitions", label: "Acquisitions", icon: ShoppingCart },
  { to: "/serials", label: "Serials", icon: Newspaper },
  { to: "/opac", label: "OPAC", icon: Search },
  { to: "/reports", label: "Reports", icon: FileBarChart },
  { to: "/admin", label: "Administration", icon: Settings },
  { to: "/glossary", label: "Glossary", icon: BookOpen },
] as const;

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggle} title="Toggle dark mode">
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

function NotificationBell() {
  const [notes, setNotes] = useState(initialNotifications);
  const unread = notes.filter((n) => !n.read).length;
  const iconMap: Record<string, string> = {
    overdue: "🔴", hold_ready: "📦", renewal: "🔄", system: "⚙️", acquisition: "📋",
  };

  const markAll = () => setNotes((prev) => prev.map((n) => ({ ...n, read: true })));
  const markOne = (id: string) => setNotes((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[calc(100vw-2rem)] sm:w-96 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="font-serif font-semibold">Notifications</div>
          <div className="flex items-center gap-2">
            {unread > 0 && <Badge variant="secondary">{unread} new</Badge>}
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAll}>
              <CheckCheck className="mr-1 h-3.5 w-3.5" /> Mark all read
            </Button>
          </div>
        </div>
        <div className="max-h-[380px] overflow-y-auto divide-y divide-border">
          {notes.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">All caught up!</div>
          ) : (
            notes.map((n) => (
              <div
                key={n.id}
                onClick={() => markOne(n.id)}
                className={`flex cursor-pointer items-start gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/50 ${!n.read ? "bg-accent/5" : ""}`}
              >
                <span className="mt-0.5 text-base">{iconMap[n.type]}</span>
                <div className="min-w-0 flex-1">
                  <div className={`font-medium leading-snug ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{n.message}</div>
                  <div className="mt-1 text-xs text-muted-foreground/70">{n.date}</div>
                </div>
                {!n.read && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = user ? user.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() : "??";

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-semibold hover:opacity-80 transition-opacity">
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>
          <div className="font-medium">{user?.name}</div>
          <div className="text-xs text-muted-foreground font-normal">{user?.role} · {user?.branch}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/admin" className="flex items-center gap-2">
            <User className="h-4 w-4" /> My profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Library className="h-4 w-4" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-serif text-sm font-semibold leading-tight">Athenaeum</span>
            <span className="text-xs text-sidebar-foreground/60 leading-tight">Library System</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Modules</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                      <Link to={item.to}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-1 text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
          <div className="h-2 w-2 rounded-full bg-success" />
          <span>All systems operational</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function AuthGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  const PUBLIC_PATHS = ["/login", "/glossary"];

  useEffect(() => {
    if (!user && !PUBLIC_PATHS.includes(pathname)) navigate({ to: "/login" });
    if (user && pathname === "/login") navigate({ to: "/" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, pathname, navigate]);

  if (!user && !PUBLIC_PATHS.includes(pathname)) return null;
  return <>{children}</>;
}

function AppLayout() {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  if (pathname === "/login" || !user) {
    return <Outlet />;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
          <SidebarTrigger />
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-2">
            <span className="font-serif text-sm font-semibold tracking-tight">Athenaeum</span>
            <span className="hidden text-xs text-muted-foreground sm:inline">— {user.staffBranch} Branch</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Logged in as <span className="font-medium text-foreground">{user.name.split(" ").map((p, i) => i === 0 ? p[0] + "." : p).join(" ")}</span>
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setGlossaryOpen(true)}
              title="Library Glossary"
            >
              <BookOpen className="h-4 w-4" />
            </Button>
            <ThemeToggle />
            <NotificationBell />
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </SidebarInset>
      <GlossaryDialog open={glossaryOpen} onOpenChange={setGlossaryOpen} />
    </SidebarProvider>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <AuthGate>
            <AppLayout />
          </AuthGate>
          <Toaster richColors position="top-right" />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
