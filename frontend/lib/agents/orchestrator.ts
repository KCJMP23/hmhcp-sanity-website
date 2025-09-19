import { AgentOutput, AgentJob, AgentArtifact } from './types';
import { runBmadWorkflow } from './bmad/adapter';
import { runAgentGraph } from './graph';
import { createAgentJob, insertArtifacts, insertLogs, completeAgentJob } from '../dal/agents';
import { mcpTools } from './mcp/tools';

export class AgentOrchestrator {
  private static instance: AgentOrchestrator;

  private constructor() {}

  public static getInstance(): AgentOrchestrator {
    if (!AgentOrchestrator.instance) {
      AgentOrchestrator.instance = new AgentOrchestrator();
    }
    return AgentOrchestrator.instance;
  }

  /**
   * Execute the daily workflow using the real LangGraph implementation
   */
  public async executeDailyWorkflow(goal: string, notes?: string): Promise<AgentOutput> {
    const taskId = `daily_${Date.now()}`;
    let jobId = '';
    
    try {
      console.log(`Starting daily workflow execution: ${taskId}`);
      console.log(`Goal: ${goal}`);
      if (notes) console.log(`Notes: ${notes}`);

      // Create the job record first
      try {
        jobId = await createAgentJob({ goal, notes, status: 'running' });
        console.log(`Created job with ID: ${jobId}`);
      } catch (error) {
        console.error('Failed to create job:', error);
        // Continue without persistence
      }

      // Execute the LangGraph-based workflow
      console.log('Executing agent workflow graph...');
      const graphResult = await runAgentGraph(taskId, [], []);

      if (!graphResult.success) {
        throw new Error(`Graph execution failed: ${graphResult.errors.join(', ')}`);
      }

      // Log successful completion
      if (jobId) {
        try {
          await insertLogs(jobId, [`Daily workflow completed successfully with ${graphResult.artifacts.length} artifacts`]);
        } catch (error) {
          console.error('Failed to insert logs:', error);
        }
      }

      // Store the generated artifacts
      if (graphResult.artifacts.length > 0 && jobId) {
        try {
          const artifacts = graphResult.artifacts.map(artifact => ({
            ref_id: artifact.type,
            label: `${artifact.type} artifact`,
            type: 'json' as const,
            data: artifact.content
          }));
          await insertArtifacts(jobId, artifacts);
        } catch (error) {
          console.error('Failed to insert artifacts:', error);
        }
      }

      // Update job status to completed
      if (jobId) {
        try {
          await completeAgentJob(jobId, 'succeeded', graphResult);
        } catch (error) {
          console.error('Failed to update job status:', error);
        }
      }

      // Integrate with BMAD framework (placeholder for now)
      console.log('Integrating with BMAD framework...');
      const bmadResult = await runBmadWorkflow({
        taskId,
        goal,
        artifacts: graphResult.artifacts,
        context: 'daily_website_maintenance'
      });

      console.log('BMAD integration result:', bmadResult);

      return {
        success: true,
        taskId,
        artifacts: graphResult.artifacts,
        logs: graphResult.logs,
        errors: graphResult.errors,
        metadata: {
          bmadIntegration: bmadResult,
          totalSteps: graphResult.logs.length,
          totalArtifacts: graphResult.artifacts.length
        }
      };

    } catch (error) {
      console.error('Daily workflow execution failed:', error);
      
      // Update job status to failed if we have a jobId
      if (jobId) {
        try {
          await completeAgentJob(jobId, 'failed', { error: error instanceof Error ? error.message : String(error) });
        } catch (updateError) {
          console.error('Failed to update job status:', updateError);
        }
      }

      return {
        success: false,
        taskId,
        artifacts: [],
        logs: [],
        errors: [error instanceof Error ? error.message : String(error)],
        metadata: {
          failurePoint: 'orchestrator',
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Execute a specific workflow using MCP tools
   */
  public async executeWorkflowWithMCP(workflowType: string, parameters: any): Promise<AgentOutput> {
    const taskId = `mcp_${workflowType}_${Date.now()}`;
    
    try {
      console.log(`Executing MCP workflow: ${workflowType}`);
      
      let result: AgentArtifact[] = [];
      
      switch (workflowType) {
        case 'content_audit':
          // Use MCP tools to audit content
          const sitemap = await mcpTools.generateSitemap();
          const deadLinks = await mcpTools.checkDeadLinks([
            'https://example.com',
            'https://example.com/about',
            'https://example.com/services'
          ]);
          result = [sitemap, deadLinks];
          break;
          
        case 'seo_analysis':
          // Use MCP tools for SEO analysis
          const keywords = await mcpTools.serpKeywords('healthcare technology');
          const analytics = await mcpTools.getAnalyticsData(
            ['sessions', 'bounce_rate', 'conversion_rate'],
            { start: '2025-01-01', end: '2025-01-10' }
          );
          result = [keywords, analytics];
          break;
          
        case 'social_media':
          // Use MCP tools for social media management
          const socialAnalytics = await mcpTools.manageSocialMedia('analyze');
          const socialEngagement = await mcpTools.manageSocialMedia('engage');
          result = [socialAnalytics, socialEngagement];
          break;
          
        default:
          throw new Error(`Unknown workflow type: ${workflowType}`);
      }

      return {
        success: true,
        taskId,
        artifacts: result,
        logs: [`MCP workflow ${workflowType} executed`],
        errors: []
      };

    } catch (error) {
      console.error(`MCP workflow execution failed:`, error);
      
      return {
        success: false,
        taskId,
        artifacts: [],
        logs: [],
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * Test MCP tools individually
   */
  public async testMCPTools(): Promise<AgentOutput> {
    const taskId = `mcp_test_${Date.now()}`;
    
    try {
      console.log('Testing MCP tools...');
      
      const testResults: AgentArtifact[] = [];
      
      // Test each MCP tool
      const tools = [
        { name: 'cmsFetchPage', fn: () => mcpTools.cmsFetchPage('home') },
        { name: 'checkDeadLinks', fn: () => mcpTools.checkDeadLinks(['https://example.com']) },
        { name: 'serpKeywords', fn: () => mcpTools.serpKeywords('healthcare') },
        { name: 'generateSitemap', fn: () => mcpTools.generateSitemap() },
        { name: 'manageSocialMedia', fn: () => mcpTools.manageSocialMedia('analyze') },
        { name: 'getAnalyticsData', fn: () => mcpTools.getAnalyticsData(['sessions'], { start: '2025-01-01', end: '2025-01-10' }) },
        { name: 'optimizeContent', fn: () => mcpTools.optimizeContent('Sample content for testing', 'page') }
      ];

      for (const tool of tools) {
        try {
          const result = await tool.fn();
          testResults.push({
            type: 'mcp_tool_test',
            content: { tool: tool.name, status: 'success', result },
            metadata: { tool: tool.name, timestamp: new Date().toISOString() }
          });
        } catch (error) {
          testResults.push({
            type: 'mcp_tool_test',
            content: { tool: tool.name, status: 'error', error: error instanceof Error ? error.message : String(error) },
            metadata: { tool: tool.name, timestamp: new Date().toISOString() }
          });
        }
      }

      return {
        success: true,
        taskId,
        artifacts: testResults,
        logs: [`MCP tools testing completed with ${testResults.length} results`],
        errors: []
      };

    } catch (error) {
      console.error('MCP tools testing failed:', error);
      
      return {
        success: false,
        taskId,
        artifacts: [],
        logs: [],
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }
}

// Export singleton instance
export const orchestrator = AgentOrchestrator.getInstance();


