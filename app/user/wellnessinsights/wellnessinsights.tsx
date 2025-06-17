"use client";

import { AppSidebar } from "@/components/sidebar/app-sidebar";
import axios from "axios";
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
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
  age?: string; // Added age property
  gender?: string; // Added gender property
  lastUpdated?: string;
};

type SensorData = {
  currHeartRate?: number;
  currPulseRate?: number;
  currSpO2?: number;
  currTemperature?: number;
  currSystolic?: number;
  currDiastolic?: number;
  currRespiratoryRate?: number;
  age?: number;
  gender?: string;
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

export default function Wellnessinsights() {
  const [diseaseInfo, setDiseaseInfo] = React.useState<DiseaseInfo | null>(
    null
  );
  const [symptoms, setSymptoms] = React.useState<string>("");
  const [age, setAge] = React.useState<string>("");
  const [gender, setGender] = React.useState<string>("");
  const [username] = React.useState<string>("maaswin");
  const [loading, setLoading] = React.useState<boolean>(false);
  const [history, setHistory] = React.useState<DiseaseInfo[]>([]);
  const [activeTab, setActiveTab] = React.useState<string>("prediction");
  const [activeDiseaseTab, setActiveDiseaseTab] =
    React.useState<string>("overview");
  const [error, setError] = React.useState<string | null>(null);
  const [vitals, setVitals] = React.useState<VitalsData>({});
  const [vitalsLoading, setVitalsLoading] = React.useState<boolean>(false);
  const [hasVitalsData, setHasVitalsData] = React.useState<boolean>(false);
  const [vitalsData, setVitalsData] = React.useState<SensorData>({});

  const fetchVitalsData = async () => {
    setVitalsLoading(true);
    try {
      const endpoints = [
        { key: "heartRate", endpoint: "/api/get/heartrate" },
        { key: "pulseRate", endpoint: "/api/get/pulserate" },
        { key: "spo2", endpoint: "/api/get/spo2" },
        { key: "temperature", endpoint: "/api/get/temperature" },
        { key: "respiratoryRate", endpoint: "/api/get/respiratoryrate" },
        { key: "bloodPressure", endpoint: "/api/get/bloodpressure" },
      ];

      const responses = await Promise.all(
        endpoints.map(({ endpoint }) =>
          axios.post(`http://localhost:8000${endpoint}`, { username })
        )
      );

      console.log(responses);

      const data = responses.reduce((acc, response, index) => {
        const { key } = endpoints[index];
        if (key === "bloodPressure") {
          return {
            ...acc,
            currSystolic: response.data[0]?.currSystolic,
            currDiastolic: response.data[0]?.currDiastolic,
          };
        } else if (key === "spo2") {
          return {
            ...acc,
            currSpO2: response.data[0]?.currSpO2,
          };
        } else if (key === "userInfo") {
          return {
            ...acc,
            age: response.data[0]?.age,
            gender: response.data[0]?.gender,
          };
        } else {
          return {
            ...acc,
            [`curr${key.charAt(0).toUpperCase() + key.slice(1)}`]:
              response.data[0]?.[
                `curr${key.charAt(0).toUpperCase() + key.slice(1)}`
              ],
          };
        }
      }, {} as SensorData);

      console.log(data);

      setVitalsData(data);
      setHasVitalsData(true);

      const vitalsForPrediction: VitalsData = {
        heartRate: data.currHeartRate,
        pulseRate: data.currPulseRate,
        bloodPressure:
          data.currSystolic && data.currDiastolic
            ? `${data.currSystolic}/${data.currDiastolic}`
            : undefined,
        temperature: data.currTemperature,
        oxygenLevel: data.currSpO2,
        respiratoryRate: data.currRespiratoryRate,
        age: age,
        gender: gender,
        lastUpdated: new Date().toISOString(),
      };

      setVitals(vitalsForPrediction);
      return vitalsForPrediction;
    } catch (error) {
      console.error("Error fetching vitals:", error);
      setError("Failed to fetch vitals data");
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
      const res = await axios.post<DiseaseInfo>(
        "http://localhost:8000/predict-from-vitals",
        {
          vitals,
        }
      );

      const response = {
        ...DEFAULT_DISEASE_INFO,
        ...res.data,
        timestamp: new Date().toISOString(),
        predictedFrom: "vitals" as "vitals",
      };

      setDiseaseInfo(response);
      setHistory((prev) =>
        [{ ...response } as DiseaseInfo, ...prev].slice(0, 5)
      );
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
      const res = await axios.post<DiseaseInfo>(
        "http://localhost:8000/predict",
        {
          symptoms,
          age,
          gender,
        }
      );

      const response = {
        ...DEFAULT_DISEASE_INFO,
        ...res.data,
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

  const metrics = [
    {
      title: "Heart Rate",
      value: vitalsData.currHeartRate ?? "--",
      unit: "BPM",
      description: "Beats per minute",
    },
    {
      title: "Pulse Rate",
      value: vitalsData.currPulseRate ?? "--",
      unit: "BPM",
      description: "Pulse measurement",
    },
    {
      title: "SpO2",
      value: vitalsData.currSpO2 ?? "--",
      unit: "%",
      description: "Oxygen saturation",
    },
    {
      title: "Temperature",
      value: vitalsData.currTemperature ?? "--",
      unit: "°F",
      description: "Body temperature",
    },
    {
      title: "Respiratory Rate",
      value: vitalsData.currRespiratoryRate ?? "--",
      unit: "rpm",
      description: "Breaths per minute",
    },
    {
      title: "Blood Pressure",
      value:
        vitalsData.currSystolic && vitalsData.currDiastolic
          ? `${vitalsData.currSystolic}/${vitalsData.currDiastolic}`
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

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 border-b">
            <SidebarTrigger className="-ml-1 text-white" />
            <Separator orientation="vertical" className="h-6" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink
                    href="/wellnessinsights"
                    className="hover:text-primary text-white"
                  >
                    Health Services
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block text-gray-500" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold text-white">
                    Wellness Insights
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
        </header>

        <main className="w-[100%] flex-1 p-6 mx-auto bg-black text-white">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              AI Health Assistant
            </h1>
            <p className="text-gray-400">
              Get personalized health insights based on your symptoms or vitals
            </p>
          </div>

          {error && (
            <Alert
              variant="destructive"
              className="mb-6 bg-red-900 border-red-700"
            >
              <AlertTitle className="text-white">Error</AlertTitle>
              <AlertDescription className="text-red-200">
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
              <TabsTrigger
                value="prediction"
                className="text-white data-[state=active]:bg-gray-700"
              >
                New Assessment
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="text-white data-[state=active]:bg-gray-700"
              >
                History
              </TabsTrigger>
              <TabsTrigger
                value="resources"
                className="text-white data-[state=active]:bg-gray-700"
              >
                Resources
              </TabsTrigger>
            </TabsList>

            <TabsContent value="prediction" className="space-y-6">
              {/* Vitals Assessment Card */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl text-white">
                    Automatic Assessment from Vitals
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Get health insights from your connected medical devices
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">
                        Age
                      </label>
                      <Input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="Your age"
                        disabled={loading || vitalsLoading}
                        required
                        className="text-white placeholder-gray-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">
                        Gender
                      </label>
                      <Select
                        value={gender}
                        onValueChange={setGender}
                        disabled={loading || vitalsLoading}
                        required
                      >
                        <SelectTrigger className=" text-white">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className=" text-white">
                          <SelectItem
                            value="male"
                            className="hover:bg-gray-800"
                          >
                            Male
                          </SelectItem>
                          <SelectItem
                            value="female"
                            className="hover:bg-gray-800"
                          >
                            Female
                          </SelectItem>
                          <SelectItem
                            value="other"
                            className="hover:bg-gray-800"
                          >
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
                        className="p-4 hover:shadow-md transition-shadow "
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-400">
                              {metric.title}
                            </p>
                            <p className="text-2xl font-semibold text-white">
                              {metric.value}{" "}
                              <span className="text-base text-gray-300">
                                {metric.unit}
                              </span>
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {metric.description}
                        </p>
                      </Card>
                    ))}
                  </div>

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
                        className="text-gray-300 hover:text-white"
                      >
                        Clear Vitals
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Symptoms Assessment Card */}
              <form onSubmit={handleSubmit}>
                <Card className="shadow-sm ">
                  <CardHeader>
                    <CardTitle className="text-xl text-white">
                      Manual Assessment from Symptoms
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Describe what you're experiencing in detail
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white">
                          Symptoms*
                        </label>
                        <Input
                          value={symptoms}
                          onChange={(e) => setSymptoms(e.target.value)}
                          placeholder="e.g. fever, headache, cough"
                          disabled={loading}
                          className="text-white placeholder-gray-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white">
                          Age
                        </label>
                        <Input
                          type="number"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          placeholder="Your age"
                          disabled={loading}
                          required
                          className=" text-white placeholder-gray-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white">
                          Gender
                        </label>
                        <Select
                          value={gender}
                          onValueChange={setGender}
                          disabled={loading}
                          required
                        >
                          <SelectTrigger className=" text-white">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent className=" text-white">
                            <SelectItem
                              value="male"
                              className="hover:bg-gray-800"
                            >
                              Male
                            </SelectItem>
                            <SelectItem
                              value="female"
                              className="hover:bg-gray-800"
                            >
                              Female
                            </SelectItem>
                            <SelectItem
                              value="other"
                              className="hover:bg-gray-800"
                            >
                              Other
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Alert className="">
                      <InfoCircledIcon className="h-4 w-4 text-blue-400" />
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
                  <Card className="">
                    <CardHeader className="border-b border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-3 w-3 rounded-full bg-gray-700" />
                          <Skeleton className="h-6 w-48 bg-gray-700" />
                        </div>
                        <Skeleton className="h-6 w-20 bg-gray-700" />
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <Skeleton className="h-4 w-full bg-gray-700" />
                        <Skeleton className="h-4 w-3/4 bg-gray-700" />
                        <Skeleton className="h-4 w-1/2 bg-gray-700" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                diseaseInfo && (
                  <div className="space-y-6">
                    {/* Assessment Card */}
                    <Card className=" text-white ">
                      <CardHeader className="border-b ">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-3 w-3 rounded-full ${severityColor(
                                diseaseInfo.severity
                              )}`}
                            />
                            <CardTitle className="text-white">
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
                          <TabsTrigger
                            value="overview"
                            className="py-3 text-white data-[state=active]:bg-gray-700"
                          >
                            Overview
                          </TabsTrigger>
                          <TabsTrigger
                            value="symptoms"
                            className="py-3 text-white data-[state=active]:bg-gray-700"
                          >
                            Symptoms
                          </TabsTrigger>
                          <TabsTrigger
                            value="treatment"
                            className="py-3 text-white data-[state=active]:bg-gray-700"
                          >
                            Treatment
                          </TabsTrigger>
                          <TabsTrigger
                            value="prevention"
                            className="py-3 text-white data-[state=active]:bg-gray-700"
                          >
                            Prevention
                          </TabsTrigger>
                        </TabsList>

                        <ScrollArea className="h-[400px] p-6">
                          <TabsContent value="overview" className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">
                              About the Condition
                            </h3>
                            <p className="text-gray-300">
                              {diseaseInfo.overview || "No overview available"}
                            </p>

                            <Collapsible>
                              <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-medium text-gray-300 hover:text-white">
                                <span>Key Facts</span>
                                <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                              </CollapsibleTrigger>
                              <CollapsibleContent className="px-4 py-2 space-y-2">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-gray-400">
                                      Severity
                                    </p>
                                    <p className="font-medium text-white">
                                      {diseaseInfo.severity || "Unknown"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-400">
                                      Age Group
                                    </p>
                                    <p className="font-medium text-white">
                                      {age || "Not specified"}
                                    </p>
                                  </div>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>

                            {safeArray(diseaseInfo.similarConditions).length >
                              0 && (
                              <div className="pt-4">
                                <h4 className="font-medium mb-2 text-white">
                                  Similar Conditions
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {safeArray(diseaseInfo.similarConditions).map(
                                    (condition, i) => (
                                      <Badge
                                        key={i}
                                        variant="outline"
                                        className="text-sm text-white border-gray-600"
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
                            <h3 className="text-lg font-semibold text-white">
                              Common Symptoms
                            </h3>
                            {safeArray(diseaseInfo.symptoms).length > 0 ? (
                              <ul className="list-disc pl-5 space-y-2 text-gray-300">
                                {safeArray(diseaseInfo.symptoms).map(
                                  (symptom, i) => (
                                    <li key={i}>{symptom}</li>
                                  )
                                )}
                              </ul>
                            ) : (
                              <p className="text-gray-400">
                                No symptoms data available
                              </p>
                            )}
                          </TabsContent>

                          <TabsContent value="treatment" className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">
                              Treatment Options
                            </h3>
                            {safeArray(diseaseInfo.treatments).length > 0 ? (
                              <ul className="list-disc pl-5 space-y-2 text-gray-300">
                                {safeArray(diseaseInfo.treatments).map(
                                  (treatment, i) => (
                                    <li key={i}>{treatment}</li>
                                  )
                                )}
                              </ul>
                            ) : (
                              <p className="text-gray-400">
                                No treatment data available
                              </p>
                            )}
                          </TabsContent>

                          <TabsContent value="prevention" className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">
                              Prevention Tips
                            </h3>
                            {safeArray(diseaseInfo.precautions).length > 0 ? (
                              <ul className="list-disc pl-5 space-y-2 text-gray-300">
                                {safeArray(diseaseInfo.precautions).map(
                                  (precaution, i) => (
                                    <li key={i}>{precaution}</li>
                                  )
                                )}
                              </ul>
                            ) : (
                              <p className="text-gray-400">
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
                        <CardTitle className="flex items-center gap-2 text-white">
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
                              <h4 className="font-medium text-white">
                                When to see a doctor
                              </h4>
                              <p className="text-sm ">
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
                              <div className="h-3 w-3 rounded-full " />
                            </div>
                            <div>
                              <h4 className="font-medium text-white">
                                Self-care tips
                              </h4>
                              <ul className="list-disc pl-5 text-sm text-gray-400 space-y-1">
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
                  <CardTitle className="text-white">
                    Assessment History
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Your recent health assessments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {history.length > 0 ? (
                    <div className="space-y-4">
                      {history.map((item, index) => (
                        <Card
                          key={index}
                          className="transition-colors cursor-pointer "
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
                                    ? new Date(item.timestamp).toLocaleString()
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
                            <p className="text-sm  line-clamp-2">
                              {item.overview || "No overview available"}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <InfoCircledIcon className="h-8 w-8 text-gray-600 mb-4" />
                      <p className="text-sm">
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
                      <h3 className="font-medium mb-4 ">Medical References</h3>
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
                            className="border rounded-lg p-4 hover:shadow-md transition-all  hover:border-gray-600"
                          >
                            <div className="font-medium ">{resource.name}</div>
                            <div className="text-sm  mt-1 truncate">
                              {resource.url}
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-4 ">Emergency Signs</h3>
                      <ul className="list-disc pl-5 space-y-2 ">
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
