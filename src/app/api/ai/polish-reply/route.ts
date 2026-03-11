import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { messageId, userInput, originalMessage, userLanguage, style = 'professional', mode = 'reply' } = await request.json();

    // 验证输入 - userInput是必须的
    if (!userInput) {
      return NextResponse.json(
        { error: 'Missing required parameter: userInput' },
        { status: 400 }
      );
    }

    // 提取请求头
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // 初始化LLM客户端
    const config = new Config();
    const client = new LLMClient(config);

    // 风格标签描述映射
    const tagDescriptions: Record<string, string> = {
      // 语气标签
      'formal': 'Use formal business language with proper titles and honorifics (e.g., Dear Sir/Madam, Respectfully)',
      'casual': 'Use friendly, conversational tone like talking to a colleague',
      'polite': 'Be extra courteous and respectful, use please/thank you frequently',
      'enthusiastic': 'Show excitement and positive energy about the opportunity',
      'neutral': 'Maintain a balanced, objective tone without strong emotions',
      // 篇幅标签
      'detailed': 'Provide comprehensive information with explanations and context',
      'concise': 'Keep it short and to the point, avoid unnecessary details',
      'brief': 'Ultra-short response, just the essentials',
      'comprehensive': 'Cover all aspects thoroughly with examples and details',
      // 表达方式标签
      'data-driven': 'Include specific numbers, statistics, and quantitative data',
      'logical': 'Structure the response with clear reasoning and logical flow',
      'emotional': 'Appeal to emotions and build personal connection',
      'storytelling': 'Use narrative and examples to illustrate points',
      'professional': 'Maintain professional business communication standards',
      // 补充信息标签
      'with-pricing': 'Include pricing information or cost estimates',
      'with-specs': 'Include product specifications and technical details',
      'with-timeline': 'Include delivery timeline and milestones',
      'with-call-to-action': 'Include clear next steps and call to action',
      'with-benefits': 'Highlight benefits and value propositions',
    };

    // 解析风格标签
    const styleTags = style.split(',').filter((s: string) => s.trim());
    const styleRequirements = styleTags.map((tag: string) => tagDescriptions[tag] || tag).join('\n- ');

    // 语言映射
    const languageNames: Record<string, string> = {
      'zh': 'Chinese (Simplified)',
      'en': 'English',
      'ja': 'Japanese',
      'ko': 'Korean',
      'de': 'German',
      'fr': 'French',
      'es': 'Spanish',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ar': 'Arabic',
    };
    const targetLanguage = languageNames[userLanguage] || 'English';

    // 根据模式构建不同的system prompt
    let systemPrompt: string;

    if (mode === 'compose') {
      // 新建消息模式 - 只有用户草稿，没有原始消息
      systemPrompt = `You are an AI assistant for a B2B chemical trading company.
Your task is to help polish and improve the user's draft message.

## User's Draft Message:
${userInput}

## Recipient (if provided):
${originalMessage?.sender || 'Not specified'}

## Subject (if provided):
${originalMessage?.title || 'Not specified'}

## Selected Style Tags:
- ${styleRequirements}

## Target Output Language: ${targetLanguage}

## Your Task:
Polish and enhance the user's draft message to make it more professional and effective:
1. Improve the clarity and professionalism of the language
2. Ensure proper business email structure (greeting, body, closing)
3. Apply ALL the selected style tags to enhance the message
4. Keep the user's core message and intent
5. MUST output in ${targetLanguage}

## Important Guidelines:
- You are polishing and enhancing the user's draft, not completely rewriting it
- Maintain the user's intended message and purpose
- Apply ALL selected style tags appropriately
- If "with-pricing" tag is selected and pricing info is missing, add placeholder like "[Please insert pricing details]"
- If "with-specs" tag is selected and specs are missing, suggest relevant specifications to include
- If "with-timeline" tag is selected, suggest adding delivery timeline
- Keep the message natural and professional
- Return ONLY the polished message text, no explanations, no labels, no additional content`;
    } else {
      // 回复模式 - 有原始消息需要回复
      systemPrompt = `You are an AI assistant for a B2B chemical trading company.
Your task is to generate a professional reply by COMPREHENSIVELY analyzing BOTH the original message and the user's draft.

## Original Message from Customer (READ CAREFULLY):
- From: ${originalMessage?.sender || 'N/A'}
- Subject: ${originalMessage?.title || 'N/A'}
- Content: 
${originalMessage?.content || 'N/A'}

## User's Draft Reply (user's intent):
${userInput}

## Selected Style Tags:
- ${styleRequirements}

## Target Output Language: ${targetLanguage}

## Your Task:
Generate a professional reply by combining:
1. First, understand what the customer is asking/saying in the original message
2. Then, understand what the user wants to express in their draft
3. Finally, create a polished reply that:
   - Addresses the customer's questions/concerns appropriately
   - Incorporates the user's intended message
   - Follows ALL the style tags selected above
   - Maintain professional business tone
   - MUST output in ${targetLanguage}

## Important Guidelines:
- You are NOT just polishing the user's text - you are creating a meaningful response
- Consider the context of the original message
- Apply ALL selected style tags to your response
- If "with-pricing" tag is selected, include reasonable pricing estimates if not provided
- If "with-specs" tag is selected, mention relevant product specifications
- If "with-timeline" tag is selected, suggest realistic delivery timeline
- Keep the user's core message but make it more complete and professional
- Return ONLY the final reply text, no explanations, no labels, no additional content`;
    }

    // 构建messages
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userInput },
    ];

    // 调用LLM - 使用备用模型列表
    const models = ['doubao-seed-1-8-251228', 'deepseek-r1-250528', 'kimi-1-0830'];
    let lastError: any = null;
    
    for (const model of models) {
      try {
        const response = await client.invoke(messages, {
          temperature: 0.7,
          model: model,
        }, undefined, customHeaders);
        
        // 成功则返回
        return NextResponse.json({
          content: response.content.trim(),
          style: style,
          model: model,
        });
      } catch (err: any) {
        console.warn(`Model ${model} failed:`, err.message);
        lastError = err;
        // 继续尝试下一个模型
      }
    }
    
    // 所有模型都失败了
    throw lastError;
  } catch (error: any) {
    console.error('AI polish reply error:', error);
    // 提供更友好的错误提示
    const errorMessage = error.message?.includes('使用人数较多') 
      ? 'AI服务繁忙，请稍后重试'
      : error.message?.includes('rate limit') 
      ? '请求过于频繁，请稍后重试'
      : error.message || '生成AI建议失败';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
