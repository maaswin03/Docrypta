"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  SidebarInset, 
  SidebarProvider, 
  SidebarTrigger 
} from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { 
  DollarSign, 
  Calendar, 
  Star, 
  Users, 
  TrendingUp, 
  Clock,
  Activity,
  Stethoscope
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabaseClient"

interface DashboardStats {
  totalRevenue: number
  totalMeetings: number
  averageRating: number
  totalPatients: number
  pendingAppointments: number
  completedToday: number
}

interface RecentAppointment {
  id: string
  patient_name: string
  appointment_date: string
  status: string
  type: string
}

export default function DoctorDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalMeetings: 0,
    averageRating: 0,
    totalPatients: 0,
    pendingAppointments: 0,
    completedToday: 0
  })
  const [recentAppointments, setRecentAppointments] = useState<RecentAppointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return

      try {
        setIsLoading(true)
        setError(null)

        // Fetch total revenue from transactions
        const { data: transactions, error: transError } = await supabase
          .from('transactions')
          .select('amount, type')
          .eq('doctor_id', user.id)

        let totalRevenue = 0
        if (transactions && !transError) {
          totalRevenue = transactions
            .filter(t => t.type === 'received')
            .reduce((sum, t) => sum + Number(t.amount), 0)
        }

        // Fetch appointments data
        const { data: appointments, error: apptError } = await supabase
          .from('appointments')
          .select('*')
          .eq('doctor_id', user.id)

        let totalMeetings = 0
        let pendingAppointments = 0
        let completedToday = 0
        let totalPatients = 0

        if (appointments && !apptError) {
          totalMeetings = appointments.filter(a => a.status === 'completed').length
          pendingAppointments = appointments.filter(a => a.status === 'pending').length
          
          const today = new Date().toISOString().split('T')[0]
          completedToday = appointments.filter(a => 
            a.status === 'completed' && 
            a.appointment_date?.startsWith(today)
          ).length

          // Count unique patients
          const uniquePatients = new Set(appointments.map(a => a.patient_id))
          totalPatients = uniquePatients.size
        }

        // Fetch average rating from feedback
        const { data: feedback, error: feedbackError } = await supabase
          .from('feedback')
          .select('rating')
          .eq('doctor_id', user.id)

        let averageRating = 0
        if (feedback && !feedbackError && feedback.length > 0) {
          const totalRating = feedback.reduce((sum, f) => sum + Number(f.rating), 0)
          averageRating = totalRating / feedback.length
        }

        // Get recent appointments with patient names
        const { data: recentAppts, error: recentError } = await supabase
          .from('appointments')
          .select(`
            id,
            patient_name,
            appointment_date,
            status,
            type
          `)
          .eq('doctor_id', user.id)
          .order('appointment_date', { ascending: false })
          .limit(5)

        setStats({
          totalRevenue,
          totalMeetings,
          averageRating: Math.round(averageRating * 10) / 10,
          totalPatients,
          pendingAppointments,
          completedToday
        })

        setRecentAppointments(recentAppts || [])

      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError('Failed to load dashboard data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [user?.id])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'accepted': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['doctor']}>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="flex items-center justify-center h-screen">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Loading dashboard...</p>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </ProtectedRoute>
    )
  }

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
                    <BreadcrumbLink href="/doctor/dashboard">
                      Doctor Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Overview</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-6 space-y-6">
              {/* Welcome Section */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Welcome back, Dr. {user?.full_name?.split(' ')[1] || user?.full_name}</h1>
                  <p className="text-muted-foreground">Here's your practice overview for today</p>
                </div>
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{user?.specialization}</span>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                    <p className="text-xs text-muted-foreground">
                      From {stats.totalMeetings} completed consultations
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalMeetings}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.completedToday} completed today
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Patient Satisfaction</CardTitle>
                    <Star className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.averageRating}/5.0</div>
                    <p className="text-xs text-muted-foreground">
                      Average rating from patients
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                    <Users className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalPatients}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.pendingAppointments} pending appointments
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Recent Appointments */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Recent Appointments
                    </CardTitle>
                    <CardDescription>
                      Your latest patient appointments
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentAppointments.length > 0 ? (
                      recentAppointments.map((appointment) => (
                        <div key={appointment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium">{appointment.patient_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(appointment.appointment_date)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(appointment.status)}>
                              {appointment.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {appointment.type}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No recent appointments
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Practice Insights
                    </CardTitle>
                    <CardDescription>
                      Key metrics for your practice
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Appointments Today</span>
                      <span className="font-medium">{stats.completedToday}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Pending Requests</span>
                      <span className="font-medium">{stats.pendingAppointments}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Average Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{stats.averageRating}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Patients</span>
                      <span className="font-medium">{stats.totalPatients}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}