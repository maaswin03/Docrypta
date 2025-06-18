"use client"

import { useState, useEffect } from "react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Activity, Brain, HeartPulse, Thermometer, Droplets, Gauge, RefreshCw, Settings as Lungs, Droplet, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabaseClient"
import { useToast } from "@/hooks/use-toast"

interface VitalsData {
  heart_rate?: number
  spo2?: number
  temperature?: number
  respiratory_rate?: number
  systolic_bp?: number
  diastolic_bp?: number
  glucose_level?: number
}

export default function WellnessInsightsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [vitals, setVitals] = useState<VitalsData | null>(null)
  const [aiInsights, setAiInsights] = useState<string>("")
  const [isLoadingVitals, setIsLoadingVitals] = useState(true)
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLatestVitals()
  }, [user?.id])

  const fetchLatestVitals = async () => {
    if (!user?.id) return

    try {
      setIsLoadingVitals(true)
      setError(null)

      const { data, error } = await supabase
        .from('vitals_data')
        .select('heart_rate, spo2, temperature, respiratory_rate, systolic_bp, diastolic_bp, glucose_level')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw new Error(error.message)
      }

      setVitals(data || null)
      
      // If we have vitals data, generate insights automatically
      if (data) {
        generateAiInsights(data)
      }
    } catch (err) {
      console.error('Error fetching vitals:', err)
      setError('Failed to load your vital signs')
      toast({
        title: "Error",
        description: "Failed to load your vital signs",
        variant: "destructive"
      })
    } finally {
      setIsLoadingVitals(false)
    }
  }

  const generateAiInsights = async (vitalsData: VitalsData) => {
    try {
      setIsGeneratingInsights(true)
      setError(null)

      // In a real app, this would call the OpenAI API
      // For demo purposes, we'll simulate the API response
      
      // Simulate API processing time
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Create a prompt with the vitals data
      const prompt = `
        You are a virtual healthcare assistant. Analyze these patient vitals and provide a short, 
        user-friendly wellness summary, noting any early signs of risk. 
        
        Vitals: 
        - Heart Rate: ${vitalsData.heart_rate || 'N/A'} bpm
        - SpO2: ${vitalsData.spo2 || 'N/A'}%
        - Temperature: ${vitalsData.temperature || 'N/A'}°C
        - Blood Pressure: ${vitalsData.systolic_bp || 'N/A'}/${vitalsData.diastolic_bp || 'N/A'} mmHg
        - Glucose: ${vitalsData.glucose_level || 'N/A'} mg/dL
        - Respiratory Rate: ${vitalsData.respiratory_rate || 'N/A'} bpm
      `
      
      // Generate a response based on the vitals
      let response = ""
      
      // Check for abnormal values and generate insights
      const abnormalities = []
      
      if (vitalsData.heart_rate && (vitalsData.heart_rate < 60 || vitalsData.heart_rate > 100)) {
        abnormalities.push("heart rate")
      }
      
      if (vitalsData.spo2 && vitalsData.spo2 < 95) {
        abnormalities.push("oxygen saturation")
      }
      
      if (vitalsData.temperature && (vitalsData.temperature < 36.1 || vitalsData.temperature > 37.2)) {
        abnormalities.push("body temperature")
      }
      
      if (vitalsData.systolic_bp && vitalsData.systolic_bp > 120) {
        abnormalities.push("systolic blood pressure")
      }
      
      if (vitalsData.diastolic_bp && vitalsData.diastolic_bp > 80) {
        abnormalities.push("diastolic blood pressure")
      }
      
      if (vitalsData.glucose_level && (vitalsData.glucose_level < 70 || vitalsData.glucose_level > 140)) {
        abnormalities.push("blood glucose")
      }
      
      if (vitalsData.respiratory_rate && (vitalsData.respiratory_rate < 12 || vitalsData.respiratory_rate > 20)) {
        abnormalities.push("respiratory rate")
      }
      
      if (abnormalities.length > 0) {
        response = `
          ## Wellness Summary
          
          Based on your recent vital signs, I've noticed some potential areas that may need attention. Your ${abnormalities.join(", ")} ${abnormalities.length === 1 ? 'is' : 'are'} outside the typical range.
          
          ### Recommendations:
          
          - Consider scheduling a follow-up with your healthcare provider to discuss these findings
          - Continue monitoring your vitals regularly
          - Maintain a balanced diet and stay hydrated
          - Ensure you're getting adequate rest and managing stress levels
          - Follow any medication regimens as prescribed by your doctor
          
          Remember that these insights are not a diagnosis, and variations in vital signs can occur for many normal reasons. Always consult with a healthcare professional for proper medical advice.
        `
      } else {
        response = `
          ## Wellness Summary
          
          Great news! Based on your recent vital signs, all your measurements appear to be within normal ranges. This suggests your body is functioning well from a physiological perspective.
          
          ### Recommendations to maintain your health:
          
          - Continue your current healthy habits
          - Stay hydrated by drinking plenty of water throughout the day
          - Maintain a balanced diet rich in fruits, vegetables, and whole grains
          - Aim for 7-9 hours of quality sleep each night
          - Engage in regular physical activity (at least 150 minutes of moderate exercise weekly)
          - Practice stress management techniques like meditation or deep breathing
          
          Remember to continue regular check-ups with your healthcare provider even when feeling well. Prevention and early detection are key components of long-term health.
        `
      }
      
      setAiInsights(response)
    } catch (err) {
      console.error('Error generating AI insights:', err)
      setError('Failed to generate AI insights')
      toast({
        title: "Error",
        description: "Failed to generate AI insights",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingInsights(false)
    }
  }

  const refreshInsights = () => {
    if (vitals) {
      generateAiInsights(vitals)
    } else {
      fetchLatestVitals()
    }
  }

  // Format the AI insights with markdown-like formatting
  const formatInsights = (text: string) => {
    if (!text) return null
    
    return text.split('\n').map((line, index) => {
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-xl font-bold mt-4 mb-2">{line.substring(3)}</h2>
      } else if (line.startsWith('### ')) {
        return <h3 key={index} className="text-lg font-semibold mt-3 mb-1">{line.substring(4)}</h3>
      } else if (line.startsWith('- ')) {
        return <li key={index} className="ml-5 list-disc my-1">{line.substring(2)}</li>
      } else if (line.trim() === '') {
        return <br key={index} />
      } else {
        return <p key={index} className="my-2">{line}</p>
      }
    })
  }

  return (
    <ProtectedRoute allowedRoles={['user']}>
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
                    <BreadcrumbLink href="/user/dashboard">
                      Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Wellness Insights</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-6 max-w-4xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Wellness Insights</h1>
                  <p className="text-muted-foreground">AI-powered analysis of your health data</p>
                </div>
                <Button variant="outline" onClick={refreshInsights} disabled={isLoadingVitals || isGeneratingInsights}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {error && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-5 w-5" />
                      <p>{error}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Latest Vitals */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Your Latest Vitals
                  </CardTitle>
                  <CardDescription>
                    Most recent health measurements from your connected devices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingVitals ? (
                    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-8 w-16" />
                        </div>
                      ))}
                    </div>
                  ) : vitals ? (
                    <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <HeartPulse className="h-4 w-4 text-red-500" />
                          <span>Heart Rate</span>
                        </div>
                        <p className="text-2xl font-semibold">
                          {vitals.heart_rate || 'N/A'} 
                          {vitals.heart_rate && <span className="text-sm font-normal ml-1">BPM</span>}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Droplets className="h-4 w-4 text-blue-500" />
                          <span>SpO2</span>
                        </div>
                        <p className="text-2xl font-semibold">
                          {vitals.spo2 || 'N/A'} 
                          {vitals.spo2 && <span className="text-sm font-normal ml-1">%</span>}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Thermometer className="h-4 w-4 text-orange-500" />
                          <span>Temperature</span>
                        </div>
                        <p className="text-2xl font-semibold">
                          {vitals.temperature || 'N/A'} 
                          {vitals.temperature && <span className="text-sm font-normal ml-1">°C</span>}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Gauge className="h-4 w-4 text-purple-500" />
                          <span>Blood Pressure</span>
                        </div>
                        <p className="text-2xl font-semibold">
                          {vitals.systolic_bp && vitals.diastolic_bp 
                            ? `${vitals.systolic_bp}/${vitals.diastolic_bp}` 
                            : 'N/A'} 
                          {vitals.systolic_bp && <span className="text-sm font-normal ml-1">mmHg</span>}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Lungs className="h-4 w-4 text-green-500" />
                          <span>Respiratory Rate</span>
                        </div>
                        <p className="text-2xl font-semibold">
                          {vitals.respiratory_rate || 'N/A'} 
                          {vitals.respiratory_rate && <span className="text-sm font-normal ml-1">/min</span>}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Droplet className="h-4 w-4 text-teal-500" />
                          <span>Glucose</span>
                        </div>
                        <p className="text-2xl font-semibold">
                          {vitals.glucose_level || 'N/A'} 
                          {vitals.glucose_level && <span className="text-sm font-normal ml-1">mg/dL</span>}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">No vitals data available</p>
                      <Button variant="outline" className="mt-2" onClick={fetchLatestVitals}>
                        Check Again
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI Insights */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI Wellness Summary
                  </CardTitle>
                  <CardDescription>
                    Personalized insights based on your health data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isGeneratingInsights ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <p>Analyzing your health data...</p>
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-[90%]" />
                      <Skeleton className="h-4 w-[80%]" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-[85%]" />
                    </div>
                  ) : aiInsights ? (
                    <div className="prose prose-sm max-w-none">
                      {formatInsights(aiInsights)}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">
                        {vitals 
                          ? "Click 'Refresh' to generate AI insights based on your vitals" 
                          : "No vitals data available to generate insights"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Disclaimer */}
              <Card className="bg-muted/50 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Disclaimer:</strong> The AI-generated insights are for informational purposes only and do not constitute medical advice. 
                    Always consult with a qualified healthcare provider for proper diagnosis and treatment of medical conditions.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}