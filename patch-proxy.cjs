const fs = require('fs');

const file = 'supabase/functions/ai-proxy/index.ts';
let code = fs.readFileSync(file, 'utf8');

// 1. Add stream flag to destructured body
code = code.replace(
  'const { modelId, prompt, messages, buildMode, systemPrompt, projectContext, summary, conversationId } = body;',
  'const { modelId, prompt, messages, buildMode, systemPrompt, projectContext, summary, conversationId, stream } = body;'
);

// 2. Modify the model switch statement to pass the stream flag
code = code.replace(
  /result = await callOpenAICompatible\(apiKey, baseUrl, modelId, augmentedSystem, finalMessages, prompt\);/g,
  'result = await callOpenAICompatible(apiKey, baseUrl, modelId, augmentedSystem, finalMessages, prompt, stream);'
);
code = code.replace(
  /result = await callAnthropic\(apiKey, baseUrl, augmentedSystem, finalMessages, prompt\);/g,
  'result = await callAnthropic(apiKey, baseUrl, augmentedSystem, finalMessages, prompt, stream);'
);
code = code.replace(
  /result = await callGemini\(apiKey, augmentedSystem, finalMessages, prompt\);/g,
  'result = await callGemini(apiKey, augmentedSystem, finalMessages, prompt, stream);'
);

// 3. If stream is true, result is a Response object, we should return it directly
code = code.replace(
  'return new Response(JSON.stringify({',
  `if (stream && typeof result !== "string") {
      // If streaming, result is a Response object from the LLM
      // We return it directly. 
      return new Response(result.body, {
        headers: { ...corsHeaders, "Content-Type": result.headers.get("Content-Type") || "text/event-stream" }
      });
    }

    return new Response(JSON.stringify({`
);

// 4. Update the call functions to accept stream and return Response | string
code = code.replace(
  /async function callOpenAICompatible\([\s\S]*?\): Promise<string> \{([\s\S]*?)const res = await fetch/m,
  (match) => match.replace('): Promise<string> {', ', stream?: boolean): Promise<string | any> {')
);
code = code.replace(
  /model,\n\s*messages: allMessages,\n\s*max_tokens: 8192,\n\s*temperature: 0.7,\n\s*}\)/m,
  `model,
      messages: allMessages,
      max_tokens: 8192,
      temperature: 0.7,
      stream: !!stream,
    })`
);
code = code.replace(
  /if \(!res\.ok\) \{[\s\S]*?return data\.choices\?\.\[0\]\?\.message\?\.content \|\| "";/m,
  `if (!res.ok) {
    const errBody = await res.text();
    throw new Error(\`API error (\${res.status}): \${errBody.slice(0, 300)}\`);
  }

  if (stream) return res;

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";`
);

// Anthropic
code = code.replace(
  /async function callAnthropic\([\s\S]*?\): Promise<string> \{([\s\S]*?)const res = await fetch/m,
  (match) => match.replace('): Promise<string> {', ', stream?: boolean): Promise<string | any> {')
);
code = code.replace(
  /max_tokens: 8192,\n\s*}\)/m,
  `max_tokens: 8192,
      stream: !!stream,
    })`
);
code = code.replace(
  /if \(!res\.ok\) \{[\s\S]*?return data\.content\?\.\[0\]\?\.text \|\| "";/m,
  `if (!res.ok) {
    const errBody = await res.text();
    throw new Error(\`Claude API error (\${res.status}): \${errBody.slice(0, 300)}\`);
  }

  if (stream) return res;

  const data = await res.json();
  return data.content?.[0]?.text || "";`
);

// Gemini
code = code.replace(
  /async function callGemini\([\s\S]*?\): Promise<string> \{([\s\S]*?)const geminiContents =/m,
  (match) => match.replace('): Promise<string> {', ', stream?: boolean): Promise<string | any> {')
);
code = code.replace(
  /const res = await fetch\(\n\s*`https:\/\/generativelanguage.googleapis.com\/v1beta\/models\/gemini-2.0-flash:generateContent\?key=\$\{apiKey\}`/m,
  `const endpoint = stream ? "streamGenerateContent?alt=sse&" : "generateContent?";
  const res = await fetch(
    \`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:\${endpoint}key=\${apiKey}\``
);
code = code.replace(
  /if \(!res\.ok\) \{[\s\S]*?return data\.candidates\?\.\[0\]\?\.content\?\.parts\?\.\[0\]\?\.text \|\| "";/m,
  `if (!res.ok) {
    const errBody = await res.text();
    throw new Error(\`Gemini API error (\${res.status}): \${errBody.slice(0, 300)}\`);
  }

  if (stream) return res;

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";`
);

fs.writeFileSync(file, code);
console.log('Successfully patched ai-proxy/index.ts for streaming');
