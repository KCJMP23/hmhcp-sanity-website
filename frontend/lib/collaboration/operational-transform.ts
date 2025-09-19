/**
 * Operational Transform Engine
 * Implements conflict-free collaborative editing algorithms
 */

import { Operation, Transform } from './types'

export class OperationalTransform {
  /**
   * Transform operation A against operation B
   * Returns transformed versions of both operations
   */
  static transform(opA: Operation, opB: Operation): Transform {
    const transformedA = { ...opA }
    const transformedB = { ...opB }

    // Handle different operation type combinations
    if (opA.type === 'insert' && opB.type === 'insert') {
      transformedA.position = this.transformInsertInsert(opA, opB).position
      transformedB.position = this.transformInsertInsert(opB, opA).position
    } else if (opA.type === 'insert' && opB.type === 'delete') {
      const result = this.transformInsertDelete(opA, opB)
      transformedA.position = result.insertPos
      transformedB.position = result.deletePos
      transformedB.length = result.deleteLength
    } else if (opA.type === 'delete' && opB.type === 'insert') {
      const result = this.transformInsertDelete(opB, opA)
      transformedB.position = result.insertPos
      transformedA.position = result.deletePos
      transformedA.length = result.deleteLength
    } else if (opA.type === 'delete' && opB.type === 'delete') {
      const result = this.transformDeleteDelete(opA, opB)
      transformedA.position = result.aPos
      transformedA.length = result.aLength
      transformedB.position = result.bPos
      transformedB.length = result.bLength
    } else if (opA.type === 'format' || opB.type === 'format') {
      // Format operations don't affect positions
      return {
        clientOp: opA,
        serverOp: opB,
        transformedClient: transformedA,
        transformedServer: transformedB
      }
    }

    return {
      clientOp: opA,
      serverOp: opB,
      transformedClient: transformedA,
      transformedServer: transformedB
    }
  }

  /**
   * Transform insert against insert
   */
  private static transformInsertInsert(
    opA: Operation,
    opB: Operation
  ): { position: number } {
    if (opA.position < opB.position) {
      return { position: opA.position }
    } else if (opA.position > opB.position) {
      return { position: opA.position + (opB.content?.length || 0) }
    } else {
      // Same position - use user ID for tie-breaking
      if (opA.userId < opB.userId) {
        return { position: opA.position }
      } else {
        return { position: opA.position + (opB.content?.length || 0) }
      }
    }
  }

  /**
   * Transform insert against delete
   */
  private static transformInsertDelete(
    insert: Operation,
    del: Operation
  ): { insertPos: number; deletePos: number; deleteLength: number } {
    const deleteEnd = del.position + (del.length || 0)

    if (insert.position <= del.position) {
      // Insert before delete
      return {
        insertPos: insert.position,
        deletePos: del.position + (insert.content?.length || 0),
        deleteLength: del.length || 0
      }
    } else if (insert.position >= deleteEnd) {
      // Insert after delete
      return {
        insertPos: insert.position - (del.length || 0),
        deletePos: del.position,
        deleteLength: del.length || 0
      }
    } else {
      // Insert within delete range
      return {
        insertPos: del.position,
        deletePos: del.position,
        deleteLength: (del.length || 0) + (insert.content?.length || 0)
      }
    }
  }

