"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Bot, Send, Trash2, AlertCircle, CheckCircle, Clock, CreditCard } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useWallet } from "@/hooks/useWallet"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/lib/supabaseClient"

interface ChatMessage {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
}

interface Subscription {
  id: string
  user_id: string
  wallet_address: string
  subscription_start: string
  subscription_end: string
}

export default function MedibotPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { connection } = useWallet()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Check subscription status
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user?.id || !connection.address) {
        setError("User ID or wallet address not found")
        setIsLoading(false)
        return
      }

      try {
        console.log('🔍 Checking subscription for user:', user.id, 'wallet:', connection.address)
        
        const { data, error } = await supabase
          .from('user_subscription')
          .select('*')
          .eq('user_id', user.id.toString())
          .eq('wallet_address', connection.address)
          .gte('subscription_end', new Date().toISOString())
          .order('subscription_end', { ascending: false })
          .limit(1)

        if (error) {
          console.error('❌ Subscription check error:', error)
          setError("Error checking subscription status")
          return
        }

        console.log('📊 Subscription data:', data)

        if (data && data.length > 0) {
          setSubscription(data[0])
          console.log('✅ Active subscription found')
          
          // Add welcome message
          setMessages([
            {
              id: '1',
              type: 'bot',
              content: `Hello ${user.full_name}! I'm Medibot, your AI health assistant. I'm here to help you with health-related questions, symptom analysis, and wellness guidance. How can I assist you today?`,
              timestamp: new Date()
            }
          ])
        } else {
          console.log('❌ No active subscription found')
          setSubscription(null)
        }
      } catch (err) {
        console.error('❌ Subscription check error:', err)
        setError("Failed to verify subscription")
      } finally {
        setIsLoading(false)
      }
    }

    checkSubscription()
  }, [user?.id, connection.address, user?.full_name])

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const getAIResponse = async (userInput: string): Promise<string> => {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
    
    // Simple AI response simulation based on keywords
    const input = userInput.toLowerCase()
    
    if (input.includes('headache') || input.includes('head pain')) {
      return "Headaches can have various causes including stress, dehydration, lack of sleep, or tension. For mild headaches, try drinking water, resting in a quiet dark room, and applying a cold or warm compress. If headaches are severe, frequent, or accompanied by other symptoms like fever, vision changes, or neck stiffness, please consult a healthcare professional immediately."
    }
    
    if (input.includes('fever') || input.includes('temperature')) {
      return "Fever is often a sign that your body is fighting an infection. For adults, a fever is generally considered 100.4°F (38°C) or higher. Stay hydrated, rest, and consider over-the-counter fever reducers if comfortable. Seek medical attention if fever exceeds 103°F (39.4°C), persists for more than 3 days, or is accompanied by severe symptoms."
    }
    
    if (input.includes('cough') || input.includes('cold')) {
      return "Coughs can be caused by viral infections, allergies, or irritants. For a dry cough, try honey, warm liquids, and throat lozenges. For productive coughs, stay hydrated to help thin mucus. See a doctor if the cough persists for more than 2 weeks, produces blood, or is accompanied by high fever or difficulty breathing."
    }
    
    if (input.includes('diet') || input.includes('nutrition') || input.includes('food')) {
      return "A balanced diet should include a variety of fruits, vegetables, whole grains, lean proteins, and healthy fats. Aim for 5-9 servings of fruits and vegetables daily, stay hydrated with water, and limit processed foods, added sugars, and excessive sodium. Consider consulting a registered dietitian for personalized nutrition advice."
    }
    
    if (input.includes('exercise') || input.includes('workout') || input.includes('fitness')) {
      return "Regular physical activity is crucial for health. Adults should aim for at least 150 minutes of moderate-intensity aerobic activity or 75 minutes of vigorous activity weekly, plus muscle-strengthening activities twice a week. Start slowly if you're new to exercise and gradually increase intensity. Consult your doctor before starting a new exercise program, especially if you have health conditions."
    }
    
    if (input.includes('sleep') || input.includes('insomnia') || input.includes('tired')) {
      return "Good sleep hygiene is essential for health. Adults need 7-9 hours of sleep nightly. Maintain a consistent sleep schedule, create a comfortable sleep environment, avoid screens before bedtime, and limit caffeine late in the day. If you consistently have trouble sleeping, consider speaking with a healthcare provider about possible sleep disorders."
    }
    
    if (input.includes('stress') || input.includes('anxiety') || input.includes('mental health')) {
      return "Managing stress is important for overall health. Try relaxation techniques like deep breathing, meditation, or yoga. Regular exercise, adequate sleep, and social support can also help. If stress or anxiety significantly impacts your daily life, consider speaking with a mental health professional. Remember, seeking help is a sign of strength, not weakness."
    }
    
    // Default response for general health queries
    return "Thank you for your health question. While I can provide general health information, I recommend consulting with a qualified healthcare professional for personalized medical advice, especially for specific symptoms or conditions. Is there a particular aspect of health and wellness you'd like to know more about?"
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    try {
      const aiResponse = await getAIResponse(userMessage.content)
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: aiResponse,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleClearChat = () => {
    setMessages([
      {
        id: '1',
        type: 'bot',
        content: `Hello ${user?.full_name}! I'm Medibot, your AI health assistant. How can I help you today?`,
        timestamp: new Date()
      }
    ])
  }

  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['user']}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Checking subscription...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  // Show subscription required screen
  if (!subscription) {
    return (
      <ProtectedRoute allowedRoles={['user']}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center shadow-lg">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Bot className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-xl">Subscription Required</CardTitle>
              <CardDescription>
                You need an active subscription to access Medibot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="text-sm text-gray-600">
                <p>Get unlimited AI health queries for just ₹50 (or 0.5 USDC) for 30 days.</p>
              </div>
              
              <div className="space-y-2">
                <Button 
                  onClick={() => router.push('/subscribe')}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Subscribe Now
                </Button>
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
        </div>
      </ProtectedRoute>
    )
  }

  // Show Medibot chat interface
  return (
    <ProtectedRoute allowedRoles={['user']}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="max-w-4xl mx-auto p-4">
          {/* Header */}
          <Card className="mb-4 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Bot className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Medibot AI Assistant</CardTitle>
                    <CardDescription>Your personal health companion</CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    {getDaysRemaining(subscription.subscription_end)} days left
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Chat Interface */}
          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Chat with Medibot</CardTitle>
                  <CardDescription>Ask me anything about health and wellness</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleClearChat}
                  disabled={messages.length <= 1}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Chat
                </Button>
              </div>
            </CardHeader>
            
            <Separator />
            
            <CardContent className="p-0">
              {/* Messages */}
              <ScrollArea className="h-[500px] p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.type === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="text-sm">{message.content}</div>
                        <div
                          className={`text-xs mt-1 ${
                            message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}
                        >
                          {formatDate(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              <Separator />
              
              {/* Input */}
              <div className="p-4">
                <div className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask me about symptoms, health tips, or wellness advice..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={isTyping}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="mt-2 text-xs text-gray-500">
                  <strong>Disclaimer:</strong> Medibot provides general health information and should not replace professional medical advice.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}