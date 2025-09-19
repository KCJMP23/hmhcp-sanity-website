'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useFormAnalytics } from '@/hooks/useAnalytics';
import { useCSRFToken } from '@/lib/csrf-client';
import { cn } from '@/lib/utils';
import { loadReCaptcha, executeReCaptcha } from '@/lib/recaptcha';

export const INTEREST_CATEGORIES = [
  { id: 'product_updates', name: 'Product Updates', description: 'New features and improvements' },
  { id: 'industry_insights', name: 'Industry Insights', description: 'Healthcare trends and analysis' },
  { id: 'case_studies', name: 'Case Studies', description: 'Success stories and best practices' },
  { id: 'events', name: 'Events & Webinars', description: 'Upcoming events and educational content' },
  { id: 'research', name: 'Research & Innovation', description: 'Latest healthcare research' },
] as const;

interface SubscriptionFormProps {
  source: string;
  variant?: 'default' | 'inline' | 'compact';
  showInterests?: boolean;
  className?: string;
}

export function SubscriptionForm({ 
  source, 
  variant = 'default',
  showInterests = true,
  className 
}: SubscriptionFormProps) {
  const [email, setEmail] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Honeypot field
  const formAnalytics = useFormAnalytics('newsletter_subscription');
  const csrf = useCSRFToken();

  // Load reCAPTCHA on component mount
  useEffect(() => {
    loadReCaptcha();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check honeypot
    if (honeypot) {
      console.warn('Bot detected via honeypot');
      setStatus('success'); // Fake success for bots
      return;
    }
    
    setIsLoading(true);
    setStatus('idle');
    setErrorMessage('');

    // Start form tracking
    formAnalytics.startFormTracking(source);

    try {
      // Execute reCAPTCHA
      const recaptchaToken = await executeReCaptcha('newsletter_subscribe');
      
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: csrf.addToHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(csrf.addToBody({
          email,
          interests,
          source,
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
      setEmail('');
      setInterests([]);
      setHoneypot('');
      formAnalytics.trackSubmit(true);
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

  if (variant === 'inline') {
    return (
      <form onSubmit={handleSubmit} className={cn('flex gap-2', className)}>
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading || status === 'success'}
          onFocus={() => formAnalytics.trackFieldInteraction('email', 'focus')}
          onBlur={() => formAnalytics.trackFieldInteraction('email', 'blur')}
          className="flex-1"
        />
        {/* Honeypot field - hidden from users */}
        <Input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
          autoComplete="off"
        />
        <Button type="submit" disabled={isLoading || status === 'success'}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : status === 'success' ? (
            <Check className="h-4 w-4" />
          ) : (
            'Subscribe'
          )}
        </Button>
      </form>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-white dark:bg-gray-900  p-6 shadow-sm border border-gray-200 dark:border-gray-800',
        className
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Stay Updated
        </h3>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Get the latest healthcare insights and product updates delivered to your inbox.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading || status === 'success'}
            onFocus={() => formAnalytics.trackFieldInteraction('email', 'focus')}
            onBlur={() => formAnalytics.trackFieldInteraction('email', 'blur')}
            className="mt-1"
          />
        </div>

        {/* Honeypot field - hidden from users */}
        <div className="hidden" aria-hidden="true">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
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
            <Label className="mb-3 block">Interests (optional)</Label>
            <div className="space-y-3">
              {INTEREST_CATEGORIES.map((category) => (
                <div key={category.id} className="flex items-start">
                  <Checkbox
                    id={category.id}
                    checked={interests.includes(category.id)}
                    onCheckedChange={() => toggleInterest(category.id)}
                    disabled={isLoading || status === 'success'}
                    className="mt-0.5"
                    onFocus={() => formAnalytics.trackFieldInteraction(category.id, 'focus')}
                  />
                  <div className="ml-3">
                    <Label
                      htmlFor={category.id}
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
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 flex items-center gap-2"
            >
              <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <p className="text-sm text-blue-600 dark:text-blue-300">
                Please check your email to confirm your subscription.
              </p>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 dark:bg-blue-900/20 border border-red-200 dark:border-blue-800 p-3 flex items-start gap-2"
            >
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-blue-400 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-blue-300">
                {errorMessage || 'Something went wrong. Please try again.'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          type="submit"
          disabled={isLoading || status === 'success'}
          className="w-full"
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
              Subscribe to Newsletter
            </>
          )}
        </Button>

        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
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
    </motion.div>
  );
}