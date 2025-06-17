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
    },
    {
      title: "Wellness Insights",
      url: "/user/wellness",
      icon: BarChart3,
    },
    {
      title: "Doctor Connect",
      url: "/user/doctors",
      icon: Stethoscope,
    },
    {
      title: "Core Care Plan",
      url: "/user/care-plan",
      icon: HeartHandshake,
    },
    {
      title: "MediBot",
      url: "/user/medibot",
      icon: Bot,
    },
    {
      title: "Products",
      url: "/user/products",
      icon: Package,
    },
    {
      title: "Wallet",
      url: "/user/wallet",
      icon: Wallet,
    },
    {
      title: "Alerts",
      url: "/user/alerts",
      icon: Bell,
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
        {
          title: "Today's Schedule",
          url: "/doctor/dashboard/schedule",
        },
      ],
    },
    {
      title: "Patients",
      url: "/doctor/patients",
      icon: Users,
      items: [
        {
          title: "All Patients",
          url: "/doctor/patients",
        },
        {
          title: "Active Cases",
          url: "/doctor/patients/active",
        },
        {
          title: "Patient Records",
          url: "/doctor/patients/records",
        },
      ],
    },
    {
      title: "Appointments",
      url: "/doctor/appointments",
      icon: Calendar,
      items: [
        {
          title: "Schedule",
          url: "/doctor/appointments/schedule",
        },
        {
          title: "Pending Requests",
          url: "/doctor/appointments/requests",
        },
        {
          title: "History",
          url: "/doctor/appointments/history",
        },
      ],
    },
    {
      title: "Consultations",
      url: "/doctor/consultations",
      icon: MessageSquare,
      items: [
        {
          title: "Video Calls",
          url: "/doctor/consultations/video",
        },
        {
          title: "Chat",
          url: "/doctor/consultations/chat",
        },
        {
          title: "Follow-ups",
          url: "/doctor/consultations/followups",
        },
      ],
    },
    {
      title: "Medical Records",
      url: "/doctor/records",
      icon: FileText,
      items: [
        {
          title: "Patient Files",
          url: "/doctor/records/files",
        },
        {
          title: "Prescriptions",
          url: "/doctor/records/prescriptions",
        },
        {
          title: "Lab Results",
          url: "/doctor/records/lab-results",
        },
      ],
    },
    {
      title: "Settings",
      url: "/doctor/settings",
      icon: Settings2,
      items: [
        {
          title: "Profile",
          url: "/doctor/settings/profile",
        },
        {
          title: "Availability",
          url: "/doctor/settings/availability",
        },
        {
          title: "Preferences",
          url: "/doctor/settings/preferences",
        },
      ],
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

  // Doctor projects/quick access
  const doctorProjects = [
    {
      name: "Medical Guidelines",
      url: "/doctor/guidelines",
      icon: Brain,
    },
    {
      name: "Research Papers",
      url: "/doctor/research",
      icon: FileText,
    },
    {
      name: "Continuing Education",
      url: "/doctor/education",
      icon: Settings2,
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