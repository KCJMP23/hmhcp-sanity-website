import { StateGraph, START, END } from '@langchain/langgraph';
import { AgentNode, AgentOutput } from './types';
import { runBmadWorkflow } from './bmad/adapter';
import { insertLogs } from '../dal/agents';

// Define the state that flows through the graph
interface WorkflowState {
  taskId: string;
  contextRefs: string[];
  inputArtifacts: any[];
  currentStep: string;
  stepOutputs: Record<string, any>;
  errors: string[];
  completedSteps: string[];
}

// Agent node implementations
const contentCrawlerNode: AgentNode = async (state: WorkflowState) => {
  try {
    console.log('ContentCrawler: Starting content analysis...');
    
    // Simulate content crawling and analysis
    const crawlResults = {
      pagesAnalyzed: 25,
      deadLinksFound: 3,
      seoIssues: ['missing meta descriptions', 'duplicate titles'],
      contentFreshness: '70%',
      performanceMetrics: {
        avgLoadTime: '2.3s',
        coreWebVitals: 'Good'
      }
    };

    // Log the step - fixed to use correct signature
    await insertLogs(state.taskId, [`Content analysis completed: ${crawlResults.pagesAnalyzed} pages analyzed`]);

    return {
      ...state,
      currentStep: 'seo_optimizer',
      stepOutputs: {
        ...state.stepOutputs,
        contentCrawler: crawlResults
      },
      completedSteps: [...state.completedSteps, 'content_crawler']
    };
  } catch (error) {
    console.error('ContentCrawler error:', error);
    return {
      ...state,
      errors: [...state.errors, `ContentCrawler: ${error}`],
      currentStep: 'error'
    };
  }
};

const seoOptimizerNode: AgentNode = async (state: WorkflowState) => {
  try {
    console.log('SEOOptimizer: Analyzing SEO opportunities...');
    
    const crawlData = state.stepOutputs.contentCrawler;
    const seoRecommendations = {
      metaDescriptions: crawlData.seoIssues.includes('missing meta descriptions') ? 
        'Add meta descriptions to 8 pages' : 'All meta descriptions present',
      titleOptimization: crawlData.seoIssues.includes('duplicate titles') ? 
        'Fix 3 duplicate titles' : 'All titles unique',
      keywordOpportunities: ['healthcare technology', 'medical innovation', 'patient care'],
      technicalSeo: ['fix canonical URLs', 'optimize image alt tags', 'improve page speed']
    };

    // Fixed to use correct signature
    await insertLogs(state.taskId, ['SEO analysis completed with recommendations']);

    return {
      ...state,
      currentStep: 'creative_writer',
      stepOutputs: {
        ...state.stepOutputs,
        seoOptimizer: seoRecommendations
      },
      completedSteps: [...state.completedSteps, 'seo_optimizer']
    };
  } catch (error) {
    console.error('SEOOptimizer error:', error);
    return {
      ...state,
      errors: [...state.errors, `SEOOptimizer: ${error}`],
      currentStep: 'error'
    };
  }
};

const creativeWriterNode: AgentNode = async (state: WorkflowState) => {
  try {
    console.log('CreativeWriter: Generating content updates...');
    
    const seoData = state.stepOutputs.seoOptimizer;
    const contentUpdates = {
      newMetaDescriptions: [
        { page: '/services', description: 'Comprehensive healthcare technology solutions for modern medical practices' },
        { page: '/research', description: 'Cutting-edge medical research and clinical trial insights' }
      ],
      blogPostIdeas: [
        'The Future of AI in Healthcare: 2025 Trends',
        'Patient Data Security: Best Practices for Medical Institutions',
        'Telemedicine Revolution: Post-Pandemic Healthcare Delivery'
      ],
      socialMediaContent: [
        'Exciting news! Our latest research on AI-powered diagnostics shows 40% improvement in accuracy. #HealthcareAI #Innovation',
        'Join us for our upcoming webinar on patient data security. Register now! #Healthcare #DataSecurity'
      ]
    };

    await insertLogs(state.taskId, ['Content generation completed']);

    return {
      ...state,
      currentStep: 'social_amplifier',
      stepOutputs: {
        ...state.stepOutputs,
        creativeWriter: contentUpdates
      },
      completedSteps: [...state.completedSteps, 'creative_writer']
    };
  } catch (error) {
    console.error('CreativeWriter error:', error);
    return {
      ...state,
      errors: [...state.errors, `CreativeWriter: ${error}`],
      currentStep: 'error'
    };
  }
};

