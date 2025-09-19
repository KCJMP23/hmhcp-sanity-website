/**
 * System Coordination Layer
 * Prevents conflicts between optimization systems and ensures proper resource management
 */

// System coordination configuration
const COORDINATION_CONFIG = {
  // System priorities (lower number = higher priority)
  systemPriorities: {
    criticalResources: 0,    // Highest priority
    imageOptimization: 1,    // High priority
    tbtReduction: 2,         // Medium priority
    componentOptimization: 3, // Medium priority
    jsOptimization: 4,       // Low priority
    bundleOptimization: 5,   // Low priority
    microChunking: 6,        // Low priority
    databaseOptimization: 7  // Lowest priority
  },
  
  // Resource types and their handling
  resourceTypes: {
    critical: ['hero-research.jpg', 'hero-technology.jpg', 'hero-consultation.jpg', 'critical-css'],
    high: ['main-layout', 'navigation', 'above-fold'],
    normal: ['images', 'components', 'scripts'],
    low: ['analytics', 'tracking', 'background']
  },
  
  // System coordination rules
  coordinationRules: {
    // Critical resources should never be delayed
    criticalResources: {
      canDelay: false,
      maxDelay: 0,
      priority: 'critical'
    },
    
    // Image optimization should not conflict with critical resources
    imageOptimization: {
      canDelay: true,
      maxDelay: 100,
      priority: 'high',
      conflicts: ['tbtReduction']
    },
    
    // TBT reduction should not delay critical resources
    tbtReduction: {
      canDelay: true,
      maxDelay: 50,
      priority: 'normal',
      conflicts: ['imageOptimization']
    }
  }
}

// System status tracking
interface SystemStatus {
  name: string
  active: boolean
  priority: number
  lastActivity: number
  resourceCount: number
  conflicts: string[]
}

class SystemCoordinator {
  private systems: Map<string, SystemStatus> = new Map()
  private resourceQueue: Map<string, any[]> = new Map()
  private isProcessing = false
  private coordinationTimer: NodeJS.Timeout | null = null

  constructor() {
    this.initializeCoordination()
  }

  private initializeCoordination() {
    // Initialize system tracking
    Object.keys(COORDINATION_CONFIG.systemPriorities).forEach(systemName => {
      this.systems.set(systemName, {
        name: systemName,
        active: false,
        priority: COORDINATION_CONFIG.systemPriorities[systemName as keyof typeof COORDINATION_CONFIG.systemPriorities],
        lastActivity: 0,
        resourceCount: 0,
        conflicts: this.getSystemConflicts(systemName)
      })
    })

    // Start coordination processing
    this.startCoordinationProcessing()
  }

  private getSystemConflicts(systemName: string): string[] {
    const rules = COORDINATION_CONFIG.coordinationRules[systemName as keyof typeof COORDINATION_CONFIG.coordinationRules]
    return rules?.conflicts || []
  }

  private startCoordinationProcessing() {
    if (this.coordinationTimer) return

    this.coordinationTimer = setInterval(() => {
      this.processCoordination()
    }, 100) // Process every 100ms
  }

  private processCoordination() {
    if (this.isProcessing) return

    this.isProcessing = true

    try {
      // Process systems by priority
      const sortedSystems = Array.from(this.systems.values())
        .filter(system => system.active)
        .sort((a, b) => a.priority - b.priority)

      for (const system of sortedSystems) {
        this.processSystem(system)
      }

      // Clean up inactive systems
      this.cleanupInactiveSystems()
    } finally {
      this.isProcessing = false
    }
  }

  private processSystem(system: SystemStatus) {
    const resources = this.resourceQueue.get(system.name) || []
    if (resources.length === 0) return

    // Check for conflicts
    const conflictingSystems = this.getActiveConflictingSystems(system.name)
    if (conflictingSystems.length > 0) {
      // Defer processing if conflicts exist
      return
    }

    // Process resources for this system
    const resourcesToProcess = resources.splice(0, 5) // Process up to 5 resources at a time
    resourcesToProcess.forEach(resource => {
      this.processResource(system, resource)
    })

    // Update system status
    system.lastActivity = performance.now()
    system.resourceCount = resources.length
  }

  private getActiveConflictingSystems(systemName: string): string[] {
    const system = this.systems.get(systemName)
    if (!system) return []

    return system.conflicts.filter(conflictSystem => {
      const conflictSystemStatus = this.systems.get(conflictSystem)
      return conflictSystemStatus?.active && 
             conflictSystemStatus.lastActivity > performance.now() - 1000 // Active in last second
    })
  }

  private processResource(system: SystemStatus, resource: any) {
    try {
      // Execute resource processing based on system type
      switch (system.name) {
        case 'criticalResources':
          this.processCriticalResource(resource)
          break
        case 'imageOptimization':
          this.processImageResource(resource)
          break
        case 'tbtReduction':
          this.processTBTResource(resource)
          break
        case 'componentOptimization':
          this.processComponentResource(resource)
          break
        default:
          this.processGenericResource(resource)
      }
    } catch (error) {
      console.error(`Error processing resource in ${system.name}:`, error)
    }
  }

