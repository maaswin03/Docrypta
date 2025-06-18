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
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, Utensils, Moon, Dumbbell, Droplet, RefreshCw, AlertCircle, HeartPulse, Thermometer, Gauge, Settings as Lungs, Droplets } from "lucide-react"
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

export default function CoreCarePlanPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [vitals, setVitals] = useState<VitalsData | null>(null)
  const [symptoms, setSymptoms] = useState("")
  const [dietPlan, setDietPlan] = useState<string>("")
  const [exercisePlan, setExercisePlan] = useState<string>("")
  const [sleepPlan, setSleepPlan] = useState<string>("")
  const [activeTab, setActiveTab] = useState("diet")
  const [isLoadingVitals, setIsLoadingVitals] = useState(true)
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)
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

  const generatePlan = async (planType: 'diet' | 'exercise' | 'sleep') => {
    if (!vitals) {
      toast({
        title: "No Vitals Data",
        description: "We need your vital signs to generate a personalized plan",
        variant: "destructive"
      })
      return
    }

    try {
      setIsGeneratingPlan(true)
      setError(null)

      // In a real app, this would call the OpenAI API
      // For demo purposes, we'll call our simulated API endpoint
      
      const response = await fetch('/api/careplan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          vitals,
          symptoms,
          planType
        }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      
      // Update the appropriate plan state
      switch (planType) {
        case 'diet':
          setDietPlan(data.plan)
          break
        case 'exercise':
          setExercisePlan(data.plan)
          break
        case 'sleep':
          setSleepPlan(data.plan)
          break
      }
      
      // Switch to the tab for the generated plan
      setActiveTab(planType)
      
      toast({
        title: "Plan Generated",
        description: `Your personalized ${planType} plan is ready!`,
      })
    } catch (err) {
      console.error(`Error generating ${planType} plan:`, err)
      setError(`Failed to generate ${planType} plan`)
      toast({
        title: "Error",
        description: `Failed to generate your ${planType} plan`,
        variant: "destructive"
      })
    } finally {
      setIsGeneratingPlan(false)
    }
  }

  // Format the AI plan with markdown-like formatting
  const formatPlan = (text: string) => {
    if (!text) return null
    
    return text.split('\n').map((line, index) => {
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-xl font-bold mt-4 mb-2">{line.substring(3)}</h2>
      } else if (line.startsWith('### ')) {
        return <h3 key={index} className="text-lg font-semibold mt-3 mb-1">{line.substring(4)}</h3>
      } else if (line.startsWith('- ')) {
        return <li key={index} className="ml-5 list-disc my-1">{line.substring(2)}</li>
      } else if (line.startsWith('**')) {
        const content = line.replace(/\*\*/g, '')
        return <p key={index} className="font-semibold my-2">{content}</p>
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
                    <BreadcrumbPage>Core Care Plan</BreadcrumbPage>
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
                  <h1 className="text-2xl font-bold">Core Care Plan</h1>
                  <p className="text-muted-foreground">AI-generated personalized health plans</p>
                </div>
                <Button variant="outline" onClick={fetchLatestVitals} disabled={isLoadingVitals}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Vitals
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
                    Health measurements used to personalize your care plans
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingVitals ? (
                    <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-8 w-16" />
                        </div>
                      ))}
                    </div>
                  ) : vitals ? (
                    <div className="grid gap-6 grid-cols-2 md:grid-cols-3">
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

              {/* Symptoms Input */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Any Symptoms?</CardTitle>
                  <CardDescription>
                    Describe any symptoms you're experiencing to help personalize your care plans
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="E.g., headache, fatigue, joint pain, etc. (optional)"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="min-h-[100px]"
                  />
                </CardContent>
              </Card>

              {/* Care Plans */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Your Personalized Care Plans</h2>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => generatePlan('diet')}
                      disabled={isGeneratingPlan || !vitals}
                    >
                      <Utensils className="h-4 w-4 mr-2" />
                      Diet Plan
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => generatePlan('exercise')}
                      disabled={isGeneratingPlan || !vitals}
                    >
                      <Dumbbell className="h-4 w-4 mr-2" />
                      Exercise Plan
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => generatePlan('sleep')}
                      disabled={isGeneratingPlan || !vitals}
                    >
                      <Moon className="h-4 w-4 mr-2" />
                      Sleep Plan
                    </Button>
                  </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="diet" className="flex items-center gap-2">
                      <Utensils className="h-4 w-4" />
                      <span className="hidden sm:inline">Diet</span>
                    </TabsTrigger>
                    <TabsTrigger value="exercise" className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4" />
                      <span className="hidden sm:inline">Exercise</span>
                    </TabsTrigger>
                    <TabsTrigger value="sleep" className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      <span className="hidden sm:inline">Sleep</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <Card className="mt-4 shadow-lg">
                    <TabsContent value="diet" className="m-0">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Utensils className="h-5 w-5" />
                          Personalized Diet Plan
                        </CardTitle>
                        <CardDescription>
                          Nutrition recommendations based on your health data
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isGeneratingPlan && activeTab === 'diet' ? (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                              <p>Generating your personalized diet plan...</p>
                            </div>
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-[90%]" />
                            <Skeleton className="h-4 w-[80%]" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-[85%]" />
                          </div>
                        ) : dietPlan ? (
                          <div className="prose prose-sm max-w-none">
                            {formatPlan(dietPlan)}
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <p className="text-muted-foreground">
                              Click the "Diet Plan" button above to generate your personalized nutrition recommendations
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </TabsContent>
                    
                    <TabsContent value="exercise" className="m-0">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Dumbbell className="h-5 w-5" />
                          Personalized Exercise Plan
                        </CardTitle>
                        <CardDescription>
                          Physical activity recommendations based on your health data
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isGeneratingPlan && activeTab === 'exercise' ? (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                              <p>Generating your personalized exercise plan...</p>
                            </div>
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-[90%]" />
                            <Skeleton className="h-4 w-[80%]" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-[85%]" />
                          </div>
                        ) : exercisePlan ? (
                          <div className="prose prose-sm max-w-none">
                            {formatPlan(exercisePlan)}
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <p className="text-muted-foreground">
                              Click the "Exercise Plan" button above to generate your personalized activity recommendations
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </TabsContent>
                    
                    <TabsContent value="sleep" className="m-0">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Moon className="h-5 w-5" />
                          Personalized Sleep Plan
                        </CardTitle>
                        <CardDescription>
                          Rest and recovery recommendations based on your health data
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isGeneratingPlan && activeTab === 'sleep' ? (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                              <p>Generating your personalized sleep plan...</p>
                            </div>
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-[90%]" />
                            <Skeleton className="h-4 w-[80%]" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-[85%]" />
                          </div>
                        ) : sleepPlan ? (
                          <div className="prose prose-sm max-w-none">
                            {formatPlan(sleepPlan)}
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <p className="text-muted-foreground">
                              Click the "Sleep Plan" button above to generate your personalized rest recommendations
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </TabsContent>
                  </Card>
                </Tabs>
              </div>

              {/* Disclaimer */}
              <Card className="bg-muted/50 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Disclaimer:</strong> These AI-generated care plans are for informational purposes only and do not constitute medical advice. 
                    Always consult with a qualified healthcare provider before making significant changes to your diet, exercise routine, or sleep habits.
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