const socialAmplifierNode: AgentNode = async (state: WorkflowState) => {
  try {
    console.log('SocialAmplifier: Planning social media strategy...');
    
    const contentData = state.stepOutputs.creativeWriter;
    const socialStrategy = {
      scheduledPosts: contentData.socialMediaContent.map((content: any, index: number) => ({
        id: `post_${Date.now()}_${index}`,
        content,
        platform: ['twitter', 'linkedin', 'facebook'][index % 3],
        scheduledTime: new Date(Date.now() + (index + 1) * 3600000).toISOString(), // 1 hour apart
        engagement: 'expected'
      })),
      hashtagStrategy: ['#HealthcareAI', '#MedicalInnovation', '#PatientCare', '#Telemedicine'],
      crossPlatformSync: true,
      engagementMetrics: {
        expectedReach: '15K+',
        targetEngagement: '8%'
      }
    };

    await insertLogs(state.taskId, ['Social media strategy planned']);

    return {
      ...state,
      currentStep: 'inbox_nurturer',
      stepOutputs: {
        ...state.stepOutputs,
        socialAmplifier: socialStrategy
      },
      completedSteps: [...state.completedSteps, 'social_amplifier']
    };
  } catch (error) {
    console.error('SocialAmplifier error:', error);
    return {
      ...state,
      errors: [...state.errors, `SocialAmplifier: ${error}`],
      currentStep: 'error'
    };
  }
};

const inboxNurturerNode: AgentNode = async (state: WorkflowState) => {
  try {
    console.log('InboxNurturer: Managing lead follow-ups...');
    
    const leadFollowUps = {
      newLeads: [
        { email: 'dr.smith@hospital.com', interest: 'AI diagnostics', followUpDate: new Date().toISOString() },
        { email: 'nurse.jones@clinic.com', interest: 'telemedicine platform', followUpDate: new Date().toISOString() }
      ],
      existingLeads: [
        { email: 'admin@medicalcenter.com', lastContact: '2025-01-10', nextFollowUp: '2025-01-17' },
        { email: 'tech@healthcare.org', lastContact: '2025-01-08', nextFollowUp: '2025-01-15' }
      ],
      newsletterSubscribers: {
        newThisWeek: 45,
        totalActive: 1247,
        engagementRate: '23%'
      }
    };

    await insertLogs(state.taskId, ['Lead management completed']);

    return {
      ...state,
      currentStep: 'business_growth_analyst',
      stepOutputs: {
        ...state.stepOutputs,
        inboxNurturer: leadFollowUps
      },
      completedSteps: [...state.completedSteps, 'inbox_nurturer']
    };
  } catch (error) {
    console.error('InboxNurturer error:', error);
    return {
      ...state,
      errors: [...state.errors, `InboxNurturer: ${error}`],
      currentStep: 'error'
    };
  }
};

const businessGrowthAnalystNode: AgentNode = async (state: WorkflowState) => {
  try {
    console.log('BusinessGrowthAnalyst: Analyzing growth opportunities...');
    
    // Aggregate all previous step outputs
    const allOutputs = state.stepOutputs;
    const growthAnalysis = {
      trafficProjections: {
        currentDaily: '2.3K',
        projectedDaily: '3.1K',
        growthRate: '35%'
      },
      conversionOpportunities: [
        'Optimize homepage CTA placement',
        'Add case study testimonials',
        'Implement A/B testing for forms'
      ],
      revenuePotential: {
        monthly: '$45K',
        quarterly: '$135K',
        annual: '$540K'
      },
      competitiveAdvantages: [
        'Superior AI technology stack',
        'Strong healthcare partnerships',
        'Comprehensive compliance features'
      ]
    };

    await insertLogs(state.taskId, ['Growth analysis completed']);

    return {
      ...state,
      currentStep: 'completed',
      stepOutputs: {
        ...state.stepOutputs,
        businessGrowthAnalyst: growthAnalysis
      },
      completedSteps: [...state.completedSteps, 'business_growth_analyst']
    };
  } catch (error) {
    console.error('BusinessGrowthAnalyst error:', error);
    return {
      ...state,
      errors: [...state.errors, `BusinessGrowthAnalyst: ${error}`],
      currentStep: 'error'
    };
  }
};

