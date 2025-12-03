import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native-web';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { colors, radii, shadows } from '../theme';

const Login = () => {
  const [localNumber, setLocalNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const country = { flag: '🇮🇳', dial: '+91', label: 'India' };

  const { requestOtpByPhone, verifyOtpByPhone, isAuthenticated, error } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  // Update error message when context error changes
  useEffect(() => {
    if (error) {
      setErrorMessage(error);
    }
  }, [error]);

  const fullPhone = () => {
    const digitsOnly = localNumber.replace(/\s|-/g, '');
    return `${country.dial}${digitsOnly}`;
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!localNumber) {
      setErrorMessage('Please enter your phone number');
      return;
    }

    try {
      setLoading(true);
      const res = await requestOtpByPhone(fullPhone());
      if (res?.message) {
        setOtpRequested(true);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to request OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!otp) {
      setErrorMessage('Please enter the OTP');
      return;
    }

    try {
      setLoading(true);
      const res = await verifyOtpByPhone(fullPhone(), otp);
      if (res?.token) {
        navigate('/dashboard');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoIcon}>✔</Text>
          </View>
          <Text style={styles.caption}>Smart Locker</Text>
          <Text style={styles.title}>Login</Text>
          <Text style={styles.subtitle}>Enter your mobile number to receive a secure OTP.</Text>
        </View>

        {errorMessage ? (
          <View style={styles.errorPill}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.inputBlock}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.phoneRow}>
            <View style={styles.countryBadge}>
              <Text style={styles.flag}>{country.flag}</Text>
              <Text style={styles.countryText}>{country.dial}</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              value={localNumber}
              onChangeText={setLocalNumber}
              placeholder="98765 43210"
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
        </View>

        {otpRequested && (
          <View style={styles.inputBlock}>
            <Text style={styles.label}>Enter OTP</Text>
            <TextInput
              style={styles.otpInput}
              value={otp}
              onChangeText={setOtp}
              placeholder="000000"
              keyboardType="number-pad"
              maxLength={6}
            />
            <Text style={styles.helpText}>We sent a 6-digit code to {fullPhone()}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.disabledButton]}
          onPress={otpRequested ? handleVerifyOtp : handleRequestOtp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.surface} size="small" />
          ) : (
            <Text style={styles.buttonText}>
              {otpRequested ? 'Verify & Continue' : 'Send OTP'}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.footerText}>
          By continuing you agree to receive transactional SMS.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    minHeight: '100vh',
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: 32,
    gap: 16,
    ...shadows.soft,
  },
  cardHeader: {
    alignItems: 'center',
    gap: 6,
  },
  logoCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    fontSize: 26,
    color: colors.brand,
    fontWeight: '700',
  },
  caption: {
    color: colors.brand,
    fontWeight: '600',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
  },
  inputBlock: {
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 6,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: radii.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  flag: {
    fontSize: 20,
  },
  countryText: {
    fontWeight: '600',
    color: colors.text,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 6,
    color: colors.text,
    backgroundColor: colors.accentSoft,
  },
  helpText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  primaryButton: {
    backgroundColor: colors.brand,
    paddingVertical: 16,
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  footerText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 13,
  },
  errorPill: {
    backgroundColor: '#FEF2F2',
    borderRadius: radii.md,
    padding: 12,
  },
  errorText: {
    color: colors.danger,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default Login;

