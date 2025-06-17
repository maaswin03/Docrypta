import { ProtectedRoute } from "@/components/auth/protected-route";
import { Activitylevelgraph } from "@/components/dashboard-user/activitylevelgraph";
import { Bloodpressurgraph } from "@/components/dashboard-user/bloodpressuregraph";
import { Ecggraph } from "@/components/dashboard-user/ecggraph";
import { Glucosegraph } from "@/components/dashboard-user/glucosegraph";
import { Heartgraph } from "@/components/dashboard-user/heartrategraph";
import { LatestVitalsSummary } from "@/components/dashboard-user/latest-vitals-summary";
import { Respiratoryrategraph } from "@/components/dashboard-user/respiratoryrategraph";
import { Spo2graph } from "@/components/dashboard-user/spo2graph";
import { Temperaturegraph } from "@/components/dashboard-user/temperaturegraph";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function Page() {
  return (
    <ProtectedRoute allowedRoles={['user']}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex flex-col min-h-screen overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">Patient Dashboard</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Health Vitals</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          
          {/* Main content area with proper scrolling */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-6 max-w-full">
              {/* Latest Vitals Summary */}
              <div className="w-full">
                <LatestVitalsSummary />
              </div>

              {/* ECG Graph - Full width with constrained height */}
              <div className="w-full">
                <div className="h-[350px] w-full">
                  <Ecggraph />
                </div>
              </div>

              {/* Main vitals - Responsive grid with fixed heights */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
                <div className="h-[300px] w-full">
                  <Heartgraph />
                </div>
                <div className="h-[300px] w-full">
                  <Spo2graph />
                </div>
                <div className="h-[300px] w-full">
                  <Temperaturegraph />
                </div>
                <div className="h-[300px] w-full">
                  <Respiratoryrategraph />
                </div>
                <div className="h-[300px] w-full">
                  <Glucosegraph />
                </div>
                <div className="h-[300px] w-full">
                  <Activitylevelgraph />
                </div>
              </div>

              {/* Blood pressure - Reduced height */}
              <div className="w-full">
                <div className="h-[280px] w-full">
                  <Bloodpressurgraph />
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}