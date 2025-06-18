"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Bell, 
  RefreshCw, 
  MoreHorizontal, 
  Trash2, 
  DollarSign, 
  Calendar, 
  Clock,
  Video,
  CheckCircle,
  AlertCircle,
  Eye
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabaseClient"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface Alert {
  id: string
  type: 'payment' | 'appointment' | 'meeting' | 'system'
  title: string
  message: string
  timestamp: string
  status: 'read' | 'unread'
  action_url?: string
  related_id?: string
  priority: 'low' | 'medium' | 'high'
}

export default function DoctorAlerts() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchAlerts()
  }, [user?.id])

  const fetchAlerts = async () => {
    if (!user?.id) return

    try {
      setIsLoading(true)
      setError(null)

      // In a real app, you would fetch from a notifications or alerts table
      // For this demo, we'll create mock alerts based on appointments and transactions
      
      const mockAlerts: Alert[] = []
      
      // Fetch appointments to create alerts
      const { data: appointments, error: apptError } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (apptError) {
        throw new Error(apptError.message)
      }
      
      // Create alerts from appointments
      appointments?.forEach((appointment, index) => {
        if (appointment.status === 'pending') {
          mockAlerts.push({
            id: `appt-${appointment.id}`,
            type: 'appointment',
            title: 'New Appointment Request',
            message: `${appointment.patient_name} has requested a ${appointment.type.toLowerCase()} appointment on ${new Date(appointment.appointment_date).toLocaleDateString()}.`,
            timestamp: appointment.created_at,
            status: index % 3 === 0 ? 'read' : 'unread',
            action_url: '/doctor/appointments',
            related_id: appointment.id,
            priority: 'medium'
          })
        } else if (appointment.status === 'accepted' && new Date(appointment.appointment_date).getTime() - new Date().getTime() < 86400000) {
          // If appointment is within 24 hours
          mockAlerts.push({
            id: `meeting-${appointment.id}`,
            type: 'meeting',
            title: 'Upcoming Appointment',
            message: `Reminder: You have an appointment with ${appointment.patient_name} on ${new Date(appointment.appointment_date).toLocaleDateString()} at ${appointment.appointment_time}.`,
            timestamp: new Date().toISOString(),
            status: 'unread',
            action_url: '/doctor/meet',
            related_id: appointment.id,
            priority: 'high'
          })
        }
      })
      
      // Fetch transactions to create payment alerts
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .eq('doctor_id', user.id)
        .eq('type', 'received')
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (transError) {
        throw new Error(transError.message)
      }
      
      // Create alerts from transactions
      transactions?.forEach((transaction) => {
        mockAlerts.push({
          id: `payment-${transaction.id}`,
          type: 'payment',
          title: 'Payment Received',
          message: `You received a payment of $${transaction.amount} from ${transaction.patient_name || 'a patient'}.`,
          timestamp: transaction.created_at,
          status: Math.random() > 0.5 ? 'read' : 'unread',
          action_url: '/doctor/wallet',
          related_id: transaction.id,
          priority: 'low'
        })
      })
      
      // Add some system alerts
      mockAlerts.push({
        id: 'system-1',
        type: 'system',
        title: 'Profile Verification',
        message: 'Your doctor profile has been verified. You can now accept appointments.',
        timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
        status: 'read',
        priority: 'medium'
      })
      
      mockAlerts.push({
        id: 'system-2',
        type: 'system',
        title: 'System Maintenance',
        message: 'The system will be undergoing maintenance on Sunday, June 30th from 2:00 AM to 4:00 AM EDT.',
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        status: 'unread',
        priority: 'low'
      })
      
      // Sort alerts by timestamp (newest first) and unread status
      mockAlerts.sort((a, b) => {
        // First sort by read/unread status
        if (a.status === 'unread' && b.status === 'read') return -1
        if (a.status === 'read' && b.status === 'unread') return 1
        
        // Then by timestamp
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      })
      
      setAlerts(mockAlerts)
    } catch (err) {
      console.error('Error fetching alerts:', err)
      setError('Failed to load alerts')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteAlert = (alertId: string) => {
    setDeletingId(alertId)
    
    // In a real app, you would call an API to delete the alert
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== alertId))
      setDeletingId(null)
      
      toast({
        title: "Alert Deleted",
        description: "The notification has been removed.",
      })
    }, 500)
  }

  const markAsRead = (alertId: string) => {
    // In a real app, you would call an API to mark the alert as read
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: 'read' as const }
          : alert
      )
    )
    
    toast({
      title: "Marked as Read",
      description: "The notification has been marked as read.",
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      // Today - show time
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <DollarSign className="h-4 w-4 text-green-600" />
      case 'appointment':
        return <Calendar className="h-4 w-4 text-blue-600" />
      case 'meeting':
        return <Video className="h-4 w-4 text-purple-600" />
      case 'system':
        return <Bell className="h-4 w-4 text-orange-600" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800">High</Badge>
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Low</Badge>
      default:
        return null
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
              <p className="text-sm text-muted-foreground">Loading alerts...</p>
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
                    <BreadcrumbPage>Alerts</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Alerts & Notifications</h1>
                  <p className="text-muted-foreground">Stay updated with important information</p>
                </div>
                <Button variant="outline" onClick={fetchAlerts}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Alerts Summary */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Bell className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Total</p>
                        <p className="text-2xl font-bold">{alerts.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-red-100 rounded-full">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Unread</p>
                        <p className="text-2xl font-bold">{alerts.filter(a => a.status === 'unread').length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-green-100 rounded-full">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Read</p>
                        <p className="text-2xl font-bold">{alerts.filter(a => a.status === 'read').length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-purple-100 rounded-full">
                        <Clock className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Today</p>
                        <p className="text-2xl font-bold">
                          {alerts.filter(a => {
                            const today = new Date().toDateString()
                            const alertDate = new Date(a.timestamp).toDateString()
                            return today === alertDate
                          }).length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Alerts Table */}
              {alerts.length > 0 ? (
                <Card className="shadow-lg">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">Type</TableHead>
                          <TableHead>Message</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {alerts.map((alert) => (
                          <TableRow key={alert.id} className={alert.status === 'unread' ? 'bg-muted/30' : ''}>
                            <TableCell>
                              <div className="p-2 bg-muted rounded-full w-8 h-8 flex items-center justify-center">
                                {getAlertIcon(alert.type)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{alert.title}</span>
                                  {alert.status === 'unread' && (
                                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{alert.message}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getPriorityBadge(alert.priority)}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">{formatDate(alert.timestamp)}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {alert.status === 'unread' && (
                                    <DropdownMenuItem onClick={() => markAsRead(alert.id)}>
                                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                      Mark as Read
                                    </DropdownMenuItem>
                                  )}
                                  
                                  {alert.action_url && (
                                    <DropdownMenuItem asChild>
                                      <Link href={alert.action_url}>
                                        <Eye className="h-4 w-4 mr-2 text-blue-600" />
                                        View Details
                                      </Link>
                                    </DropdownMenuItem>
                                  )}
                                  
                                  <DropdownMenuItem 
                                    onClick={() => deleteAlert(alert.id)}
                                    disabled={deletingId === alert.id}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {deletingId === alert.id ? 'Deleting...' : 'Delete'}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-lg">
                  <CardContent className="text-center py-12">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Alerts</h3>
                    <p className="text-muted-foreground">
                      You don't have any notifications at the moment.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}