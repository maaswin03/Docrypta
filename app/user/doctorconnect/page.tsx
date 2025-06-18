"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Video, Stethoscope, Star, MapPin, Clock, Calendar, DollarSign, Wallet, CheckCircle, AlertCircle, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/lib/auth-context"
import { useWallet } from "@/hooks/useWallet"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Doctor {
  id: string
  full_name: string
  specialization: string
  rating: number
  experience: number
  is_online: boolean
  fee: number
  wallet_address: string
}

interface Appointment {
  id: string
  doctor_id: string
  patient_id: string
  appointment_date: string
  appointment_time: string
  status: 'pending' | 'accepted' | 'rejected' | 'paid' | 'completed'
  type: string
  fee: number
  meeting_id?: string
  created_at: string
}

interface PatientVitals {
  heart_rate?: number
  spo2?: number
  temperature?: number
  respiratory_rate?: number
  systolic_bp?: number
  diastolic_bp?: number
}

export default function DoctorConnect() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const { connection, connectWallet } = useWallet()
  const [searchQuery, setSearchQuery] = useState("")
  const [specialtyFilter, setSpecialtyFilter] = useState("all")
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [appointmentType, setAppointmentType] = useState<string>("Consultation")
  const [isRequestingAppointment, setIsRequestingAppointment] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [patientVitals, setPatientVitals] = useState<PatientVitals | null>(null)
  const [isLoadingVitals, setIsLoadingVitals] = useState(false)
  const [showVitalsDialog, setShowVitalsDialog] = useState(false)

  // Default consultation fee
  const DEFAULT_FEE = 5

  // Fetch doctors and appointments on component mount
  useEffect(() => {
    fetchDoctors()
    if (user?.id) {
      fetchAppointments()
    }
  }, [user?.id])

  // Fetch doctors from Supabase
  const fetchDoctors = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, specialization, wallet_address, is_verified')
        .eq('user_type', 'doctor')
        .eq('is_verified', true)

      if (error) {
        throw new Error(error.message)
      }

      // Transform the data to match our Doctor interface
      const formattedDoctors: Doctor[] = data.map(doc => ({
        id: doc.id.toString(),
        full_name: doc.full_name,
        specialization: doc.specialization || 'General Medicine',
        rating: 4.5 + Math.random() * 0.5, // Random rating between 4.5-5.0
        experience: Math.floor(Math.random() * 15) + 3, // Random experience between 3-18 years
        is_online: Math.random() > 0.3, // 70% chance of being online
        fee: DEFAULT_FEE, // Default fee of $5
        wallet_address: doc.wallet_address || ''
      }))

      setDoctors(formattedDoctors)
    } catch (err) {
      console.error('Error fetching doctors:', err)
      setError('Failed to load doctors. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch appointments for the current user
  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      setAppointments(data || [])
    } catch (err) {
      console.error('Error fetching appointments:', err)
      toast({
        title: "Error",
        description: "Failed to load your appointments",
        variant: "destructive"
      })
    }
  }

  // Filter doctors based on search query and specialty filter
  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSpecialty = specialtyFilter === "all" || doctor.specialization === specialtyFilter
    return matchesSearch && matchesSpecialty
  })

  // Get unique specialties for the filter dropdown
  const specialties = Array.from(new Set(doctors.map(doc => doc.specialization))).sort()

  // Request an appointment with a doctor
  const requestAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime || !user) {
      toast({
        title: "Incomplete Information",
        description: "Please select a date and time for your appointment",
        variant: "destructive"
      })
      return
    }

    try {
      setIsRequestingAppointment(true)

      const appointmentData = {
        doctor_id: selectedDoctor.id,
        patient_id: user.id,
        patient_name: user.full_name,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        status: 'pending',
        type: appointmentType,
      }

      const { data, error } = await supabase
        .from('appointments')
        .insert([appointmentData])
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      // Update local appointments state
      setAppointments(prev => [data, ...prev])
      
      toast({
        title: "Appointment Requested",
        description: "Your appointment request has been sent to the doctor",
      })

      // Reset form and selected doctor
      setSelectedDoctor(null)
      setSelectedDate("")
      setSelectedTime("")
      setAppointmentType("Consultation")

    } catch (err) {
      console.error('Error requesting appointment:', err)
      toast({
        title: "Request Failed",
        description: "Failed to request appointment. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsRequestingAppointment(false)
    }
  }

  // Process payment for an appointment
  const processPayment = async () => {
    if (!currentAppointment || !connection.isConnected) {
      toast({
        title: "Payment Failed",
        description: "Please connect your wallet first",
        variant: "destructive"
      })
      return
    }

    // Verify wallet address matches the one in user profile
    if (user?.wallet_address && user.wallet_address !== connection.address) {
      toast({
        title: "Wallet Mismatch",
        description: "The connected wallet doesn't match your registered wallet address",
        variant: "destructive"
      })
      return
    }

    try {
      setIsProcessingPayment(true)

      // 1. Create a transaction record
      const transactionData = {
        doctor_id: currentAppointment.doctor_id,
        patient_id: user?.id,
        patient_name: user?.full_name,
        amount: currentAppointment.fee,
        type: 'received',
        transaction_hash: `0x${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
        description: `Payment for ${currentAppointment.type} on ${new Date(currentAppointment.appointment_date).toLocaleDateString()}`
      }

      const { error: transError } = await supabase
        .from('transactions')
        .insert([transactionData])

      if (transError) {
        throw new Error(transError.message)
      }

      // 2. Update appointment status to paid
      const { error: apptError } = await supabase
        .from('appointments')
        .update({ status: 'paid', meeting_id: generateMeetingId() })
        .eq('id', currentAppointment.id)

      if (apptError) {
        throw new Error(apptError.message)
      }

      // 3. Update local state
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === currentAppointment.id 
            ? { ...apt, status: 'paid' } 
            : apt
        )
      )

      toast({
        title: "Payment Successful",
        description: "Your appointment has been paid for and is now confirmed",
      })

      setShowPaymentDialog(false)
      fetchAppointments() // Refresh appointments to get the meeting ID

    } catch (err) {
      console.error('Error processing payment:', err)
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsProcessingPayment(false)
    }
  }

  // Generate a random meeting ID
  const generateMeetingId = () => {
    return Math.random().toString(36).substring(2, 10)
  }

  // Join a meeting
  const joinMeeting = (meetingId: string) => {
    // In a real app, this would redirect to a video call service
    window.open(`https://meet.jit.si/${meetingId}`, '_blank')
  }

  // Fetch patient vitals for the meeting
  const fetchPatientVitals = async () => {
    if (!user?.id) return

    try {
      setIsLoadingVitals(true)

      const { data, error } = await supabase
        .from('vitals_data')
        .select('heart_rate, spo2, temperature, respiratory_rate, systolic_bp, diastolic_bp')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw new Error(error.message)
      }

      setPatientVitals(data || null)
      setShowVitalsDialog(true)
    } catch (err) {
      console.error('Error fetching vitals:', err)
      toast({
        title: "Error",
        description: "Failed to load your vital signs",
        variant: "destructive"
      })
    } finally {
      setIsLoadingVitals(false)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Format time for display
  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'accepted': return 'bg-blue-100 text-blue-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'paid': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Generate available dates (next 7 days)
  const getAvailableDates = () => {
    const dates = []
    const today = new Date()
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      })
    }
    
    return dates
  }

  // Generate available time slots
  const getAvailableTimes = () => {
    const times = []
    const startHour = 9 // 9 AM
    const endHour = 17 // 5 PM
    
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute of [0, 30]) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`
        const label = new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })
        
        times.push({ value: time, label })
      }
    }
    
    return times
  }

  // Get doctor name by ID
  const getDoctorName = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId)
    return doctor ? doctor.full_name : `Doctor #${doctorId}`
  }

  return (
    <ProtectedRoute allowedRoles={['user']}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-16 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink
                    href="/user/dashboard"
                    className="hover:text-primary"
                  >
                    Health Services
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold">
                    Doctor Connect
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <main className="flex-1 p-4 md:p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight">Connect with Doctors</h1>
              <p className="text-muted-foreground">
                Book video consultations with certified healthcare professionals
              </p>
            </div>

            <Tabs defaultValue="browse">
              <TabsList className="grid w-full grid-cols-2 max-w-xs mb-6">
                <TabsTrigger value="browse">Browse Doctors</TabsTrigger>
                <TabsTrigger value="appointments">My Appointments</TabsTrigger>
              </TabsList>

              <TabsContent value="browse">
                <div className="grid gap-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search doctors by name or specialty..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Specialties" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Specialties</SelectItem>
                        {specialties.map((spec) => (
                          <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {isLoading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {[1, 2, 3].map((i) => (
                        <Card key={i} className="opacity-50">
                          <CardHeader className="pb-4">
                            <div className="flex items-start gap-4">
                              <div className="h-16 w-16 rounded-full bg-muted"></div>
                              <div>
                                <CardTitle className="text-lg bg-muted h-6 w-32 rounded"></CardTitle>
                                <p className="text-sm text-muted-foreground bg-muted h-4 w-24 mt-1 rounded"></p>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="bg-muted h-4 w-full rounded"></div>
                            <div className="bg-muted h-4 w-3/4 rounded"></div>
                          </CardContent>
                          <CardFooter>
                            <Button className="w-full" disabled>Loading...</Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  ) : error ? (
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertCircle className="h-5 w-5" />
                          <p>{error}</p>
                        </div>
                        <Button onClick={fetchDoctors} className="mt-4">
                          Try Again
                        </Button>
                      </CardContent>
                    </Card>
                  ) : selectedDoctor ? (
                    <DoctorDetailCard 
                      doctor={selectedDoctor} 
                      onBack={() => setSelectedDoctor(null)}
                      selectedDate={selectedDate}
                      setSelectedDate={setSelectedDate}
                      selectedTime={selectedTime}
                      setSelectedTime={setSelectedTime}
                      appointmentType={appointmentType}
                      setAppointmentType={setAppointmentType}
                      onRequestAppointment={requestAppointment}
                      isRequestingAppointment={isRequestingAppointment}
                      availableDates={getAvailableDates()}
                      availableTimes={getAvailableTimes()}
                    />
                  ) : (
                    <>
                      {filteredDoctors.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {filteredDoctors.map((doctor) => (
                            <DoctorCard 
                              key={doctor.id} 
                              doctor={doctor}
                              onSelect={() => setSelectedDoctor(doctor)}
                            />
                          ))}
                        </div>
                      ) : (
                        <Card>
                          <CardContent className="p-6 text-center">
                            <p className="text-muted-foreground">No doctors found matching your criteria</p>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="appointments">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Your Appointments</CardTitle>
                    <CardDescription>
                      Manage your scheduled consultations with doctors
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {appointments.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Doctor</TableHead>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {appointments.map((appointment) => (
                            <TableRow key={appointment.id}>
                              <TableCell className="font-medium">
                                Dr. {getDoctorName(appointment.doctor_id)}
                              </TableCell>
                              <TableCell>
                                {formatDate(appointment.appointment_date)}<br/>
                                <span className="text-muted-foreground text-sm">
                                  {formatTime(appointment.appointment_time)}
                                </span>
                              </TableCell>
                              <TableCell>{appointment.type}</TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(appointment.status)}>
                                  {appointment.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {appointment.status === 'accepted' && (
                                  <Button 
                                    size="sm" 
                                    onClick={() => {
                                      setCurrentAppointment(appointment)
                                      setShowPaymentDialog(true)
                                    }}
                                  >
                                    <DollarSign className="h-4 w-4 mr-1" />
                                    Pay Now
                                  </Button>
                                )}
                                
                                {appointment.status === 'paid' && (
                                  <div className="flex gap-2">
                                    <Button 
                                      size="sm" 
                                      onClick={() => joinMeeting(appointment.meeting_id || '')}
                                    >
                                      <Video className="h-4 w-4 mr-1" />
                                      Join
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={fetchPatientVitals}
                                      disabled={isLoadingVitals}
                                    >
                                      <Stethoscope className="h-4 w-4 mr-1" />
                                      Vitals
                                    </Button>
                                  </div>
                                )}
                                
                                {appointment.status === 'pending' && (
                                  <span className="text-sm text-muted-foreground">
                                    Awaiting doctor approval
                                  </span>
                                )}
                                
                                {appointment.status === 'rejected' && (
                                  <span className="text-sm text-muted-foreground">
                                    Request declined
                                  </span>
                                )}
                                
                                {appointment.status === 'completed' && (
                                  <span className="text-sm text-muted-foreground">
                                    Consultation completed
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-12">
                        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No appointments scheduled</p>
                        <Button variant="link" className="mt-2" onClick={() => document.querySelector('[data-state="inactive"][value="browse"]')?.click()}>
                          Browse Doctors
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </SidebarInset>
      </SidebarProvider>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>
              Pay for your consultation to confirm your appointment
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Doctor</span>
                <span className="font-medium">Dr. {getDoctorName(currentAppointment?.doctor_id || '')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Date</span>
                <span>{currentAppointment?.appointment_date && formatDate(currentAppointment.appointment_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Time</span>
                <span>{currentAppointment?.appointment_time && formatTime(currentAppointment.appointment_time)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Type</span>
                <span>{currentAppointment?.type}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between">
                <span className="font-medium">Total Amount</span>
                <span className="font-bold">${currentAppointment?.fee || DEFAULT_FEE}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Wallet Status</h4>
              {connection.isConnected ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Wallet Connected</p>
                      <p className="text-xs font-mono text-green-600">
                        {connection.address.slice(0, 6)}...{connection.address.slice(-4)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Wallet Not Connected</p>
                      <p className="text-xs text-yellow-600">Connect your wallet to proceed with payment</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            {!connection.isConnected ? (
              <Button 
                onClick={connectWallet} 
                className="w-full"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet
              </Button>
            ) : (
              <Button 
                onClick={processPayment} 
                disabled={isProcessingPayment}
                className="w-full"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                {isProcessingPayment ? 'Processing...' : 'Pay Now'}
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => setShowPaymentDialog(false)}
              className="w-full sm:w-auto"
              disabled={isProcessingPayment}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vitals Dialog */}
      <Dialog open={showVitalsDialog} onOpenChange={setShowVitalsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Your Current Vitals</DialogTitle>
            <DialogDescription>
              These vitals will be shared with your doctor during the consultation
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {isLoadingVitals ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : patientVitals ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Heart Rate</p>
                  <p className="font-medium">{patientVitals.heart_rate || 'N/A'} {patientVitals.heart_rate && 'BPM'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">SpO2</p>
                  <p className="font-medium">{patientVitals.spo2 || 'N/A'} {patientVitals.spo2 && '%'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Temperature</p>
                  <p className="font-medium">{patientVitals.temperature || 'N/A'} {patientVitals.temperature && '°C'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Respiratory Rate</p>
                  <p className="font-medium">{patientVitals.respiratory_rate || 'N/A'} {patientVitals.respiratory_rate && '/min'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Blood Pressure</p>
                  <p className="font-medium">
                    {patientVitals.systolic_bp && patientVitals.diastolic_bp 
                      ? `${patientVitals.systolic_bp}/${patientVitals.diastolic_bp} mmHg` 
                      : 'N/A'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No vitals data available</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowVitalsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  )
}

// Doctor Card Component
function DoctorCard({ doctor, onSelect }: { doctor: Doctor; onSelect: () => void }) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onSelect}>
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <div className="relative h-16 w-16 rounded-full overflow-hidden border bg-muted flex items-center justify-center">
            <User className="h-8 w-8 text-muted-foreground" />
            {doctor.is_online && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div>
            <CardTitle className="text-lg">Dr. {doctor.full_name}</CardTitle>
            <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-medium">{doctor.rating.toFixed(1)}</span>
          <span className="text-sm text-muted-foreground">
            ({doctor.experience}+ years)
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span>${doctor.fee} per consultation</span>
        </div>
        <div className="flex items-center gap-2 text-sm mt-2">
          <Badge variant={doctor.is_online ? "default" : "secondary"} className="rounded-full px-2 py-0 text-xs">
            {doctor.is_online ? 'Available Now' : 'Offline'}
          </Badge>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="default" 
          className="w-full"
        >
          Book Appointment
        </Button>
      </CardFooter>
    </Card>
  )
}

// Doctor Detail Card Component
function DoctorDetailCard({ 
  doctor, 
  onBack,
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  appointmentType,
  setAppointmentType,
  onRequestAppointment,
  isRequestingAppointment,
  availableDates,
  availableTimes
}: { 
  doctor: Doctor
  onBack: () => void
  selectedDate: string
  setSelectedDate: (date: string) => void
  selectedTime: string
  setSelectedTime: (time: string) => void
  appointmentType: string
  setAppointmentType: (type: string) => void
  onRequestAppointment: () => void
  isRequestingAppointment: boolean
  availableDates: { value: string, label: string }[]
  availableTimes: { value: string, label: string }[]
}) {
  return (
    <Card>
      <CardHeader>
        <Button variant="ghost" className="w-fit" onClick={onBack}>
          ← Back to doctors
        </Button>
        <div className="flex items-start gap-6 pt-4">
          <div className="relative h-24 w-24 rounded-full overflow-hidden border bg-muted flex items-center justify-center">
            <User className="h-12 w-12 text-muted-foreground" />
            {doctor.is_online && (
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div>
            <CardTitle className="text-2xl">Dr. {doctor.full_name}</CardTitle>
            <p className="text-lg text-primary">{doctor.specialization}</p>
            <div className="flex items-center gap-2 mt-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{doctor.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">
                ({doctor.experience} years experience)
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="font-medium">About Dr. {doctor.full_name.split(" ")[1] || doctor.full_name}</h3>
          <p className="text-muted-foreground">
            Board-certified {doctor.specialization} specialist with {doctor.experience} years of clinical experience. 
            Provides comprehensive care with a patient-centered approach.
          </p>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>Available for online consultations</span>
            </div>
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
              <span>Specializes in: {doctor.specialization}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>Consultation fee: ${doctor.fee}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">Book Appointment</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Appointment Type</label>
              <Select value={appointmentType} onValueChange={setAppointmentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select appointment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Consultation">Initial Consultation</SelectItem>
                  <SelectItem value="Follow-up">Follow-up</SelectItem>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Select Date</label>
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger>
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Choose a date" />
                </SelectTrigger>
                <SelectContent>
                  {availableDates.map((date) => (
                    <SelectItem key={date.value} value={date.value}>{date.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Select Time</label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger>
                  <Clock className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Choose a time slot" />
                </SelectTrigger>
                <SelectContent>
                  {availableTimes.map((time) => (
                    <SelectItem key={time.value} value={time.value}>{time.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full mt-4" 
              disabled={!selectedDate || !selectedTime || isRequestingAppointment}
              onClick={onRequestAppointment}
            >
              {isRequestingAppointment ? 'Requesting...' : 'Request Appointment'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}