import { supabaseAdmin } from './supabase'

export type AgentJobStatus = 'queued' | 'running' | 'succeeded' | 'failed'

export interface CreateJobParams {
  goal: string
  notes?: string
  status?: AgentJobStatus
}

export async function createAgentJob(params: CreateJobParams) {
  const { data, error } = await supabaseAdmin
    .from('agent_jobs')
    .insert({
      goal: params.goal,
      notes: params.notes || null,
      status: params.status || 'running',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id as string
}

export async function completeAgentJob(jobId: string, status: AgentJobStatus, result: unknown) {
  const { error } = await supabaseAdmin
    .from('agent_jobs')
    .update({
      status,
      finished_at: new Date().toISOString(),
      result: result as any,
    })
    .eq('id', jobId)

  if (error) throw error
}

export async function upsertApproval(jobId: string, artifactRefId: string, title: string, policy: 'requires_approval' | 'auto' = 'requires_approval') {
  const { error } = await supabaseAdmin
    .from('agent_approvals')
    .insert({ job_id: jobId, artifact_ref_id: artifactRefId, title, policy })
  if (error) throw error
}

export async function listAgentJobs(limit = 20) {
  const { data, error } = await supabaseAdmin
    .from('agent_jobs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function listAgentApprovals(limit = 50) {
  const { data, error } = await supabaseAdmin
    .from('agent_approvals')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function listArtifactsByJob(jobId: string) {
  const { data, error } = await supabaseAdmin
    .from('agent_artifacts')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function getArtifact(jobId: string, refId: string) {
  const { data, error } = await supabaseAdmin
    .from('agent_artifacts')
    .select('*')
    .eq('job_id', jobId)
    .eq('ref_id', refId)
    .single()
  if (error) throw error
  return data
}

export interface ArtifactInput {
  ref_id: string
  label?: string
  type: 'text' | 'json' | 'image' | 'link'
  url?: string
  data?: unknown
}

export async function insertArtifacts(jobId: string, artifacts: ArtifactInput[]) {
  if (!artifacts?.length) return
  const rows = artifacts.map(a => ({
    job_id: jobId,
    ref_id: a.ref_id,
    label: a.label || null,
    type: a.type,
    url: a.url || null,
    data: (a.data ?? null) as any,
  }))
  const { error } = await supabaseAdmin.from('agent_artifacts').insert(rows)
  if (error) throw error
}

export async function insertLogs(jobId: string, messages: string[], level: 'info' | 'warn' | 'error' = 'info') {
  if (!messages?.length) return
  const rows = messages.map(m => ({ job_id: jobId, level, message: m }))
  const { error } = await supabaseAdmin.from('agent_logs').insert(rows)
  if (error) throw error
}

export async function approveAgent(approvalId: string, status: 'approved' | 'rejected') {
  const { error } = await supabaseAdmin
    .from('agent_approvals')
    .update({ status, decided_at: new Date().toISOString() })
    .eq('id', approvalId)
  if (error) throw error
}

export async function findTodayJobByGoal(goal: string) {
  const { data, error } = await supabaseAdmin
    .from('agent_jobs')
    .select('*')
    .gte('started_at', new Date(new Date().toDateString()).toISOString())
    .eq('goal', goal)
    .order('started_at', { ascending: false })
    .limit(1)
  if (error) throw error
  return data?.[0] || null
}

export async function countJobsToday() {
  const start = new Date(new Date().toDateString()).toISOString()
  const { count, error } = await supabaseAdmin
    .from('agent_jobs')
    .select('*', { count: 'exact', head: true })
    .gte('started_at', start)
  if (error) throw error
  return count || 0
}

/**
 * Update an existing artifact's data by job and ref. If no row was updated, insert a new one.
 */
export async function updateArtifactData(jobId: string, refId: string, data: unknown, label?: string, type: 'text' | 'json' | 'image' | 'link' = 'json') {
  // Try update first
  const { data: updated, error: updateErr } = await supabaseAdmin
    .from('agent_artifacts')
    .update({ data: data as any, label: label || null, type })
    .eq('job_id', jobId)
    .eq('ref_id', refId)
    .select('id')

  if (updateErr) throw updateErr

  if (!updated || updated.length === 0) {
    // Insert if not exists
    const { error: insertErr } = await supabaseAdmin
      .from('agent_artifacts')
      .insert({ job_id: jobId, ref_id: refId, label: label || null, type, data: data as any })
    if (insertErr) throw insertErr
  }
}

/**
 * Convenience: save segmented blog sections for a job.
 */
export async function saveBlogSections(jobId: string, sections: string[]) {
  await updateArtifactData(jobId, 'blog_post_sections', { sections }, 'Blog Sections', 'json')
}


