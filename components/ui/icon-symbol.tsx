// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight } from "expo-symbols";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  // Navigation
  "house.fill": "home",
  "barcode.viewfinder": "qr-code-scanner",
  "person.fill": "person",
  "chart.bar.fill": "bar-chart",
  "plus.circle.fill": "add-circle",
  "figure.run": "directions-run",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "chevron.down": "expand-more",
  "chevron.up": "expand-less",
  
  // Food & Nutrition
  "fork.knife": "restaurant",
  "cup.and.saucer.fill": "coffee",
  "flame.fill": "local-fire-department",
  "drop.fill": "water-drop",
  "leaf.fill": "eco",
  "cart.fill": "shopping-cart",
  
  // Exercise
  "figure.walk": "directions-walk",
  "figure.outdoor.cycle": "directions-bike",
  "figure.pool.swim": "pool",
  "figure.jumprope": "fitness-center",
  "figure.elliptical": "fitness-center",
  "figure.rowing": "rowing",
  "figure.stair.stepper": "stairs",
  "figure.dance": "music-note",
  "figure.aerobics": "sports",
  "figure.strengthtraining.functional": "fitness-center",
  "figure.strengthtraining.traditional": "fitness-center",
  "figure.pilates": "self-improvement",
  "figure.yoga": "self-improvement",
  "figure.flexibility": "accessibility",
  "figure.taichi": "self-improvement",
  "figure.tennis": "sports-tennis",
  "figure.golf": "golf-course",
  "figure.hiking": "hiking",
  "dumbbell.fill": "fitness-center",
  "sportscourt.fill": "sports",
  "bolt.fill": "bolt",
  
  // UI Actions
  "plus": "add",
  "minus": "remove",
  "xmark": "close",
  "xmark.circle.fill": "cancel",
  "checkmark": "check",
  "checkmark.circle.fill": "check-circle",
  "trash.fill": "delete",
  "pencil": "edit",
  "square.and.pencil": "edit",
  "magnifyingglass": "search",
  "gear": "settings",
  "bell.fill": "notifications",
  "info.circle.fill": "info",
  "exclamationmark.triangle.fill": "warning",
  "arrow.left": "arrow-back",
  "arrow.right": "arrow-forward",
  "arrow.clockwise": "refresh",
  "star.fill": "star",
  "heart.fill": "favorite",
  "bookmark.fill": "bookmark",
  "share": "share",
  "doc.text.fill": "description",
  "lock.fill": "lock",
  "eye.fill": "visibility",
  "eye.slash.fill": "visibility-off",
  "moon.fill": "dark-mode",
  "sun.max.fill": "light-mode",
  "scalemass.fill": "scale",
  "target": "gps-fixed",
  "trophy.fill": "emoji-events",
  "calendar": "calendar-today",
  "clock.fill": "access-time",
  "arrow.up.right": "trending-up",
  "arrow.down.right": "trending-down",
  "minus.circle": "remove-circle-outline",
  "plus.circle": "add-circle-outline",
  "rectangle.stack.fill": "layers",
  "square.stack.3d.up.fill": "layers",
} as const;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
