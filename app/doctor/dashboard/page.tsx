import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function Page() {
  return (
    <ProtectedRoute allowedRoles={['doctor']}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex flex-col h-screen overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">
                      Doctor Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Patient Management</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          
          {/* Main content area with proper height constraints */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-4 space-y-6 max-w-full">
              {/* Doctor dashboard content with fixed heights */}
              <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                <div className="h-[200px] rounded-xl bg-muted/50 flex items-center justify-center">
                  <span className="text-muted-foreground">Patient Overview</span>
                </div>
                <div className="h-[200px] rounded-xl bg-muted/50 flex items-center justify-center">
                  <span className="text-muted-foreground">Appointments</span>
                </div>
                <div className="h-[200px] rounded-xl bg-muted/50 flex items-center justify-center">
                  <span className="text-muted-foreground">Analytics</span>
                </div>
              </div>
              
              {/* Main content area */}
              <div className="h-[400px] rounded-xl bg-muted/50 flex items-center justify-center">
                <span className="text-muted-foreground">Patient Management Interface</span>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}