"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import * as React from "react";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, Activity, Thermometer, Droplets, Gauge, Wind, HeartPulse, Clock, Heart, Footprints , Stethoscope} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";

type DiseaseInfo = {
  overview?: string;
  symptoms?: string[];
  causes?: string[];
  treatments?: string[];
  precautions?: string[];
  severity?: string;
  confidence?: number;
  similarConditions?: string[];
  timestamp?: string;
  predictedFrom?: "symptoms" | "vitals";
};

type VitalsData = {
  heartRate?: number;
  pulseRate?: number;
  bloodPressure?: string;
  temperature?: number;
  oxygenLevel?: number;
  respiratoryRate?: number;
  age?: string;
  gender?: string;
  lastUpdated?: string;
  glucoseLevel?: number;
  activityLevel?: any;
};

type SensorData = {
  heart_rate?: number;
  pulse_rate?: number;
  spo2?: number;
  temperature?: number;
  systolic_bp?: number;
  diastolic_bp?: number;
  respiratory_rate?: number;
  glucose_level?: number;
  activity_level?: any;
  age?: number;
  gender?: string;
  timestamp?: string;
};

const DEFAULT_DISEASE_INFO: DiseaseInfo = {
  overview: "",
  symptoms: [],
  causes: [],
  treatments: [],
  precautions: [],
  severity: "low",
  confidence: 0,
  similarConditions: [],
};

// Mock prediction function since we're not using the backend API
const mockPredictDisease = (data: any): DiseaseInfo => {
  // This is a simplified mock function that returns a basic prediction
  const symptoms = data.symptoms?.toLowerCase() || "";
  const vitals = data.vitals || {};
  
  // Simple logic to determine severity based on vitals or symptoms
  let severity = "low";
  let confidence = 0.75;
  let overview = "Based on the provided information, you appear to be in good health.";
  let symptoms_list = ["No concerning symptoms detected"];
  let treatments = ["Maintain a healthy lifestyle", "Regular check-ups"];
  let precautions = ["Stay hydrated", "Get adequate rest", "Eat a balanced diet"];
  
  // Check for concerning vitals
  if (vitals.heartRate && (vitals.heartRate > 100 || vitals.heartRate < 60)) {
    severity = "medium";
    confidence = 0.82;
    overview = "Your heart rate is outside the normal range, which may indicate stress or an underlying condition.";
    symptoms_list = ["Abnormal heart rate", "Possible cardiovascular strain"];
    treatments = ["Rest and monitor", "Consult with a healthcare provider if persistent"];
    precautions = ["Avoid strenuous activity", "Monitor your heart rate", "Stay hydrated"];
  }
  
  if (vitals.oxygenLevel && vitals.oxygenLevel < 95) {
    severity = "high";
    confidence = 0.88;
    overview = "Your oxygen saturation is below normal levels, which requires attention.";
    symptoms_list = ["Low blood oxygen", "Possible respiratory issues"];
    treatments = ["Seek medical attention", "Supplemental oxygen may be needed"];
    precautions = ["Avoid high altitudes", "Rest frequently", "Monitor oxygen levels"];
  }
  
  // Check for concerning symptoms
  if (symptoms.includes("fever") || symptoms.includes("cough") || symptoms.includes("headache")) {
    severity = "medium";
    confidence = 0.78;
    overview = "Your symptoms may indicate a common viral infection.";
    symptoms_list = ["Fever", "Cough", "Headache"];
    treatments = ["Rest", "Hydration", "Over-the-counter fever reducers if needed"];
    precautions = ["Monitor temperature", "Isolate if contagious", "Seek medical care if symptoms worsen"];
  }
  
  if (symptoms.includes("chest pain") || symptoms.includes("difficulty breathing")) {
    severity = "high";
    confidence = 0.85;
    overview = "Your symptoms require immediate medical attention as they may indicate a serious condition.";
    symptoms_list = ["Chest pain", "Difficulty breathing"];
    treatments = ["Seek emergency medical care immediately"];
    precautions = ["Do not delay seeking help", "Rest and try to remain calm"];
  }
  
  return {
    overview,
    symptoms: symptoms_list,
    treatments,
    precautions,
    severity,
    confidence,
    similarConditions: ["General health assessment"],
    timestamp: new Date().toISOString(),
    predictedFrom: data.vitals ? "vitals" : "symptoms",
  };
};

