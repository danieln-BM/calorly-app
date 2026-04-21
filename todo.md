# Calorly - Project TODO

## Setup & Configuration
- [x] Update theme colors (green primary, orange accent)
- [x] Update app.config.ts with app name and branding
- [x] Generate and set app logo/icon
- [x] Configure tab bar with 5 tabs

## Data Layer
- [x] Create food database (80+ common foods with nutrition data)
- [x] Create AsyncStorage data service (food log, user profile, goals)
- [x] Create nutrition calculation utilities (TDEE, BMI, macros)
- [x] Create exercise database with calorie burn estimates

## Onboarding
- [x] Onboarding screen with welcome + goal setup
- [x] Personal info form (name, age, height, weight, gender)
- [x] Goal selector (lose/maintain/gain)
- [x] Activity level selector
- [x] TDEE calculation and calorie goal confirmation
- [x] Health disclaimer consent on first launch

## Home (Dashboard) Screen
- [x] Circular calorie progress ring
- [x] Macro breakdown bars (protein, carbs, fat)
- [x] Meal sections (Breakfast, Lunch, Dinner, Snacks)
- [x] Water intake tracker
- [x] Date navigation (prev/next day)
- [x] Quick-add recent foods
- [x] Free tier banner showing remaining daily logs

## Food Log Screen
- [x] Meal sections with food entries
- [x] Delete food entry (with confirmation)
- [x] Add food button per meal

## Food Search Screen
- [x] Search bar with real-time filtering
- [x] Built-in food database search
- [x] Recent foods list
- [x] Custom food creation form

## Food Detail Screen
- [x] Full nutrition facts panel (FDA-style)
- [x] Serving size picker
- [x] Macro breakdown display
- [x] Add to meal selector

## Exercise Log Screen
- [x] Exercise categories (cardio, strength, flexibility, sports)
- [x] Exercise search/selection
- [x] Duration and calories burned input
- [x] Daily exercise summary
- [x] Premium gating (redirect to paywall for free users)

## Progress Screen
- [x] Weight log with line chart (react-native-svg)
- [x] 7-day calorie intake bar chart
- [x] Streak counter
- [x] BMI display
- [x] Goal progress percentage
- [x] Premium gate with upgrade CTA for free users

## Profile & Goals Screen
- [x] Personal info editing
- [x] Activity level selector
- [x] Weight goal selector
- [x] Custom calorie target
- [x] Macro ratio customization
- [x] Account deletion option (Apple required)
- [x] Dark/light mode toggle
- [x] Subscription banner (Pro status or upgrade CTA)
- [x] Manage Subscription row (for premium users)
- [x] Restore Purchases row

## Legal Pages (Apple Required)
- [x] Privacy Policy screen
- [x] Terms of Service screen
- [x] Health Disclaimer screen
- [x] About screen

## Apple App Store Compliance
- [x] Health disclaimer on first launch (onboarding)
- [x] No medical claims in UI copy
- [x] Privacy policy accessible in-app
- [x] Terms of service accessible in-app
- [x] Account deletion functionality
- [x] Contact information in settings
- [x] Age-appropriate content (4+ rating)
- [x] App icon and splash screen

## Bug Fixes (Round 2)
- [x] Fix water tracking inconsistency (stale state - useFocusEffect ensures fresh load on tab focus)
- [x] Remove stray console.log from theme-provider.tsx
- [x] Fix missing key prop warning in food-search.tsx ListHeaderComponent

## Paywall / Subscriptions
- [x] Read iOS subscription manual and SOSA 2026 docs
- [x] Create subscription.ts (plan definitions, free tier limits, premium features list)
- [x] Create subscription-provider.tsx (React context with purchase/restore/cancel)
- [x] Wire SubscriptionProvider into root _layout.tsx
- [x] Create paywall.tsx screen (annual/monthly plans, feature list, Apple legal text)
- [x] Gate food logging at 5/day for free users (home screen)
- [x] Gate exercise logging for premium only (exercise tab)
- [x] Gate custom food creation for premium only (custom-food screen)
- [x] Gate progress charts for premium only (progress tab)
- [x] Add subscription banner to profile.tsx
- [x] Add Manage Subscription row for premium users in profile.tsx
- [x] Add Restore Purchases row in profile.tsx
- [x] Apple-required auto-renewal disclosure text on paywall
- [x] Privacy Policy and Terms links on paywall

