"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { 
  SidebarInset, 
  SidebarProvider, 
  SidebarTrigger 
} from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { 
  Video, 
  Users, 
  Calendar, 
  Clock,
  Link as LinkIcon,
  Copy,
  ExternalLink
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function DoctorMeet() {
  const { toast } = useToast()
  const [meetingId, setMeetingId] = useState("")
  const [generatedMeetingId, setGeneratedMeetingId] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(false)

  const handleJoinMeeting = () => {
    if (!meetingId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid meeting ID",
        variant: "destructive",
      })
      return
    }

    setIsJoining(true)
    
    // Simulate joining a meeting
    setTimeout(() => {
      // In a real app, this would redirect to a video call service
      window.open(`https://meet.jit.si/${meetingId}`, '_blank')
      setIsJoining(false)
    }, 1000)
  }

  const generateMeetingId = () => {
    // Generate a random meeting ID
    const randomId = Math.random().toString(36).substring(2, 10)
    setGeneratedMeetingId(randomId)
    setMeetingId(randomId)
    
    toast({
      title: "Meeting ID Generated",
      description: "New meeting ID has been created and copied to the input field.",
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Meeting ID copied to clipboard",
    })
  }

  return (
    <ProtectedRoute allowedRoles={['doctor']}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex flex-col h-screen overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/doctor/dashboard">
                      Doctor Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Video Consultations</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-6 max-w-4xl mx-auto space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-2xl font-bold">Video Consultations</h1>
                <p className="text-muted-foreground">Connect with patients through secure video calls</p>
              </div>

              {/* Join Meeting Card */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Join a Meeting
                  </CardTitle>
                  <CardDescription>
                    Enter a meeting ID to join an existing consultation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Enter meeting ID"
                        value={meetingId}
                        onChange={(e) => setMeetingId(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleJoinMeeting} disabled={isJoining || !meetingId.trim()}>
                      {isJoining ? "Joining..." : "Join Meeting"}
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={generateMeetingId}>
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Generate Meeting ID
                    </Button>
                    
                    {generatedMeetingId && (
                      <Button 
                        variant="outline" 
                        onClick={() => copyToClipboard(generatedMeetingId)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy ID
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Meeting Instructions */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>How It Works</CardTitle>
                  <CardDescription>
                    Instructions for conducting video consultations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                      <div className="p-2 bg-primary/10 rounded-full w-10 h-10 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-medium">1. Schedule</h3>
                      <p className="text-sm text-muted-foreground">
                        Accept an appointment from a patient in the Appointments section.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="p-2 bg-primary/10 rounded-full w-10 h-10 flex items-center justify-center">
                        <LinkIcon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-medium">2. Generate</h3>
                      <p className="text-sm text-muted-foreground">
                        Create a meeting ID and share it with your patient via email or message.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="p-2 bg-primary/10 rounded-full w-10 h-10 flex items-center justify-center">
                        <Video className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-medium">3. Connect</h3>
                      <p className="text-sm text-muted-foreground">
                        Join the meeting at the scheduled time and conduct your consultation.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="font-medium">Tips for a Successful Consultation</h3>
                    <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-5">
                      <li>Ensure you have a stable internet connection</li>
                      <li>Use a quiet, well-lit environment</li>
                      <li>Test your camera and microphone before joining</li>
                      <li>Have the patient's medical records ready for reference</li>
                      <li>Allow extra time for technical difficulties</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Meetings */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Upcoming Consultations
                  </CardTitle>
                  <CardDescription>
                    Your scheduled video consultations for today
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-muted rounded-full">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">John Smith</p>
                          <p className="text-sm text-muted-foreground">10:30 AM - Follow-up</p>
                        </div>
                      </div>
                      <Button size="sm">
                        <Video className="h-4 w-4 mr-2" />
                        Join
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-muted rounded-full">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Sarah Johnson</p>
                          <p className="text-sm text-muted-foreground">2:00 PM - Initial Consultation</p>
                        </div>
                      </div>
                      <Button size="sm">
                        <Video className="h-4 w-4 mr-2" />
                        Join
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}