  private processCriticalResource(resource: any) {
    // Critical resources are processed immediately
    if (resource.type === 'image' && resource.url) {
      const img = new Image()
      img.src = resource.url
      img.onload = () => {
        console.log(`✅ Critical resource loaded: ${resource.url}`)
      }
    }
  }

  private processImageResource(resource: any) {
    // Image optimization with conflict checking
    if (resource.element && resource.element.tagName === 'IMG') {
      resource.element.setAttribute('data-optimized', 'true')
    }
  }

  private processTBTResource(resource: any) {
    // TBT reduction with micro-chunking
    if (resource.fn && typeof resource.fn === 'function') {
      // Execute with micro-chunking
      setTimeout(() => {
        try {
          resource.fn()
        } catch (error) {
          console.error('TBT resource execution error:', error)
        }
      }, 0)
    }
  }

  private processComponentResource(resource: any) {
    // Component optimization
    if (resource.element) {
      resource.element.setAttribute('data-optimized', 'true')
    }
  }

  private processGenericResource(resource: any) {
    // Generic resource processing
    if (resource.fn && typeof resource.fn === 'function') {
      resource.fn()
    }
  }

  private cleanupInactiveSystems() {
    const now = performance.now()
    const inactiveThreshold = 5000 // 5 seconds

    this.systems.forEach(system => {
      if (system.active && now - system.lastActivity > inactiveThreshold) {
        system.active = false
        console.log(`System ${system.name} marked as inactive`)
      }
    })
  }

  // Register a system
  registerSystem(systemName: string): void {
    const system = this.systems.get(systemName)
    if (system) {
      system.active = true
      system.lastActivity = performance.now()
      console.log(`System ${systemName} registered`)
    }
  }

  // Unregister a system
  unregisterSystem(systemName: string): void {
    const system = this.systems.get(systemName)
    if (system) {
      system.active = false
      console.log(`System ${systemName} unregistered`)
    }
  }

  // Add resource to system queue
  addResource(systemName: string, resource: any): void {
    if (!this.resourceQueue.has(systemName)) {
      this.resourceQueue.set(systemName, [])
    }
    
    this.resourceQueue.get(systemName)!.push(resource)
    
    // Register system if not already active
    this.registerSystem(systemName)
  }

  // Get system status
  getSystemStatus(systemName: string): SystemStatus | null {
    return this.systems.get(systemName) || null
  }

  // Get all system statuses
  getAllSystemStatuses(): SystemStatus[] {
    return Array.from(this.systems.values())
  }

  // Get coordination stats
  getCoordinationStats() {
    const activeSystems = Array.from(this.systems.values()).filter(s => s.active)
    const totalResources = Array.from(this.resourceQueue.values())
      .reduce((total, resources) => total + resources.length, 0)

    return {
      activeSystems: activeSystems.length,
      totalSystems: this.systems.size,
      totalResources,
      isProcessing: this.isProcessing,
      systems: activeSystems.map(s => ({
        name: s.name,
        priority: s.priority,
        resourceCount: s.resourceCount,
        lastActivity: s.lastActivity
      }))
    }
  }

  // Cleanup
  destroy() {
    if (this.coordinationTimer) {
      clearInterval(this.coordinationTimer)
      this.coordinationTimer = null
    }
    
    this.systems.clear()
    this.resourceQueue.clear()
    this.isProcessing = false
  }
}

// Global system coordinator
let systemCoordinator: SystemCoordinator | null = null

// Initialize system coordination
export function initializeSystemCoordination(): void {
  if (typeof window === 'undefined') return

  if (!systemCoordinator) {
    systemCoordinator = new SystemCoordinator()
    console.log('🔧 System coordination layer initialized')
  }
}

// Register a system
export function registerSystem(systemName: string): void {
  if (!systemCoordinator) {
    initializeSystemCoordination()
  }
  
  systemCoordinator!.registerSystem(systemName)
}

// Unregister a system
export function unregisterSystem(systemName: string): void {
  if (!systemCoordinator) {
    return
  }
  
  systemCoordinator!.unregisterSystem(systemName)
}

// Add resource to system queue
export function addResourceToSystem(systemName: string, resource: any): void {
  if (!systemCoordinator) {
    initializeSystemCoordination()
  }
  
  systemCoordinator!.addResource(systemName, resource)
}

// Get system status
export function getSystemStatus(systemName: string) {
  return systemCoordinator ? systemCoordinator.getSystemStatus(systemName) : null
}

// Get coordination stats
export function getCoordinationStats() {
  return systemCoordinator ? systemCoordinator.getCoordinationStats() : null
}

// Cleanup system coordination
export function cleanupSystemCoordination(): void {
  if (systemCoordinator) {
    systemCoordinator.destroy()
    systemCoordinator = null
    console.log('🧹 System coordination layer cleaned up')
  }
}
