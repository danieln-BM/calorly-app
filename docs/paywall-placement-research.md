# Paywall Placement Research: Calorie Counter Apps + RevenueCat

## Key Findings from Top Calorie Counter Apps (Adapty Newsletter #22, Aug 2025)

### MyFitnessPal ($13M/mo, 1M downloads/mo)
- **Placement**: Paywall shown after onboarding AND contextually when users try premium features
- **Strategy**: Premium vs Premium+ tiered split. 67% annual discount. Barcode scanner moved behind paywall (controversial but effective)
- **Trigger moments**: Accessing macro goals, nutrition reports, calorie insights, exercise calorie burn

### Cal AI ($2M/mo, 800K downloads/mo) — fastest growing
- **Placement**: 3-screen trial explanation shown DURING onboarding (before user even opens the app)
- **Strategy**: "Try for $0.00" framing. 75% off annual vs monthly. Shows AI food scanning demo BEFORE paywall
- **Key insight**: Show the value prop (AI scanning) BEFORE asking for money

### MyNetDiary ($1M/mo, 300K downloads/mo)
- **Placement**: Hard paywall on first premium feature touch → exit-intent soft trial flow
- **Strategy**: First screen pushes annual hard. If user tries to close → softer "FREE TRIAL" offer appears
- **Key insight**: Exit-intent second paywall converts users who rejected the first one

### Appediet ($500K/mo, 200K downloads/mo)
- **Placement**: Paywall shown as a product demo with animations
- **Strategy**: $0.96/week pricing feels almost free. Visual-first approach shows real UI before committing
- **Key insight**: Show the actual premium UI/features inside the paywall itself

### Cronometer ($600K/mo, 200K downloads/mo)
- **Placement**: NO hard paywall — contextual nudges everywhere throughout the app
- **Strategy**: In-app contextual prompts educate about Gold features without blocking. 55% annual discount
- **Key insight**: Gentle nudges at every premium feature touch point, never blocking core functionality

### HitMeal ($400K/mo, 90K downloads/mo)
- **Placement**: Gamified paywall with 3D avatar shown after goal-setting in onboarding
- **Strategy**: Trial toggle (user chooses trial vs direct purchase). $19.99/year makes weekly look expensive
- **Key insight**: Let users choose their commitment level on the paywall itself

---

## RevenueCat Research Findings

### Contextual Paywall Targeting (Dec 2025)
- **82% of trials start on Day 0** — the day of install is the highest-converting moment
- Top apps convert 4.6% download-to-paid vs median 1.9% — the gap is WHEN paywall appears, not what it says
- **20-30% of users cancel in the first 3 hours** — avoid showing paywalls when user is in "exploration mode"
- Context = timing + motion + mentality. Same user converts differently based on circumstance

### What Top Apps Get Right (Rosie Hoggmascall, June 2025)
- **Honest Paywall** (Blinkist-style): Clear timeline + features + reminder guarantee → +23% conversion, -55% complaints
- Price high first ($100/yr), then offer discounts to price-sensitive users — captures both segments
- Refund rates and cancellation rates matter more than raw trial conversion rate
- **Personalization**: Make the upgrade feel like a personal recommendation, not a generic sales pitch

---

## Recommended Trigger Moments for Calorly

Based on research, these are the highest-converting trigger moments for a calorie counter app:

| Trigger | Timing | Type | Rationale |
|---------|--------|------|-----------|
| After onboarding completion | Day 0 | Full paywall | 82% of trials start Day 0; user just invested time setting up |
| After 3rd food log in a day | Day 1-3 | Soft nudge | "Value moment" — user is engaged and sees the app working |
| When tapping Progress Charts | Any | Feature gate | High-intent feature; user wants insights = ready to pay |
| When tapping Exercise Log (free user) | Any | Soft upsell | Exercise tracking is a premium differentiator |
| App open on Day 3 (if not subscribed) | Day 3 | Full paywall | Re-engagement moment; user has formed a habit |
| After saving first Meal Template | Any | Soft nudge | User just discovered value; strike while iron is hot |
| When tapping Custom Food (free user) | Any | Feature gate | Power-user feature; these users convert well |
| Weekly streak milestone (7-day streak) | Week 1 | Celebration paywall | Positive emotional moment = high conversion |

---

## Paywall Design Principles (Applied to Calorly)

1. **Annual plan highlighted as "Best Value"** with "Save 67%" badge ✅ Already done
2. **7-day free trial** on both plans ✅ Already done  
3. **"Try for $0.00"** framing on CTA ✅ Already done
4. **Honest disclosure**: Show exactly what renews, when, and how to cancel ✅ Already done
5. **Exit-intent second offer**: If user dismisses paywall, show a softer "Start Free Trial" modal
6. **Contextual copy**: Change paywall headline based on which feature triggered it
7. **Feature preview**: Show a blurred/locked version of the premium feature before the paywall
