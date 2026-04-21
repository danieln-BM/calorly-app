export interface FoodItem {
  id: string;
  name: string;
  category: string;
  calories: number; // per 100g
  protein: number; // g per 100g
  carbs: number; // g per 100g
  fat: number; // g per 100g
  fiber?: number; // g per 100g
  sugar?: number; // g per 100g
  sodium?: number; // mg per 100g
  defaultServing: number; // grams
  servingUnit: string;
}

export const FOOD_CATEGORIES = [
  "Fruits",
  "Vegetables",
  "Grains & Cereals",
  "Proteins",
  "Dairy",
  "Snacks",
  "Beverages",
  "Legumes",
  "Nuts & Seeds",
  "Oils & Fats",
  "Sweets",
  "Fast Food",
  "Custom",
] as const;

export const FOOD_DATABASE: FoodItem[] = [
  // === FRUITS ===
  { id: "f001", name: "Apple", category: "Fruits", calories: 52, protein: 0.3, carbs: 13.8, fat: 0.2, fiber: 2.4, sugar: 10.4, sodium: 1, defaultServing: 182, servingUnit: "1 medium (182g)" },
  { id: "f002", name: "Banana", category: "Fruits", calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, fiber: 2.6, sugar: 12.2, sodium: 1, defaultServing: 118, servingUnit: "1 medium (118g)" },
  { id: "f003", name: "Orange", category: "Fruits", calories: 47, protein: 0.9, carbs: 11.8, fat: 0.1, fiber: 2.4, sugar: 9.4, sodium: 0, defaultServing: 131, servingUnit: "1 medium (131g)" },
  { id: "f004", name: "Strawberries", category: "Fruits", calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2.0, sugar: 4.9, sodium: 1, defaultServing: 152, servingUnit: "1 cup (152g)" },
  { id: "f005", name: "Blueberries", category: "Fruits", calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3, fiber: 2.4, sugar: 10.0, sodium: 1, defaultServing: 148, servingUnit: "1 cup (148g)" },
  { id: "f006", name: "Grapes", category: "Fruits", calories: 69, protein: 0.7, carbs: 18.1, fat: 0.2, fiber: 0.9, sugar: 15.5, sodium: 2, defaultServing: 92, servingUnit: "1/2 cup (92g)" },
  { id: "f007", name: "Watermelon", category: "Fruits", calories: 30, protein: 0.6, carbs: 7.6, fat: 0.2, fiber: 0.4, sugar: 6.2, sodium: 1, defaultServing: 280, servingUnit: "2 cups (280g)" },
  { id: "f008", name: "Mango", category: "Fruits", calories: 60, protein: 0.8, carbs: 15.0, fat: 0.4, fiber: 1.6, sugar: 13.7, sodium: 1, defaultServing: 165, servingUnit: "1 cup (165g)" },
  { id: "f009", name: "Pineapple", category: "Fruits", calories: 50, protein: 0.5, carbs: 13.1, fat: 0.1, fiber: 1.4, sugar: 9.9, sodium: 1, defaultServing: 165, servingUnit: "1 cup (165g)" },
  { id: "f010", name: "Avocado", category: "Fruits", calories: 160, protein: 2.0, carbs: 8.5, fat: 14.7, fiber: 6.7, sugar: 0.7, sodium: 7, defaultServing: 150, servingUnit: "1 medium (150g)" },
  { id: "f011", name: "Peach", category: "Fruits", calories: 39, protein: 0.9, carbs: 9.5, fat: 0.3, fiber: 1.5, sugar: 8.4, sodium: 0, defaultServing: 150, servingUnit: "1 medium (150g)" },
  { id: "f012", name: "Pear", category: "Fruits", calories: 57, protein: 0.4, carbs: 15.2, fat: 0.1, fiber: 3.1, sugar: 9.8, sodium: 1, defaultServing: 178, servingUnit: "1 medium (178g)" },

  // === VEGETABLES ===
  { id: "v001", name: "Broccoli", category: "Vegetables", calories: 34, protein: 2.8, carbs: 6.6, fat: 0.4, fiber: 2.6, sugar: 1.7, sodium: 33, defaultServing: 91, servingUnit: "1 cup (91g)" },
  { id: "v002", name: "Spinach", category: "Vegetables", calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, sugar: 0.4, sodium: 79, defaultServing: 30, servingUnit: "1 cup raw (30g)" },
  { id: "v003", name: "Carrot", category: "Vegetables", calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2, fiber: 2.8, sugar: 4.7, sodium: 69, defaultServing: 61, servingUnit: "1 medium (61g)" },
  { id: "v004", name: "Sweet Potato", category: "Vegetables", calories: 86, protein: 1.6, carbs: 20.1, fat: 0.1, fiber: 3.0, sugar: 4.2, sodium: 55, defaultServing: 130, servingUnit: "1 medium (130g)" },
  { id: "v005", name: "Tomato", category: "Vegetables", calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, sugar: 2.6, sodium: 5, defaultServing: 123, servingUnit: "1 medium (123g)" },
  { id: "v006", name: "Cucumber", category: "Vegetables", calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5, sugar: 1.7, sodium: 2, defaultServing: 119, servingUnit: "1/2 cup (119g)" },
  { id: "v007", name: "Bell Pepper", category: "Vegetables", calories: 31, protein: 1.0, carbs: 6.0, fat: 0.3, fiber: 2.1, sugar: 4.2, sodium: 4, defaultServing: 119, servingUnit: "1 medium (119g)" },
  { id: "v008", name: "Onion", category: "Vegetables", calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7, sugar: 4.2, sodium: 4, defaultServing: 110, servingUnit: "1 medium (110g)" },
  { id: "v009", name: "Lettuce (Romaine)", category: "Vegetables", calories: 17, protein: 1.2, carbs: 3.3, fat: 0.3, fiber: 2.1, sugar: 1.2, sodium: 8, defaultServing: 47, servingUnit: "1 cup (47g)" },
  { id: "v010", name: "Corn", category: "Vegetables", calories: 86, protein: 3.2, carbs: 19.0, fat: 1.2, fiber: 2.7, sugar: 3.2, sodium: 15, defaultServing: 154, servingUnit: "1 cup (154g)" },
  { id: "v011", name: "Mushrooms", category: "Vegetables", calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3, fiber: 1.0, sugar: 2.0, sodium: 5, defaultServing: 96, servingUnit: "1 cup (96g)" },
  { id: "v012", name: "Kale", category: "Vegetables", calories: 49, protein: 4.3, carbs: 8.8, fat: 0.9, fiber: 3.6, sugar: 2.3, sodium: 38, defaultServing: 67, servingUnit: "1 cup (67g)" },

  // === GRAINS & CEREALS ===
  { id: "g001", name: "White Rice (cooked)", category: "Grains & Cereals", calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3, fiber: 0.4, sugar: 0.1, sodium: 1, defaultServing: 186, servingUnit: "1 cup cooked (186g)" },
  { id: "g002", name: "Brown Rice (cooked)", category: "Grains & Cereals", calories: 112, protein: 2.6, carbs: 23.5, fat: 0.9, fiber: 1.8, sugar: 0.4, sodium: 5, defaultServing: 195, servingUnit: "1 cup cooked (195g)" },
  { id: "g003", name: "Oatmeal (cooked)", category: "Grains & Cereals", calories: 71, protein: 2.5, carbs: 12.0, fat: 1.4, fiber: 1.7, sugar: 0.3, sodium: 49, defaultServing: 234, servingUnit: "1 cup cooked (234g)" },
  { id: "g004", name: "Whole Wheat Bread", category: "Grains & Cereals", calories: 247, protein: 13.0, carbs: 41.0, fat: 4.2, fiber: 7.0, sugar: 5.6, sodium: 400, defaultServing: 28, servingUnit: "1 slice (28g)" },
  { id: "g005", name: "White Bread", category: "Grains & Cereals", calories: 265, protein: 9.0, carbs: 49.0, fat: 3.2, fiber: 2.7, sugar: 5.0, sodium: 491, defaultServing: 25, servingUnit: "1 slice (25g)" },
  { id: "g006", name: "Pasta (cooked)", category: "Grains & Cereals", calories: 131, protein: 5.0, carbs: 25.0, fat: 1.1, fiber: 1.8, sugar: 0.6, sodium: 1, defaultServing: 140, servingUnit: "1 cup cooked (140g)" },
  { id: "g007", name: "Quinoa (cooked)", category: "Grains & Cereals", calories: 120, protein: 4.4, carbs: 21.3, fat: 1.9, fiber: 2.8, sugar: 0.9, sodium: 7, defaultServing: 185, servingUnit: "1 cup cooked (185g)" },
  { id: "g008", name: "Granola", category: "Grains & Cereals", calories: 471, protein: 10.5, carbs: 64.0, fat: 20.0, fiber: 5.3, sugar: 24.0, sodium: 35, defaultServing: 58, servingUnit: "1/2 cup (58g)" },
  { id: "g009", name: "Corn Tortilla", category: "Grains & Cereals", calories: 218, protein: 5.7, carbs: 45.9, fat: 2.8, fiber: 6.3, sugar: 1.0, sodium: 228, defaultServing: 26, servingUnit: "1 tortilla (26g)" },
  { id: "g010", name: "Bagel", category: "Grains & Cereals", calories: 270, protein: 10.5, carbs: 53.0, fat: 1.5, fiber: 2.3, sugar: 5.8, sodium: 443, defaultServing: 98, servingUnit: "1 medium (98g)" },

  // === PROTEINS ===
  { id: "p001", name: "Chicken Breast (cooked)", category: "Proteins", calories: 165, protein: 31.0, carbs: 0.0, fat: 3.6, fiber: 0, sugar: 0, sodium: 74, defaultServing: 140, servingUnit: "1 breast (140g)" },
  { id: "p002", name: "Salmon (cooked)", category: "Proteins", calories: 208, protein: 20.0, carbs: 0.0, fat: 13.4, fiber: 0, sugar: 0, sodium: 59, defaultServing: 154, servingUnit: "1 fillet (154g)" },
  { id: "p003", name: "Ground Beef 80/20 (cooked)", category: "Proteins", calories: 254, protein: 26.0, carbs: 0.0, fat: 17.0, fiber: 0, sugar: 0, sodium: 82, defaultServing: 100, servingUnit: "100g" },
  { id: "p004", name: "Egg (whole)", category: "Proteins", calories: 155, protein: 13.0, carbs: 1.1, fat: 11.0, fiber: 0, sugar: 1.1, sodium: 124, defaultServing: 50, servingUnit: "1 large (50g)" },
  { id: "p005", name: "Tuna (canned in water)", category: "Proteins", calories: 116, protein: 25.5, carbs: 0.0, fat: 1.0, fiber: 0, sugar: 0, sodium: 320, defaultServing: 85, servingUnit: "3 oz (85g)" },
  { id: "p006", name: "Turkey Breast (cooked)", category: "Proteins", calories: 135, protein: 30.0, carbs: 0.0, fat: 1.0, fiber: 0, sugar: 0, sodium: 63, defaultServing: 85, servingUnit: "3 oz (85g)" },
  { id: "p007", name: "Shrimp (cooked)", category: "Proteins", calories: 99, protein: 24.0, carbs: 0.2, fat: 0.3, fiber: 0, sugar: 0, sodium: 111, defaultServing: 85, servingUnit: "3 oz (85g)" },
  { id: "p008", name: "Tofu (firm)", category: "Proteins", calories: 76, protein: 8.0, carbs: 1.9, fat: 4.8, fiber: 0.3, sugar: 0.5, sodium: 7, defaultServing: 126, servingUnit: "1/2 cup (126g)" },
  { id: "p009", name: "Pork Tenderloin (cooked)", category: "Proteins", calories: 143, protein: 26.0, carbs: 0.0, fat: 3.5, fiber: 0, sugar: 0, sodium: 57, defaultServing: 85, servingUnit: "3 oz (85g)" },
  { id: "p010", name: "Tilapia (cooked)", category: "Proteins", calories: 128, protein: 26.0, carbs: 0.0, fat: 2.7, fiber: 0, sugar: 0, sodium: 52, defaultServing: 87, servingUnit: "1 fillet (87g)" },

  // === DAIRY ===
  { id: "d001", name: "Whole Milk", category: "Dairy", calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0, sugar: 5.1, sodium: 43, defaultServing: 244, servingUnit: "1 cup (244ml)" },
  { id: "d002", name: "Greek Yogurt (plain, 0%)", category: "Dairy", calories: 59, protein: 10.0, carbs: 3.6, fat: 0.4, fiber: 0, sugar: 3.2, sodium: 36, defaultServing: 170, servingUnit: "6 oz (170g)" },
  { id: "d003", name: "Cheddar Cheese", category: "Dairy", calories: 403, protein: 25.0, carbs: 1.3, fat: 33.0, fiber: 0, sugar: 0.5, sodium: 621, defaultServing: 28, servingUnit: "1 oz (28g)" },
  { id: "d004", name: "Cottage Cheese (1%)", category: "Dairy", calories: 72, protein: 12.4, carbs: 2.7, fat: 1.0, fiber: 0, sugar: 2.7, sodium: 459, defaultServing: 226, servingUnit: "1 cup (226g)" },
  { id: "d005", name: "Butter", category: "Dairy", calories: 717, protein: 0.9, carbs: 0.1, fat: 81.1, fiber: 0, sugar: 0.1, sodium: 11, defaultServing: 14, servingUnit: "1 tbsp (14g)" },
  { id: "d006", name: "Mozzarella Cheese", category: "Dairy", calories: 280, protein: 28.0, carbs: 2.2, fat: 17.0, fiber: 0, sugar: 1.0, sodium: 486, defaultServing: 28, servingUnit: "1 oz (28g)" },
  { id: "d007", name: "Skim Milk", category: "Dairy", calories: 34, protein: 3.4, carbs: 5.0, fat: 0.1, fiber: 0, sugar: 5.1, sodium: 42, defaultServing: 244, servingUnit: "1 cup (244ml)" },
  { id: "d008", name: "Cream Cheese", category: "Dairy", calories: 342, protein: 6.2, carbs: 4.1, fat: 34.0, fiber: 0, sugar: 3.8, sodium: 321, defaultServing: 29, servingUnit: "2 tbsp (29g)" },

  // === LEGUMES ===
  { id: "l001", name: "Black Beans (cooked)", category: "Legumes", calories: 132, protein: 8.9, carbs: 23.7, fat: 0.5, fiber: 8.7, sugar: 0.3, sodium: 2, defaultServing: 172, servingUnit: "1 cup (172g)" },
  { id: "l002", name: "Chickpeas (cooked)", category: "Legumes", calories: 164, protein: 8.9, carbs: 27.4, fat: 2.6, fiber: 7.6, sugar: 4.8, sodium: 24, defaultServing: 164, servingUnit: "1 cup (164g)" },
  { id: "l003", name: "Lentils (cooked)", category: "Legumes", calories: 116, protein: 9.0, carbs: 20.0, fat: 0.4, fiber: 7.9, sugar: 1.8, sodium: 2, defaultServing: 198, servingUnit: "1 cup (198g)" },
  { id: "l004", name: "Kidney Beans (cooked)", category: "Legumes", calories: 127, protein: 8.7, carbs: 22.8, fat: 0.5, fiber: 7.4, sugar: 0.3, sodium: 2, defaultServing: 177, servingUnit: "1 cup (177g)" },
  { id: "l005", name: "Edamame", category: "Legumes", calories: 122, protein: 11.0, carbs: 8.9, fat: 5.2, fiber: 5.2, sugar: 2.2, sodium: 9, defaultServing: 155, servingUnit: "1 cup (155g)" },

  // === NUTS & SEEDS ===
  { id: "n001", name: "Almonds", category: "Nuts & Seeds", calories: 579, protein: 21.2, carbs: 21.6, fat: 49.9, fiber: 12.5, sugar: 4.4, sodium: 1, defaultServing: 28, servingUnit: "1 oz (28g)" },
  { id: "n002", name: "Peanut Butter", category: "Nuts & Seeds", calories: 588, protein: 25.1, carbs: 20.1, fat: 50.4, fiber: 6.0, sugar: 9.2, sodium: 471, defaultServing: 32, servingUnit: "2 tbsp (32g)" },
  { id: "n003", name: "Walnuts", category: "Nuts & Seeds", calories: 654, protein: 15.2, carbs: 13.7, fat: 65.2, fiber: 6.7, sugar: 2.6, sodium: 2, defaultServing: 28, servingUnit: "1 oz (28g)" },
  { id: "n004", name: "Chia Seeds", category: "Nuts & Seeds", calories: 486, protein: 16.5, carbs: 42.1, fat: 30.7, fiber: 34.4, sugar: 0.0, sodium: 16, defaultServing: 28, servingUnit: "1 oz (28g)" },
  { id: "n005", name: "Cashews", category: "Nuts & Seeds", calories: 553, protein: 18.2, carbs: 30.2, fat: 43.8, fiber: 3.3, sugar: 5.9, sodium: 12, defaultServing: 28, servingUnit: "1 oz (28g)" },
  { id: "n006", name: "Sunflower Seeds", category: "Nuts & Seeds", calories: 584, protein: 20.8, carbs: 20.0, fat: 51.5, fiber: 8.6, sugar: 2.6, sodium: 9, defaultServing: 28, servingUnit: "1 oz (28g)" },

  // === SNACKS ===
  { id: "s001", name: "Potato Chips", category: "Snacks", calories: 536, protein: 7.0, carbs: 53.0, fat: 35.0, fiber: 4.8, sugar: 0.4, sodium: 525, defaultServing: 28, servingUnit: "1 oz (28g)" },
  { id: "s002", name: "Popcorn (air-popped)", category: "Snacks", calories: 387, protein: 12.9, carbs: 77.9, fat: 4.5, fiber: 14.5, sugar: 0.9, sodium: 8, defaultServing: 28, servingUnit: "1 oz (28g)" },
  { id: "s003", name: "Dark Chocolate (70%)", category: "Snacks", calories: 598, protein: 7.8, carbs: 45.9, fat: 42.6, fiber: 10.9, sugar: 24.0, sodium: 20, defaultServing: 40, servingUnit: "4 squares (40g)" },
  { id: "s004", name: "Rice Cakes", category: "Snacks", calories: 387, protein: 8.2, carbs: 80.9, fat: 2.8, fiber: 1.5, sugar: 0.1, sodium: 10, defaultServing: 9, servingUnit: "1 cake (9g)" },
  { id: "s005", name: "Protein Bar", category: "Snacks", calories: 370, protein: 20.0, carbs: 43.0, fat: 12.0, fiber: 3.0, sugar: 25.0, sodium: 200, defaultServing: 60, servingUnit: "1 bar (60g)" },

  // === BEVERAGES ===
  { id: "b001", name: "Orange Juice", category: "Beverages", calories: 45, protein: 0.7, carbs: 10.4, fat: 0.2, fiber: 0.2, sugar: 8.4, sodium: 1, defaultServing: 240, servingUnit: "1 cup (240ml)" },
  { id: "b002", name: "Coffee (black)", category: "Beverages", calories: 2, protein: 0.3, carbs: 0.0, fat: 0.0, fiber: 0, sugar: 0, sodium: 5, defaultServing: 240, servingUnit: "1 cup (240ml)" },
  { id: "b003", name: "Whole Milk Latte", category: "Beverages", calories: 190, protein: 12.0, carbs: 19.0, fat: 7.0, fiber: 0, sugar: 18.0, sodium: 170, defaultServing: 354, servingUnit: "12 oz (354ml)" },
  { id: "b004", name: "Cola (regular)", category: "Beverages", calories: 41, protein: 0.0, carbs: 10.6, fat: 0.0, fiber: 0, sugar: 10.6, sodium: 4, defaultServing: 355, servingUnit: "12 oz can (355ml)" },
  { id: "b005", name: "Green Tea", category: "Beverages", calories: 2, protein: 0.2, carbs: 0.5, fat: 0.0, fiber: 0, sugar: 0, sodium: 2, defaultServing: 240, servingUnit: "1 cup (240ml)" },
  { id: "b006", name: "Apple Juice", category: "Beverages", calories: 46, protein: 0.1, carbs: 11.3, fat: 0.1, fiber: 0.2, sugar: 9.6, sodium: 4, defaultServing: 240, servingUnit: "1 cup (240ml)" },
  { id: "b007", name: "Protein Shake (whey)", category: "Beverages", calories: 120, protein: 25.0, carbs: 5.0, fat: 2.0, fiber: 0, sugar: 3.0, sodium: 150, defaultServing: 300, servingUnit: "1 serving (300ml)" },

  // === OILS & FATS ===
  { id: "o001", name: "Olive Oil", category: "Oils & Fats", calories: 884, protein: 0.0, carbs: 0.0, fat: 100.0, fiber: 0, sugar: 0, sodium: 2, defaultServing: 14, servingUnit: "1 tbsp (14g)" },
  { id: "o002", name: "Coconut Oil", category: "Oils & Fats", calories: 862, protein: 0.0, carbs: 0.0, fat: 100.0, fiber: 0, sugar: 0, sodium: 0, defaultServing: 14, servingUnit: "1 tbsp (14g)" },
  { id: "o003", name: "Mayonnaise", category: "Oils & Fats", calories: 680, protein: 1.0, carbs: 0.6, fat: 74.9, fiber: 0, sugar: 0.4, sodium: 635, defaultServing: 15, servingUnit: "1 tbsp (15g)" },

  // === SWEETS ===
  { id: "sw001", name: "Vanilla Ice Cream", category: "Sweets", calories: 207, protein: 3.5, carbs: 23.6, fat: 11.0, fiber: 0.6, sugar: 21.2, sodium: 80, defaultServing: 132, servingUnit: "1/2 cup (132g)" },
  { id: "sw002", name: "Chocolate Cake", category: "Sweets", calories: 352, protein: 5.0, carbs: 50.7, fat: 15.0, fiber: 2.0, sugar: 34.0, sodium: 299, defaultServing: 100, servingUnit: "1 slice (100g)" },
  { id: "sw003", name: "Honey", category: "Sweets", calories: 304, protein: 0.3, carbs: 82.4, fat: 0.0, fiber: 0.2, sugar: 82.1, sodium: 4, defaultServing: 21, servingUnit: "1 tbsp (21g)" },
  { id: "sw004", name: "Donut (glazed)", category: "Sweets", calories: 452, protein: 4.9, carbs: 51.3, fat: 25.0, fiber: 1.5, sugar: 22.0, sodium: 326, defaultServing: 60, servingUnit: "1 donut (60g)" },

  // === FAST FOOD ===
  { id: "ff001", name: "Cheeseburger (fast food)", category: "Fast Food", calories: 303, protein: 15.0, carbs: 32.0, fat: 13.0, fiber: 1.3, sugar: 7.0, sodium: 750, defaultServing: 113, servingUnit: "1 burger (113g)" },
  { id: "ff002", name: "French Fries (medium)", category: "Fast Food", calories: 312, protein: 3.4, carbs: 41.0, fat: 15.0, fiber: 3.8, sugar: 0.3, sodium: 282, defaultServing: 117, servingUnit: "medium (117g)" },
  { id: "ff003", name: "Pepperoni Pizza (1 slice)", category: "Fast Food", calories: 298, protein: 12.1, carbs: 33.6, fat: 12.9, fiber: 2.3, sugar: 3.6, sodium: 701, defaultServing: 107, servingUnit: "1 slice (107g)" },
  { id: "ff004", name: "Chicken Nuggets (6pc)", category: "Fast Food", calories: 280, protein: 14.0, carbs: 18.0, fat: 16.0, fiber: 0.5, sugar: 0.0, sodium: 540, defaultServing: 100, servingUnit: "6 pieces (100g)" },
  { id: "ff005", name: "Burrito (bean & cheese)", category: "Fast Food", calories: 189, protein: 8.0, carbs: 27.0, fat: 6.0, fiber: 3.0, sugar: 1.0, sodium: 490, defaultServing: 170, servingUnit: "1 burrito (170g)" },
];

export function searchFoods(query: string): FoodItem[] {
  if (!query.trim()) return FOOD_DATABASE;
  const lower = query.toLowerCase();
  return FOOD_DATABASE.filter(
    (f) =>
      f.name.toLowerCase().includes(lower) ||
      f.category.toLowerCase().includes(lower)
  );
}

export function getFoodById(id: string): FoodItem | undefined {
  return FOOD_DATABASE.find((f) => f.id === id);
}

export function getFoodsByCategory(category: string): FoodItem[] {
  return FOOD_DATABASE.filter((f) => f.category === category);
}
