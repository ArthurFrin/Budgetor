// components/MainLayout.tsx
import { Link, Outlet, useNavigate, useLocation } from "react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider
} from "./ui/sidebar";
import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Plus, Tag, LogOut, ReceiptEuro } from "lucide-react";
import logo from "../assets/logo.webp"; // Assuming you have a logo.svg in your assets folder
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";

export default function MainLayout() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActivePath = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const getLinkClasses = (path: string) => {
    return cn(
      "group relative px-3 py-2.5 my-1 flex items-center gap-3 transition-all duration-200 font-medium",
      isActivePath(path)
        ? "bg-primary/10"
        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
    );
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3 py-4">
            <img src={logo} alt="logo" className="w-10 h-8 object-cover rounded-md" />
            <h2 className=" font-semibold text-foreground">Budgetor</h2>
          </div>
        </SidebarHeader>
        <SidebarContent className="py-4">
          <nav className="flex flex-col gap-1">
            <Link to="/" className={getLinkClasses("/")}>
              <LayoutGrid className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            <Link to="/purchase/new" className={getLinkClasses("/purchase/new")}>
              <Plus className="h-5 w-5" />
              <span>Ajouter une dépense</span>
            </Link>
            <Link to="/purchases" className={getLinkClasses("/purchases")}>
              <ReceiptEuro className="h-5 w-5" />
              <span>Mes dépenses</span>
            </Link>
            <Link to="/categories" className={getLinkClasses("/categories")}>
              <Tag className="h-5 w-5" />
              <span>Mes catégories</span>
            </Link>
          </nav>
        </SidebarContent>
        <div className="mt-auto p-4 border-t border-border/40 bg-background/95">
          {user && (
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <div className="text-xs text-muted-foreground tracking-wide">
                  Connecté en tant que
                </div>
                <div className="font-medium text-sm text-foreground truncate">
                  {user.name ?? user.email}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 justify-start gap-2 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Se déconnecter
              </Button>
            </div>
          )}
        </div>
      </Sidebar>
      <SidebarInset>
        <main>
          <Outlet />
        </main>
      </SidebarInset>
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            zIndex: 10000,
          },
          classNames: {
            success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200',
            error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200',
            info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200',
            warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200',
          },
        }}
      />
    </SidebarProvider>
  );
}
