declare global {
  interface Window {
    ethereum?: any
    coinbaseWalletExtension?: any
  }
}

export interface WalletConnection {
  address: string
  isConnected: boolean
}

export class WalletService {
  private static instance: WalletService
  private isConnected = false
  private address = ""

  private constructor() {
    // Initialize from localStorage if available
    if (typeof window !== "undefined") {
      const storedAddress = localStorage.getItem("walletAddress")
      const storedConnected = localStorage.getItem("walletConnected")
      
      if (storedAddress && storedConnected === "true") {
        this.address = storedAddress
        this.isConnected = true
      }
    }
  }

  public static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService()
    }
    return WalletService.instance
  }

  private async getCoinbaseProvider() {
    // Check if Coinbase Wallet extension is available
    if (typeof window !== "undefined" && window.ethereum) {
      // Check if it's Coinbase Wallet
      if (window.ethereum.isCoinbaseWallet) {
        return window.ethereum
      }

      // Check for multiple providers
      if (window.ethereum.providers) {
        const coinbaseProvider = window.ethereum.providers.find((provider: any) => provider.isCoinbaseWallet)
        if (coinbaseProvider) {
          return coinbaseProvider
        }
      }
    }

    // If extension not found, try to use Coinbase Wallet SDK
    try {
      const { CoinbaseWalletSDK } = await import("@coinbase/wallet-sdk")

      const coinbaseWallet = new CoinbaseWalletSDK({
        appName: "Docrypta",
        appLogoUrl: "https://example.com/logo.png", // Replace with your actual logo URL
        darkMode: false,
      })

      return coinbaseWallet.makeWeb3Provider()
    } catch (error) {
      console.error("Failed to initialize Coinbase Wallet SDK:", error)
      throw new Error("Coinbase Wallet not available. Please install the Coinbase Wallet extension.")
    }
  }

  async connectWallet(): Promise<WalletConnection> {
    try {
      const provider = await this.getCoinbaseProvider()

      if (!provider) {
        throw new Error("Coinbase Wallet not available. Please install the Coinbase Wallet extension.")
      }

      // Request account access
      const accounts = await provider.request({
        method: "eth_requestAccounts",
      })

      if (accounts && accounts.length > 0) {
        this.address = accounts[0]
        this.isConnected = true

        // Store in localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("walletAddress", this.address)
          localStorage.setItem("walletConnected", "true")
        }

        // Listen for account changes
        provider.on("accountsChanged", (accounts: string[]) => {
          if (accounts.length === 0) {
            this.disconnect()
          } else {
            this.address = accounts[0]
            if (typeof window !== "undefined") {
              localStorage.setItem("walletAddress", this.address)
            }
          }
        })

        // Listen for disconnect
        provider.on("disconnect", () => {
          this.disconnect()
        })

        return {
          address: this.address,
          isConnected: this.isConnected,
        }
      } else {
        throw new Error("No accounts found")
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error)

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes("User rejected")) {
          throw new Error("Connection rejected. Please approve the connection in your Coinbase Wallet.")
        } else if (error.message.includes("not available")) {
          throw new Error("Coinbase Wallet not found. Please install the Coinbase Wallet extension.")
        } else {
          throw new Error(error.message)
        }
      }

      throw new Error("Failed to connect wallet. Please try again.")
    }
  }

  disconnect(): void {
    this.isConnected = false
    this.address = ""

    // Clear localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("walletAddress")
      localStorage.removeItem("walletConnected")
    }
  }

  getConnection(): WalletConnection {
    return {
      address: this.address,
      isConnected: this.isConnected,
    }
  }

  async checkConnection(): Promise<WalletConnection> {
    try {
      // First check localStorage
      if (typeof window !== "undefined") {
        const storedAddress = localStorage.getItem("walletAddress")
        const storedConnected = localStorage.getItem("walletConnected")

        if (storedAddress && storedConnected === "true") {
          this.address = storedAddress
          this.isConnected = true

          // Try to verify the connection is still valid
          try {
            const provider = await this.getCoinbaseProvider()
            if (provider) {
              const accounts = await provider.request({
                method: "eth_accounts", // This doesn't require user interaction
              })

              if (accounts && accounts.length > 0 && accounts[0] === storedAddress) {
                return {
                  address: this.address,
                  isConnected: this.isConnected,
                }
              } else {
                // Connection is stale, clear it
                this.disconnect()
              }
            }
          } catch (error) {
            // If verification fails, clear the stored connection
            this.disconnect()
          }
        }
      }

      return {
        address: this.address,
        isConnected: this.isConnected,
      }
    } catch (error) {
      console.error("Failed to check wallet connection:", error)
      return { address: "", isConnected: false }
    }
  }

  // Helper method to check if Coinbase Wallet is installed
  static isCoinbaseWalletAvailable(): boolean {
    if (typeof window === "undefined") return false

    return !!(
      window.ethereum?.isCoinbaseWallet ||
      window.coinbaseWalletExtension ||
      (window.ethereum?.providers && window.ethereum.providers.some((p: any) => p.isCoinbaseWallet))
    )
  }
}

export const walletService = WalletService.getInstance()