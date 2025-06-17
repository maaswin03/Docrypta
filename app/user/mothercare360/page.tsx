import { AppSidebar } from "@/components/sidebar/app-sidebar";
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
import * as React from "react";
import {
  AlertCircle,
  Bell,
  HeartPulse,
  Thermometer,
  Droplets,
  Gauge,
  MapPin,
  Baby,
  Calendar,
  ClipboardList,
  Shield,
  Activity,
} from "lucide-react";

interface SensorData {
  [key: string]: any;
}

// Pregnancy vital ranges
const PREGNANCY_VITAL_RANGES = {
  heartRate: { min: 70, max: 90 },
  bloodPressureSystolic: { min: 90, max: 120 },
  bloodPressureDiastolic: { min: 60, max: 80 },
  spo2: { min: 95, max: 100 },
  temperature: { min: 36.0, max: 37.2 },
  respiratoryRate: { min: 12, max: 20 },
  fetalHeartRate: { min: 110, max: 160 },
  pulseRate: { min: 60, max: 100 },
};

export default function Mothercare360() {
  const [user, setUserData] = React.useState<SensorData>({});
  const [bloodPressureData, setBloodPressureData] = React.useState<SensorData>(
    {}
  );
  const [temperatureData, setTemperatureData] = React.useState<SensorData>({});
  const [hrData, setHrData] = React.useState<SensorData>({});
  const [prData, setPrData] = React.useState<SensorData>({});
  const [rpData, setRpData] = React.useState<SensorData>({});
  const [spo2Data, setSpo2Data] = React.useState<SensorData>({});
  const [fetalHrData] = React.useState<number>(127);
  const [fetalMovementData, setFetalMovementData] = React.useState<SensorData>(
    {}
  );
  const [alertsEnabled, setAlertsEnabled] = React.useState(true);
  const [pregnancyWeek] = React.useState(24);
  const [kickCount, setKickCount] = React.useState(0);

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
    // Initial fetch
    fetchData("api/get/temperature", setTemperatureData);
    fetchData("userinfo", setUserData);
    fetchData("api/get/heartrate", setHrData);
    fetchData("api/get/pulserate", setPrData);
    fetchData("api/get/respiratoryrate", setRpData);
    fetchData("api/get/spo2", setSpo2Data);
    fetchData("api/get/bloodpressure", setBloodPressureData);
    fetchData("api/get/fetalmovement", setFetalMovementData);

    // Real-time updates
    const interval = setInterval(() => {
      fetchData("api/get/temperature", setTemperatureData);
      fetchData("api/get/heartrate", setHrData);
      fetchData("api/get/pulserate", setPrData);
      fetchData("api/get/respiratoryrate", setRpData);
      fetchData("api/get/spo2", setSpo2Data);
      fetchData("api/get/bloodpressure", setBloodPressureData);
      fetchData("api/get/fetalmovement", setFetalMovementData);
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [username]);

  const checkAbnormal = (
    value: number,
    type: keyof typeof PREGNANCY_VITAL_RANGES
  ) => {
    if (value === undefined || value === null) return false;
    return (
      value < PREGNANCY_VITAL_RANGES[type].min ||
      value > PREGNANCY_VITAL_RANGES[type].max
    );
  };

  const getRecommendations = () => {
    const recommendations = [];

    if (checkAbnormal(hrData.currHeartRate, "heartRate")) {
      recommendations.push({
        parameter: "Heart Rate",
        value: hrData.currHeartRate,
        normalRange: `${PREGNANCY_VITAL_RANGES.heartRate.min}-${PREGNANCY_VITAL_RANGES.heartRate.max}bpm`,
        advice: "Rest and avoid stress. Contact your OB-GYN if persistent.",
      });
    }

    if (
      checkAbnormal(bloodPressureData.currSystolic, "bloodPressureSystolic") ||
      checkAbnormal(bloodPressureData.currDiastolic, "bloodPressureDiastolic")
    ) {
      recommendations.push({
        parameter: "Blood Pressure",
        value: `${bloodPressureData.currSystolic}/${bloodPressureData.currDiastolic}`,
        normalRange: `${PREGNANCY_VITAL_RANGES.bloodPressureSystolic.min}-${PREGNANCY_VITAL_RANGES.bloodPressureSystolic.max}/${PREGNANCY_VITAL_RANGES.bloodPressureDiastolic.min}-${PREGNANCY_VITAL_RANGES.bloodPressureDiastolic.max}mmHg`,
        advice:
          "Monitor for headaches or vision changes. Contact provider immediately if symptoms occur.",
      });
    }

    if (checkAbnormal(spo2Data.currSpO2, "spo2")) {
      recommendations.push({
        parameter: "Oxygen Saturation",
        value: spo2Data.currSpO2,
        normalRange: `${PREGNANCY_VITAL_RANGES.spo2.min}-${PREGNANCY_VITAL_RANGES.spo2.max}%`,
        advice:
          "Try deep breathing exercises. Seek medical attention if below 92%.",
      });
    }

    if (checkAbnormal(temperatureData.currTemperature, "temperature")) {
      recommendations.push({
        parameter: "Temperature",
        value: temperatureData.currTemperature,
        normalRange: `${PREGNANCY_VITAL_RANGES.temperature.min}-${PREGNANCY_VITAL_RANGES.temperature.max}°C`,
        advice:
          "Rest and hydrate. Contact provider if fever persists or exceeds 38°C.",
      });
    }

    if (checkAbnormal(rpData.currRespiratoryRate, "respiratoryRate")) {
      recommendations.push({
        parameter: "Respiratory Rate",
        value: rpData.currRespiratoryRate,
        normalRange: `${PREGNANCY_VITAL_RANGES.respiratoryRate.min}-${PREGNANCY_VITAL_RANGES.respiratoryRate.max}rpm`,
        advice:
          "Practice relaxation breathing. Contact provider if experiencing shortness of breath.",
      });
    }

    if (checkAbnormal(fetalHrData, "fetalHeartRate")) {
      recommendations.push({
        parameter: "Fetal Heart Rate",
        value: fetalHrData,
        normalRange: `${PREGNANCY_VITAL_RANGES.fetalHeartRate.min}-${PREGNANCY_VITAL_RANGES.fetalHeartRate.max}bpm`,
        advice:
          "Try changing positions. If abnormal for more than 10 minutes, contact your provider.",
      });
    }

    if (fetalMovementData.currFetalMovement < 6) {
      recommendations.push({
        parameter: "Fetal Movement",
        value: `${fetalMovementData.currFetalMovement} movements/hr`,
        normalRange: "6-10 movements/hr",
        advice:
          "Drink cold water and lie on your left side. Count kicks for 2 hours. If <6 movements, contact provider.",
      });
    }

    return recommendations;
  };

  const vitalMetrics = [
    {
      title: "Heart Rate",
      value: hrData.currHeartRate || "--",
      description: "bpm",
      icon: <HeartPulse className="h-4 w-4" />,
      abnormal: checkAbnormal(hrData.currHeartRate, "heartRate"),
      range: `${PREGNANCY_VITAL_RANGES.heartRate.min}-${PREGNANCY_VITAL_RANGES.heartRate.max}bpm`,
    },
    {
      title: "Pulse Rate",
      value: prData.currPulseRate || "--",
      description: "bpm",
      icon: <Activity className="h-4 w-4" />, // Or another appropriate icon
      abnormal: checkAbnormal(prData.currPulseRate, "pulseRate"),
      range: `${PREGNANCY_VITAL_RANGES.pulseRate.min}-${PREGNANCY_VITAL_RANGES.pulseRate.max}bpm`,
    },
    {
      title: "Blood Pressure",
      value: `${bloodPressureData.currSystolic || "--"}/${
        bloodPressureData.currDiastolic || "--"
      }`,
      description: "mmHg",
      icon: <Gauge className="h-4 w-4" />,
      abnormal:
        checkAbnormal(
          bloodPressureData.currSystolic,
          "bloodPressureSystolic"
        ) ||
        checkAbnormal(
          bloodPressureData.currDiastolic,
          "bloodPressureDiastolic"
        ),
      range: `${PREGNANCY_VITAL_RANGES.bloodPressureSystolic.min}-${PREGNANCY_VITAL_RANGES.bloodPressureSystolic.max}/${PREGNANCY_VITAL_RANGES.bloodPressureDiastolic.min}-${PREGNANCY_VITAL_RANGES.bloodPressureDiastolic.max}mmHg`,
    },
    {
      title: "SpO2",
      value: spo2Data.currSpO2 || "--",
      description: "%",
      icon: <Droplets className="h-4 w-4" />,
      abnormal: checkAbnormal(spo2Data.currSpO2, "spo2"),
      range: `${PREGNANCY_VITAL_RANGES.spo2.min}-${PREGNANCY_VITAL_RANGES.spo2.max}%`,
    },
    {
      title: "Temperature",
      value: temperatureData.currTemperature || "--",
      description: "°C",
      icon: <Thermometer className="h-4 w-4" />,
      abnormal: checkAbnormal(temperatureData.currTemperature, "temperature"),
      range: `${PREGNANCY_VITAL_RANGES.temperature.min}-${PREGNANCY_VITAL_RANGES.temperature.max}°C`,
    },
    {
      title: "Fetal HR",
      value: fetalHrData || "--",
      description: "bpm",
      icon: <Baby className="h-4 w-4" />,
      abnormal: checkAbnormal(fetalHrData, "fetalHeartRate"),
      range: `${PREGNANCY_VITAL_RANGES.fetalHeartRate.min}-${PREGNANCY_VITAL_RANGES.fetalHeartRate.max}bpm`,
    },
  ];

  const babyDevelopmentData = [
    {
      week: 20,
      milestone: "Can hear sounds",
      size: "Banana",
      length: "25cm",
      weight: "300g",
    },
    {
      week: 24,
      milestone: "Lungs developing",
      size: "Grapefruit",
      length: "30cm",
      weight: "600g",
    },
    {
      week: 28,
      milestone: "Eyes can open",
      size: "Eggplant",
      length: "37cm",
      weight: "1kg",
    },
  ];

  const upcomingAppointments = [
    { date: "2023-12-01", type: "Routine Checkup", doctor: "Dr. Smith" },
    { date: "2023-12-15", type: "Ultrasound", doctor: "Dr. Johnson" },
    { date: "2023-12-22", type: "Glucose Test", doctor: "Dr. Smith" },
  ];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 border-b">
          <SidebarTrigger className="-ml-1 text-white" />
          <Separator orientation="vertical" className="mr-2 h-4 bg-gray-700" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink
                  href="/mothercare360"
                  className="hover:text-primary text-white"
                >
                  Ai & Asssistance
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block text-gray-500" />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold text-white">
                  Mother Care 360
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="w-full flex-1 p-6 mx-auto">
          {/* Welcome Section */}
          <section className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold mb-1">
                  Welcome, {user.name || "User"}
                </h1>
                <p>Your pregnancy journey at week {pregnancyWeek}</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setAlertsEnabled(!alertsEnabled)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm border ${
                    alertsEnabled
                      ? "border-red-500 text-red-500"
                      : "border-gray-600 text-gray-400"
                  }`}
                >
                  <Bell className="h-4 w-4" />
                  <span>{alertsEnabled ? "Alerts ON" : "Alerts OFF"}</span>
                </button>
              </div>
            </div>
          </section>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Health Overview */}
              <div className=" rounded-lg p-6 border ">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Health Overview
                  </h2>
                  <span className="text-xs border border-gray-700 px-2 py-1 rounded-full">
                    Live Monitoring
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 mb-6">
                  {vitalMetrics.map((metric, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        metric.abnormal && alertsEnabled
                          ? "border-red-500"
                          : "border-gray-700"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`p-1 rounded-md ${
                            metric.abnormal && alertsEnabled
                              ? "bg-red-500/20"
                              : "bg-gray-800"
                          }`}
                        >
                          {metric.icon}
                        </div>
                        <span className="text-xs">{metric.title}</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-medium">
                          {metric.value}
                        </span>
                        <span className="text-xs">{metric.description}</span>
                      </div>
                      <div className="text-xs  mt-1">Norm: {metric.range}</div>
                    </div>
                  ))}
                </div>

                {/* Fetal Movement Tracking */}
                <div className=" rounded-lg p-4 border">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <Baby className="h-4 w-4" />
                      Fetal Movement
                    </h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full border ${
                        fetalMovementData.currFetalMovement < 6
                          ? "border-red-500 text-red-500"
                          : "border-gray-600 text-gray-400"
                      }`}
                    >
                      {fetalMovementData.currFetalMovement || "--"} movements/hr
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">
                      Normal: 6-10 movements per hour
                    </p>
                    <button
                      onClick={() => setKickCount(kickCount + 1)}
                      className="px-4 py-2 rounded-full text-sm"
                    >
                      Count Kick ({kickCount})
                    </button>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              {alertsEnabled && getRecommendations().length > 0 && (
                <div className=" rounded-lg p-6 border border-red-500">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Health Recommendations
                  </h2>
                  <div className="space-y-4">
                    {getRecommendations().map((rec, i) => (
                      <div
                        key={i}
                        className="flex gap-3 p-3 rounded-lg border border-gray-700"
                      >
                        <div className="flex-shrink-0 mt-1">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        </div>
                        <div>
                          <h4 className="font-medium">
                            {rec.parameter}:{" "}
                            <span className="text-red-500">{rec.value}</span>
                            <span className="text-gray-500 text-sm ml-2">
                              (Normal: {rec.normalRange})
                            </span>
                          </h4>
                          <p className="text-sm  mt-1">{rec.advice}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pregnancy Progress */}
              <div className=" rounded-lg p-6 border ">
                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Pregnancy Progress
                </h2>

                {/* Trimester Tracker */}
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-400">
                      Week {pregnancyWeek} of 40
                    </span>
                    <span className="text-sm text-gray-400">
                      {pregnancyWeek < 13
                        ? "1st Trimester"
                        : pregnancyWeek < 27
                        ? "2nd Trimester"
                        : "3rd Trimester"}
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-white h-full"
                      style={{ width: `${(pregnancyWeek / 40) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Week 1</span>
                    <span>Week 40</span>
                  </div>
                </div>

                {/* Baby Development */}
                <div>
                  <h3 className="text-md font-medium mb-4 flex items-center gap-2">
                    <Baby className="h-4 w-4" />
                    Baby Development
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {babyDevelopmentData.map((data, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${
                          data.week === pregnancyWeek
                            ? "border-white"
                            : "border-gray-700"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-xs bg-gray-800 px-2 py-1 rounded-full">
                            Week {data.week}
                          </span>
                          {data.week === pregnancyWeek && (
                            <span className="text-xs bg-white text-black px-2 py-1 rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="my-2 text-sm">{data.milestone}</p>
                        <div className="text-xs text-gray-400">
                          <p>Size: {data.size}</p>
                          <p>Length: {data.length}</p>
                          <p>Weight: {data.weight}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className=" rounded-lg p-6 border border-gray-800">
                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Quick Stats
                </h2>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Last Checkup</span>
                    <span>2023-11-15</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Next Appointment</span>
                    <span className="text-white">2023-12-01</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Days to Due Date</span>
                    <span>{40 - pregnancyWeek * 7} days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Weight Gain</span>
                    <span>+5.2 kg</span>
                  </div>
                </div>
              </div>

              {/* Upcoming Appointments */}
              <div className="bg-black rounded-lg p-6 border border-gray-800">
                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Appointments
                </h2>

                <div className="space-y-4">
                  {upcomingAppointments.map((appt, index) => (
                    <div
                      key={index}
                      className="p-3  rounded-lg border border-gray-700"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{appt.type}</span>
                        <span className="text-xs bg-gray-800 px-2 py-1 rounded-full">
                          {appt.date}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400">
                        With {appt.doctor}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety & Emergency */}
              <div className="bg-black rounded-lg p-6 border border-gray-800">
                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Safety & Emergency
                </h2>

                <div className="space-y-4">
                  <button className="w-full border border-red-500 text-red-500 hover:bg-red-500/10 py-3 rounded-lg font-medium flex items-center justify-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Emergency Call
                  </button>

                  <div className="p-4 rounded-lg border border-gray-700">
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Nearest Hospital
                    </h3>
                    <p className="text-sm text-gray-400 mb-1">
                      City General Hospital
                    </p>
                    <p className="text-xs text-gray-500">
                      3.2 km away • 24/7 Maternity Ward
                    </p>
                  </div>

                  <div className="p-4  rounded-lg border border-gray-700">
                    <h3 className="font-medium mb-2">Warning Signs</h3>
                    <ul className="text-sm text-gray-400 space-y-1">
                      <li className="flex items-start gap-2">
                        <span>•</span> Severe headache or vision changes
                      </li>
                      <li className="flex items-start gap-2">
                        <span>•</span> Decreased fetal movement
                      </li>
                      <li className="flex items-start gap-2">
                        <span>•</span> Contractions before 37 weeks
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