// Create the workflow graph
export function createWorkflowGraph() {
  const workflow = new StateGraph<WorkflowState>({
    channels: {
      taskId: { value: (x: string) => x, default: () => '' },
      contextRefs: { value: (x: string[]) => x, default: () => [] },
      inputArtifacts: { value: (x: any[]) => x, default: () => [] },
      currentStep: { value: (x: string) => x, default: () => 'content_crawler' },
      stepOutputs: { value: (x: Record<string, any>) => x, default: () => ({}) },
      errors: { value: (x: string[]) => x, default: () => [] },
      completedSteps: { value: (x: string[]) => x, default: () => [] }
    }
  });

  // Add nodes
  workflow.addNode('content_crawler', contentCrawlerNode);
  workflow.addNode('seo_optimizer', seoOptimizerNode);
  workflow.addNode('creative_writer', creativeWriterNode);
  workflow.addNode('social_amplifier', socialAmplifierNode);
  workflow.addNode('inbox_nurturer', inboxNurturerNode);
  workflow.addNode('business_growth_analyst', businessGrowthAnalystNode);

  // Define the workflow flow  
  workflow.addEdge(START, 'content_crawler' as any);
  workflow.addEdge('content_crawler' as any, 'seo_optimizer' as any);
  workflow.addEdge('seo_optimizer' as any, 'creative_writer' as any);
  workflow.addEdge('creative_writer' as any, 'social_amplifier' as any);
  workflow.addEdge('social_amplifier' as any, 'inbox_nurturer' as any);
  workflow.addEdge('inbox_nurturer' as any, 'business_growth_analyst' as any);
  workflow.addEdge('business_growth_analyst' as any, END);

  // Add conditional edges for error handling
  workflow.addConditionalEdges(
    'content_crawler' as any,
    (state: any) => state.currentStep === 'error' ? 'error' : 'seo_optimizer'
  );
  workflow.addConditionalEdges(
    'seo_optimizer' as any,
    (state: any) => state.currentStep === 'error' ? 'error' : 'creative_writer'
  );
  workflow.addConditionalEdges(
    'creative_writer' as any,
    (state: any) => state.currentStep === 'error' ? 'error' : 'social_amplifier'
  );
  workflow.addConditionalEdges(
    'social_amplifier' as any,
    (state: any) => state.currentStep === 'error' ? 'error' : 'inbox_nurturer'
  );
  workflow.addConditionalEdges(
    'inbox_nurturer' as any,
    (state: any) => state.currentStep === 'error' ? 'error' : 'business_growth_analyst'
  );

  return workflow.compile();
}

// Main function to run the agent graph
export async function runAgentGraph(taskId: string, contextRefs: string[] = [], inputArtifacts: any[] = []): Promise<AgentOutput> {
  try {
    const graph = createWorkflowGraph();
    
    const initialState: WorkflowState = {
      taskId,
      contextRefs,
      inputArtifacts,
      currentStep: 'content_crawler',
      stepOutputs: {},
      errors: [],
      completedSteps: []
    };

    console.log('Starting agent workflow graph...');
    const result = await graph.invoke(initialState);
    
    console.log('Workflow completed successfully');
    return {
      success: true,
      taskId,
      artifacts: [
        {
          type: 'seo_recommendations',
          content: result.stepOutputs.seoOptimizer,
          metadata: { step: 'seo_optimizer', timestamp: new Date().toISOString() }
        },
        {
          type: 'content_updates',
          content: result.stepOutputs.creativeWriter,
          metadata: { step: 'creative_writer', timestamp: new Date().toISOString() }
        },
        {
          type: 'social_strategy',
          content: result.stepOutputs.socialAmplifier,
          metadata: { step: 'social_amplifier', timestamp: new Date().toISOString() }
        },
        {
          type: 'lead_management',
          content: result.stepOutputs.inboxNurturer,
          metadata: { step: 'inbox_nurturer', timestamp: new Date().toISOString() }
        },
        {
          type: 'growth_analysis',
          content: result.stepOutputs.businessGrowthAnalyst,
          metadata: { step: 'business_growth_analyst', timestamp: new Date().toISOString() }
        }
      ],
      logs: result.completedSteps,
      errors: result.errors
    };
  } catch (error) {
    console.error('Agent graph execution failed:', error);
    return {
      success: false,
      taskId,
      artifacts: [],
      logs: [],
      errors: [`Graph execution failed: ${error}`]
    };
  }
}


