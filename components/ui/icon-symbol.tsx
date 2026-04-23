/**
 * IconSymbol — cross-platform icon component.
 * On web: uses inline SVG (WebIcon) — zero font dependency, renders everywhere.
 * On native: uses MaterialIcons from @expo/vector-icons.
 */
import { Platform } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight } from "expo-symbols";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";
import { WebIcon } from "./web-icon";

type IconSymbolName = keyof typeof MAPPING;

// Map SF Symbol names → WebIcon names for web
const WEB_MAPPING: Record<string, string> = {
  "house.fill": "home",
  "barcode.viewfinder": "barcode",
  "person.fill": "profile",
  "chart.bar.fill": "progress",
  "plus.circle.fill": "log",
  "figure.run": "exercise",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "chevron.down": "chevron-right",
  "chevron.up": "chevron-left",
  "flame.fill": "flame",
  "drop.fill": "water",
  "cup.and.saucer.fill": "water",
  "plus": "plus",
  "minus": "minus",
  "xmark": "close",
  "xmark.circle.fill": "close",
  "checkmark": "check",
  "checkmark.circle.fill": "check",
  "trash.fill": "trash",
  "pencil": "edit",
  "square.and.pencil": "edit",
  "magnifyingglass": "search",
  "gear": "settings",
  "info.circle.fill": "info",
  "exclamationmark.triangle.fill": "info",
  "arrow.left": "chevron-left",
  "arrow.right": "chevron-right",
  "arrow.clockwise": "arrow-up",
  "star.fill": "star",
  "heart.fill": "star",
  "bookmark.fill": "star",
  "lock.fill": "lock",
  "scalemass.fill": "scale",
  "trophy.fill": "star",
  "calendar": "calendar",
  "clock.fill": "clock",
  "arrow.up.right": "arrow-up",
  "arrow.down.right": "arrow-down",
  "minus.circle": "minus",
  "plus.circle": "plus",
  "rectangle.stack.fill": "log",
  "square.stack.3d.up.fill": "log",
  "bolt.fill": "flame",
  "dumbbell.fill": "exercise",
  "figure.walk": "exercise",
  "figure.outdoor.cycle": "exercise",
  "figure.pool.swim": "exercise",
  "figure.jumprope": "exercise",
  "figure.elliptical": "exercise",
  "figure.rowing": "exercise",
  "figure.stair.stepper": "exercise",
  "figure.dance": "exercise",
  "figure.aerobics": "exercise",
  "figure.strengthtraining.functional": "exercise",
  "figure.strengthtraining.traditional": "exercise",
  "figure.pilates": "exercise",
  "figure.yoga": "exercise",
  "figure.flexibility": "exercise",
  "figure.taichi": "exercise",
  "figure.tennis": "exercise",
  "figure.golf": "exercise",
  "figure.hiking": "exercise",
  "sportscourt.fill": "exercise",
  "fork.knife": "log",
  "cart.fill": "log",
  "leaf.fill": "star",
  "bell.fill": "info",
  "share": "arrow-up",
  "doc.text.fill": "info",
  "eye.fill": "info",
  "eye.slash.fill": "close",
  "moon.fill": "star",
  "sun.max.fill": "star",
  "target": "progress",
  "paperplane.fill": "arrow-up",
  "chevron.left.forwardslash.chevron.right": "close",
};

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
  // On web: use inline SVG — guaranteed to render without font loading
  if (Platform.OS === "web") {
    const svgName = (WEB_MAPPING[name] ?? "info") as any;
    return <WebIcon name={svgName} size={size} color={color as string} />;
  }
  // On native: use MaterialIcons
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
