"use client"

import { useEffect, useState } from "react"
import { Footprints, Activity, Clock, Zap } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { supabase } from "@/lib/supabaseClient"
import { LocalStorageService } from "@/lib/localStorage"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer } from "@/components/ui/chart"

export const description = "Activity level chart for last 7 records"

const chartConfig = {
  running: {
    label: "Running",
    color: "hsl(0, 100%, 60%)",
  },
  walking: {
    label: "Walking",
    color: "hsl(45, 100%, 60%)",
  },
  resting: {
    label: "Resting",
    color: "hsl(120, 100%, 40%)",
  },
  sleeping: {
    label: "Sleeping",
    color: "hsl(240, 100%, 60%)",
  },
  exercise: {
    label: "Exercise",
    color: "hsl(300, 100%, 50%)",
  },
  idle: {
    label: "Idle",
    color: "hsl(200, 100%, 50%)",
  },
  other: {
    label: "Other",
    color: "hsl(180, 100%, 50%)",
  },
} satisfies ChartConfig

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

// Helper function to format numbers in Indian format
const formatIndianNumber = (num: number, decimals = 0) => {
  return num.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

const COLORS = {
  running: "hsl(0, 100%, 60%)",
  walking: "hsl(45, 100%, 60%)",
  resting: "hsl(120, 100%, 40%)",
  sleeping: "hsl(240, 100%, 60%)",
  exercise: "hsl(300, 100%, 50%)",
  idle: "hsl(200, 100%, 50%)",
  other: "hsl(180, 100%, 50%)",
}

export function Activitylevelgraph() {
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<{
    totalSteps: number
    totalCalories: number
    totalDistance: number
    mostCommonActivity: string
    timeRange: string
  } | null>(null)

  useEffect(() => {
    const fetchActivityData = async () => {
      try {
        setError(null)
        const userId = LocalStorageService.getUserId()
        const deviceId = LocalStorageService.getDeviceId()

        console.log("Fetching Activity data for user:", userId, "device:", deviceId)

        if (!userId) {
          setError("No user ID found in localStorage")
          setLoading(false)
          return
        }

        let query = supabase
          .from("vitals_data")
          .select("activity_level, timestamp")
          .eq("user_id", userId)
          .not("activity_level", "is", null)
          .order("timestamp", { ascending: false })
          .limit(7) // Get last 7 records

        if (deviceId) {
          query = query.eq("device_id", deviceId)
        }

        const { data, error } = await query

        if (error) {
          console.error("Error fetching activity data:", error)
          setError("Error fetching activity data: " + error.message)
          return
        }

        console.log("Activity data found:", data?.length || 0, "records")

        if (!data || data.length === 0) {
          setError("No activity data found in last 7 records")
          setLoading(false)
          return
        }

        // Count activity types and calculate totals
        const activityCounts: Record<string, number> = {}
        let totalSteps = 0
        let totalCalories = 0
        let totalDistance = 0
        let earliestTime = ""
        let latestTime = ""

        // Reverse to process chronologically
        const reversedData = data.reverse()

        for (const [index, item] of reversedData.entries()) {
          const activityData = item.activity_level

          if (!activityData) {
            console.error(`No activity data in record ${index + 1}:`, item)
            continue
          }

          // Count activity types
          const activityType = (activityData.activity_type || "other").toLowerCase()
          activityCounts[activityType] = (activityCounts[activityType] || 0) + 1

          // Sum totals
          totalSteps += Number(activityData.steps) || 0
          totalCalories += Number(activityData.calories) || 0
          totalDistance += Number(activityData.distance_km) || 0

          // Track time range
          console.log(`Processing activity record ${index + 1}:`, item.timestamp)
          if (!earliestTime) earliestTime = formatToDisplayTime(item.timestamp)
          latestTime = formatToDisplayTime(item.timestamp)
        }

        // Convert counts to chart data
        const pieData = Object.entries(activityCounts).map(([activity, count]) => ({
          name: activity.charAt(0).toUpperCase() + activity.slice(1),
          value: count,
          percentage: Math.round((count / data.length) * 100),
        }))

        // Find most common activity
        let mostCommonActivity = "other"
        let maxCount = 0
        for (const [activity, count] of Object.entries(activityCounts)) {
          if (count > maxCount) {
            maxCount = count
            mostCommonActivity = activity
          }
        }

        setSummary({
          totalSteps: Math.round(totalSteps),
          totalCalories: Math.round(totalCalories * 10) / 10,
          totalDistance: Math.round(totalDistance * 100) / 100,
          mostCommonActivity: mostCommonActivity.charAt(0).toUpperCase() + mostCommonActivity.slice(1),
          timeRange: `${earliestTime} - ${latestTime}`,
        })

        console.log("Activity pie chart data:", pieData)
        setChartData(pieData)
        setError(null)
      } catch (error) {
        console.error("Error:", error)
        setError("Unexpected error: " + (error as Error).message)
      } finally {
        setLoading(false)
      }
    }

    fetchActivityData()
  }, [])

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Activity Level</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Activity Level</CardTitle>
          <Footprints className="h-4 w-4 text-yellow-500" />
        </div>
        <CardDescription className="text-xs">Last 7 records • {summary?.timeRange || "No data"}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        {error ? (
          <div className="flex h-[180px] items-center justify-center text-sm text-red-500">{error}</div>
        ) : chartData.length > 0 ? (
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS] || COLORS.other}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">Activity</span>
                            <span className="font-bold">{data.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {data.value} records ({data.percentage}%)
                            </span>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
            No data available
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        {summary && (
          <div className="grid grid-cols-2 gap-2 w-full text-xs">
            <div className="flex items-center gap-1">
              <Footprints className="h-3 w-3 text-yellow-500" />
              <span className="text-muted-foreground">Steps:</span>
              <span className="font-medium">{formatIndianNumber(summary.totalSteps)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-green-600" />
              <span className="text-muted-foreground">Cal:</span>
              <span className="font-medium">{formatIndianNumber(summary.totalCalories, 1)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Activity className="h-3 w-3 text-blue-500" />
              <span className="text-muted-foreground">Dist:</span>
              <span className="font-medium">{formatIndianNumber(summary.totalDistance, 2)}km</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-purple-500" />
              <span className="text-muted-foreground">Mode:</span>
              <span className="font-medium">{summary.mostCommonActivity}</span>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}