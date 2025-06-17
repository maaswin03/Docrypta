"use client"

import { useEffect, useState } from "react"
import {
  Activity,
  Droplets,
  Thermometer,
  TreesIcon as Lungs,
  Droplet,
  Heart,
  Footprints,
  HeartPulse,
} from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { LocalStorageService } from "@/lib/localStorage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface LatestVitals {
  heart_rate?: number
  spo2?: number
  temperature?: number
  respiratory_rate?: number
  glucose_level?: number
  systolic_bp?: number
  diastolic_bp?: number
  activity_level?: any
  timestamp?: string
}

// Helper function to format timestamp to DDMMMHH - treating as UTC to avoid timezone issues
const formatToDDMMMHH = (timestamp: string) => {
  // Parse the timestamp as UTC to avoid timezone conversion
  const date = new Date(timestamp + "Z") // Adding Z forces UTC parsing
  const day = date.getUTCDate().toString().padStart(2, "0")
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
  const month = months[date.getUTCMonth()]
  const hour = date.getUTCHours().toString().padStart(2, "0")
  return `${day}${month}${hour}`
}

export function LatestVitalsSummary() {
  const [latestVitals, setLatestVitals] = useState<LatestVitals>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLatestVitals = async () => {
      try {
        const userId = LocalStorageService.getUserId()
        const deviceId = LocalStorageService.getDeviceId()

        if (!userId) {
          console.error("No user ID found in localStorage")
          setLoading(false)
          return
        }

        let query = supabase
          .from("vitals_data")
          .select("*")
          .eq("user_id", userId)
          .order("timestamp", { ascending: false })
          .limit(1)

        if (deviceId) {
          query = query.eq("device_id", deviceId)
        }

        const { data, error } = await query

        if (error) {
          console.error("Error fetching latest vitals:", error)
          return
        }

        if (data && data.length > 0) {
          setLatestVitals(data[0])
          console.log("Latest vitals timestamp:", data[0].timestamp)
          console.log("Formatted time:", formatToDDMMMHH(data[0].timestamp))
        }
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLatestVitals()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 mb-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const vitalsData = [
    {
      title: "Heart Rate",
      value: latestVitals.heart_rate ? `${latestVitals.heart_rate} BPM` : "N/A",
      icon: Activity,
      color: "text-blue-500",
    },
    {
      title: "SpO2",
      value: latestVitals.spo2 ? `${latestVitals.spo2}%` : "N/A",
      icon: Droplets,
      color: "text-red-500",
    },
    {
      title: "Temperature",
      value: latestVitals.temperature ? `${latestVitals.temperature}°C` : "N/A",
      icon: Thermometer,
      color: "text-orange-500",
    },
    {
      title: "Respiratory",
      value: latestVitals.respiratory_rate ? `${latestVitals.respiratory_rate}/min` : "N/A",
      icon: Lungs,
      color: "text-purple-500",
    },
    {
      title: "Glucose",
      value: latestVitals.glucose_level ? `${latestVitals.glucose_level} mg/dL` : "N/A",
      icon: Droplet,
      color: "text-green-600",
    },
    {
      title: "Blood Pressure",
      value:
        latestVitals.systolic_bp && latestVitals.diastolic_bp
          ? `${latestVitals.systolic_bp}/${latestVitals.diastolic_bp}`
          : "N/A",
      icon: Heart,
      color: "text-red-600",
    },
    {
      title: "Activity",
      value: latestVitals.activity_level?.activity_type
        ? latestVitals.activity_level.activity_type.charAt(0).toUpperCase() +
          latestVitals.activity_level.activity_type.slice(1)
        : "N/A",
      icon: Footprints,
      color: "text-yellow-500",
    },
  ]

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Latest Readings</h2>
        {latestVitals.timestamp && (
          <span className="text-sm text-muted-foreground">
            Last updated: {formatToDDMMMHH(latestVitals.timestamp)}
            <span className="ml-2 text-xs">({latestVitals.timestamp})</span>
          </span>
        )}
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
        {vitalsData.map((vital, index) => {
          const IconComponent = vital.icon
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 px-3 pt-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium text-muted-foreground">{vital.title}</CardTitle>
                  <IconComponent className={`h-3 w-3 ${vital.color}`} />
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="text-sm font-bold">{vital.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
