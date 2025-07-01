// components/MainLayout.tsx
import { Outlet, useNavigate } from "react-router";
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
          <h2 className="text-lg font-semibold">Navigation</h2>
        </SidebarHeader>
        <SidebarContent>
          {/* Ajoute ton menu ici */}
        </SidebarContent>
        <div className="mt-auto p-4 border-t flex flex-col space-y-2">
          {user && (
            <>
              <div className="text-sm text-muted-foreground">
                Connecté en tant que
              </div>
              <div className="font-medium truncate">{user.name ?? user.email}</div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
              >
                Se déconnecter
              </Button>
            </>
          )}
        </div>
      </Sidebar>
      <SidebarInset>
        <main className="p-4">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
