"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { HeartPulse, Wallet, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { signupUser } from "@/lib/auth"
import { useWallet } from "@/hooks/useWallet"
import { LocalStorageService } from "@/lib/localStorage"
import {
  validateEmail,
  validatePassword,
  validateFullName,
  validatePatientFields,
  type ValidationError,
} from "@/lib/validation"

export function PatientSignup({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter()
  const { connection, isConnecting, error: walletError, connectWallet } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    age: "",
    gender: "",
    phoneNumber: "",
    deviceId: "",
  })

  
  useEffect(() => {
    const savedData = LocalStorageService.getUserData()
    if (savedData) {
      setFormData((prev) => ({
        ...prev,
        fullName: savedData.fullName || "",
        email: savedData.email || "",
      }))
    }
  }, [])

  
  useEffect(() => {
    if (connection.isConnected && connection.address) {
      LocalStorageService.saveUserData({
        walletAddress: connection.address,
        userType: "user",
      })
      setErrors((prev) => prev.filter((error) => error.field !== "wallet"))
    }
  }, [connection])

  
  useEffect(() => {
    LocalStorageService.saveUserData({
      email: formData.email,
      fullName: formData.fullName,
      userType: "user",
    })
  }, [formData.email, formData.fullName])

  const getFieldError = (field: string) => {
    return errors.find((error) => error.field === field)?.message
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => prev.filter((error) => error.field !== field))
  }

  const handleWalletConnect = async () => {
    try {
      await connectWallet()
    } catch (err) {
      setErrors((prev) => [
        ...prev.filter((e) => e.field !== "wallet"),
        {
          field: "wallet",
          message: err instanceof Error ? err.message : "Failed to connect wallet",
        },
      ])
    }
  }

  const validateForm = (): ValidationError[] => {
    const validationErrors: ValidationError[] = []

    
    const nameError = validateFullName(formData.fullName)
    if (nameError) validationErrors.push(nameError)

    
    const emailError = validateEmail(formData.email)
    if (emailError) validationErrors.push(emailError)

    
    const passwordError = validatePassword(formData.password)
    if (passwordError) validationErrors.push(passwordError)

    
    const patientErrors = validatePatientFields({
      age: Number.parseInt(formData.age) || 0,
      phoneNumber: formData.phoneNumber,
      gender: formData.gender,
    })
    validationErrors.push(...patientErrors)

    
    if (!connection.isConnected || !connection.address) {
      validationErrors.push({
        field: "wallet",
        message: "Please connect your Coinbase wallet before creating an account",
      })
    }

    return validationErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors([])

    const validationErrors = validateForm()

    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      setIsLoading(false)
      return
    }

    const result = await signupUser({
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      userType: "user",
      age: Number.parseInt(formData.age),
      gender: formData.gender,
      phoneNumber: formData.phoneNumber,
      deviceId: formData.deviceId || undefined,
      walletAddress: connection.address,
    })

    if (result.success) {
      setShowSuccessDialog(true)
    } else {
      setErrors([{ field: "general", message: result.error || "Failed to create account" }])
    }

    setIsLoading(false)
  }

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false)
    LocalStorageService.clearUserData()
    router.push("/signin")
  }

  const isFormValid =
    connection.isConnected &&
    connection.address &&
    formData.fullName &&
    formData.email &&
    formData.password &&
    formData.age &&
    formData.gender &&
    formData.phoneNumber

  return (
    <>
      <div className={cn("w-full max-w-2xl mx-auto font-montserrat", className)} {...props}>
        <Card className="shadow-lg border-0 bg-card">
          <CardHeader className="space-y-4 pb-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <HeartPulse className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2 text-center">
                <CardTitle className="text-2xl font-bold">Join Docrypta</CardTitle>
                <CardDescription className="text-base">Create your user account to get started</CardDescription>
              </div>
              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <a
                  href="/signin"
                  className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  Sign in
                </a>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {errors.find((e) => e.field === "general") && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.find((e) => e.field === "general")?.message}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="full-name">Full Name</Label>
                    <Input
                      id="full-name"
                      type="text"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      className={getFieldError("fullName") ? "border-destructive" : ""}
                    />
                    {getFieldError("fullName") && (
                      <p className="text-sm text-destructive">{getFieldError("fullName")}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className={getFieldError("email") ? "border-destructive" : ""}
                    />
                    {getFieldError("email") && <p className="text-sm text-destructive">{getFieldError("email")}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        className={cn("pr-10", getFieldError("password") ? "border-destructive" : "")}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {getFieldError("password") && (
                      <p className="text-sm text-destructive">{getFieldError("password")}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="25"
                      min="1"
                      max="120"
                      value={formData.age}
                      onChange={(e) => handleInputChange("age", e.target.value)}
                      className={getFieldError("age") ? "border-destructive" : ""}
                    />
                    {getFieldError("age") && <p className="text-sm text-destructive">{getFieldError("age")}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                      <SelectTrigger className={getFieldError("gender") ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                    {getFieldError("gender") && <p className="text-sm text-destructive">{getFieldError("gender")}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone-number">Phone Number</Label>
                    <Input
                      id="phone-number"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                      className={getFieldError("phoneNumber") ? "border-destructive" : ""}
                    />
                    {getFieldError("phoneNumber") && (
                      <p className="text-sm text-destructive">{getFieldError("phoneNumber")}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="device-id">Device ID (Optional)</Label>
                    <Input
                      id="device-id"
                      type="text"
                      placeholder="ABC123-XYZ456"
                      value={formData.deviceId}
                      onChange={(e) => handleInputChange("deviceId", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {}
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="wallet-address">Wallet Address</Label>
                  <div className="flex gap-3">
                    <Input
                      id="wallet-address"
                      type="text"
                      placeholder="Connect your Coinbase wallet"
                      value={connection.address}
                      readOnly
                      className={cn("flex-1", getFieldError("wallet") ? "border-destructive" : "")}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleWalletConnect}
                      disabled={isConnecting}
                      className="min-w-[140px]"
                    >
                      {isConnecting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                          Connecting...
                        </>
                      ) : connection.isConnected ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Connected
                        </>
                      ) : (
                        <>
                          <Wallet className="h-4 w-4 mr-2" />
                          Connect Wallet
                        </>
                      )}
                    </Button>
                  </div>
                  {connection.isConnected && connection.address && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Wallet connected successfully
                    </div>
                  )}
                  {(getFieldError("wallet") || walletError) && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      {getFieldError("wallet") || walletError}
                    </div>
                  )}
                </div>
              </div>

              {!connection.isConnected && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please connect your Coinbase wallet to continue with registration.
                  </AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isLoading || !isFormValid}>
                {isLoading ? "Creating Account..." : "Create User Account"}
              </Button>
            </form>

            <Alert variant="destructive">
              <AlertDescription className="text-center">
                All fields are required. Please complete all information before submitting.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <DialogTitle className="text-center">Account Created Successfully!</DialogTitle>
            <DialogDescription className="text-center">
              Your User account has been created successfully. You can now sign in to access your dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center mt-6">
            <Button onClick={handleSuccessDialogClose} className="w-full">
              Continue to Sign In
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
