import { Router, type IRouter } from "express";
import { SendAiChatBody, SendAiChatResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const fallbackReplies = [
  "Start by naming the information you need to remember for each element. Then ask: what would make the next lookup constant time?",
  "Try writing the smallest example by hand and trace what changes after each step. Look for an invariant that stays true.",
  "You are close. Choose the data structure that makes the most frequent operation cheap, then check whether the input can be processed in one pass.",
  "Here is a stronger nudge: separate the work into what you know before the current element and what you learn from it. That usually reveals the right recurrence or lookup.",
];

router.post("/ai/chat", async (req, res): Promise<void> => {
  const parsed = SendAiChatBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.flatten() }, "Invalid AI assistant request");
    res.status(400).json({ error: "Please send a message to the assistant." });
    return;
  }

  const { message, problemTitle, problemTopic, hintLevel, code } = parsed.data;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const reply = fallbackReplies[Math.min(Math.round(hintLevel), fallbackReplies.length - 1)];
    const data = SendAiChatResponse.parse({
      reply: `${reply} ${problemTitle ? `Keep ${problemTitle} in mind.` : ""}`,
      provider: "guided-local",
      hintLevel,
    });
    res.json(data);
    return;
  }

  const context = [
    problemTitle ? `Problem: ${problemTitle}` : "",
    problemTopic ? `Topic: ${problemTopic}` : "",
    code ? `User code:\n${code.slice(0, 12000)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `You are Byte, a kind DSA coach. Help without immediately revealing a complete solution. The requested hint level is ${Math.round(hintLevel)}: level 0 is a conceptual nudge, level 1 is more specific, level 2 is algorithm-level guidance, and level 3 may provide a full solution only if the user explicitly asks for it. Be concise and actionable. Never be insulting.\n${context}\nUser: ${message}`;

  try {
    const requestBody = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 700 },
    });
    let response: Response | undefined;
    const models = ["gemini-2.5-flash", "gemini-2.0-flash"];
    try {
      const modelList = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
        headers: { "x-goog-api-key": apiKey },
      });
      if (modelList.ok) {
        const modelJson = (await modelList.json()) as {
          models?: Array<{ name?: string; supportedGenerationMethods?: string[] }>;
        };
        const discovered = (modelJson.models ?? [])
          .filter((model) => model.supportedGenerationMethods?.includes("generateContent"))
          .map((model) => model.name?.replace(/^models\//, ""))
          .filter((model): model is string => Boolean(model && /flash/i.test(model) && !/(tts|audio)/i.test(model)));
        models.unshift(...discovered);
      } else {
        req.log.warn({ status: modelList.status }, "Gemini model discovery unavailable");
      }
    } catch {
      req.log.warn("Gemini model discovery errored; using compatibility list");
    }
    for (const model of [...new Set(models)]) {
      const candidate = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: requestBody,
        },
      );
      response = candidate;
      if (candidate.ok) break;
      if (![404, 429, 500, 502, 503].includes(candidate.status)) break;
      req.log.warn({ model, status: candidate.status }, "Gemini model unavailable; trying compatibility fallback");
    }
    if (!response) {
      res.status(503).json({ error: "The assistant is taking a tiny study break." });
      return;
    }

    if (!response.ok) {
      const errorDetail = (await response.text()).slice(0, 300);
      req.log.warn({ status: response.status, detail: errorDetail }, "Gemini request failed");
      res.status(503).json({ error: "The assistant is taking a tiny study break." });
      return;
    }

    const json = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const reply = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!reply) {
      res.status(503).json({ error: "The assistant returned an empty response." });
      return;
    }

    res.json(SendAiChatResponse.parse({ reply, provider: "gemini", hintLevel }));
  } catch (error) {
    req.log.error({ err: error }, "Gemini request errored");
    res.status(503).json({ error: "The assistant is unavailable right now." });
  }
});

export default router;