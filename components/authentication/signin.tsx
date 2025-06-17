"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { HeartPulse, Eye, EyeOff, AlertCircle, Wallet, Mail, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { signinUser, signinWithWallet } from "@/lib/auth"
import { validateEmail, validatePassword, type ValidationError } from "@/lib/validation"
import { useWallet } from "@/hooks/useWallet"
import { useAuth } from "@/lib/auth-context"

export function Signin({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter()
  const { login, user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [activeTab, setActiveTab] = useState("email")
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successUser, setSuccessUser] = useState<any>(null)
  const { connection, isConnecting, error: walletError, connectWallet } = useWallet()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      const dashboardRoute = user.user_type === 'doctor' ? '/doctor/dashboard' : '/user/dashboard'
      console.log('🔄 Already authenticated, redirecting to:', dashboardRoute)
      router.replace(dashboardRoute)
    }
  }, [user, router])

  const getFieldError = (field: string) => {
    return errors.find((error) => error.field === field)?.message
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => prev.filter((error) => error.field !== field))
  }

  const validateEmailForm = (): ValidationError[] => {
    const validationErrors: ValidationError[] = []

    if (!formData.email) {
      validationErrors.push({ field: "email", message: "Email is required" })
    } else {
      const emailError = validateEmail(formData.email)
      if (emailError) validationErrors.push(emailError)
    }

    if (!formData.password) {
      validationErrors.push({ field: "password", message: "Password is required" })
    } else {
      const passwordError = validatePassword(formData.password)
      if (passwordError) validationErrors.push(passwordError)
    }

    return validationErrors
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors([])

    console.log('📧 Attempting email signin...')

    const validationErrors = validateEmailForm()

    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      setIsLoading(false)
      return
    }

    const result = await signinUser({
      email: formData.email,
      password: formData.password,
    })

    if (result.success && result.user) {
      console.log('✅ Email signin successful:', result.user.full_name)
      setSuccessUser(result.user)
      setShowSuccessDialog(true)
    } else {
      console.log('❌ Email signin failed:', result.error)
      setErrors([{ field: "general", message: result.error || "Failed to sign in" }])
    }

    setIsLoading(false)
  }

  const handleWalletSubmit = async () => {
    if (!connection.isConnected) {
      setErrors([{ field: "wallet", message: "Please connect your wallet first" }])
      return
    }

    setIsLoading(true)
    setErrors([])

    console.log('🔗 Attempting wallet signin...')

    const result = await signinWithWallet({
      walletAddress: connection.address,
    })

    if (result.success && result.user) {
      console.log('✅ Wallet signin successful:', result.user.full_name)
      setSuccessUser(result.user)
      setShowSuccessDialog(true)
    } else {
      console.log('❌ Wallet signin failed:', result.error)
      setErrors([{ field: "wallet", message: result.error || "Failed to sign in with wallet" }])
    }

    setIsLoading(false)
  }

  const handleSuccessDialogClose = () => {
    console.log('🎉 Processing successful login for:', successUser?.full_name)
    setShowSuccessDialog(false)
    
    if (successUser) {
      // Use the auth context login method which will handle the redirect
      login(successUser)
    }
  }

  const isEmailFormValid = formData.email && formData.password
  const isWalletFormValid = connection.isConnected

  // Don't render if user is already authenticated
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <>
      <div className={cn("w-full max-w-lg mx-auto", className)} {...props}>
        <Card className="shadow-lg border-0 bg-card">
          <CardHeader className="space-y-4 pb-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <HeartPulse className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2 text-center">
                <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                <CardDescription className="text-base">Sign in to your Docrypta account</CardDescription>
              </div>
              <div className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <a
                  href="/signup/user"
                  className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  Sign up as User
                </a>{" "}
                or{" "}
                <a
                  href="/signup/doctor"
                  className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  Sign up as Doctor
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

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email & Password
                </TabsTrigger>
                <TabsTrigger value="wallet" className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Wallet
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="space-y-4 mt-6">
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
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
                        placeholder="Enter your password"
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

                  <div className="flex items-center justify-end">
                    <a
                      href="#"
                      className="text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80"
                    >
                      Forgot password?
                    </a>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading || !isEmailFormValid}>
                    {isLoading ? "Signing In..." : "Sign In with Email"}
                  </Button>
                </form>

                {!isEmailFormValid && (
                  <Alert variant="destructive">
                    <AlertDescription className="text-center">Please enter valid details to sign in.</AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="wallet" className="space-y-4 mt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Wallet Address</Label>
                    <div className="space-y-3">
                      {!connection.isConnected ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={connectWallet}
                          disabled={isConnecting}
                        >
                          <Wallet className="mr-2 h-4 w-4" />
                          {isConnecting ? "Connecting..." : "Connect Coinbase Wallet"}
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <Input
                            value={connection.address}
                            readOnly
                            className="font-mono text-sm"
                            placeholder="Wallet address will appear here"
                          />
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-green-600 font-medium">✓ Wallet Connected</span>
                          </div>
                        </div>
                      )}
                    </div>
                    {walletError && <p className="text-sm text-destructive">{walletError}</p>}
                    {getFieldError("wallet") && <p className="text-sm text-destructive">{getFieldError("wallet")}</p>}
                  </div>

                  <Button
                    type="button"
                    className="w-full"
                    onClick={handleWalletSubmit}
                    disabled={isLoading || !isWalletFormValid}
                  >
                    {isLoading ? "Signing In..." : "Sign In with Wallet"}
                  </Button>
                </div>

                {!isWalletFormValid && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Please connect your Coinbase wallet to sign in.</AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <DialogTitle className="text-center">Welcome Back!</DialogTitle>
            <DialogDescription className="text-center">
              {successUser && (
                <>
                  Successfully signed in as {successUser.user_type}. Welcome back, {successUser.full_name}!
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center mt-6">
            <Button onClick={handleSuccessDialogClose} className="w-full">
              Continue to Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}