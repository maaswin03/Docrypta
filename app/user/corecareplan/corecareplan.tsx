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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface FormattedResponseProps {
  text: string;
  className?: string;
}

export const FormattedResponse: React.FC<FormattedResponseProps> = ({
  text,
  className = "",
}) => {
  if (!text) return null;

  const renderContent = () => {
    return text.split("\n").map((line, i) => {
      if (!line.trim()) return null;

      if (line.startsWith("## ")) {
        return (
          <h3 key={i} className="text-lg font-semibold mt-4 mb-2 text-primary">
            {line.substring(3)}
          </h3>
        );
      }

      if (line.startsWith("### ")) {
        return (
          <h4 key={i} className="text-md font-medium mt-3 mb-1">
            {line.substring(4)}
          </h4>
        );
      }

      if (line.startsWith("- ")) {
        return (
          <ul key={i} className="list-disc pl-5 my-1">
            <li>{line.substring(2)}</li>
          </ul>
        );
      }

      if (/^\d+\./.test(line)) {
        return (
          <ol key={i} className="list-decimal pl-5 my-1">
            <li>{line.substring(line.indexOf(" ") + 1)}</li>
          </ol>
        );
      }

      if (line.includes("**")) {
        const parts = line.split("**");
        return (
          <p key={i} className="my-1">
            {parts.map((part, j) =>
              j % 2 === 1 ? (
                <span key={j} className="font-semibold">
                  {part}
                </span>
              ) : (
                part
              )
            )}
          </p>
        );
      }

      if (/: \d+/.test(line)) {
        const [label, value] = line.split(": ");
        return (
          <p key={i} className="my-1">
            <span className="font-medium">{label}:</span> {value}
          </p>
        );
      }

      return (
        <p key={i} className="my-2">
          {line}
        </p>
      );
    });
  };

  return <div className={`text-sm ${className}`}>{renderContent()}</div>;
};

interface SensorData {
  [key: string]: any;
}

interface ResponseData {
  text: string;
}