export default function WellnessInsightsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [diseaseInfo, setDiseaseInfo] = React.useState<DiseaseInfo | null>(null);
  const [symptoms, setSymptoms] = React.useState<string>("");
  const [age, setAge] = React.useState<string>("");
  const [gender, setGender] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);
  const [history, setHistory] = React.useState<DiseaseInfo[]>([]);
  const [activeTab, setActiveTab] = React.useState<string>("prediction");
  const [activeDiseaseTab, setActiveDiseaseTab] = React.useState<string>("overview");
  const [error, setError] = React.useState<string | null>(null);
  const [vitals, setVitals] = React.useState<VitalsData>({});
  const [vitalsLoading, setVitalsLoading] = React.useState<boolean>(false);
  const [hasVitalsData, setHasVitalsData] = React.useState<boolean>(false);
  const [vitalsData, setVitalsData] = React.useState<SensorData>({});
  const [lastUpdated, setLastUpdated] = React.useState<string | null>(null);
  const [vitalsHistory, setVitalsHistory] = React.useState<SensorData[]>([]);

  // Initialize age and gender from user data
  React.useEffect(() => {
    if (user) {
      if (user.age) setAge(user.age.toString());
      if (user.gender) setGender(user.gender);
    }
  }, [user]);

  const fetchVitalsData = async () => {
    if (!user?.id) {
      setError("User not authenticated");
      return null;
    }

    setVitalsLoading(true);
    try {
      // Get the most recent vitals record from Supabase
      const { data, error } = await supabase
        .from("vitals_data")
        .select("*")
        .eq("user_id", user.id)
        .order("timestamp", { ascending: false })
        .limit(1);

      if (error) {
        throw new Error(`Error fetching vitals: ${error.message}`);
      }

      if (!data || data.length === 0) {
        setError("No vitals data found for this user");
        return null;
      }

      const latestVitals = data[0];
      console.log("Latest vitals from Supabase:", latestVitals);

      // Set the vitals data
      setVitalsData({
        heart_rate: latestVitals.heart_rate,
        pulse_rate: latestVitals.pulse_rate,
        spo2: latestVitals.spo2,
        temperature: latestVitals.temperature,
        systolic_bp: latestVitals.systolic_bp,
        diastolic_bp: latestVitals.diastolic_bp,
        respiratory_rate: latestVitals.respiratory_rate,
        glucose_level: latestVitals.glucose_level,
        activity_level: latestVitals.activity_level,
        timestamp: latestVitals.timestamp,
      });

      setLastUpdated(latestVitals.timestamp);
      setHasVitalsData(true);

      // Format data for prediction
      const vitalsForPrediction: VitalsData = {
        heartRate: latestVitals.heart_rate,
        pulseRate: latestVitals.pulse_rate,
        bloodPressure: latestVitals.systolic_bp && latestVitals.diastolic_bp
          ? `${latestVitals.systolic_bp}/${latestVitals.diastolic_bp}`
          : undefined,
        temperature: latestVitals.temperature,
        oxygenLevel: latestVitals.spo2,
        respiratoryRate: latestVitals.respiratory_rate,
        glucoseLevel: latestVitals.glucose_level,
        activityLevel: latestVitals.activity_level,
        age: age,
        gender: gender,
        lastUpdated: latestVitals.timestamp,
      };

      setVitals(vitalsForPrediction);
      
      // Also fetch the last 7 records for history
      const { data: historyData, error: historyError } = await supabase
        .from("vitals_data")
        .select("*")
        .eq("user_id", user.id)
        .order("timestamp", { ascending: false })
        .limit(7);
        
      if (!historyError && historyData && historyData.length > 0) {
        setVitalsHistory(historyData);
      }
      
      toast({
        title: "Vitals data loaded",
        description: "Your latest health metrics have been retrieved successfully.",
      });
      
      return vitalsForPrediction;
    } catch (error) {
      console.error("Error fetching vitals:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch vitals data");
      
      toast({
        title: "Error loading vitals",
        description: "Could not retrieve your health metrics. Please try again.",
        variant: "destructive",
      });
      
      return null;
    } finally {
      setVitalsLoading(false);
    }
  };

  const predictFromVitals = async () => {
    if (!hasVitalsData) {
      const vitalsData = await fetchVitalsData();
      if (!vitalsData) return;
    }

    setLoading(true);
    setError(null);
    try {
      // Since we're not using the backend API, we'll use our mock function
      const prediction = mockPredictDisease({ vitals });

      const response = {
        ...DEFAULT_DISEASE_INFO,
        ...prediction,
        timestamp: new Date().toISOString(),
        predictedFrom: "vitals" as "vitals",
      };

      setDiseaseInfo(response);
      setHistory((prev) => [{ ...response } as DiseaseInfo, ...prev].slice(0, 5));
      
      toast({
        title: "Assessment complete",
        description: `Health assessment based on your vitals is ready.`,
      });
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to get assessment from vitals. Please try again.");
      
      toast({
        title: "Assessment failed",
        description: "Could not complete health assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) {
      setError("Please enter symptoms");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Since we're not using the backend API, we'll use our mock function
      const prediction = mockPredictDisease({ symptoms });

      const response = {
        ...DEFAULT_DISEASE_INFO,
        ...prediction,
        timestamp: new Date().toISOString(),
        predictedFrom: "symptoms" as "symptoms",
      };

      setDiseaseInfo(response);
      setHistory((prev) => [response, ...prev].slice(0, 5));
      
      toast({
        title: "Assessment complete",
        description: `Health assessment based on your symptoms is ready.`,
      });
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to get assessment. Please try again.");
      
      toast({
        title: "Assessment failed",
        description: "Could not complete health assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load vitals data on component mount
  React.useEffect(() => {
    if (user?.id) {
      fetchVitalsData();
    }
  }, [user?.id]);

  const metrics = [
    {
      title: "Heart Rate",
      value: vitalsData.heart_rate ?? "--",
      unit: "BPM",
      description: "Beats per minute",
      icon: <HeartPulse className="h-5 w-5 text-blue-500" />,
      color: "bg-blue-50 text-blue-500",
    },
    {
      title: "Pulse Rate",
      value: vitalsData.pulse_rate ?? "--",
      unit: "BPM",
      description: "Pulse measurement",
      icon: <Activity className="h-5 w-5 text-indigo-500" />,
      color: "bg-indigo-50 text-indigo-500",
    },
    {
      title: "SpO2",
      value: vitalsData.spo2 ?? "--",
      unit: "%",
      description: "Oxygen saturation",
      icon: <Droplets className="h-5 w-5 text-red-500" />,
      color: "bg-red-50 text-red-500",
    },
    {
      title: "Temperature",
      value: vitalsData.temperature ?? "--",
      unit: "°C",
      description: "Body temperature",
      icon: <Thermometer className="h-5 w-5 text-orange-500" />,
      color: "bg-orange-50 text-orange-500",
    },
    {
      title: "Respiratory Rate",
      value: vitalsData.respiratory_rate ?? "--",
      unit: "rpm",
      description: "Breaths per minute",
      icon: <Wind className="h-5 w-5 text-purple-500" />,
      color: "bg-purple-50 text-purple-500",
    },
    {
      title: "Blood Pressure",
      value:
        vitalsData.systolic_bp && vitalsData.diastolic_bp
          ? `${vitalsData.systolic_bp}/${vitalsData.diastolic_bp}`
          : "--",
      unit: "mmHg",
      description: "Systolic/Diastolic",
      icon: <Gauge className="h-5 w-5 text-green-500" />,
      color: "bg-green-50 text-green-500",
    },
    {
      title: "Glucose Level",
      value: vitalsData.glucose_level ?? "--",
      unit: "mg/dL",
      description: "Blood sugar",
      icon: <Droplets className="h-5 w-5 text-yellow-500" />,
      color: "bg-yellow-50 text-yellow-500",
    },
    {
      title: "Activity",
      value: vitalsData.activity_level?.activity_type 
        ? vitalsData.activity_level.activity_type.charAt(0).toUpperCase() + 
          vitalsData.activity_level.activity_type.slice(1)
        : "--",
      unit: "",
      description: "Current activity",
      icon: <Footprints className="h-5 w-5 text-teal-500" />,
      color: "bg-teal-50 text-teal-500",
    },
  ];

  const severityColor = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const safeArray = (arr?: any[]) => arr || [];

  const formatDate = (timestamp?: string) => {
    if (!timestamp) return "Unknown date";
    try {
      return new Date(timestamp).toLocaleString();
    } catch (e) {
      return "Invalid date";
    }
  };

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
                      Health Services
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
            <div className="p-6 max-w-6xl mx-auto space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    AI Health Assistant
                  </h1>
                  <p className="text-muted-foreground">
                    Get personalized health insights based on your symptoms or vitals
                  </p>
                </div>
                
                {lastUpdated && (
                  <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-md flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Last updated: {formatDate(lastUpdated)}
                  </div>
                )}
              </div>

              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Current Vitals Summary */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    Current Health Metrics
                  </CardTitle>
                  <CardDescription>
                    Latest readings from your health monitoring devices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {vitalsLoading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      {Array(8).fill(0).map((_, i) => (
                        <div key={i} className="p-4 border rounded-lg">
                          <div className="flex items-center gap-3 mb-2">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-20" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                          </div>
                          <Skeleton className="h-6 w-24 mt-2" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      {metrics.map((metric, index) => (
                        <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-full ${metric.color}`}>
                              {metric.icon}
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {metric.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {metric.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-end gap-2">
                            <p className="text-2xl font-bold">
                              {metric.value}
                              {metric.unit && (
                                <span className="text-base font-normal text-muted-foreground ml-1">
                                  {metric.unit}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t pt-4 flex justify-between">
                  <div className="text-sm text-muted-foreground">
                    Data synced from your BioWear device
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchVitalsData}
                    disabled={vitalsLoading}
                    className="gap-2"
                  >
                    {vitalsLoading ? (
                      <>
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                        Refreshing...
                      </>
                    ) : (
                      <>Refresh Data</>
                    )}
                  </Button>
                </CardFooter>
              </Card>

              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-6"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="prediction">
                    New Assessment
                  </TabsTrigger>
                  <TabsTrigger value="history">
                    History
                  </TabsTrigger>
                  <TabsTrigger value="resources">
                    Resources
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="prediction" className="space-y-6">
                  {/* Vitals Assessment Card */}
                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        Automatic Assessment from Vitals
                      </CardTitle>
                      <CardDescription>
                        Get health insights from your connected medical devices
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Age
                          </label>
                          <Input
                            type="number"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            placeholder="Your age"
                            disabled={loading || vitalsLoading}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Gender
                          </label>
                          <Select
                            value={gender}
                            onValueChange={setGender}
                            disabled={loading || vitalsLoading}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">
                                Male
                              </SelectItem>
                              <SelectItem value="female">
                                Female
                              </SelectItem>
                              <SelectItem value="other">
                                Other
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Alert className="bg-blue-50 border-blue-200">
                        <InfoIcon className="h-4 w-4 text-blue-500" />
                        <AlertTitle className="text-blue-700">Vitals Data Available</AlertTitle>
                        <AlertDescription className="text-blue-600">
                          Your latest health metrics have been loaded from your BioWear device. Click the button below to get an AI assessment based on these metrics.
                        </AlertDescription>
                      </Alert>

                      <div className="flex items-center gap-4 pt-2">
                        <Button
                          onClick={predictFromVitals}
                          disabled={loading || vitalsLoading}
                          variant={hasVitalsData ? "default" : "outline"}
                          className="gap-2"
                        >
                          {vitalsLoading ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                              Processing vitals...
                            </>
                          ) : hasVitalsData ? (
                            "Get Assessment from Vitals"
                          ) : (
                            "Get Assessment from Vitals"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Symptoms Assessment Card */}
                  <form onSubmit={handleSubmit}>
                    <Card className="shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <Stethoscope className="h-5 w-5 text-primary" />
                          Manual Assessment from Symptoms
                        </CardTitle>
                        <CardDescription>
                          Describe what you're experiencing in detail
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium">
                              Symptoms*
                            </label>
                            <Input
                              value={symptoms}
                              onChange={(e) => setSymptoms(e.target.value)}
                              placeholder="e.g. fever, headache, cough"
                              disabled={loading}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Age
                            </label>
                            <Input
                              type="number"
                              value={age}
                              onChange={(e) => setAge(e.target.value)}
                              placeholder="Your age"
                              disabled={loading}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Gender
                            </label>
                            <Select
                              value={gender}
                              onValueChange={setGender}
                              disabled={loading}
                              required
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="male">
                                  Male
                                </SelectItem>
                                <SelectItem value="female">
                                  Female
                                </SelectItem>
                                <SelectItem value="other">
                                  Other
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <Alert>
                          <InfoIcon className="h-4 w-4" />
                          <AlertTitle>Note</AlertTitle>
                          <AlertDescription>
                            For informational purposes only. Consult a doctor for
                            medical advice.
                          </AlertDescription>
                        </Alert>

                        <Button
                          type="submit"
                          disabled={loading || !symptoms.trim()}
                          className="gap-2"
                        >
                          {loading ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                              Analyzing...
                            </>
                          ) : (
                            "Get Assessment"
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </form>

                  {/* Results Section */}
                  {loading && !diseaseInfo ? (
                    <div className="space-y-6">
                      <Card>
                        <CardHeader className="border-b">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-3 w-3 rounded-full" />
                              <Skeleton className="h-6 w-48" />
                            </div>
                            <Skeleton className="h-6 w-20" />
                          </div>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    diseaseInfo && (
                      <div className="space-y-6">
                        {/* Assessment Card */}
                        <Card className="shadow-md">
                          <CardHeader className="border-b">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`h-3 w-3 rounded-full ${severityColor(
                                    diseaseInfo.severity
                                  )}`}
                                />
                                <CardTitle>
                                  Health Assessment
                                </CardTitle>
                                {diseaseInfo.predictedFrom === "vitals" && (
                                  <Badge variant="secondary" className="ml-2">
                                    From Vitals
                                  </Badge>
                                )}
                              </div>
                              <Badge variant="outline">
                                Confidence:{" "}
                                {Math.round((diseaseInfo.confidence || 0) * 100)}%
                              </Badge>
                            </div>
                          </CardHeader>

                          <Tabs
                            value={activeDiseaseTab}
                            onValueChange={setActiveDiseaseTab}
                            className="w-full"
                          >
                            <TabsList className="grid w-full grid-cols-4 h-12 rounded-none border-b">
                              <TabsTrigger value="overview" className="py-3">
                                Overview
                              </TabsTrigger>
                              <TabsTrigger value="symptoms" className="py-3">
                                Symptoms
                              </TabsTrigger>
                              <TabsTrigger value="treatment" className="py-3">
                                Treatment
                              </TabsTrigger>
                              <TabsTrigger value="prevention" className="py-3">
                                Prevention
                              </TabsTrigger>
                            </TabsList>

                            <ScrollArea className="h-[400px] p-6">
                              <TabsContent value="overview" className="space-y-4">
                                <h3 className="text-lg font-semibold">
                                  About the Condition
                                </h3>
                                <p className="text-muted-foreground">
                                  {diseaseInfo.overview || "No overview available"}
                                </p>

                                <Collapsible>
                                  <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-medium hover:text-foreground">
                                    <span>Key Facts</span>
                                    <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="px-4 py-2 space-y-2">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-sm text-muted-foreground">
                                          Severity
                                        </p>
                                        <p className="font-medium">
                                          {diseaseInfo.severity || "Unknown"}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-muted-foreground">
                                          Age Group
                                        </p>
                                        <p className="font-medium">
                                          {age || "Not specified"}
                                        </p>
                                      </div>
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>

                                {safeArray(diseaseInfo.similarConditions).length > 0 && (
                                  <div className="pt-4">
                                    <h4 className="font-medium mb-2">
                                      Similar Conditions
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                      {safeArray(diseaseInfo.similarConditions).map(
                                        (condition, i) => (
                                          <Badge
                                            key={i}
                                            variant="outline"
                                            className="text-sm"
                                          >
                                            {condition}
                                          </Badge>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}
                              </TabsContent>

                              <TabsContent value="symptoms" className="space-y-4">
                                <h3 className="text-lg font-semibold">
                                  Common Symptoms
                                </h3>
                                {safeArray(diseaseInfo.symptoms).length > 0 ? (
                                  <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                                    {safeArray(diseaseInfo.symptoms).map(
                                      (symptom, i) => (
                                        <li key={i}>{symptom}</li>
                                      )
                                    )}
                                  </ul>
                                ) : (
                                  <p className="text-muted-foreground">
                                    No symptoms data available
                                  </p>
                                )}
                              </TabsContent>

                              <TabsContent value="treatment" className="space-y-4">
                                <h3 className="text-lg font-semibold">
                                  Treatment Options
                                </h3>
                                {safeArray(diseaseInfo.treatments).length > 0 ? (
                                  <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                                    {safeArray(diseaseInfo.treatments).map(
                                      (treatment, i) => (
                                        <li key={i}>{treatment}</li>
                                      )
                                    )}
                                  </ul>
                                ) : (
                                  <p className="text-muted-foreground">
                                    No treatment data available
                                  </p>
                                )}
                              </TabsContent>

                              <TabsContent value="prevention" className="space-y-4">
                                <h3 className="text-lg font-semibold">
                                  Prevention Tips
                                </h3>
                                {safeArray(diseaseInfo.precautions).length > 0 ? (
                                  <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                                    {safeArray(diseaseInfo.precautions).map(
                                      (precaution, i) => (
                                        <li key={i}>{precaution}</li>
                                      )
                                    )}
                                  </ul>
                                ) : (
                                  <p className="text-muted-foreground">
                                    No prevention data available
                                  </p>
                                )}
                              </TabsContent>
                            </ScrollArea>
                          </Tabs>
                        </Card>
                        {/* Next Steps Card */}
                        <Card className="shadow-md">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full ${severityColor(diseaseInfo.severity)}`} />
                              Recommended Next Steps
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-6">
                              <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 mt-1">
                                  <div
                                    className={`h-3 w-3 rounded-full ${severityColor(
                                      diseaseInfo.severity
                                    )}`}
                                  />
                                </div>
                                <div>
                                  <h4 className="font-medium">
                                    When to see a doctor
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {diseaseInfo.severity === "high"
                                      ? "Seek immediate medical attention"
                                      : diseaseInfo.severity === "medium"
                                      ? "Schedule an appointment within 24-48 hours"
                                      : "Consult a doctor if symptoms persist or worsen"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 mt-1">
                                  <div className="h-3 w-3 rounded-full bg-primary/50" />
                                </div>
                                <div>
                                  <h4 className="font-medium">
                                    Self-care tips
                                  </h4>
                                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                                    <li>Get plenty of rest</li>
                                    <li>Stay hydrated</li>
                                    <li>Monitor your symptoms</li>
                                    {diseaseInfo.predictedFrom === "vitals" && (
                                      <li>Monitor your vital signs regularly</li>
                                    )}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="border-t pt-4">
                            <div className="text-sm text-muted-foreground">
                              Assessment completed on {formatDate(diseaseInfo.timestamp)}
                            </div>
                          </CardFooter>
                        </Card>
                      </div>
                    )
                  )}
                </TabsContent>

                <TabsContent value="history">
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>
                          Assessment History
                        </CardTitle>
                        <CardDescription>
                          Your recent health assessments
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {history.length > 0 ? (
                          <div className="space-y-4">
                            {history.map((item, index) => (
                              <Card
                                key={index}
                                className="transition-colors cursor-pointer hover:bg-muted/30"
                                onClick={() => {
                                  setDiseaseInfo(item);
                                  setActiveTab("prediction");
                                }}
                              >
                                <CardHeader className="py-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div
                                        className={`h-2 w-2 rounded-full ${severityColor(
                                          item.severity
                                        )}`}
                                      />
                                      <CardTitle className="text-sm font-medium">
                                        {item.timestamp
                                          ? formatDate(item.timestamp)
                                          : "Unknown date"}
                                      </CardTitle>
                                      {item.predictedFrom === "vitals" && (
                                        <Badge variant="secondary">Vitals</Badge>
                                      )}
                                    </div>
                                    <Badge variant="outline">
                                      {Math.round((item.confidence || 0) * 100)}%
                                    </Badge>
                                  </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                  <p className="text-sm line-clamp-2 text-muted-foreground">
                                    {item.overview || "No overview available"}
                                  </p>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12">
                            <InfoIcon className="h-8 w-8 text-muted-foreground mb-4" />
                            <p className="text-sm text-muted-foreground">
                              No assessment history yet. Complete your first
                              assessment to see it here.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>
                          Vitals History
                        </CardTitle>
                        <CardDescription>
                          Your recent health metrics
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {vitalsHistory.length > 0 ? (
                          <div className="space-y-4">
                            {vitalsHistory.map((item, index) => (
                              <Card key={index} className="hover:bg-muted/30 transition-colors">
                                <CardHeader className="py-3">
                                  <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium">
                                      {formatDate(item.timestamp)}
                                    </CardTitle>
                                  </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="flex items-center gap-1">
                                      <HeartPulse className="h-3 w-3 text-red-500" />
                                      <span className="text-muted-foreground">HR:</span>
                                      <span>{item.heart_rate || '--'} BPM</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Droplets className="h-3 w-3 text-blue-500" />
                                      <span className="text-muted-foreground">SpO2:</span>
                                      <span>{item.spo2 || '--'}%</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Thermometer className="h-3 w-3 text-orange-500" />
                                      <span className="text-muted-foreground">Temp:</span>
                                      <span>{item.temperature || '--'}°C</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Gauge className="h-3 w-3 text-green-500" />
                                      <span className="text-muted-foreground">BP:</span>
                                      <span>
                                        {item.systolic_bp && item.diastolic_bp 
                                          ? `${item.systolic_bp}/${item.diastolic_bp}` 
                                          : '--'}
                                      </span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12">
                            <InfoIcon className="h-8 w-8 text-muted-foreground mb-4" />
                            <p className="text-sm text-muted-foreground">
                              No vitals history available.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="resources">
                  <Card>
                    <CardHeader>
                      <CardTitle>Health Resources</CardTitle>
                      <CardDescription>
                        Trusted sources for medical information
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-8">
                        <div>
                          <h3 className="font-medium mb-4">Medical References</h3>
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {[
                              {
                                name: "Mayo Clinic",
                                url: "https://www.mayoclinic.org",
                              },
                              { name: "CDC", url: "https://www.cdc.gov" },
                              { name: "WHO", url: "https://www.who.int" },
                              { name: "WebMD", url: "https://www.webmd.com" },
                              { name: "NIH", url: "https://www.nih.gov" },
                              {
                                name: "MedlinePlus",
                                url: "https://medlineplus.gov",
                              },
                            ].map((resource, i) => (
                              <a
                                key={i}
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="border rounded-lg p-4 hover:shadow-md transition-all hover:border-primary/30"
                              >
                                <div className="font-medium">{resource.name}</div>
                                <div className="text-sm text-muted-foreground mt-1 truncate">
                                  {resource.url}
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className="font-medium mb-4">Emergency Signs</h3>
                          <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
                            <AlertTitle className="text-destructive">When to seek immediate help</AlertTitle>
                            <AlertDescription className="text-destructive/90">
                              <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li>Chest pain or pressure lasting more than a few minutes</li>
                                <li>Difficulty breathing or shortness of breath</li>
                                <li>Sudden confusion or difficulty speaking</li>
                                <li>Severe, uncontrollable bleeding</li>
                                <li>Sudden severe pain anywhere in the body</li>
                              </ul>
                            </AlertDescription>
                          </Alert>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}