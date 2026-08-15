
name: platform-china
description: "Chinese platform playbook: Douyin/TikTok behavior prediction, Xiaohongshu CES scoring and search, WeChat Channels social recommendation, Bilibili community."
tags: [china, platforms, douyin, xiaohongshu, bilibili]

# China Platform Playbook

One content set across all four platforms is the classic mistake — the mechanisms differ fundamentally.

## Platform comparison

| Dimension | Douyin | Xiaohongshu (RED) | WeChat Channels | Bilibili |
|---|---|---|---|---|
| Recommendation core | Behavior prediction (neural net on user actions, weak label reliance) | CES score + tag matching (content × user tags) | Social graph first, then interest algorithm | Community + content quality |
| Key metrics | Completion, deep interaction, search value | Comments, saves, follows | Completion, likes (like = share to friends) | Triple engagement (like/coin/save), danmaku |
| Cold start pool | 200-500 people | 500-1000 people | Friends + groups | Partition + small pool |
| Search value | Medium (growing) | High (strong long-tail) | Low | Medium-high |
| Content form | 15-60s vertical | Image-text + 1-5min video | 1-3min + livestream | 5-20min long video |
| Violation red lines | Homogeneous AIGC de-duped/penalized | Fake endorsement, off-platform traffic | Replays, abnormal friend interaction | Low originality, clickbait titles |
| Growth lever | Completion + deep interaction | Saves + comments + search | Likes (socially visible) | Triple engagement + danmaku + series |

## Douyin (behavior prediction)
- Pipeline: AI review (text/image/audio violations) → cold start 200-500 pool → multimodal features (text NLP + frame recognition + voiceprint) → neural net predicts behavior value → composite score.
- 2026 shifts: labels weakened, behavior prediction dominant; diversity de-dup actively penalizes highly similar AIGC content (batch AI content gets suppressed — persona and differentiation matter); multi-interest recall surfaces hidden interests.
- Operations: completion is the floor, but deep interaction and search value weigh more; hook + rhythm (see short-video) feed the behavior model positively.

## Xiaohongshu (CES + tag matching)
- Three tables: content community + ads + e-commerce; content serves "seen, searched, bought" simultaneously.
- CES: like 1 + save 1 + comment 4 + repost 4 + follow 8 — deep interaction beats likes. Comments and saves are the pool-breakthrough levers.
- Recognition before distribution: the platform must first "understand" the content (title/body/image/video/captions/audio/product info) — information consistency across all elements decides recognition quality.
- Cold start is a calibration round: a new account with mixed directions (science today, emotion tomorrow, giveaway after) fails recognition; hold a stable content group first.
- Search logic: content should read like an answer, not a keyword pile. 70/30 rule: 70% long-tail (specific questions), 30% hot/big words. Long-tail recalls for 2-3 months — functional value beats timeliness.
- Self-check chain: does the cover+title promise and the first 5s deliver? Does the first screen hit the audience/scene/problem/result? Continuous information in the middle (no filler)? Does the ending hand the viewer a takeaway? Duration matches density (30s if it can be 30s)?

## WeChat Channels (social-to-public)
- Core logic: private traffic leverages public — a like makes the video visible to the liker's WeChat friends (first wave), then the interest algorithm takes over.
- Content score weight order: completion > likes > comments > link clicks > reposts > saves.
- Social recommendation is now part of the base recommendation model (2025 official whitepaper); content weight is lowest of the big three (~50%).
- Red lines: replay streams, low interaction, fake acting in livestreams; abnormal friend interactions (mass likes in a short window) can be flagged — bought likes are riskier here than anywhere.
- Growth lever: design for likes ("like = share"); community operation: warm up private groups → post → interact in groups → leverage public.

## Bilibili (community + long content)
- Danmaku culture and community identity; collection rate, coins, triple engagement; long-form (5-20min) with depth and information density.
- Titles/covers must not lie — the community punishes clickbait harshly (backlash).
- Plant danmaku triggers in content (arguable points, knowledge points); series + partition depth earns loyal viewers.

## AI generation application
- Platform-customized storyboards from one source: Douyin cut (3s hook + fast rhythm), RED cut (information density + answer feel), Channels cut (like design), Bilibili cut (depth + danmaku points).
- AIGC compliance: label AI content; differentiate persona to avoid Douyin's homogeneous-AIGC de-dup.
- Embed question-style keywords naturally in titles/captions/speech for RED/Douyin search — never keyword stuffing.
- Batch AI production needs a distinct angle per item — no copy-paste with swapped titles.
- Review per platform (weights differ) and feed the iteration table (see platform-growth).