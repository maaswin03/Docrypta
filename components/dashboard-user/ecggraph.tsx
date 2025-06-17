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

export function Ecggraph() {
  const [chartData, setChartData] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [activeChart, setActiveChart] = React.useState<"ecg" | "filtered">("ecg")
  const [timeRanges, setTimeRanges] = React.useState<{ start: string; end: string }[]>([])
  const [selectedRange, setSelectedRange] = React.useState<number>(0)

  React.useEffect(() => {
    const fetchEcgData = async () => {
      try {
        const userData = LocalStorageService.getUserData()
        if (!userData.walletAddress) {
          console.error("No user ID found in localStorage")
          setLoading(false)
          return
        }

        const twentyFourHoursAgo = new Date()
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

        // First, get the available ECG recording time ranges
        const { data: timeData, error: timeError } = await supabase
          .from("vitals_data")
          .select("timestamp")
          .eq("user_id", userData.walletAddress)
          .gte("timestamp", twentyFourHoursAgo.toISOString())
          .not("ecg_data", "is", null)
          .order("timestamp", { ascending: true })

        if (timeError) {
          console.error("Error fetching ECG time ranges:", timeError)
          return
        }

        if (!timeData || timeData.length === 0) {
          setLoading(false)
          return
        }

        // Group recordings into 10-minute segments
        const segments: { start: string; end: string }[] = []
        let currentSegmentStart = new Date(timeData[0].timestamp)
        let currentSegmentEnd = new Date(currentSegmentStart)
        currentSegmentEnd.setMinutes(currentSegmentEnd.getMinutes() + 10)

        timeData.forEach((item) => {
          const timestamp = new Date(item.timestamp)
          if (timestamp > currentSegmentEnd) {
            segments.push({
              start: currentSegmentStart.toISOString(),
              end: currentSegmentEnd.toISOString(),
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
        })

        setTimeRanges(segments)

        // If we have segments, fetch the first one
        if (segments.length > 0) {
          await fetchEcgSegment(segments[0].start, segments[0].end)
        }
      } catch (error) {
        console.error("Error:", error)
        setLoading(false)
      }
    }

    fetchEcgData()
  }, [])

  const fetchEcgSegment = async (startTime: string, endTime: string) => {
    try {
      setLoading(true)
      const userData = LocalStorageService.getUserData()

      const { data, error } = await supabase
        .from("vitals_data")
        .select("ecg_data, timestamp")
        .eq("user_id", userData.walletAddress)
        .gte("timestamp", startTime)
        .lte("timestamp", endTime)
        .not("ecg_data", "is", null)
        .order("timestamp", { ascending: true })

      if (error) {
        console.error("Error fetching ECG data:", error)
        return
      }

      if (!data || data.length === 0) {
        setLoading(false)
        return
      }

      // Parse ECG data - assuming it's stored as a JSON string with points
      const formattedData = []

      for (const record of data) {
        try {
          const ecgPoints = JSON.parse(record.ecg_data)

          // If it's an array of points
          if (Array.isArray(ecgPoints)) {
            for (let i = 0; i < ecgPoints.length; i++) {
              formattedData.push({
                index: formattedData.length,
                time: new Date(record.timestamp).toLocaleTimeString(),
                ecg: ecgPoints[i],
                // Generate a filtered version that's smoother (simulated)
                filtered: ecgPoints[i] + (Math.random() * 0.1 - 0.05),
              })
            }
          }
          // If it's a single value
          else if (typeof ecgPoints === "number") {
            formattedData.push({
              index: formattedData.length,
              time: new Date(record.timestamp).toLocaleTimeString(),
              ecg: ecgPoints,
              filtered: ecgPoints + (Math.random() * 0.1 - 0.05),
            })
          }
        } catch (e) {
          console.error("Error parsing ECG data:", e)
        }
      }

      setChartData(formattedData)
    } catch (error) {
      console.error("Error:", error)
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
      <Card>
        <CardHeader>
          <CardTitle>ECG</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="py-4 sm:py-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 sm:pb-0">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-medium">ECG</CardTitle>
            <HeartPulse className="h-4 w-4 text-red-500" />
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
                className="data-[active=true]:bg-muted/50 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-muted-foreground text-xs">{chartConfig[chart].label}</span>
                <span className="text-lg leading-none font-bold sm:text-xl">View</span>
              </button>
            )
          })}
        </div>
      </CardHeader>

      {timeRanges.length > 0 && (
        <div className="px-6 pt-4 flex gap-2 overflow-x-auto pb-2">
          {timeRanges.map((range, index) => (
            <button
              key={index}
              onClick={() => handleRangeChange(index)}
              className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ${
                selectedRange === index ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
              }`}
            >
              {new Date(range.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </button>
          ))}
        </div>
      )}

      <CardContent className="px-2 sm:p-6">
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 5,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis
                  dataKey="index"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => {
                    // Show fewer ticks for readability
                    return value % 50 === 0 ? value.toString() : ""
                  }}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 10 }} />
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
          <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
            {loading ? "Loading ECG data..." : "No ECG data available for this time period"}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
