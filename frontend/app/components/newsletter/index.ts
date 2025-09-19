// Newsletter Components
export { SubscriptionForm, INTEREST_CATEGORIES } from './SubscriptionForm';
export { 
  NewsletterModal, 
  useNewsletterModal,
  CtaNewsletterModal,
  ExitIntentModal,
  BlogNewsletterModal 
} from './NewsletterModal';
export { 
  NewsletterTrigger,
  HeroNewsletterTrigger,
  HeaderNewsletterTrigger,
  FooterNewsletterTrigger,
  FloatingNewsletterTrigger,
  BlogPostTrigger,
  SidebarNewsletterTrigger
} from './NewsletterTrigger';

// Types
export interface NewsletterInterest {
  id: string;
  name: string;
  description: string;
}

export interface NewsletterSubscription {
  email: string;
  interests: string[];
  source: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
}