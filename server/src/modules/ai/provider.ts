export type GeminiContext = { answer: string; facts: unknown };
export interface TextProvider { summarize(question:string,context:GeminiContext):Promise<string> }

export class GeminiProvider implements TextProvider {
  async summarize(question:string,context:GeminiContext):Promise<string>{
    const key=process.env.GEMINI_API_KEY;if(!key)throw new Error('Gemini is not configured');
    const model=process.env.GEMINI_MODEL??'gemini-2.0-flash';
    const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({systemInstruction:{parts:[{text:'You are MediFlow AI Copilot, a pharmacy business operations assistant. Discuss only the supplied inventory and business facts. Never diagnose, prescribe, recommend dosage, suggest substitutions, or provide treatment advice. Do not ask for or expose personal/customer information. If asked medical questions, refuse briefly.'}]},contents:[{role:'user',parts:[{text:`Question: ${question}\nVerified business facts (JSON): ${JSON.stringify(context.facts)}\nDeterministic calculation: ${context.answer}`}]}],generationConfig:{temperature:0.2,maxOutputTokens:300}})});
    if(!response.ok)throw new Error(`Gemini request failed (${response.status})`);
    const payload=await response.json() as {candidates?:{content?:{parts?:{text?:string}[]}}[]};
    const text=payload.candidates?.[0]?.content?.parts?.map((part)=>part.text??'').join('').trim();
    if(!text||text.length>1500)throw new Error('Gemini returned an invalid answer');
    return text;
  }
}
