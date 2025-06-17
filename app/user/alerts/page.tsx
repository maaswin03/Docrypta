import { AppSidebar } from "@/components/sidebar/app-sidebar";
import {
  AlertCircle,
  Bell,
  BellOff,
  HeartPulse,
  Thermometer,
  Droplets,
  Activity,
  Gauge,
  Wind,
  ArrowRight,
  MapPin,
  Clock,
} from "lucide-react";
import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapContainer, TileLayer} from "react-leaflet";
import "leaflet/dist/leaflet.css";


const position: [number, number] = [13.0045584, 77.5419626];

interface SensorData {
  [key: string]: any;
}

// Normal ranges for vital signs
const VITAL_RANGES = {
  spo2: { min: 95, max: 100 },
  temperature: { min: 97, max: 99 },
  heartRate: { min: 60, max: 100 },
  pulseRate: { min: 60, max: 100 },
  bloodPressureSystolic: { min: 90, max: 120 },
  bloodPressureDiastolic: { min: 60, max: 80 },
  respiratoryRate: { min: 12, max: 20 },
};

export default function Alerts() {
  const [user, setUserData] = React.useState<SensorData>({});
  const [bloodPressureData, setBloodPressureData] = React.useState<SensorData>(
    {}
  );
  const [temperatureData, setTemperatureData] = React.useState<SensorData>({});
  const [hrData, setHrData] = React.useState<SensorData>({});
  const [prData, setPrData] = React.useState<SensorData>({});
  const [rpData, setRpData] = React.useState<SensorData>({});
  const [spo2Data, setSpo2Data] = React.useState<SensorData>({});
  const [alertsEnabled, setAlertsEnabled] = React.useState(true);

  const username = "maaswin";

  const fetchData = async (
    endpoint: string,
    setter: React.Dispatch<React.SetStateAction<SensorData>>
  ) => {
    try {
      const response = await fetch(`http://localhost:8000/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) throw new Error("Network response was not ok");
      const result = await response.json();
      setter(result[0]);
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
    }
  };

  React.useEffect(() => {
    fetchData("api/get/temperature", setTemperatureData);
    fetchData("userinfo", setUserData);
    fetchData("api/get/heartrate", setHrData);
    fetchData("api/get/pulserate", setPrData);
    fetchData("api/get/respiratoryrate", setRpData);
    fetchData("api/get/spo2", setSpo2Data);
    fetchData("api/get/bloodpressure", setBloodPressureData);

    // Simulate real-time updates
    const interval = setInterval(() => {
      fetchData("api/get/temperature", setTemperatureData);
      fetchData("api/get/heartrate", setHrData);
      fetchData("api/get/pulserate", setPrData);
      fetchData("api/get/respiratoryrate", setRpData);
      fetchData("api/get/spo2", setSpo2Data);
      fetchData("api/get/bloodpressure", setBloodPressureData);
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [username]);

  const checkAbnormal = (value: number, type: keyof typeof VITAL_RANGES) => {
    if (value === undefined || value === null) return false;
    return value < VITAL_RANGES[type].min || value > VITAL_RANGES[type].max;
  };

  const metrics = [
    {
      title: "SpO2",
      value: spo2Data.currSpO2 || "--",
      description: "%",
      icon: <Droplets className="h-5 w-5" />,
      abnormal: checkAbnormal(spo2Data.currSpO2, "spo2"),
      range: `${VITAL_RANGES.spo2.min}-${VITAL_RANGES.spo2.max}%`,
    },
    {
      title: "Temperature",
      value: temperatureData.currTemperature || "--",
      description: "°F",
      icon: <Thermometer className="h-5 w-5" />,
      abnormal: checkAbnormal(temperatureData.currTemperature, "temperature"),
      range: `${VITAL_RANGES.temperature.min}-${VITAL_RANGES.temperature.max}°F`,
    },
    {
      title: "Heart Rate",
      value: hrData.currHeartRate || "--",
      description: "BPM",
      icon: <HeartPulse className="h-5 w-5" />,
      abnormal: checkAbnormal(hrData.currHeartRate, "heartRate"),
      range: `${VITAL_RANGES.heartRate.min}-${VITAL_RANGES.heartRate.max}bpm`,
    },
    {
      title: "Pulse Rate",
      value: prData.currPulseRate || "--",
      description: "BPM",
      icon: <Activity className="h-5 w-5" />,
      abnormal: checkAbnormal(prData.currPulseRate, "pulseRate"),
      range: `${VITAL_RANGES.pulseRate.min}-${VITAL_RANGES.pulseRate.max}bpm`,
    },
    {
      title: "Blood Pressure",
      value: `${bloodPressureData.currSystolic || "--"}/${
        bloodPressureData.currDiastolic || "--"
      }`,
      description: "mmHg",
      icon: <Gauge className="h-5 w-5" />,
      abnormal:
        checkAbnormal(
          bloodPressureData.currSystolic,
          "bloodPressureSystolic"
        ) ||
        checkAbnormal(
          bloodPressureData.currDiastolic,
          "bloodPressureDiastolic"
        ),
      range: `${VITAL_RANGES.bloodPressureSystolic.min}-${VITAL_RANGES.bloodPressureSystolic.max}/${VITAL_RANGES.bloodPressureDiastolic.min}-${VITAL_RANGES.bloodPressureDiastolic.max}mmHg`,
    },
    {
      title: "Respiratory Rate",
      value: rpData.currRespiratoryRate || "--",
      description: "rpm",
      icon: <Wind className="h-5 w-5" />,
      abnormal: checkAbnormal(rpData.currRespiratoryRate, "respiratoryRate"),
      range: `${VITAL_RANGES.respiratoryRate.min}-${VITAL_RANGES.respiratoryRate.max}rpm`,
    },
  ];

  const abnormalMetrics = metrics.filter((metric) => metric.abnormal);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center gap-2 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60 px-4 border-b border-gray-800">
          <SidebarTrigger className="-ml-1 text-white" />
          <Separator orientation="vertical" className="h-6" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/dashboard"
                  className="text-sm hover:text-white text-gray-300"
                >
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-sm font-medium text-white">
                  Alerts
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-gray-800"
              onClick={() => setAlertsEnabled(!alertsEnabled)}
            >
              {alertsEnabled ? (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Alerts On
                </>
              ) : (
                <>
                  <BellOff className="h-4 w-4 mr-2" />
                  Alerts Off
                </>
              )}
            </Button>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-6 pt-4 bg-black text-white">
          {/* Alert Summary */}
          {alertsEnabled && abnormalMetrics.length > 0 && (
            <Card className="bg-red-900/20 border-red-900">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <CardTitle className="text-red-400">Health Alerts</CardTitle>
                </div>
                <Badge variant="destructive" className="text-xs">
                  {abnormalMetrics.length} Warning
                  {abnormalMetrics.length > 1 ? "s" : ""}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {abnormalMetrics.map((metric, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-red-900/10 rounded-lg"
                    >
                      <div className="p-2 rounded-full bg-red-900/20">
                        {metric.icon}
                      </div>
                      <div>
                        <p className="font-medium">{metric.title}</p>
                        <p className="text-red-400 text-sm">
                          {metric.value} {metric.description} (Normal:{" "}
                          {metric.range})
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="link"
                  className="text-red-400 hover:text-red-300"
                >
                  View all alerts <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metrics.map((metric, index) => (
              <Card
                key={index}
                className={` transition-colors ${
                  metric.abnormal && alertsEnabled
                    ? "border-red-900/50 hover:border-red-900"
                    : ""
                }`}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        metric.abnormal && alertsEnabled
                          ? "bg-red-900/20 text-red-400"
                          : "bg-gray-800 text-white"
                      }`}
                    >
                      {metric.icon}
                    </div>
                    <CardTitle>{metric.title}</CardTitle>
                  </div>
                  {metric.abnormal && alertsEnabled && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-bold">
                      {metric.value}
                      <span className="text-lg font-normal text-gray-400 ml-1">
                        {metric.description}
                      </span>
                    </p>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    Normal range: {metric.range}
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    Updated 5 min ago
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Location & Emergency */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Last Known Location
                </CardTitle>
                <CardDescription>
                  {user.address || "Location data not available"}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-64 rounded-lg overflow-hidden">
                {position[0] && position[1] ? (
                  <MapContainer
                    center={position}
                    zoom={13}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                  </MapContainer>
                ) : (
                  <div className="flex items-center justify-center h-full bg-muted/50">
                    <p className="text-muted-foreground">
                      Loading location data...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Emergency Actions</CardTitle>
                <CardDescription>
                  Quick access in case of emergency
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="destructive" className="w-full">
                  Call Emergency Services
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-gray-700 text-white hover:bg-gray-800"
                >
                  Notify Emergency Contacts
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-gray-700 text-white hover:bg-gray-800"
                >
                  Share Location with Doctor
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
