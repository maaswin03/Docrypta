"use client"

import { useEffect, useState } from "react"
import { Activity } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { supabase } from "@/lib/supabaseClient"
import { LocalStorageService } from "@/lib/localStorage"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart"

export const description = "Heart rate chart showing last 7 records"

const chartConfig = {
  heart_rate: {
    label: "Heart Rate (BPM)",
    color: "hsl(215, 100%, 60%)",
  },
} satisfies ChartConfig

// Helper function to format timestamp to DD MMM HH format
const formatToDisplayTime = (timestamp: string) => {
  try {
    // Parse the timestamp directly without timezone conversion
    const date = new Date(timestamp)
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid timestamp:', timestamp)
      return 'Invalid Date'
    }
    
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

// Helper function for detailed tooltip time
const formatDetailedTime = (timestamp: string) => {
  try {
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return 'Invalid Date'
    
    const day = date.getUTCDate().toString().padStart(2, "0")
    const month = (date.getUTCMonth() + 1).toString().padStart(2, "0")
    const year = date.getUTCFullYear()
    const hour = date.getUTCHours()
    const minute = date.getUTCMinutes().toString().padStart(2, "0")
    
    // Convert to 12hr format
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    const ampm = hour >= 12 ? 'PM' : 'AM'
    
    return `${day}/${month}/${year} ${hour12.toString().padStart(2, "0")}:${minute} ${ampm}`
  } catch (error) {
    console.error('Error formatting detailed timestamp:', timestamp, error)
    return 'Invalid Date'
  }
}

export function Heartgraph() {
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [average, setAverage] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHeartRateData = async () => {
      try {
        setError(null)
        const userId = LocalStorageService.getUserId()
        const deviceId = LocalStorageService.getDeviceId()

        console.log("Fetching Heart Rate data for user:", userId, "device:", deviceId)

        if (!userId) {
          setError("No user ID found in localStorage")
          setLoading(false)
          return
        }

        let query = supabase
          .from("vitals_data")
          .select("heart_rate, timestamp")
          .eq("user_id", userId)
          .not("heart_rate", "is", null)
          .order("timestamp", { ascending: false })
          .limit(7) // Get last 7 records

        if (deviceId) {
          query = query.eq("device_id", deviceId)
        }

        const { data, error } = await query

        if (error) {
          console.error("Error fetching heart rate data:", error)
          setError("Error fetching heart rate data: " + error.message)
          return
        }

        console.log("Heart rate data found:", data?.length || 0, "records")

        if (!data || data.length === 0) {
          setError("No heart rate data found in last 7 records")
          setLoading(false)
          return
        }

        // Reverse to show chronological order in chart
        const reversedData = data.reverse()

        const formattedData = reversedData.map((item, index) => {
          console.log(`Processing heart rate record ${index + 1}:`, item.timestamp)
          return {
            time: formatToDisplayTime(item.timestamp),
            heart_rate: Number(item.heart_rate),
            fullTime: formatDetailedTime(item.timestamp),
            originalTimestamp: item.timestamp,
          }
        })

        console.log("Formatted heart rate data:", formattedData)

        // Calculate average heart rate
        const sum = data.reduce((acc, item) => acc + Number(item.heart_rate), 0)
        const avg = Math.round(sum / data.length)
        setAverage(avg)

        setChartData(formattedData)
        setError(null)
      } catch (error) {
        console.error("Error:", error)
        setError("Unexpected error: " + (error as Error).message)
      } finally {
        setLoading(false)
      }
    }

    fetchHeartRateData()
  }, [])

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Heart Rate</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Heart Rate</CardTitle>
          <Activity className="h-4 w-4 text-blue-500" />
        </div>
        <CardDescription className="text-xs">Last 7 records • Format: DD MMM HHPM</CardDescription>
      </CardHeader>
      <CardContent className="pb-3 flex-1 min-h-0 overflow-hidden">
        {error ? (
          <div className="flex h-full items-center justify-center text-sm text-red-500">{error}</div>
        ) : chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis 
                  dataKey="time" 
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={6} 
                  tick={{ fontSize: 10 }}
                  interval={Math.floor(chartData.length / 3)} // Show ~3 labels
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  tick={{ fontSize: 10 }}
                  domain={["dataMin - 10", "dataMax + 10"]}
                  width={35}
                />
                <ChartTooltip
                  cursor={false}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">Time</span>
                            <span className="font-bold">{data.fullTime}</span>
                            <span className="text-[0.70rem] uppercase text-muted-foreground">Heart Rate</span>
                            <span className="font-bold text-blue-600">{data.heart_rate} BPM</span>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Area
                  dataKey="heart_rate"
                  type="monotone"
                  fill="hsla(215, 100%, 60%, 0.2)"
                  stroke="hsl(215, 100%, 60%)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No data available
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0 flex-shrink-0">
        {average !== null && (
          <div className="flex w-full items-center justify-between text-sm">
            <span className="text-muted-foreground">Average</span>
            <span className="font-medium">{average} BPM</span>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}