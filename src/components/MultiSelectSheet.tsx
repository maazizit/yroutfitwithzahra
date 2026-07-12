import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, serif, shadow } from '@/theme';

export interface SelectOption {
  id: string;
  label: string;
  swatch?: string;
}

interface Props {
  visible: boolean;
  title: string;
  subtitle?: string;
  options: SelectOption[];
  groups?: Array<{ title: string; optionIds: string[] }>;
  selected: string[];
  onChange: (selected: string[]) => void;
  onClose: () => void;
}

const SHEET_MAX_WIDTH = 520;

function SheetButton({
  label,
  variant,
  onPress,
}: {
  label: string;
  variant: 'clear' | 'apply';
  onPress: () => void;
}) {
  const isApply = variant === 'apply';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.footerBtn,
        isApply ? styles.applyBtn : styles.clearBtn,
        pressed && styles.footerBtnPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={isApply ? styles.applyText : styles.clearText}>{label}</Text>
    </Pressable>
  );
}

export function MultiSelectSheet({
  visible,
  title,
  subtitle,
  options,
  groups,
  selected,
  onChange,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const sheetWidth = Math.min(screenWidth, SHEET_MAX_WIDTH);
  const optionMap = new Map(options.map((o) => [o.id, o]));

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  const renderChip = (id: string) => {
    const opt = optionMap.get(id);
    if (!opt) return null;
    const active = selected.includes(id);
    return (
      <Pressable
        key={id}
        onPress={() => toggle(id)}
        style={({ pressed }) => [
          styles.chip,
          active && styles.chipActive,
          pressed && styles.chipPressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
      >
        {opt.swatch ? (
          <View style={[styles.swatch, { backgroundColor: opt.swatch }, active && styles.swatchActive]} />
        ) : null}
        <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
        {active ? <Text style={styles.check}>✓</Text> : null}
      </Pressable>
    );
  };

  const sections = groups?.length
    ? groups.map((g) => ({ title: g.title, ids: g.optionIds }))
    : [{ title: '', ids: options.map((o) => o.id) }];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fermer" />
        <View
          style={[
            styles.sheet,
            {
              width: sheetWidth,
              alignSelf: screenWidth > SHEET_MAX_WIDTH ? 'center' : 'stretch',
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {sections.map((section) => (
              <View key={section.title || 'all'} style={styles.section}>
                {section.title ? <Text style={styles.sectionTitle}>{section.title}</Text> : null}
                <View style={styles.grid}>{section.ids.map(renderChip)}</View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <SheetButton label="Tout effacer" variant="clear" onPress={() => onChange([])} />
            <SheetButton
              label={`Appliquer${selected.length > 0 ? ` (${selected.length})` : ''}`}
              variant="apply"
              onPress={onClose}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(38, 34, 27, 0.45)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: colors.ivory,
    borderTopLeftRadius: radius.lg + 4,
    borderTopRightRadius: radius.lg + 4,
    maxHeight: '82%',
    paddingTop: 10,
    ...shadow.float,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 14,
  },
  title: {
    fontFamily: serif,
    fontSize: 22,
    color: colors.ink,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 4,
    paddingHorizontal: 24,
    lineHeight: 18,
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
    marginTop: 12,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 16,
    gap: 16,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 42,
  },
  chipActive: {
    borderColor: colors.ink,
    backgroundColor: colors.goldSoft,
  },
  chipPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  swatch: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.border,
  },
  swatchActive: {
    borderColor: colors.ink,
    borderWidth: 2,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.muted,
  },
  chipTextActive: {
    color: colors.ink,
    fontWeight: '700',
  },
  check: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.ivory,
  },
  footerBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  clearBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  clearText: {
    color: colors.muted,
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  applyBtn: {
    flex: 1.35,
    backgroundColor: colors.ink,
  },
  applyText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
