import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native-web';
import axios from 'axios';
import { API_URL } from '../config';
import { colors, radii, shadows } from '../theme';

const AccessCodeUnlock = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleUnlock = async () => {
    const trimmed = code.trim();
    if (trimmed.length < 4) {
      setFeedback({ type: 'error', message: 'Please enter the 4-digit access code.' });
      return;
    }

    try {
      setLoading(true);
      setFeedback(null);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/lockers/access-code/open`,
        { accessCode: trimmed },
        token
          ? {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          : undefined
      );
      setFeedback({
        type: 'success',
        message: `Locker ${response.data.lockerNumber} opened`,
        meta: response.data.booking,
      });
      setCode('');
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Invalid or expired access code.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Access Code Unlock</Text>
        <Text style={styles.subtitle}>Share the code with staff to open instantly.</Text>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={setCode}
          placeholder="Enter 4-digit code"
          keyboardType="numeric"
          maxLength={6}
        />
        <TouchableOpacity style={styles.button} onPress={handleUnlock} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.surface} size="small" />
          ) : (
            <Text style={styles.buttonText}>Open Locker</Text>
          )}
        </TouchableOpacity>
      </View>

      {feedback && (
        <View
          style={[
            styles.feedback,
            feedback.type === 'success' ? styles.successCard : styles.errorCard,
          ]}
        >
          <Text
            style={[
              styles.feedbackText,
              feedback.type === 'success' ? styles.successText : styles.errorText,
            ]}
          >
            {feedback.message}
          </Text>
          {feedback.meta && (
            <View style={{ marginTop: 6 }}>
              <Text style={styles.metaText}>
                Drawer #{feedback.meta.lockerNumber} • Code {feedback.meta.accessCode}
              </Text>
              {feedback.meta.expiresAt && (
                <Text style={styles.metaText}>
                  Valid till {new Date(feedback.meta.expiresAt).toLocaleString()}
                </Text>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 24,
    gap: 14,
    ...shadows.card,
  },
  headerRow: {
    gap: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 18,
    fontWeight: '600',
    backgroundColor: colors.background,
  },
  button: {
    backgroundColor: colors.brand,
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.surface,
    fontWeight: '600',
  },
  feedback: {
    borderRadius: radii.md,
    padding: 12,
  },
  successCard: {
    backgroundColor: colors.accentSoft,
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
  },
  feedbackText: {
    fontWeight: '600',
  },
  successText: {
    color: colors.success,
  },
  errorText: {
    color: colors.danger,
  },
  metaText: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 13,
  },
});

export default AccessCodeUnlock;

