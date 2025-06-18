"use client"

import { useState, useEffect, useCallback } from "react"
import { walletService, type WalletConnection } from "@/lib/wallet"

export function useWallet() {
  const [connection, setConnection] = useState<WalletConnection>({
    address: "",
    isConnected: false,
  })
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check for existing connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const currentConnection = await walletService.checkConnection()
        setConnection(currentConnection)
      } catch (err) {
        console.error("Failed to check wallet connection:", err)
      }
    }

    checkConnection()
  }, [])

  const connectWallet = useCallback(async () => {
    setIsConnecting(true)
    setError(null)

    try {
      const newConnection = await walletService.connectWallet()
      setConnection(newConnection)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to connect wallet"
      setError(errorMessage)
      console.error("Wallet connection error:", err)
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnectWallet = useCallback(() => {
    walletService.disconnect()
    setConnection({ address: "", isConnected: false })
    setError(null)
  }, [])

  return {
    connection,
    wallet: connection, // For backward compatibility
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
  }
}