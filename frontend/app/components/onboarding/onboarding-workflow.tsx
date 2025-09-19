'use client';

import React, { useState, useEffect } from 'react';
import { useCoreIntegration } from '@/hooks/use-core-integration';
import { LiquidGlassButton } from '@/components/ui/liquid-glass-button';
import { FrostedCard, FrostedCardContent } from '@/components/ui/frosted-card';
import { Typography } from '@/components/ui/apple-typography';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, ArrowRight, ArrowLeft, Home, Settings, BookOpen, Users } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ComponentType<{ onComplete: () => void; onBack: () => void }>;
  required: boolean;
}

const OnboardingWorkflow: React.FC = () => {
  const { userManagement, localization, featureFlags } = useCoreIntegration();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Define onboarding steps
  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to HMHCP',
      description: 'Let\'s get you set up with your new healthcare management platform',
      icon: <Home className="h-6 w-6" />,
      component: WelcomeStep,
      required: true
    },
    {
      id: 'language',
      title: 'Language Preference',
      description: 'Choose your preferred language for the platform',
      icon: <BookOpen className="h-6 w-6" />,
      component: LanguageStep,
      required: true
    },
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Set up your user profile and preferences',
      icon: <Users className="h-6 w-6" />,
      component: ProfileStep,
      required: true
    },
    {
      id: 'features',
      title: 'Feature Introduction',
      description: 'Learn about the key features available to you',
      icon: <Settings className="h-6 w-6" />,
      component: FeaturesStep,
      required: false
    }
  ];

  const currentStep = onboardingSteps[currentStepIndex];
  const progress = (completedSteps.length / onboardingSteps.filter(s => s.required).length) * 100;

  const handleStepComplete = async () => {
    if (!completedSteps.includes(currentStep.id)) {
      setCompletedSteps(prev => [...prev, currentStep.id]);
      
      // Log user activity
      await userManagement.logActivity('onboarding', 'step_completed', {
        step_id: currentStep.id,
        step_title: currentStep.title
      });
    }

    if (currentStepIndex < onboardingSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      // Complete onboarding
      await completeOnboarding();
    }
  };

  const handleStepBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    try {
      // Mark onboarding as complete in the database
      // This would typically be done through an API call
      
      await userManagement.logActivity('onboarding', 'completed', {
        total_steps: onboardingSteps.length,
        completed_steps: completedSteps
      });

      // Redirect to dashboard or show completion message
      console.log('Onboarding completed successfully!');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const skipStep = () => {
    if (currentStepIndex < onboardingSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Completing setup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Typography variant="display" className="mb-2">
            Welcome to HMHCP
          </Typography>
          <Typography variant="body" className="text-gray-600">
            Healthcare Management & Health Care Platform
          </Typography>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Setup Progress</span>
            <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-4">
            {onboardingSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  completedSteps.includes(step.id)
                    ? 'border-green-500 bg-green-500 text-white'
                    : index === currentStepIndex
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-gray-300 bg-white text-gray-400'
                }`}>
                  {completedSteps.includes(step.id) ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                {index < onboardingSteps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    completedSteps.includes(step.id) ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Step */}
        <FrostedCard className="shadow-lg" hoverEffect={true}>
          <div className="text-center p-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-blue-100/80 backdrop-blur-sm rounded-full text-blue-600">
                {currentStep.icon}
              </div>
            </div>
            <Typography variant="heading1" className="mb-3">{currentStep.title}</Typography>
            <Typography variant="body" className="text-gray-600 mb-6">{currentStep.description}</Typography>
            <currentStep.component
              onComplete={handleStepComplete}
              onBack={handleStepBack}
            />
          </div>
        </FrostedCard>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <LiquidGlassButton
            variant="secondary-light"
            onClick={handleStepBack}
            disabled={currentStepIndex === 0}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </LiquidGlassButton>

          <div className="flex space-x-2">
            {!currentStep.required && (
              <LiquidGlassButton variant="secondary-light" onClick={skipStep}>
                Skip
              </LiquidGlassButton>
            )}
            <LiquidGlassButton
              variant="primary"
              onClick={handleStepComplete}
              className="flex items-center space-x-2"
            >
              {currentStepIndex === onboardingSteps.length - 1 ? 'Complete' : 'Next'}
              <ArrowRight className="h-4 w-4" />
            </LiquidGlassButton>
          </div>
        </div>
      </div>
    </div>
  );
};

// Step Components
const WelcomeStep: React.FC<{ onComplete: () => void; onBack: () => void }> = ({ onComplete }) => {
  return (
    <div className="text-center space-y-8">
      <div className="space-y-4">
        <Typography variant="heading2" className="text-gray-800">Getting Started</Typography>
        <Typography variant="body" className="max-w-2xl mx-auto">
          HMHCP is a comprehensive healthcare management platform designed to streamline your operations, 
          enhance patient care, and improve efficiency. This quick setup will help you get the most out of the platform.
        </Typography>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="text-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20">
          <div className="w-16 h-16 bg-blue-100/80 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <Typography variant="heading4" className="text-gray-800 mb-2">User Management</Typography>
          <Typography variant="small" className="text-gray-600">Role-based access control</Typography>
        </div>
        
        <div className="text-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20">
          <div className="w-16 h-16 bg-green-100/80 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-green-600" />
          </div>
          <Typography variant="heading4" className="text-gray-800 mb-2">Multi-language</Typography>
          <Typography variant="small" className="text-gray-600">Global accessibility</Typography>
        </div>
        
        <div className="text-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20">
          <div className="w-16 h-16 bg-purple-100/80 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="h-8 w-8 text-purple-600" />
          </div>
          <Typography variant="heading4" className="text-gray-800 mb-2">AI Features</Typography>
          <Typography variant="small" className="text-gray-600">Smart content generation</Typography>
        </div>
      </div>

      <LiquidGlassButton variant="primary" onClick={onComplete} size="lg" className="mt-8">
        Get Started
      </LiquidGlassButton>
    </div>
  );
};

const LanguageStep: React.FC<{ onComplete: () => void; onBack: () => void }> = ({ onComplete }) => {
  const { localization } = useCoreIntegration();
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const handleLanguageSelect = async (languageCode: string) => {
    setSelectedLanguage(languageCode);
    await localization.changeLanguage(languageCode);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <Typography variant="heading2" className="text-gray-800 mb-3">Choose Your Language</Typography>
        <Typography variant="body" className="text-gray-600">Select the language you'd like to use for the platform</Typography>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {localization.languages.map((language) => (
          <button
            key={language.code}
            onClick={() => handleLanguageSelect(language.code)}
            className={`p-6 rounded-2xl border-2 transition-all backdrop-blur-sm ${
              selectedLanguage === language.code
                ? 'border-blue-500 bg-blue-50/80 shadow-lg'
                : 'border-gray-200/50 bg-white/30 hover:border-gray-300 hover:bg-white/50'
            }`}
          >
            <div className="text-center">
              <Typography variant="heading4" className="text-gray-800 mb-2">
                {language.native_name}
              </Typography>
              <Typography variant="small" className="text-gray-600">{language.name}</Typography>
              {language.is_default && (
                <Badge variant="secondary" className="mt-3">Default</Badge>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="text-center">
        <LiquidGlassButton variant="primary" onClick={onComplete} disabled={!selectedLanguage}>
          Continue
        </LiquidGlassButton>
      </div>
    </div>
  );
};

const ProfileStep: React.FC<{ onComplete: () => void; onBack: () => void }> = ({ onComplete }) => {
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    organization: '',
    role: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = profileData.firstName && profileData.lastName && profileData.organization;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <Typography variant="heading2" className="text-gray-800 mb-3">Complete Your Profile</Typography>
        <Typography variant="body" className="text-gray-600">Tell us a bit about yourself to personalize your experience</Typography>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Typography variant="label" className="block mb-3 text-gray-700">First Name</Typography>
          <input
            type="text"
            value={profileData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all"
            placeholder="Enter your first name"
          />
        </div>
        
        <div>
          <Typography variant="label" className="block mb-3 text-gray-700">Last Name</Typography>
          <input
            type="text"
            value={profileData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all"
            placeholder="Enter your last name"
          />
        </div>
        
        <div className="md:col-span-2">
          <Typography variant="label" className="block mb-3 text-gray-700">Organization</Typography>
          <input
            type="text"
            value={profileData.organization}
            onChange={(e) => handleInputChange('organization', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all"
            placeholder="Enter your organization name"
          />
        </div>
        
        <div className="md:col-span-2">
          <Typography variant="label" className="block mb-3 text-gray-700">Role</Typography>
          <select
            value={profileData.role}
            onChange={(e) => handleInputChange('role', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all"
          >
            <option value="">Select your role</option>
            <option value="admin">Administrator</option>
            <option value="manager">Manager</option>
            <option value="user">User</option>
          </select>
        </div>
      </div>

      <div className="text-center">
        <LiquidGlassButton variant="primary" onClick={onComplete} disabled={!isFormValid}>
          Continue
        </LiquidGlassButton>
      </div>
    </div>
  );
};

const FeaturesStep: React.FC<{ onComplete: () => void; onBack: () => void }> = ({ onComplete }) => {
  const { featureFlags } = useCoreIntegration();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <Typography variant="heading2" className="text-gray-800 mb-3">Available Features</Typography>
        <Typography variant="body" className="text-gray-600">Discover what you can do with HMHCP</Typography>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 border border-gray-200/50 rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-blue-100/80 backdrop-blur-sm rounded-full flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <Typography variant="heading4" className="text-gray-800">AI Content Generation</Typography>
          </div>
          <Typography variant="small" className="text-gray-600 mb-4">
            Create professional healthcare content using AI-powered templates
          </Typography>
          <Badge variant={featureFlags.isEnabled('ai_content_generation') ? 'default' : 'secondary'}>
            {featureFlags.isEnabled('ai_content_generation') ? 'Available' : 'Coming Soon'}
          </Badge>
        </div>

        <div className="p-6 border border-gray-200/50 rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-green-100/80 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <Typography variant="heading4" className="text-gray-800">Multi-language Support</Typography>
          </div>
          <Typography variant="small" className="text-gray-600 mb-4">
            Access the platform in your preferred language
          </Typography>
          <Badge variant={featureFlags.isEnabled('multi_language_support') ? 'default' : 'secondary'}>
            {featureFlags.isEnabled('multi_language_support') ? 'Available' : 'Coming Soon'}
          </Badge>
        </div>

        <div className="p-6 border border-gray-200/50 rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-purple-100/80 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Settings className="h-6 w-6 text-purple-600" />
            </div>
            <Typography variant="heading4" className="text-gray-800">Advanced Analytics</Typography>
          </div>
          <Typography variant="small" className="text-gray-600 mb-4">
            Track performance and gain insights with detailed analytics
          </Typography>
          <Badge variant={featureFlags.isEnabled('advanced_analytics') ? 'default' : 'secondary'}>
            {featureFlags.isEnabled('advanced_analytics') ? 'Available' : 'Coming Soon'}
          </Badge>
        </div>

        <div className="p-6 border border-gray-200/50 rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-orange-100/80 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Circle className="h-6 w-6 text-orange-600" />
            </div>
            <Typography variant="heading4" className="text-gray-800">Real-time Notifications</Typography>
          </div>
          <Typography variant="small" className="text-gray-600 mb-4">
            Stay updated with instant notifications and alerts
          </Typography>
          <Badge variant={featureFlags.isEnabled('real_time_notifications') ? 'default' : 'secondary'}>
            {featureFlags.isEnabled('real_time_notifications') ? 'Available' : 'Coming Soon'}
          </Badge>
        </div>
      </div>

      <div className="text-center">
        <LiquidGlassButton variant="primary" onClick={onComplete}>
          Complete Setup
        </LiquidGlassButton>
      </div>
    </div>
  );
};

export default OnboardingWorkflow;
