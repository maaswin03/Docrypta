"use client"

import { useEffect, useState } from "react"
import { Thermometer } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { supabase } from "@/lib/supabaseClient"
import { LocalStorageService } from "@/lib/localStorage"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart"

export const description = "Body temperature chart for last 7 records"

const chartConfig = {
  temperature: {
    label: "Temperature (°C)",
    color: "hsl(25, 100%, 60%)",
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

// Helper function to format timestamp to readable time in local timezone
const formatReadableTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function Temperaturegraph() {
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [average, setAverage] = useState<number | null>(null)

  useEffect(() => {
    const fetchTemperatureData = async () => {
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
          .select("temperature, timestamp")
          .eq("user_id", userId)
          .not("temperature", "is", null)
          .order("timestamp", { ascending: false })
          .limit(7) // Get last 7 records

        if (deviceId) {
          query = query.eq("device_id", deviceId)
        }

        const { data, error } = await query

        if (error) {
          console.error("Error fetching temperature data:", error)
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
            temperature: Number.parseFloat(item.temperature),
            fullTime: formatReadableTime(item.timestamp),
            originalTimestamp: item.timestamp, // Store original timestamp
          }
        })

        // Calculate average temperature
        const sum = data.reduce((acc, item) => acc + Number(item.temperature), 0)
        const avg = Number((sum / data.length).toFixed(1))
        setAverage(avg)

        setChartData(formattedData)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTemperatureData()
  }, [])

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Body Temperature</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Body Temperature</CardTitle>
          <Thermometer className="h-4 w-4 text-orange-500" />
        </div>
        <CardDescription className="text-xs">Last 7 records • Format: DDMMMHH</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 10 }} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 10 }} domain={[35, 38]} />
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
                            <span className="text-[0.70rem] uppercase text-muted-foreground">Temperature</span>
                            <span className="font-bold text-orange-600">{data.temperature}°C</span>
                            <span className="text-[0.70rem] uppercase text-muted-foreground">Original Time</span>
                            <span className="font-bold">{data.originalTimestamp}</span>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Area
                  dataKey="temperature"
                  type="monotone"
                  fill="hsla(25, 100%, 60%, 0.2)"
                  stroke="hsl(25, 100%, 60%)"
                  strokeWidth={2}
                />
              </AreaChart>
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
            <span className="font-medium">{average}°C</span>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
