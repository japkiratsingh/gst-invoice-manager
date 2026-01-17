import { localStorageService } from "./local-storage"
import { databaseService } from "./database-service"
import type { Invoice } from "./types"

export class MigrationHelper {
  // Check if database is available
  static async checkDatabaseConnection(): Promise<boolean> {
    try {
      await databaseService.getStats()
      return true
    } catch (error) {
      console.error("Database connection failed:", error)
      return false
    }
  }

  // Get localStorage data
  static getLocalStorageData(): { saleInvoices: Invoice[]; purchaseInvoices: Invoice[] } {
    try {
      const saleInvoices = localStorageService.getInvoices("sale")
      const purchaseInvoices = localStorageService.getInvoices("purchase")
      
      return {
        saleInvoices,
        purchaseInvoices,
      }
    } catch (error) {
      console.error("Error reading localStorage data:", error)
      return { saleInvoices: [], purchaseInvoices: [] }
    }
  }

  // Migrate data from localStorage to database
  static async migrateToDatabase(): Promise<{
    success: boolean
    message: string
    details?: any
  }> {
    try {
      // Check database connection
      const isConnected = await this.checkDatabaseConnection()
      if (!isConnected) {
        return {
          success: false,
          message: "Database connection failed. Please check your database configuration.",
        }
      }

      // Get localStorage data
      const { saleInvoices, purchaseInvoices } = this.getLocalStorageData()
      
      if (saleInvoices.length === 0 && purchaseInvoices.length === 0) {
        return {
          success: true,
          message: "No data to migrate from localStorage.",
        }
      }

      // Migrate to database
      const result = await databaseService.migrateFromLocalStorage(saleInvoices, purchaseInvoices)
      
      const totalSuccessful = result.sale.successful + result.purchase.successful
      const totalFailed = result.sale.failed + result.purchase.failed

      return {
        success: true,
        message: `Migration completed: ${totalSuccessful} invoices migrated successfully, ${totalFailed} failed.`,
        details: result,
      }
    } catch (error) {
      console.error("Migration failed:", error)
      return {
        success: false,
        message: `Migration failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }
  }

  // Clear localStorage data after successful migration
  static clearLocalStorageData(): void {
    try {
      localStorage.removeItem("gst-sale-invoices")
      localStorage.removeItem("gst-purchase-invoices")
      console.log("LocalStorage data cleared successfully")
    } catch (error) {
      console.error("Error clearing localStorage:", error)
    }
  }

  // Create a backup of localStorage data
  static createBackup(): string {
    try {
      const data = this.getLocalStorageData()
      const backup = {
        timestamp: new Date().toISOString(),
        saleInvoices: data.saleInvoices,
        purchaseInvoices: data.purchaseInvoices,
      }
      
      const backupString = JSON.stringify(backup, null, 2)
      
      // Create downloadable backup file
      const blob = new Blob([backupString], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `gst-invoice-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      return backupString
    } catch (error) {
      console.error("Error creating backup:", error)
      throw error
    }
  }

  // Restore from backup
  static restoreFromBackup(backupData: string): { success: boolean; message: string } {
    try {
      const backup = JSON.parse(backupData)
      
      if (!backup.saleInvoices || !backup.purchaseInvoices) {
        return {
          success: false,
          message: "Invalid backup format",
        }
      }

      // Restore to localStorage
      localStorageService.saveInvoices("sale", backup.saleInvoices)
      localStorageService.saveInvoices("purchase", backup.purchaseInvoices)
      
      return {
        success: true,
        message: "Data restored from backup successfully",
      }
    } catch (error) {
      console.error("Error restoring from backup:", error)
      return {
        success: false,
        message: `Failed to restore backup: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }
  }
}
