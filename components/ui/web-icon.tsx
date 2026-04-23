/**
 * WebIcon — inline SVG icons that render on all platforms (web, iOS, Android).
 * No font dependency. Uses react-native-svg which is bundled with Expo.
 */
import React from "react";
import Svg, { Path, Circle, Rect, Line, Polyline, G } from "react-native-svg";

type IconName =
  | "home"
  | "log"
  | "exercise"
  | "progress"
  | "profile"
  | "chevron-left"
  | "chevron-right"
  | "plus"
  | "minus"
  | "flame"
  | "trash"
  | "search"
  | "check"
  | "close"
  | "settings"
  | "camera"
  | "water"
  | "scale"
  | "edit"
  | "info"
  | "lock"
  | "star"
  | "arrow-up"
  | "arrow-down"
  | "calendar"
  | "clock"
  | "barcode";

interface WebIconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function WebIcon({ name, size = 24, color = "#000", strokeWidth = 1.8 }: WebIconProps) {
  const sw = strokeWidth;
  const s = size;

  const icons: Record<IconName, React.ReactNode> = {
    home: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path d="M3 9.5L12 3l9 6.5V21a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M9 22V12h6v10" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
    log: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={sw} />
        <Path d="M12 8v4M12 16h.01" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        <Path d="M8 12h8" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        <Path d="M12 8v8" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      </Svg>
    ),
    exercise: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="4" r="1.5" stroke={color} strokeWidth={sw} />
        <Path d="M8 8l4 2 4-2" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M12 10v5" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        <Path d="M9 15l3 3 3-3" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M7 12l-2 3M17 12l2 3" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      </Svg>
    ),
    progress: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Rect x="3" y="14" width="4" height="7" rx="1" stroke={color} strokeWidth={sw} />
        <Rect x="10" y="9" width="4" height="12" rx="1" stroke={color} strokeWidth={sw} />
        <Rect x="17" y="4" width="4" height="17" rx="1" stroke={color} strokeWidth={sw} />
      </Svg>
    ),
    profile: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={sw} />
        <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      </Svg>
    ),
    "chevron-left": (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
    "chevron-right": (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
    plus: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      </Svg>
    ),
    minus: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path d="M5 12h14" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      </Svg>
    ),
    flame: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path d="M12 2c0 0-5 5-5 10a5 5 0 0010 0c0-2-1-4-2-5 0 2-1 3-2 3-1 0-2-1-2-3 0 0-1 2-1 4a3 3 0 006 0c0-3-2-6-4-9z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
    trash: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M10 11v6M14 11v6" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      </Svg>
    ),
    search: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth={sw} />
        <Path d="M16.5 16.5l4 4" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      </Svg>
    ),
    check: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path d="M5 12l5 5L19 7" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
    close: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      </Svg>
    ),
    settings: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={sw} />
        <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke={color} strokeWidth={sw} />
      </Svg>
    ),
    camera: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth={sw} />
      </Svg>
    ),
    water: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path d="M12 2L6 12a6 6 0 1012 0L12 2z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
    scale: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path d="M12 3v18M3 6h18" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        <Path d="M5 6l-2 6a4 4 0 008 0L9 6" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M15 6l-2 6a4 4 0 008 0L19 6" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
    edit: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
    info: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={sw} />
        <Path d="M12 16v-4M12 8h.01" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      </Svg>
    ),
    lock: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth={sw} />
        <Path d="M7 11V7a5 5 0 0110 0v4" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      </Svg>
    ),
    star: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
    "arrow-up": (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path d="M12 19V5M5 12l7-7 7 7" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
    "arrow-down": (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path d="M12 5v14M5 12l7 7 7-7" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
    calendar: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth={sw} />
        <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      </Svg>
    ),
    clock: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={sw} />
        <Path d="M12 6v6l4 2" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
    barcode: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path d="M3 9V5a2 2 0 012-2h4M3 15v4a2 2 0 002 2h4M21 9V5a2 2 0 00-2-2h-4M21 15v4a2 2 0 01-2 2h-4" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        <Path d="M7 8v8M10 8v8M13 8v8M17 8v8" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      </Svg>
    ),
  };

  return <>{icons[name] ?? null}</>;
}
