/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SeverityType = 'High' | 'Medium' | 'Low';

export interface PainPoint {
  id: string;
  text: string;
  severity: SeverityType;
  impact?: string; // 影响面/后果
}

export type RoleType = 'User' | 'Employee' | 'Manager' | 'External';

export interface Role {
  id: string;
  name: string;
  type: RoleType;
  valueProposition: string; // 岗位/角色价值
  responsibilities: string[]; // 主要职责
  painPoints: PainPoint[]; // 岗位/角色痛点
}

export interface ProcessStage {
  id: string;
  stepName: string;
  activeRoleIds: string[]; // 参与角色
  description: string;
  painPointText: string; // 环节痛点
  valueContribution: string; // 环节价值贡献
}

export interface BusinessProcess {
  id: string;
  name: string;
  description: string;
  stages: ProcessStage[];
  processValue: string; // 流程核心价值
  effectivenessScore: number; // 效率/顺畅度得分 (0-100)
}

export type QuestionCategory = 'Process' | 'PainPoint' | 'Value' | 'General';

export interface Question {
  id: string;
  text: string;
  rationale: string; // 提问动机/设计意图
  category: QuestionCategory;
}

export interface Questionnaire {
  id: string;
  title: string;
  targetRoleId: string; // 目标角色
  questions: Question[];
  createdAt: string;
}

export type GroundingClassification = 
  | 'Industry Trend' 
  | 'Competitor Analysis' 
  | 'User Complaint' 
  | 'Regulatory Policy' 
  | 'Best Practice';

export interface GroundingChunk {
  id: string;
  title: string;
  uri: string;
  snippet: string;
  classification: GroundingClassification;
  relevanceExplanation?: string;
}

export interface SearchGroundingItem {
  id: string;
  query: string;
  executedAt: string;
  records: GroundingChunk[];
}

export interface ProductFunction {
  id: string;
  name: string;
  description: string;
  priority: 'P0' | 'P1' | 'P2';
  targetRoleId: string;
  mapsToPainPointId?: string; // 映射解决的痛点
}

export interface SynthesizedCoreFlow {
  id: string;
  flowName: string;
  description: string;
  keySteps: string[];
}

export interface ProductValuePoint {
  id: string;
  aspect: string; // 效益维度 (如：提升效率、降低成本、合规安全)
  description: string;
  benefitMetrics: string; // 量化指标/评估标准
}

export interface AISynthesis {
  functions: ProductFunction[];
  coreFlows: SynthesizedCoreFlow[];
  valuePoints: ProductValuePoint[];
  lastSynthesizedAt?: string;
}

export interface ResearchTemplate {
  id: string;
  templateName: string;
  type: 'Interview' | 'Questionnaire' | 'Observation';
  description: string;
  markdownContent: string;
}

export interface AnalysisReport {
  id: string;
  markdownContent: string;
  lastGeneratedAt: string;
}

export interface ResearchProject {
  id: string;
  name: string;
  targetIndustry: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  roles: Role[];
  processes: BusinessProcess[];
  questionnaires: Questionnaire[];
  groundingSearches: SearchGroundingItem[];
  synthesis?: AISynthesis;
  templates: ResearchTemplate[];
  report?: AnalysisReport;
}