## Barcode Scanner Feature
- [x] Read Expo camera/barcode docs
- [x] Create barcode-scanner.tsx screen with camera viewfinder
- [x] Integrate Open Food Facts API for barcode lookup
- [x] Map API response to Calorly FoodItem format
- [x] Handle not-found / error states gracefully
- [x] Add scan button to food-search.tsx header
- [x] Add icon mapping for barcode icon
- [x] Register barcode-scanner route in _layout.tsx
- [x] Add camera permission handling (iOS info.plist description)
- [x] Write unit tests for Open Food Facts data mapping
- [x] Gate barcode scanning behind premium (optional)

## QA Bug Fixes (Round 3)
- [x] Fix duplicate key `100` in food-detail.tsx serving size quick-select
- [x] Audit all screens for other duplicate key / list key issues
- [x] Audit home screen for stale state / display inconsistencies
- [x] Audit progress screen for any display bugs
- [x] Audit exercise screen for any display bugs

## Meal Templates Feature
- [x] Add meal templates data model to store.ts (saveMealTemplate, loadMealTemplates, deleteMealTemplate, logMealTemplate)
- [x] Create meal-templates.tsx screen (list of saved templates + create/delete)
- [x] Create save-meal-template.tsx modal (name the template, pick foods from today's log)
- [x] Add "Save as Template" button in food log screen
- [x] Add "Meal Templates" entry point in food-search or home screen
- [x] Register new routes in _layout.tsx
- [x] Add icon mappings for templates

## Weight Logging Widget
- [x] Add weight log data model to store.ts (already exists in progress screen - reuse)
- [x] Add weight quick-entry card to Home dashboard (same style as water tracker)
- [x] Show today's weight or last logged weight in the card
- [x] Sync with progress screen weight chart

## Nutrition Insights Widget
- [x] Add weekly insights computation to progress screen (avg calories, best streak, most-logged food)
- [x] Build InsightsCard component with animated stat tiles
- [x] Add "This Week at a Glance" section to Progress tab above charts

## Smart Paywall Placement (Research-Based)
- [x] Research top calorie counter app paywall placement strategies (MyFitnessPal, Cronometer, Cal AI, RevenueCat blog)
- [x] Add paywall trigger on Day 3 app open (engagement hook)
- [x] Add paywall trigger after logging 3rd food item in a day (value moment)
- [x] Add paywall trigger when user tries to view weekly trends (feature gate)
- [x] Add paywall trigger after completing onboarding (onboarding exit)
- [x] Add soft paywall nudge on exercise tab for free users
- [x] Track paywall trigger source for analytics context
- [x] Source-aware contextual copy on paywall screen (10 different headlines)
- [x] Paywall cooldown guard (auto-triggers respect 24h cooldown)
- [x] Fix Restore Purchases button to call restore() correctly

## BMR & BMI Features
- [x] Audit existing BMR/BMI utility functions in store.ts
- [x] Create dedicated bmi-detail.tsx screen with visual gauge, category explanation, health ranges table
- [x] Create dedicated bmr-detail.tsx screen with Mifflin-St Jeor formula breakdown, TDEE multipliers, activity level comparison
- [x] Add BMI gauge SVG component (color-coded arc: underweight → normal → overweight → obese)
- [x] Add BMR breakdown card showing calories at rest vs with activity
- [x] Wire BMI card in Progress tab to navigate to bmi-detail screen
- [x] Add BMR card to Profile tab showing daily burn estimate
- [x] Register bmi-detail and bmr-detail routes in _layout.tsx
- [x] Write unit tests for BMR calculation (Mifflin-St Jeor for male/female)
- [x] Write unit tests for BMI category classification (26 tests total)

## Paywall UI Tweaks
- [x] Show price per day under each plan's full price (instead of per month)

## Rebranding to Calorly
- [x] Audit all files for "NutriTrack", "Bulls Media", personal references — all replaced
- [x] Update app.config.ts: appName, bundle ID, logoUrl
- [x] Update all screen titles and in-app text (sed replaced all 40+ NutriTrack occurrences)
- [x] Update onboarding.tsx branding
- [x] Update paywall.tsx branding
- [x] Generate new Calorly app icon (green C ring + fork/leaf)
- [x] Copy new icon to all asset locations (icon, splash, favicon, android-foreground)
- [x] Update privacy-policy.tsx branding (done via sed)
- [x] Update terms-of-service.tsx branding (done via sed)
- [x] Update health-disclaimer.tsx branding (done via sed)
- [x] Update about.tsx branding (done via sed)
- [x] Verify store.ts AsyncStorage keys already use calorly_ prefix (confirmed)
- [x] Verify subscription.ts storage keys (confirmed clean)

## Compliance Audit Fixes
- [x] FIX-1: Remove expo-audio plugin + microphone permission from app.config.ts (not used)
- [x] FIX-2: Remove expo-video plugin from app.config.ts (not used)
- [x] FIX-3: Update privacy-policy.tsx to disclose Open Food Facts network call (barcode lookup)
- [x] FIX-4: Rename BMI category "Obese I/II+" to "Class I/II+" to avoid diagnostic framing

## RevenueCat Integration
- [x] Install react-native-purchases and react-native-purchases-ui
- [x] Add RevenueCat plugin to app.config.ts
- [x] Rewrite lib/subscription.ts with real RevenueCat SDK calls
- [x] Update lib/subscription-provider.tsx to use RevenueCat customer info
- [x] Replace paywall.tsx with RevenueCat Paywall UI component
- [x] Add Customer Center screen accessible from Profile tab
- [x] Update profile.tsx Manage Subscription to open Customer Center
- [x] Update tests to mock react-native-purchases

## Monetization & Paywall Strategy (v2)
- [x] Rewrite paywall.tsx — 2-tier pricing (Annual $39.99/yr pre-selected + Best Value + 7-day trial, Monthly $9.99/mo), X dismiss button, real RC packages
- [x] Hard paywall after onboarding — redirect to /paywall immediately after onboarding completes, before dashboard
- [x] Re-trigger paywall modal when free user taps any locked feature
- [x] Gate barcode scanner behind isPremium check
- [x] Gate full macro breakdown (carbs/fat/protein) — free users see calories only on home screen
- [x] Gate custom food creation behind isPremium check
- [x] Gate advanced progress charts (history >30 days, nutrient trends) behind isPremium check
- [x] Update subscription.ts — real RevenueCat purchasePackage() with annual/monthly packages
- [x] Update tests for new subscription flow

## Event Tracking System (Firebase Analytics)
- [x] Install @react-native-firebase/app and @react-native-firebase/analytics
- [x] Create lib/analytics.ts — typed event service layer with all event functions
- [x] onboarding_started — fires on first onboarding screen
- [x] onboarding_step_completed — fires on each step with step_number + step_name params
- [x] onboarding_completed — fires when onboarding finishes
- [x] permission_granted / permission_denied — fires after camera permission dialog
- [x] aha_moment_reached — fires when user logs their first food entry
- [x] paywall_viewed — fires every time paywall screen appears (trigger_source, variant, user_state params)
- [x] paywall_dismissed — fires when user taps X on paywall (time_on_paywall_seconds param)
- [x] paywall_cta_tapped — fires on CTA button tap (plan_selected param)
- [x] pricing_plan_selected — fires when user taps annual/monthly option (nice-to-have)
- [x] core_action_performed — fires when user logs a food entry (action_count param)
- [x] feature_used — fires for barcode scan, custom food, progress chart (feature_name param)
- [x] error_critical — fires on critical errors on paywall/purchase screens
- [x] Update app.config.ts with Firebase plugin
- [x] Write analytics unit tests

## Singular SDK Integration + ATT
- [x] Install singular-react-native package
- [x] Add singular-react-native Expo plugin to app.config.ts
- [x] Add NSUserTrackingUsageDescription to app.config.ts (iOS info.plist)
- [x] Create lib/singular.ts service layer with init, event wrappers, and revenue tracking
- [x] Create components/att-pre-prompt.tsx — custom pre-prompt modal before native ATT dialog
- [x] Wire ATT pre-prompt + Singular.init() in onboarding completion flow (after onboarding, before paywall)
- [x] Mirror all analytics events to Singular in analytics.ts (dual-track Firebase + Singular)
- [x] Set Singular customUserId when RevenueCat user ID is available
- [x] Track subscription revenue via Singular.revenue() on purchase
- [x] Write Singular unit tests

## Flow & Paywall Changes (Apr 2026)
- [x] Replace custom paywall UI with RevenueCat dashboard paywall (presentPaywallIfNeeded / RevenueCatUI)
- [x] Remove ATT pre-prompt modal — show only native Apple ATT dialog
- [x] Move ATT prompt to AFTER paywall (onboarding → paywall → ATT)
