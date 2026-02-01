import type { CheckInType } from "./types";

export const CHECKIN_TEMPLATES: Record<CheckInType, string> = {
  Daily: `Daily Check-In

What went well today?
- 

What got in the way?
- 

What’s the next move (1–2 actions)?
- 

Confidence (1–10): 
Energy (1–10): 
`,
  Weekly: `Weekly Review

Wins:
- 

Progress:
- 

Stuck points:
- 

Focus for next week (top 1–3):
- 
`,
  Blocked: `Blocked Update

What are you blocked on?
- 

What do you need (time / info / decision / help)?
- 

What’s the smallest next step?
- 
`,
  Win: `Win Update

What did you accomplish?
- 

Why does it matter?
- 

How will you carry this momentum forward?
- 
`,
  Other: `Update

What’s happening?
- 

What’s next?
- 
`,
};
