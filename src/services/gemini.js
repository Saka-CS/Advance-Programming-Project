import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;
let currentApiKey = '';
let currentModelName = 'gemini-1.5-flash';

export const initGemini = (apiKey, modelName = 'gemini-1.5-flash') => {
  if (apiKey !== currentApiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
    currentApiKey = apiKey;
  }
  currentModelName = modelName;
};

export const hasApiKey = () => {
  return !!currentApiKey;
};

// Fetch models available for generateContent for a given API key
export const fetchAvailableModels = async (apiKey) => {
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  );
  if (!resp.ok) {
    const err = await resp.json();
    throw new Error(err?.error?.message || `HTTP ${resp.status}`);
  }
  const data = await resp.json();
  // Filter to only models that support generateContent
  return (data.models || [])
    .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
    .map(m => ({
      name: m.name.replace('models/', ''),   // e.g. "gemini-1.5-flash"
      displayName: m.displayName || m.name,  // human-readable label
    }));
};

// Combine all resources into a context string (capped per resource to stay within token limits)
const MAX_RESOURCE_CHARS = 8000;
const buildContext = (resources) => {
  if (!resources || resources.length === 0) return 'No resources loaded.';
  return resources.map((r, index) => {
    const truncated = r.content.length > MAX_RESOURCE_CHARS;
    const body = r.content.slice(0, MAX_RESOURCE_CHARS);
    return `--- Resource ${index + 1}: "${r.title}" (${r.type}) ---\n${body}${truncated ? '\n[...content truncated for length...]' : ''}`;
  }).join('\n\n');
};

export const generateAutocomplete = async (text, resources) => {
  if (!genAI) throw new Error('Gemini API not initialized');
  const model = genAI.getGenerativeModel({ model: currentModelName });

  const context = buildContext(resources);
  const prompt = `You are an AI research assistant. Based on the following resources (if any), autocomplete the user's text. ONLY output the continuation of the text, do not repeat what the user already wrote, and do not add conversational filler. Keep it concise, around 1-3 sentences.
  
Resources Context:
${context}

User Text:
${text}

Continuation:`;

  const result = await model.generateContent(prompt);
  return result.response.text();
};

export const suggestEdits = async (text, resources) => {
  if (!genAI) throw new Error('Gemini API not initialized');
  const model = genAI.getGenerativeModel({ model: currentModelName });

  const context = buildContext(resources);
  const prompt = `You are an expert academic editor and research assistant. Review the user's text and provide specific, constructive suggestions for improvement based on the provided resources (if any). Suggest improvements for clarity, tone, factual accuracy (based on resources), and grammar.
  
Resources Context:
${context}

User Text to Review:
${text}

Provide your suggestions in a clear, bulleted markdown list.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
};

export const checkCitation = async (citationText, resources) => {
  if (!genAI) throw new Error('Gemini API not initialized');
  const model = genAI.getGenerativeModel({ model: currentModelName });

  const context = buildContext(resources);

  if (!resources || resources.length === 0) {
    throw new Error('No PDF resources loaded. Please upload source documents first.');
  }

  const prompt = `You are a strict academic fact-checker. The user has written a piece of text that may contain citations or factual claims. Your job is to verify each claim against the provided source documents ONLY.

For each identifiable claim or citation in the user's text:
1. State the claim clearly.
2. Search the provided resources for supporting or contradicting evidence.
3. Return one of these verdicts:
   - ✅ **Supported** – The claim is directly supported by the source documents.
   - ⚠️ **Partially Supported** – Some aspects are supported but others are not found.
   - ❌ **Not Found** – No evidence for this claim exists in the provided documents.
   - ❌ **Contradicted** – The documents explicitly contradict this claim.
4. Quote the relevant excerpt from the source document that justifies your verdict.

Source Documents:
${context}

Text to Verify:
${citationText}

Citation Check Report:`;

  const result = await model.generateContent(prompt);
  return result.response.text();
};

// A simple utility to extract text from a file if needed (for text files)
// For PDFs, we would typically use a library like pdf.js, but we'll simulate or use basic text extraction here.
export const extractTextFromFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
};
