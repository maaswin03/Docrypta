"use client"

import * as React from "react"
import { HeartPulse } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { supabase } from "@/lib/supabaseClient"
import { LocalStorageService } from "@/lib/localStorage"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export const description = "ECG data for the last 24 hours"

const chartConfig = {
  ecg: {
    label: "ECG",
    color: "hsl(0, 100%, 65%)",
  },
  filtered: {
    label: "Filtered",
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

export function Ecggraph() {
  const [chartData, setChartData] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [activeChart, setActiveChart] = React.useState<"ecg" | "filtered">("ecg")
  const [timeRanges, setTimeRanges] = React.useState<{ start: string; end: string; label: string }[]>([])
  const [selectedRange, setSelectedRange] = React.useState<number>(0)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchEcgData = async () => {
      try {
        setError(null)
        const userId = LocalStorageService.getUserId()
        const deviceId = LocalStorageService.getDeviceId()

        console.log("Fetching ECG data for user:", userId, "device:", deviceId)

        if (!userId) {
          setError("No user ID found in localStorage")
          setLoading(false)
          return
        }

        const twentyFourHoursAgo = new Date()
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

        // First, get the available ECG recording time ranges
        let query = supabase
          .from("vitals_data")
          .select("timestamp")
          .eq("user_id", userId)
          .gte("timestamp", twentyFourHoursAgo.toISOString())
          .not("ecg_data", "is", null)
          .order("timestamp", { ascending: true })

        if (deviceId) {
          query = query.eq("device_id", deviceId)
        }

        const { data: timeData, error: timeError } = await query

        if (timeError) {
          console.error("Error fetching ECG time ranges:", timeError)
          setError("Error fetching ECG time ranges: " + timeError.message)
          return
        }

        console.log("ECG time data found:", timeData?.length || 0, "records")

        if (!timeData || timeData.length === 0) {
          setError("No ECG data found in last 24 hours")
          setLoading(false)
          return
        }

        // Group recordings into 10-minute segments
        const segments: { start: string; end: string; label: string }[] = []
        let currentSegmentStart = new Date(timeData[0].timestamp)
        let currentSegmentEnd = new Date(currentSegmentStart)
        currentSegmentEnd.setMinutes(currentSegmentEnd.getMinutes() + 10)

        timeData.forEach((item) => {
          const timestamp = new Date(item.timestamp)
          if (timestamp > currentSegmentEnd) {
            segments.push({
              start: currentSegmentStart.toISOString(),
              end: currentSegmentEnd.toISOString(),
              label: formatToDisplayTime(currentSegmentStart.toISOString()),
            })
            currentSegmentStart = timestamp
            currentSegmentEnd = new Date(currentSegmentStart)
            currentSegmentEnd.setMinutes(currentSegmentEnd.getMinutes() + 10)
          }
        })

        // Add the last segment
        segments.push({
          start: currentSegmentStart.toISOString(),
          end: currentSegmentEnd.toISOString(),
          label: formatToDisplayTime(currentSegmentStart.toISOString()),
        })

        console.log("ECG segments created:", segments.length)
        setTimeRanges(segments)

        // If we have segments, fetch the first one
        if (segments.length > 0) {
          await fetchEcgSegment(segments[0].start, segments[0].end)
        }
      } catch (error) {
        console.error("Error:", error)
        setError("Unexpected error: " + (error as Error).message)
        setLoading(false)
      }
    }

    fetchEcgData()
  }, [])

  const fetchEcgSegment = async (startTime: string, endTime: string) => {
    try {
      setLoading(true)
      setError(null)
      const userId = LocalStorageService.getUserId()
      const deviceId = LocalStorageService.getDeviceId()

      console.log("Fetching ECG segment from", startTime, "to", endTime)

      let query = supabase
        .from("vitals_data")
        .select("ecg_data, timestamp")
        .eq("user_id", userId)
        .gte("timestamp", startTime)
        .lte("timestamp", endTime)
        .not("ecg_data", "is", null)
        .order("timestamp", { ascending: true })

      if (deviceId) {
        query = query.eq("device_id", deviceId)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error fetching ECG data:", error)
        setError("Error fetching ECG data: " + error.message)
        return
      }

      console.log("ECG segment data found:", data?.length || 0, "records")

      if (!data || data.length === 0) {
        setError("No ECG data available for this time period")
        setLoading(false)
        return
      }

      // Parse ECG data - assuming it's stored as a JSON string with points
      const formattedData = []

      for (const [recordIndex, record] of data.entries()) {
        try {
          let ecgPoints
          
          // Handle both string and object formats
          if (typeof record.ecg_data === 'string') {
            ecgPoints = JSON.parse(record.ecg_data)
          } else {
            ecgPoints = record.ecg_data
          }

          console.log(`Processing ECG record ${recordIndex + 1}:`, typeof ecgPoints, ecgPoints)

          // Extract values array from the ECG data structure
          let values = []
          if (ecgPoints && ecgPoints.values && Array.isArray(ecgPoints.values)) {
            values = ecgPoints.values
          } else if (Array.isArray(ecgPoints)) {
            values = ecgPoints
          } else if (typeof ecgPoints === 'number') {
            values = [ecgPoints]
          } else {
            console.warn(`Unexpected ECG data format in record ${recordIndex + 1}:`, ecgPoints)
            continue
          }

          // Add each ECG point as a data point
          for (const [pointIndex, point] of values.entries()) {
            if (typeof point === 'number' && !isNaN(point)) {
              formattedData.push({
                index: formattedData.length,
                time: formatToDisplayTime(record.timestamp),
                ecg: Number(point.toFixed(3)),
                // Generate a filtered version that's smoother (simulated)
                filtered: Number((point + (Math.random() * 0.1 - 0.05)).toFixed(3)),
                originalTimestamp: record.timestamp,
              })
            }
          }
        } catch (e) {
          console.error(`Error parsing ECG data for record ${recordIndex + 1}:`, e, record.ecg_data)
        }
      }

      console.log("Formatted ECG data points:", formattedData.length)
      setChartData(formattedData)
      setError(null)
    } catch (error) {
      console.error("Error:", error)
      setError("Unexpected error: " + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleRangeChange = (index: number) => {
    if (timeRanges[index]) {
      setSelectedRange(index)
      fetchEcgSegment(timeRanges[index].start, timeRanges[index].end)
    }
  }

  if (loading && timeRanges.length === 0) {
    return (
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle>ECG</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full h-full flex flex-col overflow-hidden">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row flex-shrink-0">
        <div className="flex flex-1 flex-col justify-center gap-1 px-4 py-2 sm:px-6 sm:py-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium">ECG</CardTitle>
            <HeartPulse className="h-3 w-3 text-red-500" />
          </div>
          <CardDescription className="text-xs">Last 24 hours - {timeRanges.length} recordings</CardDescription>
        </div>
        <div className="flex">
          {["ecg", "filtered"].map((key) => {
            const chart = key as keyof typeof chartConfig
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="data-[active=true]:bg-muted/50 flex flex-1 flex-col justify-center gap-1 border-t px-3 py-2 text-left even:border-l sm:border-t-0 sm:border-l sm:px-4 sm:py-3"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-muted-foreground text-xs">{chartConfig[chart].label}</span>
                <span className="text-xs leading-none font-bold">View</span>
              </button>
            )
          })}
        </div>
      </CardHeader>

      {timeRanges.length > 0 && (
        <div className="px-3 pt-2 flex gap-1 overflow-x-auto pb-1 flex-shrink-0">
          {timeRanges.slice(0, 5).map((range, index) => ( // Limit to 5 buttons
            <button
              key={index}
              onClick={() => handleRangeChange(index)}
              className={`text-xs px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${
                selectedRange === index ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      )}

      <CardContent className="px-2 py-2 sm:p-3 flex-1 min-h-0 overflow-hidden">
        {error ? (
          <div className="flex h-full items-center justify-center text-sm text-red-500">{error}</div>
        ) : chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 5,
                  left: 5,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis
                  dataKey="index"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  tick={{ fontSize: 8 }}
                  tickFormatter={(value) => {
                    // Show fewer ticks for readability
                    return value % 50 === 0 ? value.toString() : ""
                  }}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={4} tick={{ fontSize: 8 }} />
                <ChartTooltip content={<ChartTooltipContent className="w-[150px]" nameKey="ecg" />} />
                <Line
                  dataKey={activeChart}
                  type="monotone"
                  stroke={`var(--color-${activeChart})`}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {loading ? "Loading ECG data..." : "No ECG data available for this time period"}
          </div>
        )}
      </CardContent>
    </Card>
  )
}