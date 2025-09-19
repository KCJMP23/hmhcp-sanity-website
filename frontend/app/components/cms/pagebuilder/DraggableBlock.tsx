'use client'

import { useRef } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { cn } from '@/lib/utils'

const ItemTypes = {
  BLOCK: 'block'
}

interface DraggableBlockProps {
  block: any
  index: number
  moveBlock: (fromIndex: number, toIndex: number) => void
  children: React.ReactNode
}

export function DraggableBlock({ block, index, moveBlock, children }: DraggableBlockProps) {
  const ref = useRef<HTMLDivElement>(null)
  
  const [{ handlerId }, drop] = useDrop({
    accept: ItemTypes.BLOCK,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      }
    },
    hover(item: any, monitor) {
      if (!ref.current) return
      
      const dragIndex = item.index
      const hoverIndex = index
      
      if (dragIndex === hoverIndex) return
      
      const hoverBoundingRect = ref.current?.getBoundingClientRect()
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
      const clientOffset = monitor.getClientOffset()
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top
      
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return
      
      moveBlock(dragIndex, hoverIndex)
      item.index = hoverIndex
    },
  })
  
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.BLOCK,
    item: () => ({ id: block.id, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })
  
  drag(drop(ref))
  
  return (
    <div
      ref={ref}
      className={cn(
        'relative',
        isDragging && 'opacity-50'
      )}
      data-handler-id={handlerId}
    >
      {children}
    </div>
  )
}