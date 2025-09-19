'use client'

import { TextBlock } from './blocks/TextBlock'
import { HeadingBlock } from './blocks/HeadingBlock'
import { ImageBlock } from './blocks/ImageBlock'
import { ButtonBlock } from './blocks/ButtonBlock'
import { ColumnsBlock } from './blocks/ColumnsBlock'
import { HeroBlock } from './blocks/HeroBlock'
import { SpacerBlock } from './blocks/SpacerBlock'
import { DraggableBlock } from './DraggableBlock'

const BlockComponents = {
  text: TextBlock,
  heading: HeadingBlock,
  image: ImageBlock,
  button: ButtonBlock,
  columns: ColumnsBlock,
  hero: HeroBlock,
  spacer: SpacerBlock
} as const

interface BlockRendererProps {
  block: any
  isSelected: boolean
  isPreview: boolean
  onSelect: () => void
  onUpdate: (updates: any) => void
  onDelete: () => void
  onDuplicate: () => void
  onMove: (fromIndex: number, toIndex: number) => void
  index: number
}

export function BlockRenderer({ 
  block, 
  isSelected, 
  isPreview, 
  onSelect, 
  onUpdate, 
  onDelete, 
  onDuplicate, 
  onMove, 
  index 
}: BlockRendererProps) {
  const BlockComponent = BlockComponents[block.type as keyof typeof BlockComponents]
  
  if (!BlockComponent) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 dark:bg-blue-900/20">
        <p className="text-red-600 dark:text-blue-400">Unknown block type: {block.type}</p>
      </div>
    )
  }
  
  const blockElement = (
    <BlockComponent
      id={block.id}
      content={block.content}
      styles={block.styles}
      isSelected={isSelected}
      isPreview={isPreview}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onSelect={onSelect}
    />
  )
  
  if (isPreview) {
    return blockElement
  }
  
  return (
    <DraggableBlock block={block} index={index} moveBlock={onMove}>
      {blockElement}
    </DraggableBlock>
  )
}