// Page Builder Components
export { PageBuilder } from './PageBuilder'

// Block Components
export { TextBlock } from './blocks/TextBlock'
export { HeadingBlock } from './blocks/HeadingBlock'
export { ImageBlock } from './blocks/ImageBlock'
export { ButtonBlock } from './blocks/ButtonBlock'
export { ColumnsBlock } from './blocks/ColumnsBlock'
export { HeroBlock } from './blocks/HeroBlock'
export { SpacerBlock } from './blocks/SpacerBlock'

// Types
export interface Block {
  id: string
  type: string
  content: any
  styles: Record<string, any>
  children?: Block[]
}

export interface PageBuilderProps {
  initialContent?: Block[]
  onSave?: (content: Block[]) => void
}