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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DownloadCloud, Smartphone } from "lucide-react";

export default function Syncapp() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 border-b">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/syncapp">Products</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold">
                  SyncApp
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex flex-col items-center justify-center gap-6 text-center py-12">
              <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-primary/10 animate-pulse"></div>
                <div className="relative p-4 rounded-full bg-primary/5 border border-primary/10">
                  <Smartphone
                    className="h-10 w-10 text-primary"
                    strokeWidth={1.5}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">
                  SyncApp Coming Soon
                </h1>
                <p className="text-muted-foreground max-w-md">
                  Our mobile application is currently in development and will be
                  available on the Play Store soon.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                <Button size="lg" className="w-full" disabled>
                  <DownloadCloud className="w-4 h-4 mr-2" />
                  Download for Android
                </Button>
              </div>

              <Badge variant="secondary" className="mt-2">
                Estimated launch: Nov 2025
              </Badge>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-3">Seamless Sync</h3>
              <p className="text-sm text-muted-foreground">
                Automatically sync your data across all devices in real-time
                with our secure cloud technology.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-3">Offline Access</h3>
              <p className="text-sm text-muted-foreground">
                Work without internet? No problem. Changes sync when you're back
                online.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-3">Cross-Platform</h3>
              <p className="text-sm text-muted-foreground">
                Available on Android now, with iOS and web versions coming soon.
              </p>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
