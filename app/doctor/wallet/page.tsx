"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  Wallet, 
  Copy, 
  ExternalLink, 
  ArrowUpRight, 
  ArrowDownLeft,
  RefreshCw,
  DollarSign
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useWallet } from "@/hooks/useWallet"
import { supabase } from "@/lib/supabaseClient"
import { useToast } from "@/hooks/use-toast"

interface Transaction {
  id: string
  date: string
  type: 'sent' | 'received'
  amount: number
  transaction_hash: string
  patient_name?: string
  description?: string
  status: string
}

export default function DoctorWallet() {
  const { user } = useAuth()
  const { connection, connectWallet } = useWallet()
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [balance, setBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWalletData = async () => {
      if (!user?.id) return

      try {
        setIsLoading(true)
        setError(null)

        // Fetch transactions
        const { data: transactionData, error: transError } = await supabase
          .from('transactions')
          .select('*')
          .eq('doctor_id', user.id)
          .order('created_at', { ascending: false })

        if (transError) {
          throw new Error(transError.message)
        }

        const formattedTransactions = transactionData?.map(t => ({
          id: t.id,
          date: t.created_at,
          type: t.type,
          amount: Number(t.amount),
          transaction_hash: t.transaction_hash || '',
          patient_name: t.patient_name,
          description: t.description,
          status: t.status || 'completed'
        })) || []

        setTransactions(formattedTransactions)

        // Calculate balance
        const totalReceived = formattedTransactions
          .filter(t => t.type === 'received')
          .reduce((sum, t) => sum + t.amount, 0)
        
        const totalSent = formattedTransactions
          .filter(t => t.type === 'sent')
          .reduce((sum, t) => sum + t.amount, 0)

        setBalance(totalReceived - totalSent)

      } catch (err) {
        console.error('Error fetching wallet data:', err)
        setError('Failed to load wallet data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchWalletData()
  }, [user?.id])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const truncateHash = (hash: string) => {
    if (!hash) return 'N/A'
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`
  }

  const getTransactionIcon = (type: string) => {
    return type === 'received' ? (
      <ArrowDownLeft className="h-4 w-4 text-green-600" />
    ) : (
      <ArrowUpRight className="h-4 w-4 text-red-600" />
    )
  }

  const getTransactionColor = (type: string) => {
    return type === 'received' ? 'text-green-600' : 'text-red-600'
  }

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['doctor']}>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="flex items-center justify-center h-screen">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Loading wallet...</p>
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
                      Doctor Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Wallet</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Wallet</h1>
                  <p className="text-muted-foreground">Manage your Web3 wallet and transactions</p>
                </div>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Wallet Info */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5" />
                      Wallet Address
                    </CardTitle>
                    <CardDescription>
                      Your connected Web3 wallet
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {connection.isConnected ? (
                      <>
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm break-all">
                              {connection.address}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(connection.address)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Connected
                        </div>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          No wallet connected
                        </p>
                        <Button onClick={connectWallet}>
                          <Wallet className="h-4 w-4 mr-2" />
                          Connect Wallet
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Current Balance
                    </CardTitle>
                    <CardDescription>
                      Your total wallet balance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{formatCurrency(balance)}</div>
                    <p className="text-sm text-muted-foreground mt-2">
                      From {transactions.filter(t => t.type === 'received').length} received transactions
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Transactions */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>
                    All your wallet transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {transactions.length > 0 ? (
                    <div className="space-y-4">
                      {transactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-muted rounded-full">
                              {getTransactionIcon(transaction.type)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {transaction.type === 'received' ? 'Received' : 'Sent'}
                                </span>
                                {transaction.patient_name && (
                                  <span className="text-sm text-muted-foreground">
                                    {transaction.type === 'received' ? 'from' : 'to'} {transaction.patient_name}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{formatDate(transaction.date)}</span>
                                <span>•</span>
                                <span className="font-mono">{truncateHash(transaction.transaction_hash)}</span>
                                {transaction.transaction_hash && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(transaction.transaction_hash)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                              {transaction.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {transaction.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-medium ${getTransactionColor(transaction.type)}`}>
                              {transaction.type === 'received' ? '+' : '-'}{formatCurrency(transaction.amount)}
                            </div>
                            <Badge variant="outline" className="mt-1">
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No transactions found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}