  /**
   * Transform delete against delete
   */
  private static transformDeleteDelete(
    opA: Operation,
    opB: Operation
  ): {
    aPos: number
    aLength: number
    bPos: number
    bLength: number
  } {
    const aEnd = opA.position + (opA.length || 0)
    const bEnd = opB.position + (opB.length || 0)

    if (aEnd <= opB.position) {
      // A before B
      return {
        aPos: opA.position,
        aLength: opA.length || 0,
        bPos: opB.position - (opA.length || 0),
        bLength: opB.length || 0
      }
    } else if (bEnd <= opA.position) {
      // B before A
      return {
        aPos: opA.position - (opB.length || 0),
        aLength: opA.length || 0,
        bPos: opB.position,
        bLength: opB.length || 0
      }
    } else if (opA.position <= opB.position && aEnd >= bEnd) {
      // A contains B
      return {
        aPos: opA.position,
        aLength: (opA.length || 0) - (opB.length || 0),
        bPos: opA.position,
        bLength: 0
      }
    } else if (opB.position <= opA.position && bEnd >= aEnd) {
      // B contains A
      return {
        aPos: opB.position,
        aLength: 0,
        bPos: opB.position,
        bLength: (opB.length || 0) - (opA.length || 0)
      }
    } else if (opA.position < opB.position) {
      // Partial overlap, A starts first
      const overlap = aEnd - opB.position
      return {
        aPos: opA.position,
        aLength: (opA.length || 0) - overlap,
        bPos: opA.position,
        bLength: (opB.length || 0) - overlap
      }
    } else {
      // Partial overlap, B starts first
      const overlap = bEnd - opA.position
      return {
        aPos: opB.position,
        aLength: (opA.length || 0) - overlap,
        bPos: opB.position,
        bLength: (opB.length || 0) - overlap
      }
    }
  }

  /**
   * Apply an operation to a document
   */
  static applyOperation(content: string, operation: Operation): string {
    switch (operation.type) {
      case 'insert':
        return (
          content.slice(0, operation.position) +
          (operation.content || '') +
          content.slice(operation.position)
        )

      case 'delete':
        return (
          content.slice(0, operation.position) +
          content.slice(operation.position + (operation.length || 0))
        )

      case 'replace':
        return (
          content.slice(0, operation.position) +
          (operation.content || '') +
          content.slice(operation.position + (operation.length || 0))
        )

      case 'format':
        // Format operations don't change content
        return content

      default:
        return content
    }
  }

  /**
   * Compose multiple operations into a single operation
   */
  static compose(operations: Operation[]): Operation[] {
    if (operations.length === 0) return []
    if (operations.length === 1) return operations

    const composed: Operation[] = []
    let current = operations[0]

    for (let i = 1; i < operations.length; i++) {
      const next = operations[i]

      // Try to merge consecutive operations
      if (this.canMerge(current, next)) {
        current = this.merge(current, next)
      } else {
        composed.push(current)
        current = next
      }
    }

    composed.push(current)
    return composed
  }

  /**
   * Check if two operations can be merged
   */
  private static canMerge(opA: Operation, opB: Operation): boolean {
    // Same user and close in time
    if (opA.userId !== opB.userId) return false
    if (Math.abs(opA.timestamp - opB.timestamp) > 1000) return false

    // Compatible operation types
    if (opA.type === 'insert' && opB.type === 'insert') {
      // Consecutive inserts
      return opA.position + (opA.content?.length || 0) === opB.position
    }

    if (opA.type === 'delete' && opB.type === 'delete') {
      // Consecutive deletes
      return opA.position === opB.position || 
             opA.position === opB.position + (opB.length || 0)
    }

    return false
  }

  /**
   * Merge two operations
   */
  private static merge(opA: Operation, opB: Operation): Operation {
    if (opA.type === 'insert' && opB.type === 'insert') {
      return {
        ...opA,
        content: (opA.content || '') + (opB.content || ''),
        timestamp: opB.timestamp,
        version: opB.version
      }
    }

    if (opA.type === 'delete' && opB.type === 'delete') {
      const minPos = Math.min(opA.position, opB.position)
      return {
        ...opA,
        position: minPos,
        length: (opA.length || 0) + (opB.length || 0),
        timestamp: opB.timestamp,
        version: opB.version
      }
    }

    return opB
  }

