"use client"

import {
  Activity,
  Droplets,
  Thermometer,
  TreesIcon as Lungs,
  Droplet,
  Heart,
  Footprints,
  HeartPulse,
  User,
  ArrowLeft,
  RefreshCw,
  Gauge
} from "lucide-react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabaseClient"

interface PatientInfo {
  id: string
  full_name: string
  age?: number
  gender?: string
  device_id?: string
}

interface VitalsData {
  id: string
  timestamp: string
  heart_rate?: number
  spo2?: number
  temperature?: number
  respiratory_rate?: number
  glucose_level?: number
  systolic_bp?: number
  diastolic_bp?: number
  ecg_data?: any
  activity_level?: any
}

export default function PatientVitals() {
  const { patientId } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [patient, setPatient] = useState<PatientInfo | null>(null)
  const [latestVitals, setLatestVitals] = useState<VitalsData | null>(null)
  const [vitalsHistory, setVitalsHistory] = useState<VitalsData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("current")
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    const checkAccess = async () => {
      if (!user?.id || !patientId) return

      try {
        // Check if doctor has an accepted appointment with this patient
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('doctor_id', user.id)
          .eq('patient_id', patientId)
          .in('status', ['accepted', 'completed'])
          .limit(1)

        if (error) {
          throw new Error(error.message)
        }

        if (data && data.length > 0) {
          setHasAccess(true)
          fetchPatientData()
        } else {
          setError("You don't have permission to view this patient's vitals")
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Error checking access:', err)
        setError('Failed to verify access permissions')
        setIsLoading(false)
      }
    }

    checkAccess()
  }, [user?.id, patientId])

  const fetchPatientData = async () => {
    if (!patientId) return

    try {
      setIsLoading(true)
      setError(null)

      // Fetch patient info
      const { data: patientData, error: patientError } = await supabase
        .from('users')
        .select('id, full_name, age, gender, device_id')
        .eq('id', patientId)
        .single()

      if (patientError) {
        throw new Error(patientError.message)
      }

      setPatient(patientData)

      // Fetch latest vitals
      const { data: latestVitalsData, error: vitalsError } = await supabase
        .from('vitals_data')
        .select('*')
        .eq('user_id', patientId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single()

      if (vitalsError && vitalsError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw new Error(vitalsError.message)
      }

      setLatestVitals(latestVitalsData || null)

      // Fetch vitals history
      const { data: historyData, error: historyError } = await supabase
        .from('vitals_data')
        .select('*')
        .eq('user_id', patientId)
        .order('timestamp', { ascending: false })
        .limit(10)

      if (historyError) {
        throw new Error(historyError.message)
      }

      setVitalsHistory(historyData || [])

    } catch (err) {
      console.error('Error fetching patient data:', err)
      setError('Failed to load patient data')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getVitalStatus = (name: string, value: number | undefined) => {
    if (value === undefined) return { color: "text-gray-500", status: "N/A" }
    
    // Define normal ranges for each vital
    const ranges: Record<string, { min: number, max: number }> = {
      heart_rate: { min: 60, max: 100 },
      spo2: { min: 95, max: 100 },
      temperature: { min: 36.1, max: 37.2 },
      respiratory_rate: { min: 12, max: 20 },
      glucose_level: { min: 70, max: 140 },
      systolic_bp: { min: 90, max: 120 },
      diastolic_bp: { min: 60, max: 80 }
    }

    const range = ranges[name]
    if (!range) return { color: "text-gray-500", status: "Unknown" }

    if (value < range.min) {
      return { color: "text-amber-500", status: "Low" }
    } else if (value > range.max) {
      return { color: "text-red-500", status: "High" }
    } else {
      return { color: "text-green-500", status: "Normal" }
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
              <p className="text-sm text-muted-foreground">Loading patient vitals...</p>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </ProtectedRoute>
    )
  }

  if (error || !hasAccess) {
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
                      <BreadcrumbPage>Patient Vitals</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            
            <div className="flex-1 overflow-y-auto min-h-0 flex items-center justify-center">
              <Card className="max-w-md w-full">
                <CardHeader>
                  <CardTitle>Access Denied</CardTitle>
                  <CardDescription>
                    {error || "You don't have permission to view this patient's vitals"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => router.push('/doctor/appointments')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Appointments
                  </Button>
                </CardContent>
              </Card>
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
                    <BreadcrumbLink href="/doctor/appointments">
                      Appointments
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Patient Vitals</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">{patient?.full_name}</h1>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {patient?.age && <span>Age: {patient.age}</span>}
                      {patient?.gender && <span>Gender: {patient.gender}</span>}
                      {patient?.device_id && <span>Device ID: {patient.device_id}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => router.push('/doctor/appointments')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button variant="outline" onClick={fetchPatientData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                  <TabsTrigger value="current">Current Vitals</TabsTrigger>
                  <TabsTrigger value="history">Vitals History</TabsTrigger>
                </TabsList>

                <TabsContent value="current" className="space-y-6 mt-6">
                  {latestVitals ? (
                    <>
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Latest Vitals</h2>
                        <p className="text-sm text-muted-foreground">
                          Last updated: {formatDate(latestVitals.timestamp)}
                        </p>
                      </div>

                      {/* Vitals Grid */}
                      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        <Card className="shadow-sm hover:shadow-md transition-shadow">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-medium">Heart Rate</CardTitle>
                              <HeartPulse className="h-4 w-4 text-red-500" />
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between">
                              <div className="text-2xl font-bold">
                                {latestVitals.heart_rate || 'N/A'}
                                {latestVitals.heart_rate && <span className="text-sm ml-1">BPM</span>}
                              </div>
                              {latestVitals.heart_rate && (
                                <Badge className={`${getVitalStatus('heart_rate', latestVitals.heart_rate).color} bg-opacity-20`}>
                                  {getVitalStatus('heart_rate', latestVitals.heart_rate).status}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Normal: 60-100 BPM</p>
                          </CardContent>
                        </Card>

                        <Card className="shadow-sm hover:shadow-md transition-shadow">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-medium">SpO2</CardTitle>
                              <Droplets className="h-4 w-4 text-blue-500" />
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between">
                              <div className="text-2xl font-bold">
                                {latestVitals.spo2 || 'N/A'}
                                {latestVitals.spo2 && <span className="text-sm ml-1">%</span>}
                              </div>
                              {latestVitals.spo2 && (
                                <Badge className={`${getVitalStatus('spo2', latestVitals.spo2).color} bg-opacity-20`}>
                                  {getVitalStatus('spo2', latestVitals.spo2).status}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Normal: 95-100%</p>
                          </CardContent>
                        </Card>

                        <Card className="shadow-sm hover:shadow-md transition-shadow">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-medium">Temperature</CardTitle>
                              <Thermometer className="h-4 w-4 text-orange-500" />
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between">
                              <div className="text-2xl font-bold">
                                {latestVitals.temperature || 'N/A'}
                                {latestVitals.temperature && <span className="text-sm ml-1">°C</span>}
                              </div>
                              {latestVitals.temperature && (
                                <Badge className={`${getVitalStatus('temperature', latestVitals.temperature).color} bg-opacity-20`}>
                                  {getVitalStatus('temperature', latestVitals.temperature).status}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Normal: 36.1-37.2°C</p>
                          </CardContent>
                        </Card>

                        <Card className="shadow-sm hover:shadow-md transition-shadow">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-medium">Blood Pressure</CardTitle>
                              <Gauge className="h-4 w-4 text-red-500" />
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between">
                              <div className="text-2xl font-bold">
                                {latestVitals.systolic_bp && latestVitals.diastolic_bp 
                                  ? `${latestVitals.systolic_bp}/${latestVitals.diastolic_bp}` 
                                  : 'N/A'}
                                {latestVitals.systolic_bp && <span className="text-sm ml-1">mmHg</span>}
                              </div>
                              {latestVitals.systolic_bp && (
                                <Badge className={`${getVitalStatus('systolic_bp', latestVitals.systolic_bp).color} bg-opacity-20`}>
                                  {getVitalStatus('systolic_bp', latestVitals.systolic_bp).status}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Normal: 90-120/60-80 mmHg</p>
                          </CardContent>
                        </Card>

                        <Card className="shadow-sm hover:shadow-md transition-shadow">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-medium">Respiratory Rate</CardTitle>
                              <Lungs className="h-4 w-4 text-purple-500" />
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between">
                              <div className="text-2xl font-bold">
                                {latestVitals.respiratory_rate || 'N/A'}
                                {latestVitals.respiratory_rate && <span className="text-sm ml-1">/min</span>}
                              </div>
                              {latestVitals.respiratory_rate && (
                                <Badge className={`${getVitalStatus('respiratory_rate', latestVitals.respiratory_rate).color} bg-opacity-20`}>
                                  {getVitalStatus('respiratory_rate', latestVitals.respiratory_rate).status}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Normal: 12-20 /min</p>
                          </CardContent>
                        </Card>

                        <Card className="shadow-sm hover:shadow-md transition-shadow">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-medium">Glucose Level</CardTitle>
                              <Droplet className="h-4 w-4 text-green-500" />
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between">
                              <div className="text-2xl font-bold">
                                {latestVitals.glucose_level || 'N/A'}
                                {latestVitals.glucose_level && <span className="text-sm ml-1">mg/dL</span>}
                              </div>
                              {latestVitals.glucose_level && (
                                <Badge className={`${getVitalStatus('glucose_level', latestVitals.glucose_level).color} bg-opacity-20`}>
                                  {getVitalStatus('glucose_level', latestVitals.glucose_level).status}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Normal: 70-140 mg/dL</p>
                          </CardContent>
                        </Card>

                        <Card className="shadow-sm hover:shadow-md transition-shadow">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-medium">Activity Level</CardTitle>
                              <Footprints className="h-4 w-4 text-yellow-500" />
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold capitalize">
                              {latestVitals.activity_level?.activity_type || 'N/A'}
                            </div>
                            {latestVitals.activity_level?.steps && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Steps: {latestVitals.activity_level.steps}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </div>

                      {/* ECG Data */}
                      {latestVitals.ecg_data && (
                        <Card className="shadow-lg">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Activity className="h-5 w-5" />
                              ECG Data
                            </CardTitle>
                            <CardDescription>
                              Latest electrocardiogram readings
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="p-4 bg-muted rounded-lg">
                              <pre className="text-xs overflow-auto">
                                {JSON.stringify(latestVitals.ecg_data, null, 2)}
                              </pre>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  ) : (
                    <Card className="shadow-lg">
                      <CardContent className="text-center py-12">
                        <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Vitals Data</h3>
                        <p className="text-muted-foreground">
                          This patient doesn't have any vitals data recorded yet.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="history" className="space-y-6 mt-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Vitals History</h2>
                    <p className="text-sm text-muted-foreground">
                      Last {vitalsHistory.length} records
                    </p>
                  </div>

                  {vitalsHistory.length > 0 ? (
                    <div className="space-y-4">
                      {vitalsHistory.map((record) => (
                        <Card key={record.id} className="shadow-sm hover:shadow-md transition-shadow">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-medium">
                                {formatDate(record.timestamp)}
                              </CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground">Heart Rate</p>
                                <p className="font-medium">{record.heart_rate || 'N/A'} {record.heart_rate && 'BPM'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">SpO2</p>
                                <p className="font-medium">{record.spo2 || 'N/A'} {record.spo2 && '%'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Temperature</p>
                                <p className="font-medium">{record.temperature || 'N/A'} {record.temperature && '°C'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Blood Pressure</p>
                                <p className="font-medium">
                                  {record.systolic_bp && record.diastolic_bp 
                                    ? `${record.systolic_bp}/${record.diastolic_bp} mmHg` 
                                    : 'N/A'}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="shadow-lg">
                      <CardContent className="text-center py-12">
                        <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No History Available</h3>
                        <p className="text-muted-foreground">
                          This patient doesn't have any historical vitals data.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}