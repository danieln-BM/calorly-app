# Calorly - Calorie & Nutrition Counter — Design Document

## Brand Identity

**App Name:** Calorly  
**Tagline:** Track smarter. Live better.  
**Primary Color:** `#22C55E` (vibrant green — health, vitality)  
**Accent Color:** `#F97316` (orange — energy, warmth)  
**Background:** `#FFFFFF` light / `#0F1117` dark  
**Surface:** `#F8FAFC` light / `#1A1D23` dark  
**Typography:** System font (SF Pro on iOS)

---

## Screen List

1. **Onboarding** — Welcome + goal setup (weight goal, activity level, calorie target)
2. **Home (Dashboard)** — Daily calorie ring, macro breakdown, meal sections, water tracker
3. **Food Log** — Add food entries per meal (Breakfast/Lunch/Dinner/Snacks)
4. **Food Search** — Search food database, recent foods, custom foods
5. **Food Detail** — Nutrition facts, serving size selector, add to log
6. **Exercise Log** — Log cardio/strength exercises, calories burned
7. **Progress** — Weight chart, calorie trend, streak tracker
8. **Profile & Goals** — Personal info, calorie/macro goals, daily targets
9. **Settings** — Units, notifications, theme, data management
10. **Privacy Policy** — Full privacy policy (Apple required)
11. **Terms of Service** — Full terms of service (Apple required)
12. **Health Disclaimer** — Medical/health disclaimer (Apple required)

---

## Tab Bar (5 tabs)

| Tab | Icon | Screen |
|-----|------|--------|
| Home | house.fill | Dashboard |
| Log | plus.circle.fill | Food Log |
| Exercise | figure.run | Exercise Log |
| Progress | chart.bar.fill | Progress |
| Profile | person.fill | Profile |

---

## Primary Content & Functionality

### Home (Dashboard)
- Circular calorie progress ring (consumed vs. goal)
- Macro bars: Protein / Carbs / Fat (grams + %)
- Meal sections: Breakfast, Lunch, Dinner, Snacks (with calorie totals)
- Water intake tracker (cups/glasses)
- Quick-add recent foods
- Date navigation (prev/next day)

### Food Log
- Organized by meal type
- Each entry shows: food name, calories, serving size
- Swipe to delete
- Tap to edit serving
- Add food button per meal section

### Food Search
- Search bar with real-time filtering
- Built-in food database (500+ common foods)
- Recent foods list
- Custom food creation
- Barcode scanner placeholder (UI only)

### Food Detail
- Full nutrition facts panel (FDA-style)
- Serving size picker (slider + text input)
- Macro breakdown (protein, carbs, fat, fiber, sugar, sodium)
- Add to meal selector

### Exercise Log
- Cardio exercises (running, cycling, swimming, walking)
- Strength exercises (weights, bodyweight)
- Duration + calories burned estimation
- Daily exercise summary

### Progress
- Weight log with line chart
- 7-day calorie intake chart
- Streak counter
- BMI calculator display
- Goal progress percentage

### Profile & Goals
- Name, age, height, weight, gender
- Activity level selector
- Weight goal (lose/maintain/gain)
- Custom calorie target
- Macro ratio customization

### Settings
- Unit system (metric/imperial)
- Meal names customization
- Daily reminder notifications
- Dark/light mode toggle
- Export data option
- Privacy Policy link
- Terms of Service link
- Health Disclaimer link
- App version info

---

## Key User Flows

### Flow 1: Log a Meal
1. Tap "Log" tab → See meal sections
2. Tap "+" on Breakfast → Food Search screen
3. Type food name → Select from results
4. Adjust serving size → Tap "Add to Log"
5. Return to Home → See updated calorie ring

### Flow 2: Set Up Goals (Onboarding)
1. App launch → Onboarding screen
2. Enter name, age, height, weight
3. Select goal (lose/maintain/gain weight)
4. Select activity level
5. App calculates TDEE → Confirm calorie goal
6. Land on Home dashboard

### Flow 3: Track Progress
1. Tap "Progress" tab
2. View 7-day calorie chart
3. Log today's weight
4. See BMI and goal progress

---

## Color Choices

```
Primary Green:  #22C55E  — Main actions, progress rings, success states
Accent Orange:  #F97316  — Calories, energy, highlights
Blue:           #3B82F6  — Carbs macro color
Purple:         #A855F7  — Fat macro color
Red:            #EF4444  — Over-limit warnings, errors
Yellow:         #EAB308  — Protein macro color
Background:     #FFFFFF / #0F1117
Surface:        #F8FAFC / #1A1D23
Text:           #111827 / #F9FAFB
Muted:          #6B7280 / #9CA3AF
Border:         #E5E7EB / #374151
```

---

## Apple App Store Compliance

### Required Elements
- [x] Privacy Policy screen (accessible from Settings)
- [x] Terms of Service screen (accessible from Settings)
- [x] Health Disclaimer (shown on first launch + in Settings)
- [x] No medical claims — only general wellness tracking
- [x] Onboarding consent for data collection
- [x] Account deletion option in Profile
- [x] Contact/support information in Settings
- [x] Age-appropriate content (4+ rating)
- [x] No third-party data sharing without consent
- [x] Accurate metadata and app description

### Health Disclaimer Text
"Calorly is designed for general wellness and informational purposes only. It is not a medical device and should not be used to diagnose, treat, cure, or prevent any disease or health condition. Always consult a qualified healthcare professional before making significant changes to your diet or exercise routine. The calorie and nutrition information provided is for general reference only and may not be accurate for all individuals."
