// components/MainLayout.tsx
import { Link, Outlet, useNavigate } from "react-router";
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
import { LayoutGrid, Plus, Tag, LogOut, Receipt } from "lucide-react";
import logo from "../assets/logo.webp"; // Assuming you have a logo.svg in your assets folder

export default function MainLayout() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center">
          <img src={logo} alt="logo" className="w-15 object-cover" />
          <h2 className="text-lg font-semibold">Balance ton compte</h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <Link to="/" className="p-2 hover:bg-gray-100 flex items-center space-x-2">
            <LayoutGrid />
            <span>Dashbord</span>
          </Link>
          <Link to="/purchase/new" className="p-2 hover:bg-gray-100 flex items-center space-x-2">
            <Plus />
            <span>Ajouter une dépense</span>
          </Link>
          <Link to="/purchases" className="p-2 hover:bg-gray-100 flex items-center space-x-2">
            <Receipt />
            <span>Mes dépenses</span>
          </Link>
          <Link to="/categories" className="p-2 hover:bg-gray-100 flex items-center space-x-2">
            <Tag />
            <span>Mes catégories</span>
          </Link>
        </SidebarContent>
        <div className="mt-auto p-4 border-t flex flex-col space-y-2">
          {user && (
            <>
              <div className="text-sm text-muted-foreground">
                Connecté en tant que
              </div>
              <div className="font-medium truncate">{user.name ?? user.email}</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-red-600 hover:bg-red-50 justify-start p-2 gap-2"
              >
                <LogOut className="h-4 w-4" />
                Se déconnecter
              </Button>
            </>
          )}
        </div>
      </Sidebar>
      <SidebarInset>
        <main>
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
