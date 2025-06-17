"use client"

import { CheckCircle, Wallet, AlertCircle } from "lucide-react"
import { useWallet } from "@/hooks/useWallet"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface WalletStatusProps {
  className?: string
  showConnectButton?: boolean
}

export function WalletStatus({ className, showConnectButton = true }: WalletStatusProps) {
  const { wallet, isConnecting, error, connectWallet, disconnectWallet } = useWallet()

  const handleConnect = async () => {
    try {
      await connectWallet()
    } catch (err) {
      console.error("Failed to connect wallet:", err)
    }
  }

  if (wallet.isConnected) {
    return (
      <div className={cn("flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md", className)}>
        <CheckCircle className="size-4 text-green-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-green-800">Wallet Connected</p>
          <p className="text-xs text-green-600 font-mono">
            {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={disconnectWallet}
          className="text-green-700 border-green-300 hover:bg-green-100"
        >
          Disconnect
        </Button>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md", className)}>
        <AlertCircle className="size-4 text-red-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800">Connection Failed</p>
          <p className="text-xs text-red-600">{error}</p>
        </div>
        {showConnectButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleConnect}
            disabled={isConnecting}
            className="text-red-700 border-red-300 hover:bg-red-100"
          >
            Retry
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md", className)}>
      <Wallet className="size-4 text-amber-600" />
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-800">Wallet Not Connected</p>
        <p className="text-xs text-amber-600">Connect your Coinbase wallet to continue</p>
      </div>
      {showConnectButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleConnect}
          disabled={isConnecting}
          className="text-amber-700 border-amber-300 hover:bg-amber-100"
        >
          {isConnecting ? "Connecting..." : "Connect"}
        </Button>
      )}
    </div>
  )
}
