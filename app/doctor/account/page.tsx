"use client"

import { useState, useEffect } from "react"
import { User, Mail, Phone, Calendar, Shield, Edit, Save, X, Camera, Stethoscope, FileText, Wallet } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabaseClient"

interface DoctorProfile {
  id: number
  full_name: string
  email: string
  user_type: 'doctor'
  phone_number?: string
  specialization?: string
  reg_id?: string
  wallet_address?: string
  is_verified?: boolean
  created_at: string
}

export default function DoctorAccountPage() {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState<DoctorProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone_number: '',
    specialization: ''
  })

  useEffect(() => {
    const fetchDoctorProfile = async () => {
      if (!user?.id) {
        setError("User ID not found")
        setIsLoading(false)
        return
      }

      try {
        console.log('🔍 Fetching doctor profile for ID:', user.id)
        
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('❌ Error fetching profile:', error)
          setError("Failed to load profile: " + error.message)
          return
        }

        console.log('✅ Profile loaded:', data)
        setProfile(data)
        
        // Initialize edit form with current data
        setEditForm({
          full_name: data.full_name || '',
          phone_number: data.phone_number || '',
          specialization: data.specialization || ''
        })
        
        setError(null)
      } catch (err) {
        console.error('❌ Profile fetch error:', err)
        setError("Unexpected error loading profile")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDoctorProfile()
  }, [user?.id])

  const handleSaveProfile = async () => {
    if (!profile?.id) return

    setIsSaving(true)
    setError(null)

    try {
      console.log('💾 Saving profile updates...')
      
      const updates = {
        full_name: editForm.full_name,
        phone_number: editForm.phone_number || null,
        specialization: editForm.specialization || null
      }

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', profile.id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      console.log('✅ Profile updated successfully:', data)
      setProfile(data)
      setIsEditing(false)
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      })
    } catch (err) {
      console.error('❌ Profile update error:', err)
      setError(err instanceof Error ? err.message : "Failed to update profile")
      
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '',
        phone_number: profile.phone_number || '',
        specialization: profile.specialization || ''
      })
    }
    setIsEditing(false)
    setError(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['doctor']}>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="flex items-center justify-center h-screen">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Loading profile...</p>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </ProtectedRoute>
    )
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
                      Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Account Settings</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-6 max-w-4xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Account Settings</h1>
                  <p className="text-muted-foreground">Manage your profile and account preferences</p>
                </div>
                
                {!isEditing && (
                  <Button onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-6 md:grid-cols-2">
                {/* Profile Information */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Profile Information
                    </CardTitle>
                    <CardDescription>
                      Your personal information and account details
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src="" alt={profile?.full_name} />
                        <AvatarFallback className="text-lg">
                          {profile?.full_name ? getUserInitials(profile.full_name) : 'DR'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium">{profile?.full_name}</h3>
                        <Badge variant="default">
                          Doctor
                        </Badge>
                        {profile?.is_verified && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <Shield className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Editable Fields */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name</Label>
                        {isEditing ? (
                          <Input
                            id="full_name"
                            value={editForm.full_name}
                            onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                            placeholder="Enter your full name"
                          />
                        ) : (
                          <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{profile?.full_name || 'Not provided'}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{profile?.email}</span>
                          <Badge variant="outline" className="ml-auto">Read-only</Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone_number">Phone Number</Label>
                        {isEditing ? (
                          <Input
                            id="phone_number"
                            value={editForm.phone_number}
                            onChange={(e) => setEditForm(prev => ({ ...prev, phone_number: e.target.value }))}
                            placeholder="Enter your phone number"
                          />
                        ) : (
                          <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{profile?.phone_number || 'Not provided'}</span>
                          </div>
                        )}
                      </div>

                      {/* Doctor-specific fields */}
                      <div className="space-y-2">
                        <Label htmlFor="specialization">Specialization</Label>
                        {isEditing ? (
                          <Input
                            id="specialization"
                            value={editForm.specialization}
                            onChange={(e) => setEditForm(prev => ({ ...prev, specialization: e.target.value }))}
                            placeholder="Enter your specialization"
                          />
                        ) : (
                          <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                            <Stethoscope className="h-4 w-4 text-muted-foreground" />
                            <span>{profile?.specialization || 'Not provided'}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Registration ID</Label>
                        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm">{profile?.reg_id || 'Not provided'}</span>
                          <Badge variant="outline" className="ml-auto">Read-only</Badge>
                        </div>
                      </div>
                    </div>

                    {/* Edit Actions */}
                    {isEditing && (
                      <div className="flex gap-2 pt-4">
                        <Button onClick={handleSaveProfile} disabled={isSaving}>
                          <Save className="h-4 w-4 mr-2" />
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Account Security & Info */}
                <div className="space-y-6">
                  {/* Wallet Information */}
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5" />
                        Wallet Information
                      </CardTitle>
                      <CardDescription>
                        Your registered wallet details
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Registered Wallet</Label>
                        <div className="p-3 bg-muted rounded-md">
                          <div className="font-mono text-xs break-all">
                            {profile?.wallet_address || 'No wallet registered'}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          This is the wallet address you registered with during account creation.
                          Contact support if you need to update your wallet address.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Account Information */}
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Account Information
                      </CardTitle>
                      <CardDescription>
                        Account status and creation details
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Account Type</Label>
                        <div className="flex items-center gap-2">
                          <Badge variant="default">
                            Healthcare Provider
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Verification Status</Label>
                        <div className="flex items-center gap-2">
                          {profile?.is_verified ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <Shield className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              <Shield className="h-3 w-3 mr-1" />
                              Pending Verification
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Member Since</Label>
                        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{profile?.created_at ? formatDate(profile.created_at) : 'Unknown'}</span>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <Button variant="destructive" onClick={logout} className="w-full">
                          Sign Out
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}