  /**
   * Invert an operation (for undo functionality)
   */
  static invert(operation: Operation, beforeContent: string): Operation {
    switch (operation.type) {
      case 'insert':
        return {
          ...operation,
          type: 'delete',
          length: operation.content?.length || 0,
          content: undefined
        }

      case 'delete':
        return {
          ...operation,
          type: 'insert',
          content: beforeContent.substr(operation.position, operation.length)
        }

      case 'replace':
        return {
          ...operation,
          content: beforeContent.substr(operation.position, operation.length),
          length: operation.content?.length || 0
        }

      case 'format':
        // Invert format by removing attributes
        return {
          ...operation,
          attributes: {}
        }

      default:
        return operation
    }
  }

  /**
   * Transform a series of operations against each other
   */
  static transformSeries(
    clientOps: Operation[],
    serverOps: Operation[]
  ): { transformed: Operation[]; conflicts: Operation[] } {
    const transformed: Operation[] = []
    const conflicts: Operation[] = []

    for (const clientOp of clientOps) {
      let currentOp = clientOp

      for (const serverOp of serverOps) {
        const result = this.transform(currentOp, serverOp)
        currentOp = result.transformedClient

        // Check for conflicts
        if (this.isConflict(clientOp, serverOp)) {
          conflicts.push(clientOp, serverOp)
        }
      }

      transformed.push(currentOp)
    }

    return { transformed, conflicts }
  }

  /**
   * Check if two operations conflict
   */
  private static isConflict(opA: Operation, opB: Operation): boolean {
    // Different users editing same region
    if (opA.userId === opB.userId) return false

    const aEnd = opA.position + (opA.length || opA.content?.length || 0)
    const bEnd = opB.position + (opB.length || opB.content?.length || 0)

    // Check for overlapping regions
    return !(aEnd <= opB.position || bEnd <= opA.position)
  }

  /**
   * Calculate diff between two strings
   */
  static diff(oldText: string, newText: string): Operation[] {
    const operations: Operation[] = []
    let oldIndex = 0
    let newIndex = 0

    // Simple diff algorithm - can be replaced with more sophisticated one
    while (oldIndex < oldText.length || newIndex < newText.length) {
      if (oldIndex >= oldText.length) {
        // Insert remaining new text
        operations.push({
          id: `op-${Date.now()}-${Math.random()}`,
          type: 'insert',
          position: oldIndex,
          content: newText.slice(newIndex),
          userId: 'system',
          timestamp: Date.now(),
          version: 0
        })
        break
      }

      if (newIndex >= newText.length) {
        // Delete remaining old text
        operations.push({
          id: `op-${Date.now()}-${Math.random()}`,
          type: 'delete',
          position: oldIndex,
          length: oldText.length - oldIndex,
          userId: 'system',
          timestamp: Date.now(),
          version: 0
        })
        break
      }

      if (oldText[oldIndex] === newText[newIndex]) {
        oldIndex++
        newIndex++
      } else {
        // Find the extent of the difference
        const deleteLength = this.findDifferenceLength(
          oldText.slice(oldIndex),
          newText.slice(newIndex)
        )
        const insertContent = this.findInsertContent(
          oldText.slice(oldIndex),
          newText.slice(newIndex)
        )

        if (deleteLength > 0) {
          operations.push({
            id: `op-${Date.now()}-${Math.random()}`,
            type: 'delete',
            position: oldIndex,
            length: deleteLength,
            userId: 'system',
            timestamp: Date.now(),
            version: 0
          })
        }

        if (insertContent) {
          operations.push({
            id: `op-${Date.now()}-${Math.random()}`,
            type: 'insert',
            position: oldIndex,
            content: insertContent,
            userId: 'system',
            timestamp: Date.now(),
            version: 0
          })
          newIndex += insertContent.length
        }

        oldIndex += deleteLength
      }
    }

    return operations
  }

  private static findDifferenceLength(oldText: string, newText: string): number {
    let length = 0
    while (length < oldText.length && oldText[length] !== newText[0]) {
      length++
    }
    return length
  }

  private static findInsertContent(oldText: string, newText: string): string {
    let content = ''
    let i = 0
    while (i < newText.length && newText[i] !== oldText[0]) {
      content += newText[i]
      i++
    }
    return content
  }
}