"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CreditCard, Wallet, CheckCircle, AlertCircle, Bot, Clock, Shield } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useWallet } from "@/hooks/useWallet"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabaseClient"

export default function SubscribePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { connection, connectWallet, isConnecting } = useWallet()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if user already has an active subscription
  useEffect(() => {
    const checkExistingSubscription = async () => {
      if (!user?.id || !connection.address) return

      try {
        const { data, error } = await supabase
          .from('user_subscription')
          .select('*')
          .eq('user_id', user.id.toString())
          .eq('wallet_address', connection.address)
          .gte('subscription_end', new Date().toISOString())
          .single()

        if (data && !error) {
          // User already has active subscription
          toast({
            title: "Active Subscription Found",
            description: "You already have an active Medibot subscription!",
          })
          router.push('/user/medibot')
        }
      } catch (err) {
        // No active subscription found, which is expected
        console.log('No active subscription found')
      }
    }

    checkExistingSubscription()
  }, [user?.id, connection.address, router, toast])

  const handleSubscriptionPayment = async () => {
    if (!user?.id) {
      setError("User ID not found. Please sign in again.")
      return
    }

    if (!connection.isConnected || !connection.address) {
      setError("Please connect your wallet first.")
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Simulate x402pay payment process
      // In a real implementation, you would integrate with x402pay SDK here
      console.log('🔄 Initiating x402pay payment...')
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // For demo purposes, we'll assume payment is successful
      // In production, you would handle the actual payment response
      const paymentSuccessful = true // This would come from x402pay response
      
      if (paymentSuccessful) {
        // Calculate subscription dates
        const subscriptionStart = new Date()
        const subscriptionEnd = new Date()
        subscriptionEnd.setDate(subscriptionEnd.getDate() + 30) // 30 days from now

        // Save subscription to Supabase
        const { data, error } = await supabase
          .from('user_subscription')
          .insert([
            {
              user_id: user.id.toString(),
              wallet_address: connection.address,
              subscription_start: subscriptionStart.toISOString(),
              subscription_end: subscriptionEnd.toISOString(),
            }
          ])
          .select()
          .single()

        if (error) {
          throw new Error(`Failed to save subscription: ${error.message}`)
        }

        console.log('✅ Subscription saved successfully:', data)

        // Show success toast
        toast({
          title: "Subscription Activated!",
          description: "Your Medibot subscription is now active for 30 days.",
        })

        // Redirect to Medibot
        router.push('/user/medibot')
      } else {
        throw new Error('Payment failed. Please try again.')
      }
    } catch (err) {
      console.error('❌ Subscription error:', err)
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.')
      
      toast({
        title: "Payment Failed",
        description: "There was an issue processing your payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConnectWallet = async () => {
    try {
      await connectWallet()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet')
    }
  }

  return (
    <ProtectedRoute allowedRoles={['user']}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Bot className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Unlock AI Health Assistant
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Subscribe for ₹50 (or 0.5 USDC) to access unlimited AI health queries for 30 days.
              Get instant medical insights, symptom analysis, and personalized health recommendations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Subscription Card */}
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-semibold flex items-center justify-center gap-2">
                  <Bot className="h-5 w-5 text-blue-600" />
                  Medibot Premium
                </CardTitle>
                <CardDescription>
                  AI-powered health assistant with unlimited access
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Pricing */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">₹50</div>
                  <div className="text-sm text-gray-500">or 0.5 USDC</div>
                  <Badge variant="secondary" className="mt-2">
                    <Clock className="h-3 w-3 mr-1" />
                    30 Days Access
                  </Badge>
                </div>

                <Separator />

                {/* Features */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">What's included:</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Unlimited AI health queries
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Symptom analysis & recommendations
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Personalized health insights
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      24/7 availability
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Secure & private conversations
                    </li>
                  </ul>
                </div>

                <Separator />

                {/* User Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">User ID:</span>
                    <span className="font-mono text-gray-900">{user?.id || 'Not found'}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-sm text-gray-500">Wallet Address:</span>
                    {connection.isConnected ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="font-mono text-xs text-gray-900 break-all">
                          {connection.address}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        <span className="text-sm text-gray-500">Not connected</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  {!connection.isConnected ? (
                    <Button 
                      onClick={handleConnectWallet}
                      disabled={isConnecting}
                      className="w-full"
                      size="lg"
                    >
                      <Wallet className="h-4 w-4 mr-2" />
                      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleSubscriptionPayment}
                      disabled={isProcessing}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      size="lg"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      {isProcessing ? 'Processing...' : 'Subscribe Now'}
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    onClick={() => router.push('/user/dashboard')}
                    className="w-full"
                  >
                    Back to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Benefits Card */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-green-50">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Why Choose Medibot?
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                      <Bot className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">AI-Powered Insights</h4>
                      <p className="text-sm text-gray-600">
                        Get instant medical insights powered by advanced AI trained on medical literature.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                      <Shield className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Privacy First</h4>
                      <p className="text-sm text-gray-600">
                        Your health conversations are encrypted and never shared with third parties.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                      <Clock className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">24/7 Availability</h4>
                      <p className="text-sm text-gray-600">
                        Access health guidance anytime, anywhere, without waiting for appointments.
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Important Note</h4>
                  <p className="text-xs text-gray-600">
                    Medibot provides general health information and should not replace professional medical advice. 
                    Always consult with healthcare professionals for serious medical concerns.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}