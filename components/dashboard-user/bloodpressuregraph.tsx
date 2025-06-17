"use client"

import { useEffect, useState } from "react"
import { Heart } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts"
import { supabase } from "@/lib/supabaseClient"
import { LocalStorageService } from "@/lib/localStorage"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart"

export const description = "Blood pressure chart for last 8 records"

const chartConfig = {
  systolic: {
    label: "Systolic",
    color: "hsl(0, 100%, 65%)",
  },
  diastolic: {
    label: "Diastolic",
    color: "hsl(215, 100%, 60%)",
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

export function Bloodpressurgraph() {
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [averages, setAverages] = useState<{ systolic: number | null; diastolic: number | null }>({
    systolic: null,
    diastolic: null,
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBloodPressureData = async () => {
      try {
        setError(null)
        const userId = LocalStorageService.getUserId()
        const deviceId = LocalStorageService.getDeviceId()

        console.log("Fetching Blood Pressure data for user:", userId, "device:", deviceId)

        if (!userId) {
          setError("No user ID found in localStorage")
          setLoading(false)
          return
        }

        let query = supabase
          .from("vitals_data")
          .select("systolic_bp, diastolic_bp, timestamp")
          .eq("user_id", userId)
          .not("systolic_bp", "is", null)
          .not("diastolic_bp", "is", null)
          .order("timestamp", { ascending: false })
          .limit(8) // Reduced to 8 for better display

        if (deviceId) {
          query = query.eq("device_id", deviceId)
        }

        const { data, error } = await query

        if (error) {
          console.error("Error fetching blood pressure data:", error)
          setError("Error fetching blood pressure data: " + error.message)
          return
        }

        console.log("Blood pressure data found:", data?.length || 0, "records")

        if (!data || data.length === 0) {
          setError("No blood pressure data found in last 8 records")
          setLoading(false)
          return
        }

        // Reverse to show chronological order in chart
        const reversedData = data.reverse()

        const formattedData = reversedData.map((item, index) => {
          console.log(`Processing blood pressure record ${index + 1}:`, item.timestamp)
          return {
            time: formatToDisplayTime(item.timestamp),
            systolic: Number(item.systolic_bp),
            diastolic: Number(item.diastolic_bp),
            fullTime: formatDetailedTime(item.timestamp),
            originalTimestamp: item.timestamp,
          }
        })

        console.log("Formatted blood pressure data:", formattedData)

        // Calculate averages
        const systolicSum = data.reduce((acc, item) => acc + Number(item.systolic_bp), 0)
        const diastolicSum = data.reduce((acc, item) => acc + Number(item.diastolic_bp), 0)

        setAverages({
          systolic: Math.round(systolicSum / data.length),
          diastolic: Math.round(diastolicSum / data.length),
        })

        setChartData(formattedData)
        setError(null)
      } catch (error) {
        console.error("Error:", error)
        setError("Unexpected error: " + (error as Error).message)
      } finally {
        setLoading(false)
      }
    }

    fetchBloodPressureData()
  }, [])

  if (loading) {
    return (
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle>Blood Pressure</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Blood Pressure</CardTitle>
          <Heart className="h-3 w-3 text-red-500" />
        </div>
        <CardDescription className="text-xs">Last 8 records • Format: DD MMM HHPM</CardDescription>
      </CardHeader>
      <CardContent className="pb-2 flex-1 min-h-0 overflow-hidden">
        {error ? (
          <div className="flex h-full items-center justify-center text-sm text-red-500">{error}</div>
        ) : chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                margin={{ top: 10, right: 5, left: 5, bottom: 25 }}
                barCategoryGap="20%"
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  tick={{ fontSize: 8 }}
                  interval={Math.floor(chartData.length / 4)} // Show ~4 labels max
                  angle={-45}
                  textAnchor="end"
                  height={40}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={4} 
                  tick={{ fontSize: 8 }} 
                  domain={[40, 160]}
                  width={30}
                />
                <Legend
                  verticalAlign="top"
                  height={15}
                  iconType="circle"
                  iconSize={3}
                  formatter={(value) => <span className="text-xs">{value}</span>}
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
                            <span className="text-[0.70rem] uppercase text-muted-foreground">Blood Pressure</span>
                            <span className="font-bold text-red-600">
                              {data.systolic}/{data.diastolic} mmHg
                            </span>
                            <span className="text-[0.60rem] text-muted-foreground">Original: {data.originalTimestamp}</span>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="systolic" fill="hsl(0, 100%, 65%)" radius={[1, 1, 0, 0]} maxBarSize={15} />
                <Bar dataKey="diastolic" fill="hsl(215, 100%, 60%)" radius={[1, 1, 0, 0]} maxBarSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No data available
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0 flex-shrink-0">
        {averages.systolic !== null && averages.diastolic !== null && (
          <div className="flex w-full items-center justify-between text-xs">
            <div className="flex flex-col">
              <span className="text-muted-foreground">Avg Systolic</span>
              <span className="font-medium">{averages.systolic} mmHg</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-muted-foreground">Avg Diastolic</span>
              <span className="font-medium">{averages.diastolic} mmHg</span>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}