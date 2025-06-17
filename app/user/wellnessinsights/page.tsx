"use client";

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
import { InfoIcon } from "lucide-react";
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
};

type SensorData = {
  heart_rate?: number;
  pulse_rate?: number;
  spo2?: number;
  temperature?: number;
  systolic_bp?: number;
  diastolic_bp?: number;
  respiratory_rate?: number;
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

export default function Wellnessinsights() {
  const { user } = useAuth();
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
        timestamp: latestVitals.timestamp,
      });

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
        age: age,
        gender: gender,
        lastUpdated: latestVitals.timestamp,
      };

      setVitals(vitalsForPrediction);
      return vitalsForPrediction;
    } catch (error) {
      console.error("Error fetching vitals:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch vitals data");
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
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to get assessment from vitals. Please try again.");
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
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to get assessment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Load vitals data on component mount
  React.useEffect(() => {
    fetchVitalsData();
  }, [user?.id]);

  const metrics = [
    {
      title: "Heart Rate",
      value: vitalsData.heart_rate ?? "--",
      unit: "BPM",
      description: "Beats per minute",
    },
    {
      title: "Pulse Rate",
      value: vitalsData.pulse_rate ?? "--",
      unit: "BPM",
      description: "Pulse measurement",
    },
    {
      title: "SpO2",
      value: vitalsData.spo2 ?? "--",
      unit: "%",
      description: "Oxygen saturation",
    },
    {
      title: "Temperature",
      value: vitalsData.temperature ?? "--",
      unit: "°C",
      description: "Body temperature",
    },
    {
      title: "Respiratory Rate",
      value: vitalsData.respiratory_rate ?? "--",
      unit: "rpm",
      description: "Breaths per minute",
    },
    {
      title: "Blood Pressure",
      value:
        vitalsData.systolic_bp && vitalsData.diastolic_bp
          ? `${vitalsData.systolic_bp}/${vitalsData.diastolic_bp}`
          : "--",
      unit: "mmHg",
      description: "Systolic/Diastolic",
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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 border-b">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-6" />
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
                    Wellness Insights
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
        </header>

        <main className="w-full flex-1 p-6 mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">
              AI Health Assistant
            </h1>
            <p className="text-muted-foreground">
              Get personalized health insights based on your symptoms or vitals
            </p>
          </div>

          {error && (
            <Alert
              variant="destructive"
              className="mb-6"
            >
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}

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
                  <CardTitle className="text-xl">
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

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {metrics.map((metric, index) => (
                      <Card
                        key={index}
                        className="p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              {metric.title}
                            </p>
                            <p className="text-2xl font-semibold">
                              {metric.value}{" "}
                              <span className="text-base text-muted-foreground">
                                {metric.unit}
                              </span>
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {metric.description}
                        </p>
                      </Card>
                    ))}
                  </div>

                  {vitalsData.timestamp && (
                    <div className="text-sm text-muted-foreground">
                      Last updated: {formatDate(vitalsData.timestamp)}
                    </div>
                  )}

                  <div className="flex items-center gap-4 pt-2">
                    <Button
                      onClick={predictFromVitals}
                      disabled={loading || vitalsLoading}
                      variant={hasVitalsData ? "default" : "outline"}
                    >
                      {vitalsLoading
                        ? "Processing vitals..."
                        : hasVitalsData
                        ? "Re-assess from Vitals"
                        : "Get Assessment from Vitals"}
                    </Button>
                    {hasVitalsData && (
                      <Button
                        variant="ghost"
                        onClick={() => setHasVitalsData(false)}
                        disabled={vitalsLoading}
                      >
                        Clear Vitals
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Symptoms Assessment Card */}
              <form onSubmit={handleSubmit}>
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl">
                      Manual Assessment from Symptoms
                    </CardTitle>
                    <CardDescription>
                      Describe what you're experiencing in detail
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <div className="space-y-2">
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
                    >
                      {loading ? "Analyzing..." : "Get Assessment"}
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
                    <Card>
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
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" />
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
                              <div className="h-3 w-3 rounded-full" />
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
                    </Card>
                  </div>
                )
              )}
            </TabsContent>

            <TabsContent value="history">
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
                          className="transition-colors cursor-pointer"
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
                            <p className="text-sm line-clamp-2">
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
                            className="border rounded-lg p-4 hover:shadow-md transition-all hover:border-border"
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
                      <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                        <li>
                          Chest pain or pressure lasting more than a few minutes
                        </li>
                        <li>Difficulty breathing or shortness of breath</li>
                        <li>Sudden confusion or difficulty speaking</li>
                        <li>Severe, uncontrollable bleeding</li>
                        <li>Sudden severe pain anywhere in the body</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}