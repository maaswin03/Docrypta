"use client"

import { useEffect, useState } from "react"
import { Droplet } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { supabase } from "@/lib/supabaseClient"
import { LocalStorageService } from "@/lib/localStorage"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart"

export const description = "Glucose level chart for last 7 records"

const chartConfig = {
  glucose_level: {
    label: "Glucose (mg/dL)",
    color: "hsl(150, 100%, 40%)",
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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  })
}

export function Glucosegraph() {
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [average, setAverage] = useState<number | null>(null)

  useEffect(() => {
    const fetchGlucoseData = async () => {
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
          .select("glucose_level, timestamp")
          .eq("user_id", userId)
          .not("glucose_level", "is", null)
          .order("timestamp", { ascending: false })
          .limit(7) // Get last 7 records

        if (deviceId) {
          query = query.eq("device_id", deviceId)
        }

        const { data, error } = await query

        if (error) {
          console.error("Error fetching glucose data:", error)
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
            glucose_level: item.glucose_level,
            fullTime: formatReadableTime(item.timestamp),
            originalTimestamp: item.timestamp, // Store original timestamp
          }
        })

        // Calculate average glucose level
        const sum = data.reduce((acc, item) => acc + Number(item.glucose_level), 0)
        const avg = Math.round(sum / data.length)
        setAverage(avg)

        setChartData(formattedData)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchGlucoseData()
  }, [])

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Glucose Level</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Glucose Level</CardTitle>
          <Droplet className="h-4 w-4 text-green-600" />
        </div>
        <CardDescription className="text-xs">Last 7 records • Format: DDMMMHH</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 10 }} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 10 }} domain={[70, 180]} />
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
                            <span className="text-[0.70rem] uppercase text-muted-foreground">Glucose Level</span>
                            <span className="font-bold text-green-600">{data.glucose_level} mg/dL</span>
                            <span className="text-[0.70rem] uppercase text-muted-foreground">Original Timestamp</span>
                            <span className="font-bold">{data.originalTimestamp}</span>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="glucose_level" fill="hsl(150, 100%, 40%)" radius={4} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
            No data available
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        {average !== null && (
          <div className="flex w-full items-center justify-between text-sm">
            <span className="text-muted-foreground">Average</span>
            <span className="font-medium">{average} mg/dL</span>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
