# Improved Extraction Prompt (Iteration #2)

## Changes from V1:
1. Added 4 few-shot examples (2 YES, 2 NO)
2. Explicit scoring thresholds
3. Frequency keyword guide
4. Stricter filtering criteria

---

## Full Prompt:

You are analyzing Reddit posts from r/Entrepreneur to extract actionable pain points that indie hackers could build products around.

For each post, identify:
1. Is there a genuine pain point or problem being expressed?
2. If yes, extract the specific pain point
3. Score on three dimensions (0-100):
   - **Intensity**: How frustrated/desperate?
   - **Specificity**: How actionable?
   - **Frequency**: Recurring problem?

### Scoring Guide:

**Intensity:**
- 90-100: Extreme frustration ("nightmare", "crushing me", "going to break")
- 70-89: High frustration ("killing my", "eating all my time")
- 50-69: Moderate frustration ("annoying", "painful")
- 30-49: Mild annoyance
- 0-29: Barely frustrated

**Specificity:**
- 90-100: Concrete workflow pain with specific numbers/details
- 70-89: Clear problem with actionable elements
- 50-69: Problem described but vague solution space
- 30-49: Abstract complaint
- 0-29: Extremely vague

**Frequency:**
- 90-100: Daily/weekly recurring ("every day", "3-4 hours daily")
- 70-89: Monthly recurring ("third time this year", "happens often")
- 50-69: Occasional but repeated
- 30-49: Might be one-time
- 0-29: Clearly one-time event

### Few-Shot Examples:

**Example 1: YES - Actionable Pain Point**
Post: "Email marketing costs are insane - $300/month for 10k subscribers when I only send 2-3 emails/month"
Analysis:
- Has pain point: YES
- Pain point: "Email marketing tools charge high prices for infrequent senders with large lists"
- Intensity: 75 (strong frustration: "insane")
- Specificity: 90 (concrete numbers: $300/month, 10k subs, 2-3 emails)
- Frequency: 85 (monthly recurring cost)
- Composite: 83.3
- Quote: "I only send 2-3 emails per month, so I'm paying for features I don't use"

**Example 2: YES - Actionable Pain Point**
Post: "Spent 40 hours on a client project, delivered the files, now they're ghosting me. Third time this year."
Analysis:
- Has pain point: YES
- Pain point: "Freelancers getting ghosted by clients after delivering work without payment"
- Intensity: 85 (high frustration, financial loss)
- Specificity: 95 (specific: 40 hours, unpaid, pattern established)
- Frequency: 90 ("third time this year")
- Composite: 90.0
- Quote: "Third time this has happened this year"

**Example 3: NO - Success Story**
Post: "Just hit $10k MRR after 18 months! Happy to answer questions."
Analysis:
- Has pain point: NO
- Reason: "Success story without a specific problem expressed"

**Example 4: NO - General Question**
Post: "What's your go-to tech stack in 2026?"
Analysis:
- Has pain point: NO
- Reason: "General discussion question, no complaint or problem stated"

### Reject if:
- Memes, jokes, emojis in title
- Success stories without problems
- General "what do you think" discussions
- Self-promotional ("FREE COURSE", "Check out my...")
- Post content <50 characters
- No clear frustration or problem language

---

POSTS TO ANALYZE:
[Insert posts here]

Return JSON array with format:
```json
[
  {
    "post_id": 1,
    "has_pain_point": true,
    "pain_point": "concise problem description",
    "intensity": 85,
    "specificity": 90,
    "frequency": 80,
    "composite_score": 85.0,
    "supporting_quote": "direct quote"
  },
  {
    "post_id": 2,
    "has_pain_point": false,
    "reason": "brief explanation"
  }
]
```

Return ONLY valid JSON, no other text.
