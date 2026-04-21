# Paywall Research Notes

## From iOS Subscription Manual (Apr 2026)

### Paywall Strategy (Section 3)
- **Soft paywall after onboarding** is recommended for H&F apps (show value first, then gate)
- Show paywall after onboarding is complete (user has seen the value)
- Default trial length: **7 days** (test 3-day only as a later speed/payback experiment)
- Plan architecture: **Annual + Monthly** (2-plan paywalls dominate at 41-60% for H&F)
- Annual plan should be the highlighted/recommended option
- Price anchoring: annual plan shown first, monthly as fallback

### Pricing (Section 4)
- H&F category pricing defaults:
  - Annual: **$39.99/year** (~$3.33/month)
  - Monthly: **$9.99/month**
  - Weekly: not recommended for H&F (low conversion)
- Highlight annual plan with "Best Value" badge
- Show per-month equivalent for annual plan

### Paywall UI Elements (from SOSA 2026, Section 5)
- **Highlighted pricing**: 74.5% median adoption — MUST HAVE
- **Multiple plan options**: 59.2% median — MUST HAVE (show 2 plans)
- **Feature list**: 57.1% median — MUST HAVE
- **Free trial messaging**: 58.9% median — MUST HAVE
- **Discount badge**: 47.5% median — INCLUDE (show % savings on annual)
- **Cancel assurance**: 39.5% median — INCLUDE ("Cancel anytime")
- Countdown timers and progress bars: near-zero adoption — SKIP

### Apple Compliance Rules (Section 10)
- Every paywall MUST clearly explain: value, billing, cancelability
- MUST include "Restore Purchases" button
- Subscription periods must be at least 7 days
- Must be available across user's devices
- Auto-renewal disclosure REQUIRED (Apple mandates this text)

### Required Apple Legal Text on Paywall
"Payment will be charged to your Apple ID account at the confirmation of purchase. Subscription automatically renews unless it is canceled at least 24 hours before the end of the current period. Your account will be charged for renewal within 24 hours prior to the end of the current period. You can manage and cancel your subscriptions by going to your account settings on the App Store after purchase."

### Paywall Timing
- Show paywall AFTER onboarding (after user has seen value)
- Do NOT show paywall before value is visible
- Soft gate: let free users use basic features, gate premium ones

## From SOSA 2026 (RevenueCat)

### H&F Category Benchmarks
- Trial → paid median: ~37.7%
- D35 paid: ~2.9%
- D14 RPI: ~$0.48
- Annual plans shown: 43.8% (highest across categories)

### Plan Distribution for H&F
- 2-plan paywalls: 60.2% (highest across all categories)
- Annual plans: 43.8% shown on paywalls
- Monthly plans: 37.6% shown on paywalls

### Key Insights
- Annual plan should be highlighted as "Best Value"
- Show savings percentage prominently (e.g., "Save 67%")
- Feature list with checkmarks converts well
- "Cancel anytime" reduces anxiety

## Implementation Plan

### Free Tier (what users get without paying)
- Basic food logging (up to 5 entries/day)
- Basic calorie tracking (today only)
- Water tracking
- Basic profile setup

### Premium Tier (Calorly Pro)
- Unlimited food logging
- Full history and progress charts (7-day, 30-day, 90-day)
- Exercise tracking
- Custom food creation
- Macro goals customization
- Weight tracking with charts
- Advanced nutrition breakdown (fiber, sugar, sodium)
- Export data

### Paywall Screen Design
- Full-screen modal with close button (X) in top-right
- App icon at top
- Headline: "Unlock Calorly Pro"
- Subheadline: "Everything you need to reach your goals"
- Feature list with checkmarks (5-6 key features)
- 2 plan cards: Annual (highlighted, "Best Value" badge) + Monthly
- Annual shows per-month equivalent and savings %
- Free trial messaging: "Start 7-Day Free Trial"
- CTA button: "Start Free Trial"
- Below button: auto-renewal disclosure (required by Apple)
- "Restore Purchases" link
- "Privacy Policy" and "Terms of Service" links
