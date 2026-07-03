/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, FormEvent } from "react";
import { 
  LayoutDashboard, 
  Users, 
  GitFork, 
  Search, 
  Layers, 
  FileText, 
  Plus, 
  Trash2, 
  Brain, 
  Download, 
  Printer, 
  TrendingUp, 
  Compass, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  Loader2, 
  Map, 
  Target, 
  ArrowRight,
  Info,
  History,
  Cpu,
  Copy,
  Calendar,
  X,
  Eye
} from "lucide-react";
import { 
  ResearchProject, 
  Role, 
  BusinessProcess, 
  ProcessStage, 
  PainPoint, 
  Questionnaire, 
  GroundingChunk, 
  SearchGroundingItem, 
  ProductFunction, 
  SynthesizedCoreFlow, 
  ProductValuePoint, 
  GroundingClassification,
  SeverityType,
  RoleType,
  QuestionCategory,
  AISynthesis
} from "./types";
import { PRESET_PROJECT_DEMO, PRESET_AUTO_SERVICE, PRESETS } from "./data/presets";

export default function App() {
  // Projects List
  const [projects, setProjects] = useState<ResearchProject[]>(() => {
    const saved = localStorage.getItem("research_projects");
    return saved ? JSON.parse(saved) : PRESETS;
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(projects[0]?.id || "preset-medical");
  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];

  // Selected Brain Model (defaults to DeepSeek v4 Pro)
  const [selectedModel, setSelectedModel] = useState<string>("DeepSeek v4 Pro");

  // State to view details of any historical project in a modal
  const [historyProjectDetail, setHistoryProjectDetail] = useState<ResearchProject | null>(null);

  // Sidebar navigation states
  const [activeTab, setActiveTab] = useState<"dashboard" | "roles" | "processes" | "grounding" | "synthesis" | "reports">("dashboard");

  // Local state for editing or creating projects
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectIndustry, setNewProjectIndustry] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  // States for AI operations
  const [isAIInitializing, setIsAIInitializing] = useState(false);
  const [isAIGeneratingQuestions, setIsAIGeneratingQuestions] = useState(false);
  const [isAIGroundingSearching, setIsAIGroundingSearching] = useState(false);
  const [isAISynthesizing, setIsAISynthesizing] = useState(false);
  const [isAIGeneratingReport, setIsAIGeneratingReport] = useState(false);

  // Search Grounding query string
  const [groundingQuery, setGroundingQuery] = useState("");

  // Edit / Input modals
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleForm, setRoleForm] = useState<{
    id?: string;
    name: string;
    type: RoleType;
    valueProposition: string;
    responsibilities: string;
    painPointText: string;
    painPointSeverity: SeverityType;
    painPointImpact: string;
  }>({
    name: "",
    type: "User",
    valueProposition: "",
    responsibilities: "",
    painPointText: "",
    painPointSeverity: "Medium",
    painPointImpact: ""
  });

  // Process Modal state
  const [isProcModalOpen, setIsProcModalOpen] = useState(false);
  const [procForm, setProcForm] = useState<{
    id?: string;
    name: string;
    description: string;
    processValue: string;
    effectivenessScore: number;
    stages: ProcessStage[];
  }>({
    name: "",
    description: "",
    processValue: "",
    effectivenessScore: 60,
    stages: []
  });

  // Stage editor state (helper inside process modal)
  const [stageInput, setStageInput] = useState<{
    stepName: string;
    activeRoleIds: string[];
    description: string;
    painPointText: string;
    valueContribution: string;
  }>({
    stepName: "",
    activeRoleIds: [],
    description: "",
    painPointText: "",
    valueContribution: ""
  });

  // Custom alert / notification message
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);

  // Save changes back to localStorage
  useEffect(() => {
    localStorage.setItem("research_projects", JSON.stringify(projects));
  }, [projects]);

  const showNotification = (msg: string, type: "success" | "error" | "info" = "success") => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 5000);
  };

  // Create a blank project
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName || !newProjectIndustry) {
      showNotification("请填写项目名称和目标行业", "error");
      return;
    }
    const newProj: ResearchProject = {
      id: "proj-" + Date.now(),
      name: newProjectName,
      targetIndustry: newProjectIndustry,
      description: newProjectDesc || "暂无项目描述，通过在仪表盘中配置AI或手动编辑构建...",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      roles: [],
      processes: [],
      questionnaires: [],
      groundingSearches: [],
      templates: []
    };
    setProjects([newProj, ...projects]);
    setActiveProjectId(newProj.id);
    setIsCreatingProject(false);
    // Reset forms
    setNewProjectName("");
    setNewProjectIndustry("");
    setNewProjectDesc("");
    showNotification("创建新项目成功！可以在仪表盘发起 AI 智能化生成。");
  };

  // Delete project
  const handleDeleteProject = (id: string, name: string) => {
    if (window.confirm(`确定要删除调研项目 "${name}" 吗？此操作不可逆。`)) {
      const remaining = projects.filter(p => p.id !== id);
      if (remaining.length === 0) {
        setProjects(PRESETS);
        setActiveProjectId(PRESETS[0].id);
      } else {
        setProjects(remaining);
        setActiveProjectId(remaining[0].id);
      }
      showNotification("项目已成功删除", "info");
    }
  };

  // Restart current project with Medical preset data
  const handleResetToPresetDemo = () => {
    if (window.confirm("确定要重置并载入「智慧医疗门诊」经典预设案例吗？")) {
      const clonedPreset = JSON.parse(JSON.stringify(PRESET_PROJECT_DEMO));
      clonedPreset.id = "preset-" + Date.now();
      clonedPreset.name = clonedPreset.name + " (克隆复刻)";
      setProjects([clonedPreset, ...projects.filter(p => p.id !== activeProjectId)]);
      setActiveProjectId(clonedPreset.id);
      showNotification("预设智慧医疗诊疗链案例载入完成！");
    }
  };

  // Restart current project with Auto Service preset data
  const handleResetToPresetAuto = () => {
    if (window.confirm("确定要重置并载入「新能源汽车售后维保」智能预设案例吗？")) {
      const clonedPreset = JSON.parse(JSON.stringify(PRESET_AUTO_SERVICE));
      clonedPreset.id = "preset-auto-" + Date.now();
      clonedPreset.name = clonedPreset.name + " (克隆复刻)";
      setProjects([clonedPreset, ...projects.filter(p => p.id !== activeProjectId)]);
      setActiveProjectId(clonedPreset.id);
      showNotification("预设新能源汽车售后智能案例载入完成！");
    }
  };

  // Update specific fields of the active project
  const updateActiveProject = (updater: (proj: ResearchProject) => ResearchProject) => {
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...updater(p),
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    }));
  };

  // AI API Integration: 1. Generate starting Roles & Processes
  const handleAIGenerateElements = async () => {
    if (!activeProject.targetIndustry || !activeProject.description) {
      showNotification("请先配置当前项目的调研行业与背景描述，以为 AI 提供精确定向脑暴范围。", "error");
      return;
    }
    setIsAIInitializing(true);
    try {
      const response = await fetch("/api/research/generate-starting-elements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetIndustry: activeProject.targetIndustry,
          description: activeProject.description,
          model: selectedModel
        })
      });
      if (!response.ok) {
        throw new Error(await response.text() || "AI 接口请求失败");
      }
      const data = await response.json();
      
      // Map AI returned data format into internal models
      const generatedRoles: Role[] = (data.roles || []).map((r: any, idx: number) => ({
        id: `ai-role-${idx}-${Date.now()}`,
        name: r.name,
        type: r.type || "User",
        valueProposition: r.valueProposition,
        responsibilities: r.responsibilities || [],
        painPoints: (r.painPoints || []).map((p: any, pIdx: number) => ({
          id: `ai-rp-${idx}-${pIdx}-${Date.now()}`,
          text: p.text,
          severity: p.severity || "Medium",
          impact: p.impact || ""
        }))
      }));

      const generatedProcesses: BusinessProcess[] = (data.processes || []).map((p: any, idx: number) => {
        const processId = `ai-proc-${idx}-${Date.now()}`;
        return {
          id: processId,
          name: p.name,
          description: p.description,
          processValue: p.processValue || "",
          effectivenessScore: p.effectivenessScore || 60,
          stages: (p.stages || []).map((st: any, sIdx: number) => {
            // Find matched active role IDs
            const mappedRoleIds = generatedRoles
              .filter(gr => (st.activeRoleNames || []).some((arn: string) => arn.includes(gr.name) || gr.name.includes(arn)))
              .map(gr => gr.id);
            // Fallback to first role if none matched
            if (mappedRoleIds.length === 0 && generatedRoles.length > 0) {
              mappedRoleIds.push(generatedRoles[0].id);
            }
            return {
              id: `ai-stage-${idx}-${sIdx}-${Date.now()}`,
              stepName: st.stepName,
              activeRoleIds: mappedRoleIds,
              description: st.description,
              painPointText: st.painPointText,
              valueContribution: st.valueContribution
            };
          })
        };
      });

      updateActiveProject(proj => ({
        ...proj,
        roles: generatedRoles,
        processes: generatedProcesses
      }));

      showNotification(`AI 成功识别！已提取 ${generatedRoles.length} 个核心岗位与 ${generatedProcesses.length} 个核心价值流程链！`);
      setActiveTab("roles"); // Jump to visualizer
    } catch (err: any) {
      console.error(err);
      showNotification(`生成失败: ${err.message}`, "error");
    } finally {
      setIsAIInitializing(false);
    }
  };

  // AI API Integration: 2. Generate optimized Questionnaires tailored to active project's roles/processes
  const handleAIGenerateQuestions = async () => {
    if (activeProject.roles.length === 0) {
      showNotification("请先在项目中创建或 AI 生成角色岗位矩阵，以便针对性定题调研。", "error");
      return;
    }
    setIsAIGeneratingQuestions(true);
    try {
      const response = await fetch("/api/research/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetIndustry: activeProject.targetIndustry,
          description: activeProject.description,
          roles: activeProject.roles,
          processes: activeProject.processes,
          model: selectedModel
        })
      });
      if (!response.ok) throw new Error("AI 问题清单生成失败");
      const data = await response.json();

      const aiQuestionnaires: Questionnaire[] = (data.questionnaires || []).map((q: any, idx: number) => {
        // Find corresponding role ID
        const matchedRole = activeProject.roles.find(r => r.name.toLowerCase().includes(q.targetRoleName?.toLowerCase()) || q.targetRoleName?.toLowerCase().includes(r.name.toLowerCase()));
        return {
          id: `ai-q-${idx}-${Date.now()}`,
          title: q.title,
          targetRoleId: matchedRole ? matchedRole.id : (activeProject.roles[0]?.id || "unknown"),
          createdAt: new Date().toISOString(),
          questions: (q.questions || []).map((ques: any, qIdx: number) => ({
            id: `ai-ques-${idx}-${qIdx}-${Date.now()}`,
            text: ques.text,
            rationale: ques.rationale,
            category: (ques.category as QuestionCategory) || "General"
          }))
        };
      });

      updateActiveProject(proj => ({
        ...proj,
        questionnaires: aiQuestionnaires
      }));

      showNotification(`成功生成定制化问题清单！已为不同角色输出 ${aiQuestionnaires.length} 套专业深度访谈提纲。`);
    } catch (err: any) {
      console.error(err);
      showNotification(`提纲生成失败: ${err.message}`, "error");
    } finally {
      setIsAIGeneratingQuestions(false);
    }
  };

  // AI API Integration: 3. Directed online information search classification
  const handleAIGroundingSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!groundingQuery.trim()) {
      showNotification("请键入检索/调研关键字", "error");
      return;
    }
    setIsAIGroundingSearching(true);
    try {
      const response = await fetch("/api/research/grounding-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: groundingQuery,
          targetIndustry: activeProject.targetIndustry,
          description: activeProject.description,
          model: selectedModel
        })
      });
      if (!response.ok) throw new Error("双智网检索失败");
      const data = await response.json();

      const newRecordsList: GroundingChunk[] = (data.records || []).map((r: any, idx: number) => ({
        id: `ai-gr-${idx}-${Date.now()}`,
        title: r.title,
        uri: r.uri || "https://google.com/search?q=" + encodeURIComponent(groundingQuery),
        snippet: r.snippet,
        classification: r.classification || "User Complaint",
        relevanceExplanation: r.relevanceExplanation
      }));

      if (newRecordsList.length === 0) {
        showNotification("未搜索到强匹配的高干货资讯，可更换词再次定向拉取。", "info");
        return;
      }

      const searchItem: SearchGroundingItem = {
        id: `search-${Date.now()}`,
        query: groundingQuery,
        executedAt: new Date().toISOString(),
        records: newRecordsList
      };

      updateActiveProject(proj => ({
        ...proj,
        groundingSearches: [searchItem, ...proj.groundingSearches]
      }));

      setGroundingQuery("");
      showNotification(`定向自动查收归类成功！提取并深度分类 ${newRecordsList.length} 条高价值网络事实。`);
    } catch (err: any) {
      console.error(err);
      showNotification(`情报检索失败: ${err.message}`, "error");
    } finally {
      setIsAIGroundingSearching(false);
    }
  };

  // Delete search item
  const handleDeleteGroundingQuery = (searchId: string) => {
    updateActiveProject(proj => ({
      ...proj,
      groundingSearches: proj.groundingSearches.filter(s => s.id !== searchId)
    }));
    showNotification("已移除该历史检索批次");
  };

  // AI API Integration: 4. Synthesize blueprint product functions (Maps to Pain Points), Core Flows, Value metrics
  const handleAISynthesizeBlueprint = async () => {
    setIsAISynthesizing(true);
    try {
      // Gather all grounding chunks in this project so far
      const allChunks = activeProject.groundingSearches.flatMap(gs => gs.records);
      
      const response = await fetch("/api/research/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetIndustry: activeProject.targetIndustry,
          description: activeProject.description,
          roles: activeProject.roles,
          processes: activeProject.processes,
          groundingChunks: allChunks,
          model: selectedModel
        })
      });

      if (!response.ok) throw new Error("产品蓝图推导合成失败");
      const data = await response.json();

      const synthesizedFunctions: ProductFunction[] = (data.functions || []).map((f: any, idx: number) => {
        // Map back targetRoleId
        const targetR = activeProject.roles.find(r => r.name.includes(f.targetRoleName) || f.targetRoleName?.includes(r.name));
        // Map back pain point ID
        const allPainPoints = activeProject.roles.flatMap(r => r.painPoints);
        const targetPP = allPainPoints.find(p => p.text.includes(f.mapsToPainPointText) || f.mapsToPainPointText?.includes(p.text));
        return {
          id: `ai-func-${idx}-${Date.now()}`,
          name: f.name,
          description: f.description,
          priority: (f.priority as 'P0' | 'P1' | 'P2') || 'P1',
          targetRoleId: targetR ? targetR.id : (activeProject.roles[0]?.id || "unknown"),
          mapsToPainPointId: targetPP ? targetPP.id : undefined
        };
      });

      const synthesizedFlows: SynthesizedCoreFlow[] = (data.coreFlows || []).map((cf: any, idx: number) => ({
        id: `ai-cf-${idx}-${Date.now()}`,
        flowName: cf.flowName,
        description: cf.description,
        keySteps: cf.keySteps || []
      }));

      const synthesizedValues: ProductValuePoint[] = (data.valuePoints || []).map((vp: any, idx: number) => ({
        id: `ai-vp-${idx}-${Date.now()}`,
        aspect: vp.aspect,
        description: vp.description,
        benefitMetrics: vp.benefitMetrics
      }));

      const synthesisData: AISynthesis = {
        functions: synthesizedFunctions,
        coreFlows: synthesizedFlows,
        valuePoints: synthesizedValues,
        lastSynthesizedAt: new Date().toISOString()
      };

      updateActiveProject(proj => ({
        ...proj,
        synthesis: synthesisData
      }));

      showNotification(`AI 产品化合成就绪！推导出 ${synthesizedFunctions.length} 个解御痛点之重磅功能与新闭环。`);
    } catch (err: any) {
      console.error(err);
      showNotification(`产品合成失败: ${err.message}`, "error");
    } finally {
      setIsAISynthesizing(false);
    }
  };

  // AI API Integration: 5. Generate McKinsey standard analysis report & templates
  const handleAIGenerateReportAndTemplates = async () => {
    setIsAIGeneratingReport(true);
    try {
      const allChunks = activeProject.groundingSearches.flatMap(gs => gs.records);
      const response = await fetch("/api/research/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetIndustry: activeProject.targetIndustry,
          description: activeProject.description,
          roles: activeProject.roles,
          processes: activeProject.processes,
          groundingChunks: allChunks,
          synthesis: activeProject.synthesis,
          model: selectedModel
        })
      });

      if (!response.ok) throw new Error("报告生产失败");
      const data = await response.json();

      // Split or parse standard observation guidelines templates
      const reportContent = data.markdownContent || "";
      
      // Auto-extract templates if they exist in markdown, or add a default high-grade template
      const templateList = activeProject.templates.length > 0 ? activeProject.templates : [
        {
          id: `t-auto-${Date.now()}`,
          templateName: `${activeProject.name} - 一线实操访谈与观察指南`,
          type: "Interview" as const,
          description: "为实地入户/入场调研人员提供流程顺畅度、岗位卡点的客观证据采集表。",
          markdownContent: `## 📋 ${activeProject.targetIndustry} 数字化调研指南

### 【调研前置准备】
1. **携带设备**：笔、录音笔（需征得被访者同意）、秒表（测定人效卡点时间）。
2. **话术开场**：您好，我是本项目组业务分析师。今天进行无干扰观察和简短对话，旨在提升咱们数字化系统效率，降低您的机械操作负荷。所有数据将脱敏处理。

---

### 【第一阶段：岗位日常职责验证（主观）】
* 对照角色名簿进行印证：
1. 询问岗位价值：您认为您一天中最有价值的输出是什么？
2. 痛点打分：在整套跟进流程中，是否有由于系统陈旧、信息滞后、不配合跑腿造成的瓶颈？给繁复度打个分（1-10分）。

---

### 【第二阶段：端到端步骤秒表测量（客观）】
* 重点盯着我们的主干流程控制节点进行时间切片测量：
* **测量指标 A-1**: 单步骤操作耗时（从发起、呼叫、系统刷卡录入直至出数据）。
* **观察记录 B-2**: 系统界面是否存在多窗口切来切去、报错回弹、数据不可视？
* **衡量成本 C-3**: 参与角色在中途发生的物理跨科室/跨层级位移距离（米）及等待耗时。

---

### 【第三阶段：产品功能愿景匹配】
向被调研者提供功能蓝图说明（或画册原型），验证其是否能切实解渴，提炼建议修改反馈。`
        }
      ];

      updateActiveProject(proj => ({
        ...proj,
        report: {
          id: `rep-${Date.now()}`,
          markdownContent: reportContent,
          lastGeneratedAt: new Date().toISOString()
        },
        templates: templateList
      }));

      showNotification("智库级市场剖析报告及执行模版已落槌生成！支持立即导出及精美排版。");
      setActiveTab("reports");
    } catch (err: any) {
      console.error(err);
      showNotification(`报告生成失败: ${err.message}`, "error");
    } finally {
      setIsAIGeneratingReport(false);
    }
  };


  // Manual addition/edition of Roles & Pain points
  const handleOpenRoleModal = (role?: Role) => {
    if (role) {
      setRoleForm({
        id: role.id,
        name: role.name,
        type: role.type,
        valueProposition: role.valueProposition,
        responsibilities: role.responsibilities.join("\n"),
        painPointText: role.painPoints[0]?.text || "",
        painPointSeverity: role.painPoints[0]?.severity || "Medium",
        painPointImpact: role.painPoints[0]?.impact || ""
      });
    } else {
      setRoleForm({
        name: "",
        type: "User",
        valueProposition: "",
        responsibilities: "",
        painPointText: "",
        painPointSeverity: "Medium",
        painPointImpact: ""
      });
    }
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.name) {
      showNotification("角色/岗位名称为必填项", "error");
      return;
    }

    const resps = roleForm.responsibilities
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const painPoints: PainPoint[] = roleForm.painPointText ? [
      {
        id: `p-${Date.now()}`,
        text: roleForm.painPointText,
        severity: roleForm.painPointSeverity,
        impact: roleForm.painPointImpact
      }
    ] : [];

    if (roleForm.id) {
      // Edit mode
      updateActiveProject(proj => ({
        ...proj,
        roles: proj.roles.map(r => r.id === roleForm.id ? {
          ...r,
          name: roleForm.name,
          type: roleForm.type,
          valueProposition: roleForm.valueProposition,
          responsibilities: resps,
          painPoints: painPoints.length > 0 ? painPoints : r.painPoints
        } : r)
      }));
      showNotification("角色已成功更新");
    } else {
      // Add mode
      const newRole: Role = {
        id: `role-${Date.now()}`,
        name: roleForm.name,
        type: roleForm.type,
        valueProposition: roleForm.valueProposition,
        responsibilities: resps,
        painPoints
      };
      updateActiveProject(proj => ({
        ...proj,
        roles: [...proj.roles, newRole]
      }));
      showNotification("角色已成功创建");
    }
    setIsRoleModalOpen(false);
  };

  const handleDeleteRole = (roleId: string) => {
    if (window.confirm("确定要删除和解绑该角色岗位吗？由于它可能参与了流程，请稍后检查流程图。")) {
      updateActiveProject(proj => ({
        ...proj,
        roles: proj.roles.filter(r => r.id !== roleId)
      }));
      showNotification("角色已被清除", "info");
    }
  };

  // Manual addition/edition of Processes & Steps
  const handleOpenProcModal = (proc?: BusinessProcess) => {
    if (proc) {
      setProcForm({
        id: proc.id,
        name: proc.name,
        description: proc.description,
        processValue: proc.processValue,
        effectivenessScore: proc.effectivenessScore,
        stages: proc.stages
      });
    } else {
      setProcForm({
        name: "",
        description: "",
        processValue: "",
        effectivenessScore: 65,
        stages: []
      });
    }
    // Reset stage inputs inside
    setStageInput({
      stepName: "",
      activeRoleIds: [],
      description: "",
      painPointText: "",
      valueContribution: ""
    });
    setIsProcModalOpen(true);
  };

  const handleAddStageToForm = () => {
    if (!stageInput.stepName) {
      showNotification("请至少填写控制步骤/环节的名称", "error");
      return;
    }
    const newStage: ProcessStage = {
      id: `st-m-${Date.now()}`,
      stepName: stageInput.stepName,
      activeRoleIds: stageInput.activeRoleIds,
      description: stageInput.description,
      painPointText: stageInput.painPointText,
      valueContribution: stageInput.valueContribution
    };
    setProcForm(prev => ({
      ...prev,
      stages: [...prev.stages, newStage]
    }));
    // Reset stage fields
    setStageInput({
      stepName: "",
      activeRoleIds: [],
      description: "",
      painPointText: "",
      valueContribution: ""
    });
    showNotification("核心步骤已追加到草稿列表中");
  };

  const handleRemoveStageFromForm = (idx: number) => {
    setProcForm(prev => ({
      ...prev,
      stages: prev.stages.filter((_, i) => i !== idx)
    }));
  };

  const handleSaveProcess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!procForm.name) {
      showNotification("流程名称为必填项", "error");
      return;
    }

    if (procForm.id) {
      // Edit mode
      updateActiveProject(proj => ({
        ...proj,
        processes: proj.processes.map(p => p.id === procForm.id ? {
          ...p,
          name: procForm.name,
          description: procForm.description,
          processValue: procForm.processValue,
          effectivenessScore: procForm.effectivenessScore,
          stages: procForm.stages
        } : p)
      }));
      showNotification("业务价值链流程已更新");
    } else {
      // Create mode
      const newProc: BusinessProcess = {
        id: `proc-${Date.now()}`,
        name: procForm.name,
        description: procForm.description,
        processValue: procForm.processValue,
        effectivenessScore: procForm.effectivenessScore,
        stages: procForm.stages
      };
      updateActiveProject(proj => ({
        ...proj,
        processes: [...proj.processes, newProc]
      }));
      showNotification("新价值链流程已就绪");
    }
    setIsProcModalOpen(false);
  };

  const handleDeleteProcess = (procId: string) => {
    if (window.confirm("确定要切断并彻底删除此核心流程吗？")) {
      updateActiveProject(proj => ({
        ...proj,
        processes: proj.processes.filter(p => p.id !== procId)
      }));
      showNotification("流程已被清退", "info");
    }
  };


  // Quick custom simple markdown formatter to HTML since it renders perfectly in vanilla react:
  const renderMarkdown = (md: string) => {
    if (!md) return <p className="text-slate-400 italic">暂无报告内容，请点击AI一键分析生成报告。</p>;
    const lines = md.split("\n");
    let inTable = false;
    let tableRows: string[][] = [];

    return lines.map((line, idx) => {
      const trimmed = line.trim();

      // Heading 1
      if (trimmed.startsWith("# ")) {
        return <h1 key={idx} className="text-2xl font-extrabold text-slate-900 border-b border-slate-200 pb-2 mt-8 mb-4 tracking-tight">{trimmed.slice(2)}</h1>;
      }
      // Heading 2
      if (trimmed.startsWith("## ")) {
        return <h2 key={idx} className="text-xl font-bold text-slate-800 pb-1 mt-6 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-blue-500 rounded-full inline-block"></span>
          {trimmed.slice(3)}
        </h2>;
      }
      // Heading 3
      if (trimmed.startsWith("### ")) {
        return <h3 key={idx} className="text-md font-bold text-slate-700 mt-4 mb-2">{trimmed.slice(4)}</h3>;
      }
      // Blockquote
      if (trimmed.startsWith("> ")) {
        return <blockquote key={idx} className="border-l-4 border-slate-300 bg-slate-50 italic text-slate-600 p-4 rounded-r-md my-4 font-normal">{trimmed.slice(2)}</blockquote>;
      }
      // Horizontal Rule
      if (trimmed === "---") {
        return <hr key={idx} className="border-slate-200 my-6" />;
      }
      // List item
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const itemText = trimmed.slice(2);
        // Match bold in list item
        const boldMatch = itemText.match(/\*\*(.*?)\*\*/g);
        if (boldMatch) {
          let withBold = itemText;
          boldMatch.forEach(matched => {
            const clean = matched.replace(/\*\*/g, "");
            withBold = withBold.replace(matched, `<strong>${clean}</strong>`);
          });
          return <li key={idx} className="list-disc ml-6 py-1 text-slate-600 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: withBold }} />;
        }
        return <li key={idx} className="list-disc ml-6 py-1 text-slate-600 text-sm leading-relaxed">{itemText}</li>;
      }
      // Bold inline replacement for normal paragraph
      if (trimmed) {
        // Table row builder helper
        if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
          const cells = trimmed.split("|").map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
          if (trimmed.includes("---")) {
            return null; // Divider row skip
          }
          return (
            <div key={idx} className="overflow-x-auto my-2">
              <table className="min-w-full divide-y divide-slate-100 border border-slate-100">
                <tbody className="bg-slate-50">
                  <tr className="divide-x divide-slate-100">
                    {cells.map((cell, cidx) => (
                      <td key={cidx} className="px-4 py-2 text-xs font-medium text-slate-600">{cell}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          );
        }

        let formattedLine = trimmed;
        // Search and substitute bold markdown elements
        const boldMatches = trimmed.match(/\*\*(.*?)\*\*/g);
        if (boldMatches) {
          boldMatches.forEach(bm => {
            const clean = bm.replace(/\*\*/g, "");
            formattedLine = formattedLine.replace(bm, `<strong class="font-semibold text-slate-900">${clean}</strong>`);
          });
          return <p key={idx} className="text-slate-600 text-sm leading-relaxed mb-3" dangerouslySetInnerHTML={{ __html: formattedLine }} />;
        }
        return <p key={idx} className="text-slate-600 text-sm leading-relaxed mb-3">{trimmed}</p>;
      }

      return <div key={idx} className="h-2"></div>;
    });
  };

  // Export functions
  const handleExportMarkdown = () => {
    if (!activeProject.report) {
      showNotification("请先用 AI 分析并生成最终报告再进行导出。", "error");
      return;
    }
    const reportText = activeProject.report.markdownContent;
    const blob = new Blob([reportText], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${activeProject.name}_调研价值分析报告.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("已生成 Markdown 格式报告并自动下载！");
  };

  // Triggering native styled browser printing for elegant PDF saving
  const handlePrintPDF = () => {
    window.print();
  };


  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-800 overflow-hidden">
      
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="no-print w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        
        {/* Sidebar Product Title */}
        <div className="p-5 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold font-display shadow-md shadow-blue-500/20">V</div>
          <div className="flex flex-col">
            <span className="font-bold text-white tracking-tight text-sm font-display">ValueLens AI</span>
            <span className="text-[10px] text-slate-500 tracking-wider uppercase font-semibold">调研与价值链分析</span>
          </div>
        </div>

        {/* Project Selector inside Sidebar */}
        <div className="px-4 py-3 bg-slate-950/40 border-b border-slate-800/60">
          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">当前工作区</label>
          <select 
            className="w-full bg-slate-800 hover:bg-slate-700/80 text-white rounded px-2 py-1.5 text-xs outline-none border border-slate-700/50 cursor-pointer transition-colors"
            value={activeProjectId}
            onChange={(e) => {
              setActiveProjectId(e.target.value);
              // reset screen to dashboard when switching project to prevent mismatch
              setActiveTab("dashboard");
            }}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name.length > 20 ? p.name.slice(0, 18) + "..." : p.name}
              </option>
            ))}
          </select>
          <div className="mt-2 flex items-center justify-between">
            <button 
              onClick={() => setIsCreatingProject(true)}
              className="text-[11px] font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> 新建调研项目
            </button>
            <button 
              onClick={handleResetToPresetDemo}
              className="text-[11px] font-medium text-slate-400 hover:text-slate-300 flex items-center gap-1 cursor-pointer"
              title="重新克隆一份智慧医疗门诊典型研究案例"
            >
              加载医疗案例
            </button>
          </div>
        </div>

        {/* Sidebar Main Navigation Tabs */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          
          <div className="text-[10px] font-bold uppercase text-slate-500 px-3 py-2 tracking-wider">诊断梳理阶段</div>
          
          <button 
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium cursor-pointer transition-colors ${activeTab === "dashboard" ? "bg-slate-800 text-white shadow" : "hover:bg-slate-800/50 text-slate-400 hover:text-slate-200"}`}
          >
            <LayoutDashboard className="w-4 h-4 text-blue-500" />
            工作区概览
          </button>

          <button 
            onClick={() => setActiveTab("roles")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium cursor-pointer transition-colors ${activeTab === "roles" ? "bg-slate-800 text-white shadow" : "hover:bg-slate-800/50 text-slate-400 hover:text-slate-200"}`}
          >
            <Users className="w-4 h-4 text-emerald-500" />
            岗位角色与价值
            {activeProject.roles.length > 0 && (
              <span className="ml-auto bg-slate-800 text-emerald-400 text-[10px] px-1.5 py-0.2 rounded-full border border-slate-700 font-bold">{activeProject.roles.length}</span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab("processes")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium cursor-pointer transition-colors ${activeTab === "processes" ? "bg-slate-800 text-white shadow" : "hover:bg-slate-800/50 text-slate-400 hover:text-slate-200"}`}
          >
            <GitFork className="w-4 h-4 text-amber-500" />
            业务主价值流
            {activeProject.processes.length > 0 && (
              <span className="ml-auto bg-slate-800 text-amber-400 text-[10px] px-1.5 py-0.2 rounded-full border border-slate-700 font-bold">{activeProject.processes.length}</span>
            )}
          </button>

          <div className="pt-4 text-[10px] font-bold uppercase text-slate-500 px-3 py-2 tracking-wider">外链定向检索</div>

          <button 
            onClick={() => setActiveTab("grounding")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium cursor-pointer transition-colors ${activeTab === "grounding" ? "bg-slate-800 text-white shadow" : "hover:bg-slate-800/50 text-slate-400 hover:text-slate-200"}`}
          >
            <Search className="w-4 h-4 text-cyan-500" />
            网络搜集与痛点归类
            {activeProject.groundingSearches.length > 0 && (
              <span className="ml-auto bg-blue-950 text-blue-300 text-[10px] px-1.5 py-0.2 rounded-full border border-blue-900/40 font-bold">
                {activeProject.groundingSearches.flatMap(g => g.records).length}
              </span>
            )}
          </button>

          <div className="pt-4 text-[10px] font-bold uppercase text-slate-500 px-3 py-2 tracking-wider">输出规划</div>

          <button 
            onClick={() => setActiveTab("synthesis")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium cursor-pointer transition-colors ${activeTab === "synthesis" ? "bg-slate-800 text-white shadow" : "hover:bg-slate-800/50 text-slate-400 hover:text-slate-200"}`}
          >
            <Layers className="w-4 h-4 text-indigo-500" />
            功能重塑与产品化
            {activeProject.synthesis && (
              <span className="ml-auto bg-indigo-950 text-indigo-300 text-[10px] px-1.5 py-0.2 rounded-full border border-indigo-900/40 font-bold">✓</span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab("reports")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium cursor-pointer transition-colors ${activeTab === "reports" ? "bg-slate-800 text-white shadow" : "hover:bg-slate-800/50 text-slate-400 hover:text-slate-200"}`}
          >
            <FileText className="w-4 h-4 text-pink-500" />
            调研指南与分析报告
            {activeProject.report && (
              <span className="ml-auto bg-pink-950 text-pink-300 text-[10px] px-1.5 py-0.2 rounded-full border border-pink-900/40 font-bold">已产出</span>
            )}
          </button>

        </nav>

        {/* Crawler Status widget inside Sidebar bottom */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/20">
          <div className="bg-slate-800/40 rounded-lg p-3 text-xs border border-slate-800/40">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[11px] text-slate-400 font-medium">研判脑力引擎</span>
              <span className="text-emerald-400 flex items-center gap-1 font-bold text-[10px]">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                在线就绪
              </span>
            </div>
            
            <select
              value={selectedModel}
              onChange={(e) => {
                setSelectedModel(e.target.value);
                showNotification(`研判脑力引擎已切换至：${e.target.value}`, "info");
              }}
              className="w-full bg-slate-900/90 text-slate-200 border border-slate-700/60 rounded px-2 py-1 text-[11px] outline-none focus:border-indigo-500 cursor-pointer mb-2 font-medium"
            >
              <option value="DeepSeek v4 Pro">DeepSeek v4 Pro (默认)</option>
              <option value="DeepSeek R1 Advanced">DeepSeek R1 Advanced</option>
              <option value="Gemini 1.5 Pro">Gemini 1.5 Pro</option>
              <option value="GPT-4o Enterprise">GPT-4o Enterprise</option>
            </select>

            <div className="text-[10px] text-slate-500 h-7 leading-tight overflow-hidden text-ellipsis line-clamp-2">
              {selectedModel === "DeepSeek v4 Pro" && "✨ 高性能商业价值研判与高密商业逻辑推理引擎"}
              {selectedModel === "DeepSeek R1 Advanced" && "🧠 深度思考强化逻辑推理版，支持万级上下文"}
              {selectedModel === "Gemini 1.5 Pro" && "🚀 多模态长上下文混合智能体，深度挖掘多模卡点"}
              {selectedModel === "GPT-4o Enterprise" && "💼 企业级高可靠综合商业智囊，支持全面价值重塑"}
            </div>
            
            <div className="mt-2 w-full bg-slate-700 h-1 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-pink-500 h-full" style={{ width: "100%" }}></div>
            </div>
          </div>
        </div>

      </aside>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Header */}
        <header className="no-print h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-sm z-10">
          
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
              {activeProject.name}
            </h2>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded border border-blue-100 uppercase tracking-widest font-mono">
              Value Chain Active
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleAIGenerateReportAndTemplates}
              disabled={isAIGeneratingReport}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isAIGeneratingReport ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  研算分析报告中...
                </>
              ) : (
                <>
                  <Brain className="w-3.5 h-3.5 text-pink-500" />
                  智能生成报告
                </>
              )}
            </button>

            <button 
              onClick={handlePrintPDF}
              className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-500/10 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              打印导出 PDF
            </button>
          </div>

        </header>

        {/* Floating Notification */}
        {notification && (
          <div className="fixed top-20 right-8 z-50 animate-bounce">
            <div className={`shadow-lg rounded-lg p-3.5 flex items-center gap-2 border text-xs font-medium ${
              notification.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-100" :
              notification.type === "error" ? "bg-red-50 text-red-800 border-red-100" :
              "bg-blue-50 text-blue-800 border-blue-100"
            }`}>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>{notification.msg}</span>
            </div>
          </div>
        )}

        {/* Central Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          
          {/* TAB 1: DASHBOARD & PROJECT AI INITIALIZER */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 max-w-5xl mx-auto">
              
              {/* Introduction Card */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 pointer-events-none translate-x-12 -translate-y-12">
                  <Brain className="w-96 h-96 text-white" />
                </div>
                <div className="relative z-10 max-w-3xl">
                  <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">Business Analyst Copilot</span>
                  <h3 className="text-2xl font-black mt-1 mb-2 tracking-tight font-display">
                    市场痛点细分、角色价值网格与产品化推导工具
                  </h3>
                  <p className="text-slate-300 text-xs md:text-sm leading-relaxed font-light">
                    在这里，您只需定义一个行业或特定业务背景。系统可以为您定向智能化分析该市场中最典型也最痛苦的岗位角色、繁琐的传统端到端工作流、以及每一项子步骤的当前痛点和真实岗位价值。辅以定向网络搜索实锤证据与麦肯锡级深度报告产出。
                  </p>
                </div>
              </div>

              {/* Configure Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Configuration inputs */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Compass className="w-4 h-4 text-blue-500" />
                    第一步：配置当前调研行业与核心痛点背景
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">1. 目标调研市场/行业</label>
                      <input 
                        type="text"
                        className="w-full text-xs border border-slate-200 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                        placeholder="例如：高端新能源汽车售后服务、智慧医院门诊导药链..."
                        value={activeProject.targetIndustry}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateActiveProject(p => ({ ...p, targetIndustry: val }));
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">2. 核心场景或要改善的痛点描述</label>
                      <textarea
                        rows={4}
                        className="w-full text-xs border border-slate-200 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 leading-relaxed"
                        placeholder="描述面临的典型矛盾，例如现场排队拥挤、多方信息零散等具体弊病..."
                        value={activeProject.description}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateActiveProject(p => ({ ...p, description: val }));
                        }}
                      />
                    </div>

                    {/* AI trigger Button */}
                    <div className="pt-2 flex items-center gap-3">
                      <button 
                        onClick={handleAIGenerateElements}
                        disabled={isAIInitializing}
                        className="px-5 py-2 rounded-lg bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 tracking-wide flex items-center gap-2 shadow cursor-pointer transition-all disabled:opacity-50"
                      >
                        {isAIInitializing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                            AI 价值链研算分析中...
                          </>
                        ) : (
                          <>
                            <Brain className="w-4 h-4 text-blue-400" />
                            AI 深度一键识别角色与流程
                          </>
                        )}
                      </button>
                      <span className="text-[11px] text-slate-400">
                        依据以上输入，自动剖析角色责任图谱、流程价值。
                      </span>
                    </div>

                  </div>
                </div>

                {/* Dashboard Stats */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">
                      当前调研数据指标
                    </h3>
                    <div className="space-y-4">
                      
                      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-emerald-500" />
                          <div className="text-xs">
                            <p className="font-semibold text-slate-800">岗位角色</p>
                            <p className="text-[10px] text-slate-400">已识别岗位与价值</p>
                          </div>
                        </div>
                        <span className="text-lg font-black text-slate-950 font-mono">{activeProject.roles.length}</span>
                      </div>

                      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-2">
                          <GitFork className="w-4 h-4 text-amber-500" />
                          <div className="text-xs">
                            <p className="font-semibold text-slate-800">业务核心流程</p>
                            <p className="text-[10px] text-slate-400">端到端重要业务流</p>
                          </div>
                        </div>
                        <span className="text-lg font-black text-slate-950 font-mono">{activeProject.processes.length}</span>
                      </div>

                      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-2">
                          <Search className="w-4 h-4 text-cyan-500" />
                          <div className="text-xs">
                            <p className="font-semibold text-slate-800">外部调研事实</p>
                            <p className="text-[10px] text-slate-400">搜索分类佐证</p>
                          </div>
                        </div>
                        <span className="text-lg font-black text-slate-950 font-mono">
                          {activeProject.groundingSearches.flatMap(gs => gs.records).length}
                        </span>
                      </div>

                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100/80 space-y-2">
                    <p className="text-[10px] text-center text-slate-400 font-semibold uppercase tracking-wider">重置或加载预设案例</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={handleResetToPresetDemo} 
                        className="text-center text-[11px] bg-slate-50 hover:bg-blue-50 text-blue-600 font-bold py-1.5 px-1.5 rounded border border-blue-100 hover:border-blue-200 transition-all cursor-pointer"
                      >
                        🏥 智慧医疗案例
                      </button>
                      <button 
                        onClick={handleResetToPresetAuto} 
                        className="text-center text-[11px] bg-slate-50 hover:bg-emerald-50 text-emerald-600 font-bold py-1.5 px-1.5 rounded border border-emerald-100 hover:border-emerald-200 transition-all cursor-pointer"
                      >
                        🚗 新能源汽车案例
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Flow mapping and instructions cards */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-2 font-display">完成本项目的推荐步骤</h3>
                <p className="text-xs text-slate-500 mb-4">通过简单四步完成结构化的价值主张与新产品设计闭环交付：</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs">
                    <div className="w-6 h-6 bg-blue-100 text-blue-700 font-black flex items-center justify-center rounded-full mb-2">1</div>
                    <p className="font-semibold text-slate-800">项目初始化脑暴</p>
                    <p className="text-[11px] text-slate-400 mt-1">输入您的业务诉求，AI精准推演出角色痛点及业务步骤链路（左上角一键识别）。</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs">
                    <div className="w-6 h-6 bg-emerald-100 text-emerald-700 font-black flex items-center justify-center rounded-full mb-2">2</div>
                    <p className="font-semibold text-slate-800">角色访谈与网格</p>
                    <p className="text-[11px] text-slate-400 mt-1">查看岗位角色及定制提纲，到‘外部检索说真事’模块去拉取网上真实的痛点事件归类。</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs">
                    <div className="w-6 h-6 bg-amber-100 text-amber-700 font-black flex items-center justify-center rounded-full mb-2">3</div>
                    <p className="font-semibold text-slate-800">解药与产品蓝图</p>
                    <p className="text-[11px] text-slate-400 mt-1">进入‘功能重塑推导’，让 AI 依据刚才识别出的每一项岗位痛点，深度扣合研发功能项与P0优先级。</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs">
                    <div className="w-6 h-6 bg-pink-100 text-pink-700 font-black flex items-center justify-center rounded-full mb-2">4</div>
                    <p className="font-semibold text-slate-800">终审报告交付</p>
                    <p className="text-[11px] text-slate-400 mt-1">产出精细的麦肯锡模式报告与现场调研标准化执行表，优雅支持转出为Markdown和打印PDF。</p>
                  </div>
                </div>
              </div>

              {/* Historical Projects Panel */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-indigo-500" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 font-display">🗄️ 历史项目库与档案看板</h3>
                      <p className="text-xs text-slate-500 mt-0.5">支持查看、对比各历史项目的信息，直接调阅其特定岗位、主流程、痛点证据与产品蓝图，而无需频繁切换当前工作区。</p>
                    </div>
                  </div>
                  <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full border border-indigo-100 font-bold">
                    共 {projects.length} 个调研项目
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projects.map((p) => {
                    const isActive = p.id === activeProjectId;
                    const roleCount = p.roles.length;
                    const procCount = p.processes.length;
                    const searchCount = p.groundingSearches.flatMap(gs => gs.records).length;
                    const hasSynthesis = !!(p.synthesis && p.synthesis.functions.length > 0);
                    const hasReport = !!(p.report && p.report.markdownContent);

                    return (
                      <div 
                        key={p.id} 
                        className={`rounded-xl border p-5 flex flex-col justify-between transition-all ${
                          isActive 
                            ? "bg-slate-50/80 border-slate-300 ring-1 ring-slate-100" 
                            : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-[11px] font-semibold text-slate-400 font-mono tracking-wider">
                              {new Date(p.createdAt || Date.now()).toLocaleDateString("zh-CN", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit"
                              })} 创建
                            </span>
                            {isActive ? (
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-black rounded border border-blue-200">
                                当前激活
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-semibold rounded border border-slate-200">
                                历史存档
                              </span>
                            )}
                          </div>

                          <h4 className="font-bold text-slate-950 text-sm mb-1 line-clamp-1" title={p.name}>
                            {p.name}
                          </h4>
                          <p className="text-[11px] font-medium text-indigo-600 mb-2">{p.targetIndustry}</p>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                            {p.description || "暂无描述信息..."}
                          </p>

                          {/* Stat Grid inside card */}
                          <div className="grid grid-cols-3 gap-2 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 mb-4">
                            <div className="text-center">
                              <p className="text-[10px] text-slate-400 font-semibold uppercase">岗位角色</p>
                              <p className="text-xs font-black text-slate-800 font-mono mt-0.5">{roleCount}</p>
                            </div>
                            <div className="text-center border-x border-slate-200/60">
                              <p className="text-[10px] text-slate-400 font-semibold uppercase">业务流</p>
                              <p className="text-xs font-black text-slate-800 font-mono mt-0.5">{procCount}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] text-slate-400 font-semibold uppercase">网络证据</p>
                              <p className="text-xs font-black text-slate-800 font-mono mt-0.5">{searchCount}</p>
                            </div>
                          </div>

                          {/* Planning items status indicators */}
                          <div className="flex gap-4 mb-4 text-[10px] font-bold text-slate-500">
                            <div className="flex items-center gap-1">
                              {hasSynthesis ? (
                                <span className="text-emerald-600 flex items-center gap-0.5">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> 已推导功能
                                </span>
                              ) : (
                                <span className="text-slate-400">
                                  - 未推导功能
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {hasReport ? (
                                <span className="text-pink-600 flex items-center gap-0.5">
                                  <CheckCircle2 className="w-3 h-3 text-pink-500" /> 已产出报告
                                </span>
                              ) : (
                                <span className="text-slate-400">
                                  - 未生成报告
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button 
                            onClick={() => setHistoryProjectDetail(p)}
                            className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 py-1 px-2.5 rounded bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-100 transition-colors cursor-pointer"
                            title="免切换，直接查看该历史项目的所有信息"
                          >
                            <Eye className="w-3.5 h-3.5" /> 查看项目信息
                          </button>
                          
                          <div className="flex items-center gap-1">
                            {!isActive && (
                              <button 
                                onClick={() => {
                                  setActiveProjectId(p.id);
                                  showNotification(`已切换至工作区：${p.name}`, "success");
                                }}
                                className="flex items-center gap-1 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white py-1 px-2.5 rounded shadow-sm hover:shadow transition-colors cursor-pointer"
                              >
                                <ArrowRight className="w-3.5 h-3.5" /> 激活工作区
                              </button>
                            )}
                            
                            <button 
                              onClick={() => {
                                const clone = JSON.parse(JSON.stringify(p));
                                clone.id = "preset-" + Date.now();
                                clone.name = clone.name + " (克隆复制)";
                                clone.createdAt = new Date().toISOString();
                                setProjects([clone, ...projects]);
                                showNotification(`成功复制项目 "${p.name}"`);
                              }}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded border border-transparent hover:border-slate-200 transition-colors"
                              title="克隆复制此项目"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            <button 
                              onClick={() => handleDeleteProject(p.id, p.name)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-50 rounded border border-transparent hover:border-slate-200 transition-colors"
                              title="删除此项目"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: ROLE MATRIX */}
          {activeTab === "roles" && (
            <div className="space-y-6 max-w-5xl mx-auto">
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-display">市场参与者角色与岗位价值网格</h3>
                  <p className="text-xs text-slate-500 mt-0.5">识别业务场域内各岗位的核心职责、岗位存在价值以及当前深受困扰的前三大痛点。</p>
                </div>
                <button 
                  onClick={() => handleOpenRoleModal()}
                  className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> 手动追加岗位
                </button>
              </div>

              {activeProject.roles.length === 0 ? (
                <div className="bg-white border rounded-xl p-12 text-center text-slate-400">
                  <span className="text-3xl block mb-2">👥</span>
                  <p className="text-sm">当前项目暂未录入角色。您可以返回 “工作区概览” 一键让 AI 智能识别！</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeProject.roles.map(role => (
                    <div key={role.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between hover:border-slate-300 transition-all relative group">
                      <div>
                        {/* Header card info */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider mr-2 uppercase ${
                              role.type === "User" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                              role.type === "Employee" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                              role.type === "Manager" ? "bg-indigo-50 text-indigo-700 border border-indigo-100" :
                              "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}>
                              {role.type === "User" ? "终端用户" :
                               role.type === "Employee" ? "一线职工" :
                               role.type === "Manager" ? "关键管理" : "外部利益关联"}
                            </span>
                            <h4 className="font-extrabold text-slate-900 inline-block text-md tracking-tight align-middle">{role.name}</h4>
                          </div>
                          
                          {/* Edit / Delete actions on hover/focus */}
                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => handleOpenRoleModal(role)}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded transition-colors"
                              title="编辑岗位信息"
                            >
                              <Brain className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteRole(role.id)}
                              className="p-1 text-slate-300 hover:text-red-600 hover:bg-slate-50 rounded transition-colors"
                              title="删除此职位"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Value proposition 岗位核心价值 */}
                        <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100 mb-4 whitespace-pre-wrap">
                          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">岗位存在的主客观核心价值 Contribution</p>
                          <p className="text-xs text-slate-700 leading-relaxed font-medium italic">“ {role.valueProposition} ”</p>
                        </div>

                        {/* Responsibilities 核心日常职责 */}
                        <div className="mb-4">
                          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">关键职责/任务域 Responsibilities</p>
                          <ul className="space-y-1">
                            {role.responsibilities.map((resp, rIdx) => (
                              <li key={rIdx} className="text-xs text-slate-600 flex items-start gap-1.5 leading-relaxed">
                                <span className="text-emerald-500 font-bold mt-0.5">•</span>
                                <span>{resp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Pain points 痛点危害 */}
                        {role.painPoints && role.painPoints.length > 0 && (
                          <div className="border-t border-slate-100 pt-3">
                            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">典型岗位痛点与影响 Bottlenecks</p>
                            <div className="space-y-3">
                              {role.painPoints.map(pp => (
                                <div key={pp.id} className="p-2.5 bg-red-50/50 rounded-lg border border-red-100/40 text-xs">
                                  <div className="flex items-center gap-1.5 mb-1 font-semibold text-red-900">
                                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                    <span>{pp.text}</span>
                                    <span className={`text-[9px] font-bold px-1.5 rounded py-0.2 uppercase ml-auto ${
                                      pp.severity === "High" ? "bg-red-100 text-red-700" :
                                      pp.severity === "Medium" ? "bg-orange-100 text-orange-700" :
                                      "bg-slate-100 text-slate-600"
                                    }`}>
                                      {pp.severity === "High" ? "极严重" : pp.severity === "Medium" ? "中等" : "一般"}
                                    </span>
                                  </div>
                                  {pp.impact && (
                                    <p className="text-[11px] text-red-700/80 leading-relaxed italic ml-5">
                                      <strong>连锁危害:</strong> {pp.impact}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Generate interview standard questions card */}
              {activeProject.roles.length > 0 && (
                <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md border border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-sm tracking-wide">💡 第二步：已就绪岗位网格，智能设计定岗调研问题清单吗？</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-2xl">根据当前填写的岗位职责，AI 可以为您深度设计专属访谈清单，明确问题背后的提问意图（Rationale）。</p>
                  </div>
                  <button 
                    onClick={handleAIGenerateQuestions}
                    disabled={isAIGeneratingQuestions}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs tracking-wider transition-colors shrink-0 cursor-pointer text-center flex items-center gap-1"
                  >
                    {isAIGeneratingQuestions ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        分析动机并出题中...
                      </>
                    ) : "设计访谈问题提纲"}
                  </button>
                </div>
              )}

              {/* Custom Questions view if generated */}
              {activeProject.questionnaires && activeProject.questionnaires.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    已自动就绪的 【访谈提纲与提问指南】
                  </h3>
                  <div className="space-y-6">
                    {activeProject.questionnaires.map((qn) => {
                      const matchedRole = activeProject.roles.find(r => r.id === qn.targetRoleId);
                      return (
                        <div key={qn.id} className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                          <p className="text-xs font-bold text-blue-600 flex items-center gap-1.5 mb-1">
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                            针对: {matchedRole?.name || "通用岗位"}
                          </p>
                          <h4 className="font-extrabold text-sm text-slate-800 mb-3">{qn.title}</h4>
                          <div className="grid grid-cols-1 gap-2.5">
                            {qn.questions.map((q, qidx) => (
                              <div key={q.id} className="bg-white p-3 rounded-lg border border-slate-100/80 text-xs">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <span className="inline-block px-1.5 py-0.2 bg-slate-100 text-slate-600 text-[9px] font-bold rounded mr-1.5 uppercase tracking-wide">
                                      {q.category === "Process" ? "流程探察" :
                                       q.category === "PainPoint" ? "痛点剖析" :
                                       q.category === "Value" ? "价值测度" : "宏观随访"}
                                    </span>
                                    <strong className="text-slate-800 font-medium">{qidx + 1}. {q.text}</strong>
                                  </div>
                                </div>
                                {q.rationale && (
                                  <p className="text-[11px] text-slate-400 mt-1.5 italic pl-4 border-l-2 border-slate-200">
                                    <strong>提问指向/意图:</strong> {q.rationale}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: PROCESS LIFE MATRIX */}
          {activeTab === "processes" && (
            <div className="space-y-6 max-w-5xl mx-auto">
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-display">端到端业务主价值流诊断</h3>
                  <p className="text-xs text-slate-500 mt-0.5">梳理核心运营流程。剖析流转中的每一个关节点、对应的当前通顺阻碍以及各环节对业务总链条的价值供给。</p>
                </div>
                <button 
                  onClick={() => handleOpenProcModal()}
                  className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> 手动录入工作流
                </button>
              </div>

              {activeProject.processes.length === 0 ? (
                <div className="bg-white border rounded-xl p-12 text-center text-slate-400">
                  <span className="text-3xl block mb-2">🔄</span>
                  <p className="text-sm">当前项目暂无工作流程。点击“工作区概览”让 AI 分秒间为您精析行业标准流程！</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {activeProject.processes.map(proc => (
                    <div key={proc.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                      
                      {/* Flow General description top section */}
                      <div className="flex flex-col md:flex-row md:items-start justify-between border-b border-slate-100 pb-4 mb-5 gap-3">
                        <div className="max-w-3xl">
                          <h4 className="font-extrabold text-slate-900 text-md tracking-tight">{proc.name}</h4>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{proc.description}</p>
                          {proc.processValue && (
                            <p className="text-[11px] text-blue-700 bg-blue-50/50 inline-block px-2.5 py-1 rounded border border-blue-100/40 mt-2">
                              <strong>流程大价值 (Total Value):</strong> {proc.processValue}
                            </p>
                          )}
                        </div>
                        
                        {/* Process efficiency indicators */}
                        <div className="flex-shrink-0 md:text-right flex items-center md:flex-col gap-2.5">
                          <div>
                            <span className="text-[10px] text-slate-400 block">运转顺畅度</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-md font-black ${
                                proc.effectivenessScore < 50 ? "text-red-500" :
                                proc.effectivenessScore < 75 ? "text-amber-500" : "text-emerald-500"
                              }`}>{proc.effectivenessScore} / 100</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => handleOpenProcModal(proc)}
                              className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
                            >
                              编辑流程
                            </button>
                            <button 
                              onClick={() => handleDeleteProcess(proc.id)}
                              className="p-1 Text-slate-300 hover:text-red-600 rounded transition"
                              title="移除此流程"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Lane visualization steps horizontal map */}
                      <div className="relative">
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-4">流程价值链流转路线与诊断 (Stage Lane)</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                          {proc.stages.map((stage, sIdx) => {
                            // find participating roles names
                            const rolesInStage = activeProject.roles.filter(r => stage.activeRoleIds.includes(r.id));
                            return (
                              <div key={stage.id} className="bg-slate-50/50 rounded-xl border border-slate-100 p-4 hover:bg-slate-50 relative flex flex-col justify-between transition-all">
                                
                                {/* Heading step count */}
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="w-5 h-5 bg-slate-200 text-slate-700 font-bold rounded-full text-[10px] flex items-center justify-center font-mono">
                                      0{sIdx + 1}
                                    </span>
                                    {rolesInStage.length > 0 && (
                                      <div className="flex flex-wrap gap-1">
                                        {rolesInStage.map(r => (
                                          <span key={r.id} className="bg-slate-200/60 border border-slate-200 text-slate-600 text-[9px] px-1 py-0.2 rounded font-medium">
                                            {r.name}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <h5 className="font-extrabold text-slate-900 text-sm mb-1.5">{stage.stepName}</h5>
                                  <p className="text-[11px] text-slate-500 leading-relaxed mb-3">{stage.description}</p>
                                </div>

                                {/* Diagnoses detail text block */}
                                <div className="space-y-2 border-t border-slate-100/60 pt-2 text-[11px]">
                                  
                                  {stage.painPointText && (
                                    <div className="bg-red-50/40 p-1.5 rounded border border-red-50 text-[11px] text-slate-700">
                                      <span className="text-red-500 font-bold block">⚠️ 环节阻碍瓶颈:</span>
                                      <p className="leading-relaxed text-red-900 font-light">{stage.painPointText}</p>
                                    </div>
                                  )}

                                  {stage.valueContribution && (
                                    <div className="bg-emerald-50/40 p-1.5 rounded border border-emerald-50 text-[11px] text-slate-700">
                                      <span className="text-emerald-600 font-bold block">❇️ 环节价值贡献 (Value Contribution):</span>
                                      <p className="leading-relaxed text-emerald-800 font-light">{stage.valueContribution}</p>
                                    </div>
                                  )}

                                </div>

                              </div>
                            );
                          })}
                        </div>

                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* TAB 4: AUTOMATED SEARCH GROUNDING */}
          {activeTab === "grounding" && (
            <div className="space-y-6 max-w-5xl mx-auto">
              
              {/* Introduction to grounding crawler */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-cyan-50 rounded-lg text-cyan-600">
                    <Search className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-md font-bold text-slate-900 font-display">高能双智互联网定向查收</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mt-1">
                      针对该行业的难点，研判大脑会调用 Google 搜索网络最新文献、知名研报、政策法案和市民热线吐槽。一键检索后，后台自动执行多重智能过滤与归类整理。所有归类信息会直接融合到最底层的研究大纲模型中，确保我们产出的分析报告拥有无懈可击的手动旁证和最新参考依据。
                    </p>
                  </div>
                </div>

                {/* Grounding real-time search trigger form */}
                <form onSubmit={handleAIGroundingSearch} className="mt-5 flex gap-2">
                  <input
                    type="text"
                    required
                    className="flex-1 text-xs border border-slate-200 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                    placeholder="请输入定向搜索归类的主干热点关键词，如‘智慧门诊 一站式服务 诊间支付 现状’..."
                    value={groundingQuery}
                    onChange={(e) => setGroundingQuery(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={isAIGroundingSearching}
                    className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-lg hover:bg-slate-800 shrink-0 cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1.5"
                  >
                    {isAIGroundingSearching ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                        搜集检索归类中...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4 text-blue-400" />
                        发起深度定向查收
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Crawled categorization dashboard list */}
              {activeProject.groundingSearches.length === 0 ? (
                <div className="bg-white border rounded-xl p-12 text-center text-slate-400">
                  <span className="text-3xl block mb-2">📡</span>
                  <p className="text-sm">尚未有互联网调研归档事实。推荐立即触发网上搜寻，为本次痛点大搜剖获得科学支撑！</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {activeProject.groundingSearches.map((search) => (
                    <div key={search.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                      
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">调研关键词检索批次</span>
                          <h4 className="font-extrabold text-slate-800 text-sm">“ {search.query} ”</h4>
                        </div>
                        <div className="text-right flex items-center gap-2.5">
                          <span className="text-[10px] text-slate-400 block font-mono">收集时间: {new Date(search.executedAt).toLocaleDateString()}</span>
                          <button 
                            onClick={() => handleDeleteGroundingQuery(search.id)}
                            className="text-xs text-red-500 hover:underline cursor-pointer flex items-center gap-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> 移除
                          </button>
                        </div>
                      </div>

                      {/* Display categorized cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {search.records.map((item) => (
                          <div key={item.id} className="border border-slate-100 rounded-lg p-3.5 bg-slate-50 hover:bg-white hover:shadow-sm transition-all flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                                  item.classification === "Industry Trend" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                                  item.classification === "Best Practice" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                  item.classification === "User Complaint" ? "bg-red-50 text-red-700 border border-red-100" :
                                  item.classification === "Competitor Analysis" ? "bg-orange-50 text-orange-700 border border-orange-100" :
                                  "bg-slate-100 text-slate-700 border border-slate-200"
                                }`}>
                                  {item.classification === "Industry Trend" ? "行业趋势宏观" :
                                   item.classification === "Best Practice" ? "行业标杆最佳实践" :
                                   item.classification === "User Complaint" ? "用户/客户投诉吐槽" :
                                   item.classification === "Competitor Analysis" ? "竞品痛点分析" : "合规与政策法规"}
                                </span>
                              </div>
                              <h5 className="font-bold text-xs text-slate-900 leading-tight mb-2 truncate" title={item.title}>{item.title}</h5>
                              <p className="text-[11px] text-slate-500 leading-relaxed mb-3 italic">“ {item.snippet} ”</p>
                            </div>

                            {/* Significance mapping */}
                            <div className="border-t border-slate-100/60 pt-2.5">
                              {item.relevanceExplanation && (
                                <div className="text-[11px] text-slate-600 bg-white/80 p-2 rounded border border-slate-100 leading-relaxed">
                                  <strong className="text-blue-700 block text-[10px]">🔎 调研启发与功能映射:</strong>
                                  <p>{item.relevanceExplanation}</p>
                                </div>
                              )}
                              
                              {/* Source URI */}
                              {item.uri && (
                                <a 
                                  href={item.uri} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-blue-500 hover:underline mt-2 inline-block font-mono overflow-hidden text-ellipsis whitespace-nowrap w-full"
                                >
                                  来源出处 ↗ {item.uri}
                                </a>
                              )}
                            </div>

                          </div>
                        ))}
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* TAB 5: SYNTHESIS & PRODUCT BLUEPRINT */}
          {activeTab === "synthesis" && (
            <div className="space-y-6 max-w-5xl mx-auto">
              
              {/* Introduction Card */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                  <div>
                    <h3 className="text-md font-bold text-slate-900 font-display">智能产品功能矩阵重塑</h3>
                    <p className="text-xs text-slate-500 mt-1">根据前期多岗位核心痛点及业务卡点，一键智能化合成出与之完美契合的未来系统功能模块、全新的数字化闭环流以及精细量化的商业预期指标。</p>
                  </div>
                  <button 
                    onClick={handleAISynthesizeBlueprint}
                    disabled={isAISynthesizing}
                    className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                  >
                    {isAISynthesizing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        转配价值契合模型中...
                      </>
                    ) : (
                      <>
                        <Brain className="w-3.5 h-3.5 text-blue-400" />
                        AI 深度推导产品架构蓝图
                      </>
                    )}
                  </button>
                </div>
              </div>

              {!activeProject.synthesis ? (
                <div className="bg-white border rounded-xl p-12 text-center text-slate-400">
                  <span className="text-3xl block mb-2">🎯</span>
                  <p className="text-sm">尚未推导合成产品蓝图。点击上方智能推导，AI 会融合所有痛点和搜索干货，秒级产出最优良的一体化技术改造落地方案！</p>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Part A: Feature lists with mapping to painpoints */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h4 className="font-bold text-slate-900 text-sm mb-4 border-b border-slate-100 pb-2">
                       A. 针对性产品核心功能列表 (Product Feature Mapping)
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeProject.synthesis.functions.map((func) => {
                        const matchedRole = activeProject.roles.find(r => r.id === func.targetRoleId);
                        return (
                          <div key={func.id} className="p-4 bg-slate-50 border border-slate-100/80 rounded-lg flex flex-col justify-between hover:bg-white transition-all hover:shadow-sm">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-black tracking-widest ${
                                  func.priority === 'P0' ? 'bg-red-50 text-red-600 border border-red-100' :
                                  func.priority === 'P1' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                  'bg-slate-100 text-slate-600'
                                }`}>
                                  {func.priority} 优先级
                                </span>
                                {matchedRole && (
                                  <span className="text-[10px] text-slate-500 font-medium">使用岗：{matchedRole.name}</span>
                                )}
                              </div>
                              <h5 className="font-extrabold text-slate-900 text-xs mb-1.5">{func.name}</h5>
                              <p className="text-[11px] text-slate-500 leading-relaxed mb-3">{func.description}</p>
                            </div>

                            {/* Matched target painpoint display */}
                            {func.mapsToPainPointId && (
                              <div className="bg-red-50/20 border border-red-50 p-2 rounded text-[10px] mt-2">
                                <strong className="text-red-700 block">🩹 治愈并缓解的痛点:</strong>
                                <p className="text-slate-600 leading-relaxed font-light">
                                  {activeProject.roles.flatMap(r => r.painPoints).find(p => p.id === func.mapsToPainPointId)?.text || "相关岗位与流程痛点"}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Part B: New Core Optimized Closed Loop flow chart */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h4 className="font-bold text-slate-900 text-sm mb-4 border-b border-slate-100 pb-2">
                      B. 数字化闭环新流程设计 (Optimized Core Flow Loops)
                    </h4>
                    <div className="space-y-6">
                      {activeProject.synthesis.coreFlows.map((flow) => (
                        <div key={flow.id} className="bg-blue-50/20 border border-blue-100/60 rounded-xl p-5">
                          <h5 className="font-extrabold text-blue-900 text-sm mb-1.5">🔄 新闭环流程：{flow.flowName}</h5>
                          <p className="text-xs text-slate-500 leading-relaxed mb-4">{flow.description}</p>
                          
                          {/* Flow Steps arrow map */}
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                            {flow.keySteps.map((step, idx) => (
                              <div key={idx} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm relative flex flex-col justify-between">
                                <div className="text-[10px] text-slate-400 font-bold font-mono">STEP 0{idx + 1}</div>
                                <p className="text-xs text-slate-800 leading-relaxed mt-1 font-medium">{step}</p>
                                {idx < flow.keySteps.length - 1 && (
                                  <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-20 text-blue-300">
                                    <ArrowRight className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Part C: Quantitative evaluation KPIs */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h4 className="font-bold text-slate-900 text-sm mb-4 border-b border-slate-100 pb-2">
                      C. 产品化商业核心价值点与效益量化 (Measurable Value Propositions)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeProject.synthesis.valuePoints.map((vp) => (
                        <div key={vp.id} className="bg-indigo-50/10 border border-indigo-100/50 rounded-xl p-4 flex flex-col justify-between">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-indigo-500 tracking-widest block mb-1">量化商业增益维度</span>
                            <h5 className="font-extrabold text-slate-900 text-xs mb-1.5">{vp.aspect}</h5>
                            <p className="text-[11px] text-slate-500 leading-relaxed mb-3">{vp.description}</p>
                          </div>
                          <div className="bg-indigo-50 p-2.5 rounded-lg border border-indigo-100/50 text-indigo-900 text-xs">
                            <strong className="block text-[10px] text-indigo-700">🎯 精确定量考核期望 (KPI formula):</strong>
                            <p className="leading-relaxed mt-0.5 font-medium">{vp.benefitMetrics}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* TAB 6: COMPLETE REPORTS & GUIDES WORKSPACE */}
          {activeTab === "reports" && (
            <div className="space-y-6 max-w-5xl mx-auto">
              
              {/* Introduction Card */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 no-print">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-pink-50 rounded-lg text-pink-600">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-md font-bold text-slate-900 font-display">麦肯锡标准调研报告与执行问卷</h3>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1">
                        集成行业分析大纲。报告框架完美适配顶层利益相关者决策。除了极具前瞻性的宏观、岗位和价值流改写批判，更有下发给一线的调研实操问卷和标准动作模版。点击下方按钮，完美支持一键打包下载、或者本地精细打印成 PDF 文件。
                      </p>
                    </div>
                  </div>
                </div>

                {/* Print and Export Actions */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-3">
                  <button
                    onClick={handleExportMarkdown}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4 text-blue-400" />
                    导出 Markdown 格式
                  </button>
                  <button
                    onClick={handlePrintPDF}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg cursor-pointer transition-all shadow flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" />
                    立即排版打印/保存 PDF
                  </button>
                </div>
              </div>

              {/* Display area of report & guides templates together */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left side column: The Guidelines questionnaire template */}
                <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">实操工作指南模板</span>
                    <h4 className="font-extrabold text-slate-800 text-sm mb-3">一线调研员问题清单与问卷</h4>
                    
                    {activeProject.templates.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">尚未产出模板指南。可以通过一键“智能生成报告”联动产出。</p>
                    ) : (
                      <div className="space-y-4">
                        {activeProject.templates.map(tmpl => (
                          <div key={tmpl.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <h5 className="font-bold text-xs text-slate-900 mb-1">{tmpl.templateName}</h5>
                            <p className="text-[11px] text-slate-400 mb-2 leading-tight">{tmpl.description}</p>
                            <div className="border-t border-slate-200/60 pt-2.5 max-h-96 overflow-y-auto">
                              <pre className="text-[10px] font-mono text-slate-700 font-light whitespace-pre-wrap leading-relaxed">
                                {tmpl.markdownContent}
                              </pre>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 no-print">
                    <p className="text-[10px] text-slate-400 italic">💡 问卷模版适用于实地抽样访谈并辅助系统校验作用。</p>
                  </div>
                </div>

                {/* Right side column: Main Detailed Report preview card */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-8 min-h-[600px] flex flex-col justify-between print-card print:border-none print:shadow-none">
                  
                  {/* Report Main content rendering */}
                  <div className="prose prose-sm max-w-none">
                    
                    {/* Page break format for beautiful printing */}
                    <div className="text-center pb-8 border-b border-slate-200/80 mb-6">
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-widest block mb-1">McKinsey Standard Report</span>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight font-display mb-2">{activeProject.name} 价值与诊断立项书</h2>
                      <div className="text-xs font-mono text-slate-400 flex items-center justify-center gap-3">
                        <span>分析师: AI Studio Business Architect</span>
                        <span>•</span>
                        <span>发布时间: 2026-06-05</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {activeProject.report ? (
                        renderMarkdown(activeProject.report.markdownContent)
                      ) : (
                        <div className="py-12 text-center text-slate-400">
                          <Brain className="w-12 h-12 text-slate-200 mx-auto mb-3 animate-pulse" />
                          <p className="text-sm">报告底稿正在静候，请点击顶部 “智能生成报告” 一键分析全价值链。</p>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Print footer placeholder */}
                  {activeProject.report && (
                    <div className="mt-12 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                      <span>© ValueLens 市场商业模式落地报告</span>
                      <span className="font-mono">Page 1 of 1</span>
                    </div>
                  )}

                </div>

              </div>

            </div>
          )}

        </div>

      </main>

      {/* 3. POPUP MODAL: ADD / EDIT ROLE */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-extrabold text-slate-900 text-sm">岗位与痛点配置</h4>
              <button 
                onClick={() => setIsRoleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="p-5 space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">岗位角色名称</label>
                  <input 
                    type="text" 
                    required
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 outline-none font-medium"
                    placeholder="例如：挂号柜面员、高级病理学家"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">岗位类别</label>
                  <select 
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 outline-none"
                    value={roleForm.type}
                    onChange={(e) => setRoleForm({ ...roleForm, type: e.target.value as RoleType })}
                  >
                    <option value="User">终端用户/消费者</option>
                    <option value="Employee">一线核心员工</option>
                    <option value="Manager">管理者/决策者</option>
                    <option value="External">外部供应/监管者</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">岗位的核心价值 (岗位存在使命)</label>
                <textarea 
                  rows={2}
                  required
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 outline-none leading-relaxed"
                  placeholder="该岗位在整个业务商业链中担任怎样不可或缺的基石核心价值..."
                  value={roleForm.valueProposition}
                  onChange={(e) => setRoleForm({ ...roleForm, valueProposition: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">核心职责 (一行输入一条，点击回车换行)</label>
                <textarea 
                  rows={3}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 outline-none font-mono leading-relaxed"
                  placeholder="日常高频职责1&#13;日常高频职责2..."
                  value={roleForm.responsibilities}
                  onChange={(e) => setRoleForm({ ...roleForm, responsibilities: e.target.value })}
                />
              </div>

              <div className="border-t border-slate-100 pt-3">
                <span className="block text-xs font-bold text-slate-600 mb-2">配置该岗位承受的具体痛点</span>
                <div className="bg-red-50/20 p-3 rounded-lg border border-red-100/30 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">痛点具体描述</label>
                      <input 
                        type="text"
                        className="w-full text-[11px] border border-slate-200 rounded p-1.5 bg-white"
                        placeholder="例如：手动审核多接口容易错漏严重"
                        value={roleForm.painPointText}
                        onChange={(e) => setRoleForm({ ...roleForm, painPointText: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">严重程度</label>
                      <select    
                        className="w-full text-[11px] border border-slate-200 rounded p-1.5 bg-white"
                        value={roleForm.painPointSeverity}
                        onChange={(e) => setRoleForm({ ...roleForm, painPointSeverity: e.target.value as SeverityType })}
                      >
                        <option value="High">极严重 High</option>
                        <option value="Medium">中等 Medium</option>
                        <option value="Low">低轻 Low</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">危害与因果恶性影响 (Impact)</label>
                    <input 
                      type="text"
                      className="w-full text-[11px] border border-slate-200 rounded p-1.5 bg-white"
                      placeholder="由于该痛点，导致用户满意度大幅暴跌或运营超支50%等后果"
                      value={roleForm.painPointImpact}
                      onChange={(e) => setRoleForm({ ...roleForm, painPointImpact: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button 
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm cursor-pointer transition-colors"
                >
                  保存并上架
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 4. POPUP MODAL: ADD / EDIT PROCESS */}
      {isProcModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h4 className="font-extrabold text-slate-900 text-sm">核心运行工作流与控制环节配置</h4>
              <button 
                onClick={() => setIsProcModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <form onSubmit={handleSaveProcess} id="procFormSubmit" className="space-y-4">
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1">流程大类名称</label>
                    <input 
                      type="text" 
                      required
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 outline-none font-medium"
                      placeholder="如：首诊患者现场挂号及就医呼叫主流程"
                      value={procForm.name}
                      onChange={(e) => setProcForm({ ...procForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">预估顺畅度得分 (0-100)</label>
                    <input 
                      type="number"
                      min={0}
                      max={100}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2 outline-none font-medium"
                      value={procForm.effectivenessScore}
                      onChange={(e) => setProcForm({ ...procForm, effectivenessScore: parseInt(e.target.value) || 60 })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">流程起点/终点与流程描述</label>
                  <input 
                    type="text" 
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 outline-none"
                    placeholder="例如：起点自患者扫码挂号、经历护士站报到、终点至进入各诊室会医..."
                    value={procForm.description}
                    onChange={(e) => setProcForm({ ...procForm, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">流程的核心商业大价值 (Goal Point)</label>
                  <input 
                    type="text" 
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 outline-none"
                    placeholder="精准对接医患资源，释放三甲医院专家产能"
                    value={procForm.processValue}
                    onChange={(e) => setProcForm({ ...procForm, processValue: e.target.value })}
                  />
                </div>

              </form>

              {/* Steps/Stages Draft block */}
              <div className="border-t border-slate-100 pt-4">
                <span className="block text-xs font-bold text-slate-700 mb-2">第二步：为此流程追加控制步骤（按顺序）</span>
                
                {/* Draft list display */}
                {procForm.stages.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {procForm.stages.map((st, sidx) => (
                      <div key={st.id} className="p-2.5 bg-slate-50 border border-slate-150 rounded-lg flex items-center justify-between text-xs font-medium">
                        <div>
                          <span className="font-mono bg-slate-200/60 px-1.5 py-0.2 rounded mr-2">步骤 {sidx + 1}</span>
                          <strong className="text-slate-800">{st.stepName}</strong>
                          <span className="text-slate-400 text-[10px] ml-2">({st.activeRoleIds.length} 角色参与)</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleRemoveStageFromForm(sidx)}
                          className="text-red-500 text-xs hover:underline"
                        >
                          移除
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic mb-3">暂无流动骤项，推荐在下方临时表单区追加步骤：</p>
                )}

                {/* Sub-form to add a stage */}
                <div className="bg-slate-50/50 rounded-lg border border-slate-200 p-3.5 space-y-3 text-xs">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">步骤名称</label>
                      <input 
                        type="text"
                        className="w-full text-[11px] border border-slate-200 rounded p-1.5 bg-white"
                        placeholder="如：现场排队现金挂号"
                        value={stageInput.stepName}
                        onChange={(e) => setStageInput({ ...stageInput, stepName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">参与该步骤的关联岗位(多选)</label>
                      <div className="max-h-24 overflow-y-auto border border-slate-200 rounded p-1.5 bg-white space-y-1">
                        {activeProject.roles.map(r => (
                          <label key={r.id} className="flex items-center gap-1.5 cursor-pointer text-[10px] font-medium text-slate-600">
                            <input 
                              type="checkbox"
                              checked={stageInput.activeRoleIds.includes(r.id)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setStageInput(prev => ({
                                  ...prev,
                                  activeRoleIds: checked 
                                    ? [...prev.activeRoleIds, r.id] 
                                    : prev.activeRoleIds.filter(id => id !== r.id)
                                }));
                              }}
                            />
                            {r.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">步骤细节流转描述</label>
                    <input 
                      type="text"
                      className="w-full text-[11px] border border-slate-200 rounded p-1.5 bg-white"
                      placeholder="患者在大厅一楼柜台，掏出社保卡进行手工排队录入..."
                      value={stageInput.description}
                      onChange={(e) => setStageInput({ ...stageInput, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-red-700 mb-1">❌ 步骤存在的瓶颈或耗损点 (Pain Point)</label>
                      <input 
                        type="text"
                        className="w-full text-[11px] border border-slate-200 rounded p-1.5 bg-white text-red-900"
                        placeholder="高峰排长队45分钟，窗口柜台压力荷载濒临崩溃"
                        value={stageInput.painPointText}
                        onChange={(e) => setStageInput({ ...stageInput, painPointText: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-700 mb-1">❇️ 步骤发挥的实质价值贡献 (Value Contribution)</label>
                      <input 
                        type="text"
                        className="w-full text-[11px] border border-slate-200 rounded p-1.5 bg-white text-emerald-900"
                        placeholder="确保医院对账零差错，实名认证保障医疗法制安全"
                        value={stageInput.valueContribution}
                        onChange={(e) => setStageInput({ ...stageInput, valueContribution: e.target.value })}
                      />
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={handleAddStageToForm}
                    className="w-full py-1.5 text-[11px] font-bold text-center border border-dashed border-blue-400 bg-blue-50/20 hover:bg-blue-50 text-blue-700 rounded transition-colors cursor-pointer"
                  >
                    + 将此步骤加入流程草稿中
                  </button>

                </div>
              </div>

            </div>

            <div className="p-5 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0 bg-slate-50">
              <button 
                type="button"
                onClick={() => setIsProcModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                title="放弃当前所有草稿和修改"
              >
                取消
              </button>
              <button 
                type="button"
                onClick={handleSaveProcess}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm cursor-pointer transition-colors"
              >
                保存完整流程
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. POPUP MODAL: CREATE PROJECT WORKSPACE */}
      {isCreatingProject && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-100">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-extrabold text-slate-900 text-sm">创建全新调研分析项目</h4>
              <button 
                onClick={() => setIsCreatingProject(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">主调研项目名称</label>
                <input 
                  type="text" 
                  required
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 outline-none font-medium"
                  placeholder="例如：生鲜电商极速配送价值链诊断"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">目标市场/细分垂直行业</label>
                <input 
                  type="text" 
                  required
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 outline-none font-medium"
                  placeholder="例如：冷链食品与最后一公里短途配送"
                  value={newProjectIndustry}
                  onChange={(e) => setNewProjectIndustry(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">项目立足场景及当前核心瓶颈描述</label>
                <textarea 
                  rows={3}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 outline-none leading-relaxed"
                  placeholder="对面临的痛度做个简要文字说明。稍后可以在一键 AI 识别中自动为您铺满整张价值网格图。"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button 
                  type="button"
                  onClick={() => setIsCreatingProject(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm cursor-pointer transition-colors"
                >
                  创建空工作区
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 6. POPUP MODAL: HISTORY PROJECT DETAILS VIEW */}
      {historyProjectDetail && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
              <div className="space-y-1 flex-1 min-w-0 mr-4">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300">
                    历史项目档案调阅
                  </span>
                </div>
                <h4 className="font-extrabold text-lg tracking-tight font-display truncate">
                  {historyProjectDetail.name}
                </h4>
                <p className="text-xs text-slate-400 flex flex-wrap items-center gap-1.5 font-medium">
                  <span className="font-semibold text-slate-300">垂直行业:</span> {historyProjectDetail.targetIndustry}
                  <span className="mx-1">•</span>
                  <span className="font-semibold text-slate-300">创建时间:</span> {new Date(historyProjectDetail.createdAt || Date.now()).toLocaleString("zh-CN")}
                </p>
              </div>
              <button 
                onClick={() => setHistoryProjectDetail(null)}
                className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                title="关闭档案"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Context Summary card */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 text-xs leading-relaxed text-slate-600">
                <span className="font-extrabold text-slate-800 block mb-1 text-[11px] uppercase tracking-wider">立项核心背景与痛点说明</span>
                {historyProjectDetail.description || "暂无项目描述信息..."}
              </div>

              {/* Multi-Section Inspector */}
              <div className="space-y-6">
                
                {/* section 1: Roles Grid */}
                <div className="space-y-3">
                  <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                    <Users className="w-4 h-4 text-emerald-500" />
                    已识别的岗位角色与价值主张 ({historyProjectDetail.roles.length})
                  </h5>
                  {historyProjectDetail.roles.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">暂无岗位信息</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {historyProjectDetail.roles.map(role => (
                        <div key={role.id} className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-900 text-xs">{role.name}</span>
                            <span className="px-1.5 py-0.2 bg-slate-100 border border-slate-200 text-slate-500 rounded text-[9px] font-bold">
                              {role.type === "User" ? "用户" : role.type === "Employee" ? "一线" : role.type === "Manager" ? "主管" : "外部"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">
                            <strong className="text-slate-700">存在价值:</strong> {role.valueProposition}
                          </p>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">岗位核心痛点:</span>
                            {role.painPoints.map((pp, idx) => (
                              <div key={pp.id || idx} className="text-[11px] border-l-2 border-red-500/50 pl-2 py-0.5 space-y-0.5">
                                <p className="font-semibold text-slate-800 flex items-center gap-1">
                                  <span className={`w-1.5 h-1.5 rounded-full ${pp.severity === 'High' ? 'bg-red-500' : pp.severity === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                  {pp.text}
                                </p>
                                {pp.impact && <p className="text-[10px] text-slate-400 leading-normal pl-2.5">危害: {pp.impact}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* section 2: Processes */}
                <div className="space-y-4">
                  <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                    <GitFork className="w-4 h-4 text-amber-500" />
                    端到端主价值流程与控制环节 ({historyProjectDetail.processes.length})
                  </h5>
                  {historyProjectDetail.processes.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">暂无流程信息</p>
                  ) : (
                    <div className="space-y-4">
                      {historyProjectDetail.processes.map(proc => (
                        <div key={proc.id} className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
                          <div className="bg-slate-50 p-3 border-b border-slate-100 flex items-center justify-between">
                            <div>
                              <h6 className="font-bold text-slate-900 text-xs">{proc.name}</h6>
                              <p className="text-[10px] text-slate-400 mt-0.5">{proc.description}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 uppercase font-semibold">传统模式效率</span>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className={`text-xs font-black ${proc.effectivenessScore < 50 ? 'text-red-500' : 'text-amber-500'}`}>{proc.effectivenessScore}%</span>
                                <div className="w-12 bg-slate-200 h-1 rounded-full overflow-hidden">
                                  <div className={`h-full ${proc.effectivenessScore < 50 ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${proc.effectivenessScore}%` }} />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="p-3 space-y-2">
                            {proc.stages.map((stage, idx) => (
                              <div key={stage.id || idx} className="bg-slate-50/50 p-2.5 rounded border border-slate-100/80 text-[11px] leading-relaxed relative">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="w-4 h-4 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center text-[9px] font-black">{idx + 1}</span>
                                  <span className="font-bold text-slate-800">{stage.stepName}</span>
                                </div>
                                <p className="text-slate-500 text-[10.5px] mb-1.5">{stage.description}</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] border-t border-slate-100/80 pt-1.5 mt-1">
                                  <div className="text-red-600 font-medium">
                                    <strong className="text-slate-500">环节痛点: </strong> {stage.painPointText}
                                  </div>
                                  <div className="text-emerald-700 font-medium">
                                    <strong className="text-slate-500">价值贡献: </strong> {stage.valueContribution}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* section 3: Synthesis & Report Status */}
                <div className="space-y-3">
                  <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    产品规划方案与麦肯锡级落地交付
                  </h5>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Functions */}
                    <div className="border border-slate-200/80 rounded-xl p-4 space-y-3">
                      <span className="text-xs font-extrabold text-slate-800 block border-b pb-1">AI 提炼的核心产品特性 ({historyProjectDetail.synthesis?.functions.length || 0})</span>
                      {(!historyProjectDetail.synthesis || historyProjectDetail.synthesis.functions.length === 0) ? (
                        <p className="text-xs text-slate-400 italic">该项目尚未进行产品重塑推导。</p>
                      ) : (
                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {historyProjectDetail.synthesis.functions.map(fn => (
                            <div key={fn.id} className="p-2 bg-slate-50 border border-slate-100 rounded text-[11px] space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800">{fn.name}</span>
                                <span className="px-1 py-0 bg-indigo-50 text-indigo-700 font-bold rounded text-[9px]">{fn.priority}</span>
                              </div>
                              <p className="text-slate-500 leading-normal">{fn.description}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Report Status */}
                    <div className="border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <span className="text-xs font-extrabold text-slate-800 block border-b pb-1">麦肯锡级商业报告产出</span>
                        {historyProjectDetail.report ? (
                          <div className="space-y-2">
                            <div className="p-3 bg-emerald-50/50 text-emerald-800 border border-emerald-100 rounded-lg text-xs flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              <div>
                                <p className="font-bold">商业模式落地报告已就绪</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">包含前言宏观、价值网格、流程诊断和 ROI 回报评价</p>
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-3 leading-normal">
                              {historyProjectDetail.report.markdownContent?.slice(0, 150) || "商业可行性报告文本内容..."}
                            </p>
                          </div>
                        ) : (
                          <div className="p-3 bg-slate-50 text-slate-400 border border-slate-100 rounded-lg text-xs flex items-center gap-2">
                            <Info className="w-4 h-4 text-slate-400 shrink-0" />
                            <span>该历史项目暂未调取大模型生成最终交付报告。</span>
                          </div>
                        )}
                      </div>

                      {historyProjectDetail.report && (
                        <div className="text-[10px] text-slate-400 mt-2 text-right">
                          上次生成于: {new Date(historyProjectDetail.report.lastGeneratedAt).toLocaleString("zh-CN")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              <div className="text-xs text-slate-500">
                档案编号: <span className="font-mono font-bold text-slate-700">{historyProjectDetail.id}</span>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setHistoryProjectDetail(null)}
                  className="px-4 py-2 bg-white text-slate-700 text-xs font-bold border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  关闭档案
                </button>
                
                {historyProjectDetail.id !== activeProjectId && (
                  <button 
                    onClick={() => {
                      setActiveProjectId(historyProjectDetail.id);
                      setHistoryProjectDetail(null);
                      showNotification(`已激活工作区：${historyProjectDetail.name}`, "success");
                    }}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 shadow-sm flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <ArrowRight className="w-3.5 h-3.5" /> 激活该项目为当前工作区
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
