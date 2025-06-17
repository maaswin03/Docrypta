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
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
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
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0 w-full overflow-hidden">
            {/* Latest Vitals Summary */}
            <LatestVitalsSummary />

            {/* ECG Graph - Full width */}
            <div className="w-full">
              <Ecggraph />
            </div>

            {/* Main vitals - Responsive grid with proper constraints */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 w-full">
              <div className="w-full min-w-0">
                <Heartgraph />
              </div>
              <div className="w-full min-w-0">
                <Spo2graph />
              </div>
              <div className="w-full min-w-0">
                <Temperaturegraph />
              </div>
              <div className="w-full min-w-0">
                <Respiratoryrategraph />
              </div>
              <div className="w-full min-w-0">
                <Glucosegraph />
              </div>
              <div className="w-full min-w-0">
                <Activitylevelgraph />
              </div>
            </div>

            {/* Blood pressure - Full width */}
            <div className="w-full">
              <Bloodpressurgraph />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}