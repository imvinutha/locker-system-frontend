import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native-web';
import { colors, radii, shadows } from '../theme';

const BookingSummaryCard = ({ summary, onDismiss }) => {
  if (!summary) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.badge}>
          <Text style={styles.badgeIcon}>✅</Text>
        </View>
        <Text style={styles.title}>Booking Confirmed!</Text>
        <View style={styles.detailBox}>
          <View style={styles.row}>
            <Text style={styles.label}>Drawer</Text>
            <Text style={styles.value}>{summary.drawerLabel || summary.drawerSize || 'Locker'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Locker ID</Text>
            <Text style={styles.value}>#{summary.lockerNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Duration</Text>
            <Text style={styles.value}>{summary.durationLabel}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total</Text>
            <Text style={styles.valueHighlight}>₹{Number(summary.amount).toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Access Code</Text>
            <Text style={styles.code}>{summary.accessCode}</Text>
          </View>
          {summary.expiresAt && (
            <View style={styles.row}>
              <Text style={styles.label}>Valid Till</Text>
              <Text style={styles.value}>
                {new Date(summary.expiresAt).toLocaleString()}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.footerNote}>
          Your drawer is ready! Share the access code with the attendant to open the locker.
        </Text>
        <TouchableOpacity style={styles.button} onPress={onDismiss}>
          <Text style={styles.buttonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 2000,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 24,
    alignItems: 'center',
    gap: 16,
    ...shadows.soft,
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  detailBox: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 16,
    gap: 10,
    backgroundColor: colors.background,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.textMuted,
    fontSize: 14,
  },
  value: {
    color: colors.text,
    fontWeight: '600',
  },
  valueHighlight: {
    color: colors.brandDark,
    fontWeight: '700',
  },
  code: {
    fontWeight: '800',
    fontSize: 20,
    color: colors.brand,
  },
  footerNote: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 13,
  },
  button: {
    backgroundColor: colors.brand,
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: 60,
  },
  buttonText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 16,
  },
});

export default BookingSummaryCard;

