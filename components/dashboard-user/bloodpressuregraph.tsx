"use client"

import { useEffect, useState } from "react"
import { Heart } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts"
import { supabase } from "@/lib/supabaseClient"
import { LocalStorageService } from "@/lib/localStorage"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart"

export const description = "Blood pressure chart for last 24 records"

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

// Helper function to format timestamp to DDMMMHH in UTC
const formatToDDMMMHH = (timestamp: string) => {
  const date = new Date(timestamp)
  const day = date.getUTCDate().toString().padStart(2, "0")
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
  const month = months[date.getUTCMonth()]
  const hour = date.getUTCHours().toString().padStart(2, "0")
  return `${day}${month}${hour}`
}

// Helper function to format timestamp to a readable time format
const formatReadableTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function Bloodpressurgraph() {
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [averages, setAverages] = useState<{ systolic: number | null; diastolic: number | null }>({
    systolic: null,
    diastolic: null,
  })

  useEffect(() => {
    const fetchBloodPressureData = async () => {
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
          .select("systolic_bp, diastolic_bp, timestamp")
          .eq("user_id", userId)
          .not("systolic_bp", "is", null)
          .not("diastolic_bp", "is", null)
          .order("timestamp", { ascending: false })
          .limit(24) // Get last 24 records

        if (deviceId) {
          query = query.eq("device_id", deviceId)
        }

        const { data, error } = await query

        if (error) {
          console.error("Error fetching blood pressure data:", error)
          return
        }

        if (!data || data.length === 0) {
          setLoading(false)
          return
        }

        // Reverse to show chronological order in chart
        const reversedData = data.reverse()

        const formattedData = reversedData.map((item) => {
          console.log("Original timestamp:", item.timestamp) // Debugging
          return {
            time: formatToDDMMMHH(item.timestamp),
            systolic: Number(item.systolic_bp),
            diastolic: Number(item.diastolic_bp),
            fullTime: formatReadableTime(item.timestamp),
            originalTimestamp: item.timestamp, // Store original timestamp
          }
        })

        // Calculate averages
        const systolicSum = data.reduce((acc, item) => acc + Number(item.systolic_bp), 0)
        const diastolicSum = data.reduce((acc, item) => acc + Number(item.diastolic_bp), 0)

        setAverages({
          systolic: Math.round(systolicSum / data.length),
          diastolic: Math.round(diastolicSum / data.length),
        })

        setChartData(formattedData)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBloodPressureData()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Blood Pressure</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Blood Pressure</CardTitle>
          <Heart className="h-4 w-4 text-red-500" />
        </div>
        <CardDescription className="text-xs">Last 24 records • Format: DDMMMHH</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 15, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 9 }}
                  interval={Math.floor(chartData.length / 6)} // Show ~6 labels
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 10 }} domain={[40, 160]} />
                <Legend
                  verticalAlign="top"
                  height={25}
                  iconType="circle"
                  iconSize={6}
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
                            <span className="text-[0.70rem] uppercase text-muted-foreground">Timestamp</span>
                            <span className="font-bold">{data.originalTimestamp}</span>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="systolic" fill="hsl(0, 100%, 65%)" radius={3} maxBarSize={25} />
                <Bar dataKey="diastolic" fill="hsl(215, 100%, 60%)" radius={3} maxBarSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            No data available
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        {averages.systolic !== null && averages.diastolic !== null && (
          <div className="flex w-full items-center justify-between text-sm">
            <div className="flex flex-col">
              <span className="text-muted-foreground">Average Systolic</span>
              <span className="font-medium">{averages.systolic} mmHg</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-muted-foreground">Average Diastolic</span>
              <span className="font-medium">{averages.diastolic} mmHg</span>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
