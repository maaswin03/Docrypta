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

// Helper function to format timestamp to DD MMM HH format
const formatToDisplayTime = (timestamp: string) => {
  try {
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return 'Invalid Date'
    
    const day = date.getUTCDate().toString().padStart(2, "0")
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
    const month = months[date.getUTCMonth()]
    const hour = date.getUTCHours()
    
    // Convert 24hr to 12hr format
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    const ampm = hour >= 12 ? 'PM' : 'AM'
    
    return `${day} ${month} ${hour12.toString().padStart(2, "0")}${ampm}`
  } catch (error) {
    console.error('Error formatting timestamp:', timestamp, error)
    return 'Invalid Date'
  }
}

export function LatestVitalsSummary() {
  const [latestVitals, setLatestVitals] = useState<LatestVitals>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLatestVitals = async () => {
      try {
        setError(null)
        const userId = LocalStorageService.getUserId()
        const deviceId = LocalStorageService.getDeviceId()

        console.log("Fetching Latest Vitals for user:", userId, "device:", deviceId)

        if (!userId) {
          setError("No user ID found in localStorage")
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
          setError("Error fetching latest vitals: " + error.message)
          return
        }

        console.log("Latest vitals data found:", data?.length || 0, "records")

        if (data && data.length > 0) {
          setLatestVitals(data[0])
          console.log("Latest vitals timestamp:", data[0].timestamp)
          console.log("Formatted time:", formatToDisplayTime(data[0].timestamp))
          setError(null)
        } else {
          setError("No vitals data found")
        }
      } catch (error) {
        console.error("Error:", error)
        setError("Unexpected error: " + (error as Error).message)
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

  if (error) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Latest Readings</h2>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
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
            Last updated: {formatToDisplayTime(latestVitals.timestamp)}
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