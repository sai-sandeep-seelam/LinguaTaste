# 🎬 LinguaTaste — Hackathon Judge Demo Script

> **Objective**: Showcase how LinguaTaste leverages Qloo's Cultural Taste Graph to deliver personalized immersion content with high-res artwork and direct 1-click platform redirects ("Where to Consume").

---

## ⏱️ 3-Minute Walkthrough

### Act 1: The Cold Start & The Cultural Problem (0:00 - 0:45)
1. **Open the App**: Land on [http://localhost:3000](http://localhost:3000). Note the sleek dark glassmorphism design with the Qloo Taste Graph badge.
2. **The Problem Pitch**:
   > *"Most language learners drop out because beginners are handed nursery rhymes or 'Despacito'. If an adult learner loves psychological anime like Death Note and indie rock like Radiohead, generic LLMs fail them with clichés. Qloo solves this."*
3. **1-Click Persona Launch**:
   - In the **Judge Quick-Launch Personas** bar, click:
     **🎸 Anime & Indie Rock (Japanese A1)**.
   - Instantly, LinguaTaste populates the taste seeds (*Attack on Titan, Radiohead, Death Note, Spirited Away, Neutral Milk Hotel*), configures Japanese A1, and queries the Qloo taste graph.

---

### Act 2: Qloo Taste Fingerprint & Cultural Bridges (0:45 - 1:30)
1. **Inspect Qloo Cultural Fingerprint**:
   - Show the extracted Taste Tags with real affinity weights (e.g. *Post-Rock, Melancholy, Psychological Fiction, Dystopian Narrative*).
2. **Taste Bridge Callouts**:
   - Point to the candidate card for **toe** (Japanese math-rock band):
     > *"⚡ Qloo Taste Graph Bridge: Connects Radiohead's complex rhythmic instrumentation directly to Japanese math-rock pioneers toe."*
   - Point to **Serial Experiments Lain**:
     > *"⚡ Qloo Taste Graph Bridge: Direct psychological thriller aesthetic peer to Death Note, with sparse dialogue ideal for A1 beginner immersion."*

---

### Act 3: Artwork & The "Where to Consume" Moment (1:30 - 2:15)
1. **Visual Richness (Posters & Covers)**:
   - Notice the high-resolution poster artwork dynamically resolved via TMDB (for film/TV), Open Library (for books), and iTunes/Deezer (for music) with zero layout shift.
2. **The "Click the Icon & Land on the Platform" Moment**:
   - Hover over the platform row on **Serial Experiments Lain**.
   - Notice the **Netflix** or **Crunchyroll** platform icon with the tooltip indicating link tier (Tier 1/Tier 2 confirmed available in region).
   - **Click the Netflix icon**: It instantly opens the title page in a new tab (`rel="noopener noreferrer"`).
   - For music (*toe*), click the **Spotify** / **Apple Music** icon: Lands directly on the artist's discography.
3. **Region Selector & Subscriptions Filter**:
   - In the left panel under **Availability Region**, switch region from `US` to `JP` or `GB`. Watch availability dynamically update.
   - Under **My Active Subscriptions**, tick **Netflix** and **Spotify**.
   - In the candidate matrix, click the **"Available to Me"** filter: Instantly, items not accessible on your active platforms fade away, and remaining accessible candidates receive a **+15% ranking boost**!

---

### Act 4: Structured Immersion Calendar (2:15 - 2:45)
1. **Scroll to Week 1 Immersion Schedule**:
   - See the 7-day calendar scheduled to the user's weekly study budget.
   - Look at each session card:
     - **Mini poster artwork** embedded right in the card.
     - **Exact platform action**: *"Tue: Episode 1 on Netflix [icon, link]"*.
     - **Pre-teach Vocabulary**: Crucial words and translations before watching.
     - **Active Challenge**: Targeted active listening exercise.

---

### Act 5: The "Qloo vs. Generic LLM" Proof (2:45 - 3:00)
1. **Click the "Qloo vs. Generic LLM" tab**:
   - Show the side-by-side benchmark comparison.
   - Contrast the generic LLM's cliché suggestions (*Doraemon, Pokemon, generic beginner J-pop*) against Qloo's deep taste matches (*toe, Serial Experiments Lain, Shintaro Sakamoto*).
2. **Footer Compliance**:
   - Note the official TMDB logo with required legal disclaimer and JustWatch attribution.
