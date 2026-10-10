// api/analyze.js — Gemini version
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { idea, country, sector, budget } = req.body;

  if (!idea) {
    return res.status(400).json({ error: 'Idea required' });
  }

  const prompt = `You are LOOP's startup risk analyst. Analyze this startup idea brutally honestly.

Idea: ${idea}
Country: ${country}
Sector: ${sector}
Budget: ${budget}

Database context (from CB Insights + regional data):
- 43% of startups fail due to no market need
- 29% run out of cash
- 23% have wrong team
- Bangladesh funding dropped 95% in 2024
- India funding dropped 60%
- Emerging markets face regulatory + currency risks

Output JSON only:
{
  "risk_score": 0-100,
  "verdict": "HIGH RISK" | "CAUTION" | "WORTH EXPLORING",
  "verdict_text": "one line in Bengali",
  "red_flags": ["flag1", "flag2", "flag3", "flag4"],
  "similar_failures": [{"name": "", "country": "", "reason": ""}],
  "checklist": ["q1", "q2", "q3", "q4", "q5"],
  "brutal_truth": "one brutal honest paragraph in Bengali",
  "market_reality": "one paragraph about this sector in this region"
}

Rules:
- Be brutally honest, don't sugarcoat
- Use Bengali for user-facing text (verdict_text, brutal_truth)
- Use English for technical fields
- Never invent specific company names or fake data
- If unsure, say "insufficient data"
- Return ONLY valid JSON, no markdown, no explanation`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      return res.status(500).json({ error: 'Gemini API failed: ' + response.status });
    }

    const data = await response.json();
    
    // Extract text from Gemini response
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      return res.status(500).json({ error: 'No response from Gemini' });
    }

    // Parse JSON (remove markdown code fences if any)
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const analysis = JSON.parse(cleaned);
    res.status(200).json(analysis);

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Analysis failed: ' + error.message });
  }
}