export default function Personalizedplans() {
  const [suggestions, setSuggestions] = React.useState({
    spo2: "",
    temperature: "",
    heartRate: "",
    diet: "",
    exercise: "",
    sleep: "",
  });
  const [bloodPressureData, setBloodPressureData] = React.useState<SensorData>(
    {}
  );
  const [temperatureData, setTemperatureData] = React.useState<SensorData>({});
  const [heartrateData, setheartrateData] = React.useState<SensorData>({});
  const [pulserateData, setpulserateData] = React.useState<SensorData>({});
  const [rpData, setrpData] = React.useState<SensorData>({});
  const [spo2Data, setspo2Data] = React.useState<SensorData>({});

  const [loading, setLoading] = React.useState({
    general: false,
    diet: false,
    exercise: false,
    sleep: false,
  });

  const username = "maaswin";

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLoading((prev) => ({ ...prev, general: true }));
    try {
      setLoading((prev) => ({ ...prev, general: true }));

      const tempRes = await axios.post<ResponseData>(
        "http://localhost:8000/api/temperature_suggestions",
        { username }
      );
      setSuggestions((prev) => ({
        ...prev,
        temperature: tempRes.data.text.replace(/\*/g, ""),
      }));

      const spo2Res = await axios.post<ResponseData>(
        "http://localhost:8000/api/spo2_suggestions",
        {
          username,
        }
      );
      setSuggestions((prev) => ({
        ...prev,
        spo2: spo2Res.data.text.replace(/\*/g, ""),
      }));

      const heartRateRes = await axios.post<ResponseData>(
        "http://localhost:8000/api/pulseandheartrate_suggestions",
        { username }
      );
      setSuggestions((prev) => ({
        ...prev,
        heartRate: heartRateRes.data.text.replace(/\*/g, ""),
      }));
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setLoading((prev) => ({ ...prev, general: false }));
    }
  };

  const generateDietPlan = async () => {
    setLoading((prev) => ({ ...prev, diet: true }));
    try {
      const res = await axios.post<ResponseData>(
        "http://localhost:8000/generate_diet_plan",
        {
          username,
          healthData: {
            spo2: bloodPressureData.currentsp02,
            temperature: temperatureData.currenttemperature,
            heartRate: heartrateData.currentheartRate,
            pulseRate: pulserateData.currentpulseRate,
          },
        }
      );
      setSuggestions((prev) => ({
        ...prev,
        diet: res.data.text.replace(/\*/g, ""),
      }));
    } catch (error) {
      console.error("Error generating diet plan:", error);
    } finally {
      setLoading((prev) => ({ ...prev, diet: false }));
    }
  };

  const generateExercisePlan = async () => {
    setLoading((prev) => ({ ...prev, exercise: true }));
    try {
      const res = await axios.post<ResponseData>(
        "http://localhost:8000/generate_exercise_plan",
        {
          username,
          healthData: {
            spo2: bloodPressureData.currentsp02,
            temperature: temperatureData.currenttemperature,
            heartRate: heartrateData.currentheartRate,
            pulseRate: pulserateData.currentpulseRate,
          },
        }
      );
      setSuggestions((prev) => ({
        ...prev,
        exercise: res.data.text.replace(/\*/g, ""),
      }));
    } catch (error) {
      console.error("Error generating exercise plan:", error);
    } finally {
      setLoading((prev) => ({ ...prev, exercise: false }));
    }
  };

  const generateSleepPlan = async () => {
    setLoading((prev) => ({ ...prev, sleep: true }));
    try {
      const res = await axios.post<ResponseData>(
        "http://localhost:8000/generate_sleep_plan",
        {
          username,
          healthData: {
            spo2: bloodPressureData.currentsp02,
            temperature: temperatureData.currenttemperature,
            heartRate: heartrateData.currentheartRate,
            pulseRate: pulserateData.currentpulseRate,
          },
        }
      );
      setSuggestions((prev) => ({
        ...prev,
        sleep: res.data.text.replace(/\*/g, ""),
      }));
    } catch (error) {
      console.error("Error generating sleep plan:", error);
    } finally {
      setLoading((prev) => ({ ...prev, sleep: false }));
    }
  };

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [tempRes, heartRes, pulseRes, respRes, spo2Res, bpRes] =
          await Promise.all([
            fetch("http://localhost:8000/api/get/temperature", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username }),
            }),
            fetch("http://localhost:8000/api/get/heartrate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username }),
            }),
            fetch("http://localhost:8000/api/get/pulserate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username }),
            }),
            fetch("http://localhost:8000/api/get/respiratoryrate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username }),
            }),
            fetch("http://localhost:8000/api/get/spo2", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username }),
            }),
            fetch("http://localhost:8000/api/get/bloodpressure", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username }),
            }),
          ]);

        if (!tempRes.ok || !bpRes.ok || !heartRes.ok) {
          throw new Error("Network response was not ok");
        }

        const [tempData, bpData, heartData, pulseData, respData, spo2Data] =
          await Promise.all([
            tempRes.json(),
            bpRes.json(),
            heartRes.json(),
            pulseRes.json(),
            respRes.json(),
            spo2Res.json(),
          ]);

        setTemperatureData(tempData[0]);
        setBloodPressureData(bpData[0]);
        setheartrateData(heartData[0]);
        setpulserateData(pulseData[0]);
        setrpData(respData[0]);
        setspo2Data(spo2Data[0]);

        console.log("Temperature Data:", tempData[0]);
        console.log("Blood Pressure Data:", bpData[0]);
        console.log("Heart Rate Data:", heartData[0]);
        console.log("Pulse Rate Data:", pulseData[0]);
        console.log("Respiratory Rate Data:", respData[0]);
        console.log("SpO2 Data:", spo2Data[0]);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [username]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 border-b">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink
                    href="/corecareplan"
                    className="hover:text-primary"
                  >
                    Ai & Asssistance
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold">
                    Core Care Plans
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
        </header>

        <main className="flex-1 p-6">
          {/* Current Readings Section */}
          <section className="mb-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight">
                Current Readings
              </h1>
              <p className="text-muted-foreground text-sm">
                Latest measurements from your health monitoring devices
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <Card className="h-full rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardDescription className="font-medium text-sm">
                    SpO2
                  </CardDescription>
                  <CardTitle className="text-2xl">
                    {spo2Data.currSpO2 || "--"}{" "}
                    <span className="text-base">%</span>
                  </CardTitle>
                </CardHeader>
                <CardFooter>
                  <p className="text-xs text-muted-foreground">
                    Updated 5 min ago
                  </p>
                </CardFooter>
              </Card>

              <Card className="h-full rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardDescription className="font-medium text-sm">
                    Temperature
                  </CardDescription>
                  <CardTitle className="text-2xl">
                    {temperatureData.currTemperature || "--"}{" "}
                    <span className="text-base">°F</span>
                  </CardTitle>
                </CardHeader>
                <CardFooter>
                  <p className="text-xs text-muted-foreground">
                    Updated 5 min ago
                  </p>
                </CardFooter>
              </Card>

              <Card className="h-full rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardDescription className="font-medium text-sm">
                    Heart Rate
                  </CardDescription>
                  <CardTitle className="text-2xl">
                    {heartrateData.currHeartRate || "--"}{" "}
                    <span className="text-base">bpm</span>
                  </CardTitle>
                </CardHeader>
                <CardFooter>
                  <p className="text-xs text-muted-foreground">
                    Updated 5 min ago
                  </p>
                </CardFooter>
              </Card>

              <Card className="h-full rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardDescription className="font-medium text-sm">
                    Pulse Rate
                  </CardDescription>
                  <CardTitle className="text-2xl">
                    {pulserateData.currPulseRate || "--"}{" "}
                    <span className="text-base">bpm</span>
                  </CardTitle>
                </CardHeader>
                <CardFooter>
                  <p className="text-xs text-muted-foreground">
                    Updated 5 min ago
                  </p>
                </CardFooter>
              </Card>

              <Card className="h-full rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardDescription className="font-medium text-sm">
                    Respiratory Rate
                  </CardDescription>
                  <CardTitle className="text-2xl">
                    {rpData.currRespiratoryRate || "--"}{" "}
                    <span className="text-base">rpm</span>
                  </CardTitle>
                </CardHeader>
                <CardFooter>
                  <p className="text-xs text-muted-foreground">
                    Updated 5 min ago
                  </p>
                </CardFooter>
              </Card>

              <Card className="h-full rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardDescription className="font-medium text-sm">
                    Blood Pressure
                  </CardDescription>
                  <CardTitle className="text-2xl">
                    {bloodPressureData.currSystolic &&
                    bloodPressureData.currDiastolic
                      ? `${bloodPressureData.currSystolic}/${bloodPressureData.currDiastolic}`
                      : "--"}
                    <span className="text-base">mmHg</span>
                  </CardTitle>
                </CardHeader>
                <CardFooter>
                  <p className="text-xs text-muted-foreground">
                    Updated 5 min ago
                  </p>
                </CardFooter>
              </Card>
            </div>
          </section>

          <section className="mb-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Health Metrics Recommendations
                </h1>
                <p className="text-muted-foreground text-sm">
                  Customized recommendations based on your health metrics
                </p>
              </div>
              <Button onClick={handleSubmit} disabled={loading.general}>
                {loading.general ? "Generating..." : "Generate Suggestions"}
              </Button>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    Temperature Recommendations
                  </CardTitle>
                  <CardDescription>
                    Current reading: {temperatureData.currTemperature || "--"}°F
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {suggestions.temperature ? (
                    <FormattedResponse
                      text={suggestions.temperature}
                      className="text-muted-foreground"
                    />
                  ) : (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-[90%]" />
                      <Skeleton className="h-4 w-[80%]" />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    SpO2 Recommendations
                  </CardTitle>
                  <CardDescription>
                    Current reading: {spo2Data.currSpO2 || "--"}%
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {suggestions.spo2 ? (
                    <FormattedResponse
                      text={suggestions.spo2}
                      className="text-muted-foreground"
                    />
                  ) : (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-[90%]" />
                      <Skeleton className="h-4 w-[80%]" />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-purple-500" />
                    Heart & Pulse Rate Recommendations
                  </CardTitle>
                  <CardDescription>
                    Current readings: {heartrateData.currHeartRate || "--"} BPM
                    & {pulserateData.currPulseRate || "--"} BPM
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {suggestions.heartRate ? (
                    <FormattedResponse
                      text={suggestions.heartRate}
                      className="text-muted-foreground"
                    />
                  ) : (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-[90%]" />
                      <Skeleton className="h-4 w-[80%]" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>

          <section>
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight">
                Lifestyle Plans
              </h1>
              <p className="text-muted-foreground text-sm">
                Personalized plans tailored to your health metrics and goals
              </p>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-orange-500" />
                      Personalized Diet Plan
                    </CardTitle>
                    <Button
                      onClick={generateDietPlan}
                      disabled={loading.diet}
                      size="sm"
                      variant="outline"
                    >
                      {loading.diet ? "Generating..." : "Generate Plan"}
                    </Button>
                  </div>
                  <CardDescription>
                    Nutrition recommendations based on your health metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {suggestions.diet ? (
                    <FormattedResponse
                      text={suggestions.diet}
                      className="text-muted-foreground"
                    />
                  ) : (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-[90%]" />
                      <Skeleton className="h-4 w-[80%]" />
                      <Skeleton className="h-4 w-[70%]" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Exercise Plan Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      Personalized Exercise Plan
                    </CardTitle>
                    <Button
                      onClick={generateExercisePlan}
                      disabled={loading.exercise}
                      size="sm"
                      variant="outline"
                    >
                      {loading.exercise ? "Generating..." : "Generate Plan"}
                    </Button>
                  </div>
                  <CardDescription>
                    Workout routines tailored to your fitness level and health
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {suggestions.exercise ? (
                    <FormattedResponse
                      text={suggestions.exercise}
                      className="text-muted-foreground"
                    />
                  ) : (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-[90%]" />
                      <Skeleton className="h-4 w-[80%]" />
                      <Skeleton className="h-4 w-[70%]" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sleep Plan Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-indigo-500" />
                      Personalized Sleep Plan
                    </CardTitle>
                    <Button
                      onClick={generateSleepPlan}
                      disabled={loading.sleep}
                      size="sm"
                      variant="outline"
                    >
                      {loading.sleep ? "Generating..." : "Generate Plan"}
                    </Button>
                  </div>
                  <CardDescription>
                    Sleep recommendations to optimize your rest and recovery
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {suggestions.sleep ? (
                    <FormattedResponse
                      text={suggestions.sleep}
                      className="text-muted-foreground"
                    />
                  ) : (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-[90%]" />
                      <Skeleton className="h-4 w-[80%]" />
                      <Skeleton className="h-4 w-[70%]" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
