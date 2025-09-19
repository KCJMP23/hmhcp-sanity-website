'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useFormAnalytics } from '@/hooks/useAnalytics';
import { useCSRFToken } from '@/lib/csrf-client';
import { cn } from '@/lib/utils';
import { loadReCaptcha, executeReCaptcha } from '@/lib/recaptcha';
import { INTEREST_CATEGORIES } from './SubscriptionForm';

interface NewsletterModalProps {
  isOpen: boolean;
  onClose: () => void;
  source?: string;
  title?: string;
  description?: string;
  showInterests?: boolean;
}

export function NewsletterModal({ 
  isOpen, 
  onClose,
  source = 'modal',
  title = 'Stay Updated with Healthcare Insights',
  description = 'Get the latest healthcare technology insights, product updates, and industry news delivered straight to your inbox.',
  showInterests = true
}: NewsletterModalProps) {
  const [email, setEmail] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Honeypot field
  const formAnalytics = useFormAnalytics('newsletter_modal');
  const csrf = useCSRFToken();

  // Load reCAPTCHA on component mount
  useEffect(() => {
    loadReCaptcha();
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setInterests([]);
      setStatus('idle');
      setErrorMessage('');
      setHoneypot('');
      formAnalytics.startFormTracking(`${source}_modal`);
    }
  }, [isOpen, source, formAnalytics]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check honeypot
    if (honeypot) {
      console.warn('Bot detected via honeypot');
      setStatus('success'); // Fake success for bots
      setTimeout(() => onClose(), 2000);
      return;
    }
    
    setIsLoading(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      // Execute reCAPTCHA
      const recaptchaToken = await executeReCaptcha('newsletter_subscribe_modal');
      
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: csrf.addToHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(csrf.addToBody({
          email,
          interests,
          source: `${source}_modal`,
          recaptchaToken,
          utm_source: new URLSearchParams(window.location.search).get('utm_source'),
          utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
          utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign'),
        })),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Subscription failed');
      }

      setStatus('success');
      formAnalytics.trackSubmit(true);
      
      // Auto-close modal after 3 seconds on success
      setTimeout(() => {
        onClose();
        setEmail('');
        setInterests([]);
        setStatus('idle');
      }, 3000);
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred');
      formAnalytics.trackSubmit(false, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleInterest = (interestId: string) => {
    setInterests(prev => 
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </DialogTitle>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {description}
            </p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div>
              <Label htmlFor="modal-email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="modal-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading || status === 'success'}
                onFocus={() => formAnalytics.trackFieldInteraction('email', 'focus')}
                onBlur={() => formAnalytics.trackFieldInteraction('email', 'blur')}
                className="mt-1.5"
              />
            </div>

            {/* Honeypot field - hidden from users */}
            <div className="hidden" aria-hidden="true">
              <Label htmlFor="modal-website">Website</Label>
              <Input
                id="modal-website"
                name="website"
                type="text"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {showInterests && (
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  What interests you? (optional)
                </Label>
                <div className="space-y-3 max-h-32 overflow-y-auto">
                  {INTEREST_CATEGORIES.map((category) => (
                    <div key={category.id} className="flex items-start">
                      <Checkbox
                        id={`modal-${category.id}`}
                        checked={interests.includes(category.id)}
                        onCheckedChange={() => toggleInterest(category.id)}
                        disabled={isLoading || status === 'success'}
                        className="mt-0.5"
                        onFocus={() => formAnalytics.trackFieldInteraction(category.id, 'focus')}
                      />
                      <div className="ml-3">
                        <Label
                          htmlFor={`modal-${category.id}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {category.name}
                        </Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {category.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              {status === 'success' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-green-50 dark:bg-blue-900/20 border border-green-200 dark:border-blue-800 p-4 flex items-center gap-3"
                >
                  <div className="p-1 bg-green-100 dark:bg-blue-900/40">
                    <Check className="h-4 w-4 text-green-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-blue-200">
                      Success! Check your email
                    </p>
                    <p className="text-xs text-green-600 dark:text-blue-300">
                      Please confirm your subscription to complete the process.
                    </p>
                  </div>
                </motion.div>
              )}

              {status === 'error' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-red-50 dark:bg-blue-900/20 border border-red-200 dark:border-blue-800 p-4 flex items-start gap-3"
                >
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-blue-200">
                      Subscription failed
                    </p>
                    <p className="text-xs text-red-600 dark:text-blue-300">
                      {errorMessage || 'Something went wrong. Please try again.'}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1"
              >
                Maybe Later
              </Button>
              <Button
                type="submit"
                disabled={isLoading || status === 'success'}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Subscribing...
                  </>
                ) : status === 'success' ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Subscribed!
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Subscribe
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-center text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
              By subscribing, you agree to our{' '}
              <a href="/legal/privacy-policy"
                className="underline hover:text-gray-700 dark:hover:text-gray-300"
                
                rel="noopener noreferrer"
              >
                Privacy Policy
              </a>
              . You can unsubscribe at any time.
            </p>
          </form>
        </DialogContent>
      </Dialog>
  );
}

// Hook for easier modal state management
export function useNewsletterModal() {
  const [isOpen, setIsOpen] = useState(false);
  
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  };
}

// Preset modal variants for common use cases
export function CtaNewsletterModal(props: Omit<NewsletterModalProps, 'source'>) {
  return (
    <NewsletterModal
      {...props}
      source="cta"
      title="Join 10,000+ Healthcare Professionals"
      description="Get exclusive insights on healthcare technology trends, product innovations, and industry best practices delivered weekly."
    />
  );
}

export function ExitIntentModal(props: Omit<NewsletterModalProps, 'source'>) {
  return (
    <NewsletterModal
      {...props}
      source="exit_intent"
      title="Don't Miss Out on Healthcare Insights"
      description="Before you go, subscribe to our newsletter for the latest healthcare technology updates and exclusive content."
      showInterests={false}
    />
  );
}

export function BlogNewsletterModal(props: Omit<NewsletterModalProps, 'source'>) {
  return (
    <NewsletterModal
      {...props}
      source="blog"
      title="More Healthcare Insights"
      description="Enjoyed this article? Get more valuable healthcare technology insights and research updates delivered to your inbox."
    />
  );
}