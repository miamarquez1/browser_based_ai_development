What did you build?

I built a real, date based daily streak tracker. It automatically checks a user in once per calendar day, saves the data in localStorage, and lights up flame icons for each weekday based on actual visit dates, not just visuals.

How did micro-iteration feel?

At first, it was frustrating because the AI didn’t really follow my request to iterate in small steps. It kept trying to rewrite big chunks of logic instead of adjusting one layer at a time. I had to repeatedly redirect it. Once I enforced smaller steps, focusing on persistence first, then calculation, then the look of the feature, the process felt much more controlled and easier to debug.

What did self-review catch?

The AI was strong at spotting edge cases. It consistently flagged first-visit initialization issues, one-visit-per-day guards, and safe localStorage checks. However, it missed some UX logic details. For example, my streak kept displaying 0 instead of starting at 1 on the first visit, and I had to rewrite that logic multiple times. The same thing happened with the flame icons. I wanted them fully data-driven, but the AI leaned on CSS instead of proper state updates.

Tool impressions Copilot Agent 

I liked the quick inline context and visual diffs in browser-based tools. They are great for focused changes. But they are slower in larger repositories and not ideal for running full test suites. CLI tools feel faster and better for refactors, even if browsing context is less convenient.

When would I use this workflow?

Micro-iteration and self-review work best for layered features or risky logic changes. I would skip it for simple, low-impact edits.