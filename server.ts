/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Helper to initialize GoogleGenAI lazily
let aiClient: GoogleGenAI | null = null;
function getAIClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please configure it in your Secrets / Env settings.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Map the client's preferred model to the runtime engine (Defaulting to gemini-3.1-pro-preview for DeepSeek v4 Pro level)
function getLLMModelName(clientModel: string | undefined): string {
  if (!clientModel) return "gemini-3.1-pro-preview"; // Default as requested
  const m = clientModel.toLowerCase();
  if (m.includes("deepseek v4") || m.includes("deepseek r1") || m.includes("pro-preview") || m.includes("3.1-pro")) {
    return "gemini-3.1-pro-preview"; // Advanced deep-reasoning model
  }
  return "gemini-3.5-flash"; // Highly efficient standard model
}

// 1. Generate starting Roles, Position Value, and Processes
app.post("/api/research/generate-starting-elements", async (req, res) => {
  try {
    const { targetIndustry, description, model } = req.body;
    if (!targetIndustry || !description) {
      res.status(400).json({ error: "Missing required fields: targetIndustry, description" });
      return;
    }

    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: getLLMModelName(model),
      contents: `你是个资深的行业商业分析师（Business Analyst）和产品价值链专家。
针对以下目标市场/行业进行调研分析：
行业/领域: ${targetIndustry}
业务背景与描述: ${description}

请识别出：
1. 市场中或该场景下的关键角色和岗位（包括用户、一线员工、管理者、外部协作者）。并明确每个岗位的核心价值（岗位价值/存在意义）、职责和核心痛点。
2. 核心端到端业务/管理流程。识别业务的关键流程，并细化到每个流程的主要控制环节（步骤）、哪些角色参与、该环节的价值贡献，以及该流程的痛点与价值。

请以完整干净的JSON格式返回结果。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            roles: {
              type: Type.ARRAY,
              description: "识别出的角色与岗位列表",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "角色/岗位名称，如：挂号收费员、患者、门诊主治医生" },
                  type: { type: Type.STRING, description: "角色类型：只能是 'User'、'Employee'、'Manager'、'External' 中的一个" },
                  valueProposition: { type: Type.STRING, description: "岗位的核心价值、对价值链的贡献" },
                  responsibilities: {
                    type: Type.ARRAY,
                    description: "此岗位的主要核心职责列表",
                    items: { type: Type.STRING }
                  },
                  painPoints: {
                    type: Type.ARRAY,
                    description: "此角色最突出的痛点列表（至少2个）",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        text: { type: Type.STRING, description: "痛点具体描述，应具体并贴合业务" },
                        severity: { type: Type.STRING, description: "严重程度，只能是 'High'、'Medium'、'Low' 之一" },
                        impact: { type: Type.STRING, description: "该痛点对业务或体验造成的具体危害和后果" }
                      },
                      required: ["text", "severity", "impact"]
                    }
                  }
                },
                required: ["name", "type", "valueProposition", "responsibilities", "painPoints"]
              }
            },
            processes: {
              type: Type.ARRAY,
              description: "识别出的端到端核心业务或管理流程",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "流程名称，如：门诊挂号分诊流、患者诊疗开单流" },
                  description: { type: Type.STRING, description: "该流程的起点、终点和简要场景说明" },
                  processValue: { type: Type.STRING, description: "该流程在整体商业或运营中的核心价值" },
                  effectivenessScore: { 
                    type: Type.INTEGER, 
                    description: "当前传统模式下该流程的顺畅度/效率自评得分 (建议在 30-75 之间以体现痛点优化空间)" 
                  },
                  stages: {
                    type: Type.ARRAY,
                    description: "流程的主要流转步骤/控制点",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        stepName: { type: Type.STRING, description: "步骤/环节名称" },
                        activeRoleNames: { 
                          type: Type.ARRAY, 
                          description: "参与此环节的角色名称，应与上面的roles列表中角色名称产生关联或能呼应",
                          items: { type: Type.STRING }
                        },
                        description: { type: Type.STRING, description: "该环节的具体操作与流转细节" },
                        painPointText: { type: Type.STRING, description: "该控制环节存在的阻碍、瓶颈或痛点描述" },
                        valueContribution: { type: Type.STRING, description: "该步骤对流程整体能够提供的确定性价值或增值项" }
                      },
                      required: ["stepName", "activeRoleNames", "description", "painPointText", "valueContribution"]
                    }
                  }
                },
                required: ["name", "description", "processValue", "effectivenessScore", "stages"]
              }
            }
          },
          required: ["roles", "processes"]
        }
      }
    });

    const text = response.text;
    res.json(JSON.parse(text || "{}"));
  } catch (error: any) {
    console.error("Generate Starting Elements error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

// 2. Create optimized question list tailored to specific roles/processes
app.post("/api/research/generate-questions", async (req, res) => {
  try {
    const { targetIndustry, description, roles, processes, model } = req.body;
    if (!targetIndustry || !roles) {
      res.status(400).json({ error: "Missing Target Industry or Roles in request body" });
      return;
    }

    const ai = getAIClient();
    const prompt = `您是专业的客户访谈与痛点挖掘顾问。
行业: ${targetIndustry}
背景: ${description}

当前识别了以下岗位角色团队：
${JSON.stringify(roles, null, 2)}

当前识别了以下涉及的核心业务流程：
${JSON.stringify(processes, null, 2)}

请针对上面定义的角色列表中的每一位（或者重要岗位组合），量身定制设计一套用于 1对1 调研访谈或问卷的问题清单。
设计动机需要说明为什么提问这个问题，它对应哪些管理痛点或流程环节。
问题应分为四类（category）：'Process' (针对流程不顺/环节流转的疑问), 'PainPoint' (深度分析痛苦和危害), 'Value' (寻找岗位核心价值发挥的最大空间或指标), 'General' (一般性宏观或背景了解)。

请返回一个包含问题清单设计的JSON，它关联对应的角色或岗位：`;

    const response = await ai.models.generateContent({
      model: getLLMModelName(model),
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questionnaires: {
              type: Type.ARRAY,
              description: "为不同角色设计的问题清单列表",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "问题清单标题，例如：针对[岗位名称]的职责与痛点深挖访谈提纲" },
                  targetRoleName: { type: Type.STRING, description: "对应的角色/岗位名称，需要与前面的roles中的name精确呼应" },
                  questions: {
                    type: Type.ARRAY,
                    description: "此角色专属的问题清单（建议5-7个）",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        text: { type: Type.STRING, description: "访谈/问卷问题具体字句" },
                        rationale: { type: Type.STRING, description: "该问题背后的设计初心、它能对应深挖出的流程或价值漏洞" },
                        category: { 
                          type: Type.STRING, 
                          description: "问题分类，只能是 'Process' | 'PainPoint' | 'Value' | 'General' 之一" 
                        }
                      },
                      required: ["text", "rationale", "category"]
                    }
                  }
                },
                required: ["title", "targetRoleName", "questions"]
              }
            }
          },
          required: ["questionnaires"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Generate Questions error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

// 3. Online Target Research & Auto Retrieval Grounding and Grouping
app.post("/api/research/grounding-search", async (req, res) => {
  try {
    const { query, targetIndustry, description, model } = req.body;
    if (!query) {
      res.status(400).json({ error: "Query is required" });
      return;
    }

    const ai = getAIClient();
    const prompt = `调研关键字: "${query}"
该关键词应用于行业领域: ${targetIndustry} (${description})

请基于互联网上的最新专业信息、文章、报告或用户投诉反馈，详细分析并罗列出与该调研关键词强相关的痛点、现存瓶颈、政策以及最佳实践。
你的回答应该覆盖行业宏观和当前行业典型问题。`;

    // Perform research with Google Search Grounding dynamically!
    const response = await ai.models.generateContent({
      model: getLLMModelName(model),
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    // Extract grounding chunks from metadata!
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webRecords = groundingChunks.map((chunk: any, index: number) => {
      // Sometimes it's web, sometimes it could be maps/other
      const title = chunk.web?.title || `参考来源 #${index + 1}`;
      const uri = chunk.web?.uri || "";
      const snippet = chunk.web?.title || `检索到的关于"${query}"的网络关联文献。`;
      return {
        id: `chunk-${index}-${Date.now()}`,
        title,
        uri,
        snippet,
      };
    });

    // Now, classify these records and the AI search findings using a secondary internal helper response, or let's ask Gemini to categorize them in a nice JSON structure!
    // Rather than multiple roundtrips, we can ask Gemini directly to output classified summaries based on search findings.
    const synthesisPrompt = `刚刚进行了搜索引擎检索有关："${query}"。
检索到的高权重网址参考如下：
${JSON.stringify(webRecords, null, 2)}

请帮助我将此次网络搜索中获得的市场认知、典型用户痛点和现成报告进行归类和精炼成具体卡片，以便应用到产品需求识别中。
你必需将以下参考网址（uri）一并归入分类好的卡片中，并且提供该网址在分类中的详细佐证。
请将检索获得的干货归纳为以下几类（classification）：
- 'Industry Trend' (行业趋势/风向/宏观规律)
- 'Competitor Analysis' (竞品情况/市面已有解法/竞争痛点)
- 'User Complaint' (用户吐槽/客户真实难受点/一线声音)
- 'Regulatory Policy' (规章制度/合规要求/标准卡点)
- 'Best Practice' (行业最佳标杆/优秀标杆做法)

请返回结构化JSON数据以供入库分类：`;

    const classificationResponse = await ai.models.generateContent({
      model: getLLMModelName(model),
      contents: synthesisPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            records: {
              type: Type.ARRAY,
              description: "网络检索内容细化分类卡片",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "干货标题，如：XX系统卡顿导致用户积压风波" },
                  uri: { type: Type.STRING, description: "对应的网址/来源，应该精确匹配刚才提供的高权重网址中的一个" },
                  snippet: { type: Type.STRING, description: "干货核心观点摘要与痛点提炼（100-200字，内容充实）" },
                  classification: { 
                    type: Type.STRING, 
                    description: "干货分类，只能是 'Industry Trend' | 'Competitor Analysis' | 'User Complaint' | 'Regulatory Policy' | 'Best Practice' 中的一个" 
                  },
                  relevanceExplanation: { type: Type.STRING, description: "此项发现对我们本次进行 ${targetIndustry} 产品功能设计与价值挖掘的启发" }
                },
                required: ["title", "uri", "snippet", "classification", "relevanceExplanation"]
              }
            }
          },
          required: ["records"]
        }
      }
    });

    res.json(JSON.parse(classificationResponse.text || "{}"));
  } catch (error: any) {
    console.error("Grounding Search error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

// 4. Synthesize Requirements, Product Functions, Core Flow and Key Values
app.post("/api/research/synthesize", async (req, res) => {
  try {
    const { targetIndustry, description, roles, processes, groundingChunks, model } = req.body;
    
    const ai = getAIClient();
    const prompt = `您是顶尖的产品总监、商业架构师及资深咨询顾问。
请根据我们前期的调研，系统化、深度识别和定义出本项目的：
1. **产品核心功能 (Product Functions)**：定义能切实缓解核心岗位痛点、优化关键流程步骤的具体功能项。赋予其优先级 (P0、P1、P2) 和受惠岗位。
2. **核心流优化定义 (Core Flows)**：设计好产品化以后的数字化、线上化新闭环（例如：自助报到排队流，自动合并处分开单流），描述新流程的关键步骤。
3. **关键价值实现指标与层面 (Product Value Points)**：结合效率、成本、岗位满意度、合规度等，提炼最突出的3大价值增长点，并给出量化的可衡量指标/评估方法。

前期多维度调研输入：
行业: ${targetIndustry}
背景描述: ${description}

已识别的角色与痛点:
${JSON.stringify(roles, null, 2)}

已识别的业务流程与痛点:
${JSON.stringify(processes, null, 2)}

互联网检索归类情报:
${JSON.stringify(groundingChunks, null, 2)}


请设计产品架构并以干净结构化的JSON格式返回产品顶层价值与功能蓝图：`;

    const response = await ai.models.generateContent({
      model: getLLMModelName(model),
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            functions: {
              type: Type.ARRAY,
              description: "深度识别的产品功能特性列表",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "功能名称，如：智能AI预分诊路由系统" },
                  description: { type: Type.STRING, description: "功能介绍与技术业务实现逻辑" },
                  priority: { type: Type.STRING, description: "开发与上线优先级：'P0' | 'P1' | 'P2' 之一" },
                  targetRoleName: { type: Type.STRING, description: "该功能的受惠或直接操作角色名称，应该精确匹配roles中的name" },
                  mapsToPainPointText: { type: Type.STRING, description: "此功能明确可以解决并治愈的哪项角色痛点或流程卡点描述" }
                },
                required: ["name", "description", "priority", "targetRoleName", "mapsToPainPointText"]
              }
            },
            coreFlows: {
              type: Type.ARRAY,
              description: "全新的数字化、智能化闭环核心流程列表",
              items: {
                type: Type.OBJECT,
                properties: {
                  flowName: { type: Type.STRING, description: "优化后的新闭环流程名" },
                  description: { type: Type.STRING, description: "新模式下该流程如何流转，如何提升顺畅度" },
                  keySteps: { 
                    type: Type.ARRAY, 
                    description: "该优良闭环涉及的关键业务或数字步骤/节点（步骤不要多于5步）",
                    items: { type: Type.STRING }
                  }
                },
                required: ["flowName", "description", "keySteps"]
              }
            },
            valuePoints: {
              type: Type.ARRAY,
              description: "核心能给客户和企业带来的三大价值优势及量化指标",
              items: {
                type: Type.OBJECT,
                properties: {
                  aspect: { type: Type.STRING, description: "效益维度：如：‘极大提升诊前分流效率’、‘降低收费窗口财务差错’" },
                  description: { type: Type.STRING, description: "该点商业主要支撑逻辑说明" },
                  benefitMetrics: { type: Type.STRING, description: "对应该价值考核、量化的指标公式或期望达成比例，例如‘诊前盲目排队平均缩短45%以上’" }
                },
                required: ["aspect", "description", "benefitMetrics"]
              }
            }
          },
          required: ["functions", "coreFlows", "valuePoints"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Synthesize error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

// 5. Generate Full Detailed Analysis Report and Actionable templates (Markdown Format)
app.post("/api/research/generate-report", async (req, res) => {
  try {
    const { targetIndustry, description, roles, processes, groundingChunks, synthesis, model } = req.body;

    const ai = getAIClient();
    const prompt = `您是一位拥有25年咨询经验的麦肯锡/埃森哲高级合伙人，以及世界级数字化产品专家。
请为正在进行的 ${targetIndustry} (${description}) 撰写一份**非常深度、详尽、可以提交给董事会或投资者**的《市场深度调研、岗位价值链及产品商业模式落地报告》。

本项目的输入细节如下：
1. 角色岗位与其痛点深度细分：
${JSON.stringify(roles, null, 2)}

2. 端到端流程及其价值、瓶颈深挖：
${JSON.stringify(processes, null, 2)}

3. 定向网上最新调研情况：
${JSON.stringify(groundingChunks, null, 2)}

4. 优化的产品功能定义与核心价值点：
${JSON.stringify(synthesis, null, 2)}

请撰写一份格式优美、结构严谨的 Markdown 格式分析报告。
报告必须包含以下几个主要篇章：
1. 【第一章：前言与市场宏观风向分析】
   - 基于行业趋势、核心问题、政策推演。
2. 【第二章：多角色岗位与核心价值网格】
   - 梳理这些角色如何相互连接，并列出最重要的几个岗位价值以及他们痛点间的因果依赖。
3. 【第三章：业务核心流程评估与痛点诊断分析】
   - 对已有传统流程提出深度批判并测算效率。
4. 【第四章：核心功能落地、流程闭环重塑方案】
   - 阐述新闭环流程的先进性。
5. 【第五章：商业价值主张与定量量化评价】
   - 详细写出本项目上期预期的资金、时间或人力ROI回报和各价值层。

另外，请紧接在报告正文后，为分析师队伍量身定制出2个极高可行度的实操【访谈与观察调研工作指南模板】（用于实际去现场调研或下发角色时的标准问题和动作指南模版）。

直接返回高密度的富有见地的 Markdown 字符串，不要有多余的外层包裹或说明。可以使用丰富的 Markdown 排版、表格、引用等。`;

    const response = await ai.models.generateContent({
      model: getLLMModelName(model),
      contents: prompt,
    });

    res.json({ markdownContent: response.text || "" });
  } catch (error: any) {
    console.error("Generate Report error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});


// Express/Vite Dev vs Production Asset Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running and listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
