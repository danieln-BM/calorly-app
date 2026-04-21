import React, { useCallback, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  Dimensions,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import Svg, {
  Path,
  Circle,
  Text as SvgText,
  G,
  Line,
} from "react-native-svg";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  loadProfile,
  calculateBMI,
  getBMIDetail,
  UserProfile,
  DEFAULT_PROFILE,
} from "@/lib/store";

const SCREEN_WIDTH = Dimensions.get("window").width;
const GAUGE_SIZE = Math.min(SCREEN_WIDTH - 64, 280);
const CX = GAUGE_SIZE / 2;
const CY = GAUGE_SIZE / 2;
const R = GAUGE_SIZE * 0.38;

// Convert BMI value to angle on the arc (180° arc from left to right)
// BMI range displayed: 10 – 45
const BMI_MIN = 10;
const BMI_MAX = 45;
function bmiToAngle(bmi: number): number {
  const clamped = Math.max(BMI_MIN, Math.min(BMI_MAX, bmi));
  const pct = (clamped - BMI_MIN) / (BMI_MAX - BMI_MIN);
  return 180 + pct * 180; // 180° (left) → 360° (right)
}

function polarToXY(angleDeg: number, radius: number, cx: number, cy: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

// Draw an arc segment
function arcPath(startAngle: number, endAngle: number, r: number, cx: number, cy: number, thickness: number): string {
  const s = polarToXY(startAngle, r, cx, cy);
  const e = polarToXY(endAngle, r, cx, cy);
  const si = polarToXY(startAngle, r - thickness, cx, cy);
  const ei = polarToXY(endAngle, r - thickness, cx, cy);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${s.x} ${s.y}`,
    `A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`,
    `L ${ei.x} ${ei.y}`,
    `A ${r - thickness} ${r - thickness} 0 ${large} 0 ${si.x} ${si.y}`,
    "Z",
  ].join(" ");
}

const BMI_SEGMENTS = [
  { label: "Underweight", min: 10, max: 18.5, color: "#3B82F6" },
  { label: "Normal",      min: 18.5, max: 25,  color: "#22C55E" },
  { label: "Overweight",  min: 25,   max: 30,  color: "#F59E0B" },
  { label: "High BMI I",  min: 30,   max: 35,  color: "#EF4444" },
  { label: "High BMI II+",min: 35,   max: 45,  color: "#B91C1C" },
];

const THICKNESS = GAUGE_SIZE * 0.13;

function BMIGauge({ bmi, color }: { bmi: number; color: string }) {
  const needleAngle = bmiToAngle(bmi);
  const needleTip = polarToXY(needleAngle, R - THICKNESS / 2, CX, CY);
  const needleBase1 = polarToXY(needleAngle + 90, 8, CX, CY);
  const needleBase2 = polarToXY(needleAngle - 90, 8, CX, CY);

  return (
    <Svg width={GAUGE_SIZE} height={GAUGE_SIZE * 0.6} viewBox={`0 ${CY - 8} ${GAUGE_SIZE} ${GAUGE_SIZE * 0.6}`}>
      {/* Segments */}
      {BMI_SEGMENTS.map((seg) => (
        <Path
          key={seg.label}
          d={arcPath(bmiToAngle(seg.min), bmiToAngle(seg.max), R, CX, CY, THICKNESS)}
          fill={seg.color}
          opacity={0.9}
        />
      ))}

      {/* Needle */}
      <Path
        d={`M ${needleBase1.x} ${needleBase1.y} L ${needleTip.x} ${needleTip.y} L ${needleBase2.x} ${needleBase2.y} Z`}
        fill={color}
      />
      {/* Center dot */}
      <Circle cx={CX} cy={CY} r={10} fill={color} />
      <Circle cx={CX} cy={CY} r={5} fill="white" />

      {/* BMI value label */}
      <SvgText
        x={CX}
        y={CY - 28}
        textAnchor="middle"
        fontSize={28}
        fontWeight="800"
        fill={color}
      >
        {bmi.toFixed(1)}
      </SvgText>
      <SvgText
        x={CX}
        y={CY - 12}
        textAnchor="middle"
        fontSize={11}
        fill="#888"
      >
        BMI
      </SvgText>
    </Svg>
  );
}

const BMI_TABLE = [
  { range: "< 18.5",    category: "Underweight",      color: "#3B82F6" },
  { range: "18.5–24.9", category: "Normal weight",    color: "#22C55E" },
  { range: "25–29.9",   category: "Overweight",       color: "#F59E0B" },
  { range: "30–34.9",   category: "High BMI (Class I)",  color: "#EF4444" },
  { range: "≥ 35",      category: "High BMI (Class II+)",color: "#B91C1C" },
];

export default function BMIDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  useFocusEffect(
    useCallback(() => {
      loadProfile().then(setProfile);
    }, [])
  );

  const bmi = calculateBMI(profile.weightKg, profile.heightCm);
  const detail = getBMIDetail(bmi);

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20, gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
              padding: 8,
              borderRadius: 10,
              backgroundColor: colors.surface,
            })}
          >
            <Text style={{ fontSize: 20 }}>←</Text>
          </Pressable>
          <View>
            <Text style={{ fontSize: 24, fontWeight: "800", color: colors.foreground }}>BMI Calculator</Text>
            <Text style={{ fontSize: 13, color: colors.muted }}>Body Mass Index</Text>
          </View>
        </View>

        {/* Gauge Card */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 20,
            padding: 20,
            alignItems: "center",
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <BMIGauge bmi={bmi} color={detail.color} />

          {/* Category badge */}
          <View
            style={{
              marginTop: 8,
              paddingHorizontal: 16,
              paddingVertical: 6,
              borderRadius: 20,
              backgroundColor: detail.color + "22",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "800", color: detail.color }}>
              {detail.category}
            </Text>
          </View>

          <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center", marginTop: 8, lineHeight: 19 }}>
            {detail.description}
          </Text>
        </View>

        {/* Your Stats */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
            Your Stats
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1, backgroundColor: colors.background, borderRadius: 12, padding: 12, alignItems: "center" }}>
              <Text style={{ fontSize: 22, fontWeight: "800", color: colors.primary }}>
                {profile.weightKg} kg
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>Weight</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.background, borderRadius: 12, padding: 12, alignItems: "center" }}>
              <Text style={{ fontSize: 22, fontWeight: "800", color: colors.primary }}>
                {profile.heightCm} cm
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>Height</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.background, borderRadius: 12, padding: 12, alignItems: "center" }}>
              <Text style={{ fontSize: 22, fontWeight: "800", color: detail.color }}>
                {bmi.toFixed(1)}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>BMI</Text>
            </View>
          </View>

          {/* Healthy weight range */}
          {(() => {
            const hMin = Math.round(18.5 * (profile.heightCm / 100) ** 2 * 10) / 10;
            const hMax = Math.round(24.9 * (profile.heightCm / 100) ** 2 * 10) / 10;
            return (
              <View
                style={{
                  marginTop: 12,
                  backgroundColor: "#22C55E18",
                  borderRadius: 10,
                  padding: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Text style={{ fontSize: 18 }}>🎯</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#22C55E" }}>
                    Healthy weight for your height
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                    {hMin} – {hMax} kg (BMI 18.5–24.9)
                  </Text>
                </View>
              </View>
            );
          })()}
        </View>

        {/* Advice Card */}
        <View
          style={{
            backgroundColor: detail.color + "12",
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            borderLeftWidth: 4,
            borderLeftColor: detail.color,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "700", color: detail.color, marginBottom: 6 }}>
            💡 What this means for you
          </Text>
          <Text style={{ fontSize: 13, color: colors.foreground, lineHeight: 20 }}>
            {detail.advice}
          </Text>
        </View>

        {/* BMI Ranges Table */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
            BMI Classification (WHO)
          </Text>
          {BMI_TABLE.map((row, i) => (
            <View
              key={row.range}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 10,
                borderBottomWidth: i < BMI_TABLE.length - 1 ? 1 : 0,
                borderBottomColor: colors.border,
                backgroundColor: row.category === detail.category ? row.color + "14" : "transparent",
                borderRadius: 8,
                paddingHorizontal: 8,
                marginHorizontal: -8,
              }}
            >
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: row.color,
                  marginRight: 10,
                }}
              />
              <Text style={{ flex: 1, fontSize: 13, color: colors.foreground, fontWeight: row.category === detail.category ? "700" : "400" }}>
                {row.category}
              </Text>
              <Text style={{ fontSize: 13, color: colors.muted, fontWeight: "600" }}>{row.range}</Text>
              {row.category === detail.category && (
                <Text style={{ marginLeft: 8, fontSize: 12 }}>◀</Text>
              )}
            </View>
          ))}
        </View>

        {/* Disclaimer */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 11, color: colors.muted, lineHeight: 17, textAlign: "center" }}>
            ⚠️ BMI is a screening tool, not a diagnostic measure. It does not account for muscle mass, bone density, age, or ethnicity. Always consult a qualified healthcare professional for medical advice.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
