"use client"

import * as React from "react"
import {
  Activity,
  Bot,
  Brain,
  CreditCard,
  Heart,
  HeartHandshake,
  Package,
  Settings2,
  Shield,
  Stethoscope,
  Users,
  Wallet,
  Bell,
  BarChart3,
  MessageSquare,
  Calendar,
  FileText,
  User,
  Baby,
  HelpCircle,
  Smartphone,
  ShoppingCart,
  Video,
} from "lucide-react"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavProjects } from "@/components/sidebar/nav-projects"
import { NavUser } from "@/components/sidebar/nav-user"
import { TeamSwitcher } from "@/components/sidebar/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useAuth } from "@/lib/auth-context"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()

  // User navigation items
  const userNavItems = [
    {
      title: "Dashboard",
      url: "/user/dashboard",
      icon: Activity,
      items: [
        {
          title: "Health Vitals",
          url: "/user/dashboard",
        },
        {
          title: "Overview",
          url: "/user/dashboard/overview",
        },
      ],
    },
    {
      title: "AI Assistant",
      url: "/user/medibot",
      icon: Bot,
      items: [
        {
          title: "Chat with Medibot",
          url: "/user/medibot",
        },
        {
          title: "Subscribe",
          url: "/subscribe",
        },
      ],
    },
    {
      title: "Health Services",
      url: "/user/wellness",
      icon: BarChart3,
      items: [
        {
          title: "Wellness Insights",
          url: "/user/wellnessinsights",
        },
        {
          title: "Doctor Connect",
          url: "/user/doctorconnect",
        },
        {
          title: "Core Care Plan",
          url: "/user/corecareplan",
        },
        {
          title: "Mother Care 360",
          url: "/user/mothercare360",
        },
      ],
    },
    {
      title: "Products",
      url: "/user/products",
      icon: Package,
      items: [
        {
          title: "BioWear",
          url: "/user/biowear",
        },
        {
          title: "SyncApp",
          url: "/user/syncapp",
        },
      ],
    },
    {
      title: "Alerts",
      url: "/user/alerts",
      icon: Bell,
    },
    {
      title: "Resources",
      url: "/user/resources",
      icon: HelpCircle,
      items: [
        {
          title: "FAQs",
          url: "/user/faqs",
        },
        {
          title: "Home",
          url: "/user/home",
        },
      ],
    },
  ]

  // Doctor navigation items
  const doctorNavItems = [
    {
      title: "Dashboard",
      url: "/doctor/dashboard",
      icon: Activity,
      isActive: true,
      items: [
        {
          title: "Overview",
          url: "/doctor/dashboard",
        },
      ],
    },
    {
      title: "Appointments",
      url: "/doctor/appointments",
      icon: Calendar,
      items: [
        {
          title: "All Appointments",
          url: "/doctor/appointments",
        },
      ],
    },
    {
      title: "Wallet",
      url: "/doctor/wallet",
      icon: Wallet,
      items: [
        {
          title: "Overview",
          url: "/doctor/wallet",
        },
      ],
    },
    {
      title: "Video Consultations",
      url: "/doctor/meet",
      icon: Video,
    },
    {
      title: "Alerts",
      url: "/doctor/alerts",
      icon: Bell,
    },
  ]

  // User projects/quick access
  const userProjects = [
    {
      name: "Emergency Contacts",
      url: "/user/emergency",
      icon: Shield,
    },
    {
      name: "Health Records",
      url: "/user/records",
      icon: FileText,
    },
  ]


  // Determine which navigation to show based on user type
  const navItems = user?.user_type === 'doctor' ? doctorNavItems : userNavItems
  const projects = user?.user_type === 'doctor' ? doctorProjects : userProjects

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
        <NavProjects projects={projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}