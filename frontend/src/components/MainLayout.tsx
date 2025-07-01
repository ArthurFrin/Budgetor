// components/MainLayout.tsx
import { Outlet } from "react-router"
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarInset, 
  SidebarProvider 
} from "./ui/sidebar"

export default function MainLayout() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <h2 className="text-lg font-semibold">Navigation</h2>
        </SidebarHeader>
        <SidebarContent>
          {/* Add your sidebar content here */}
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <main className="p-4">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
