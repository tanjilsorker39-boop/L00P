// api/analyze.js
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
- If unsure, say "insufficient data"`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7
      })
    });
    
    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);
    res.status(200).json(analysis);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Analysis failed' });
  }
}
