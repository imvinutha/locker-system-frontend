import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native-web';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const OtpVerification = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(300); // 5 minutes countdown
  
  const { verifyOTP, isAuthenticated, error } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get userId from location state
  const userId = location.state?.userId;
  
  // Redirect if already authenticated or no userId
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else if (!userId) {
      navigate('/login');
    }
  }, [isAuthenticated, userId, navigate]);
  
  // Update error message when context error changes
  useEffect(() => {
    if (error) {
      setErrorMessage(error);
    }
  }, [error]);
  
  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // OTP expired
      setErrorMessage('OTP has expired. Please login again.');
    }
  }, [countdown]);
  
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!otp) {
      setErrorMessage('Please enter the OTP');
      return;
    }
    
    if (countdown <= 0) {
      setErrorMessage('OTP has expired. Please login again.');
      return;
    }
    
    try {
      setLoading(true);
      await verifyOTP(userId, otp);
      navigate('/dashboard');
    } catch (error) {
      console.error('OTP verification error:', error);
      setErrorMessage(error.response?.data?.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>OTP Verification</Text>
        
        <Text style={styles.subtitle}>
          Enter the OTP sent to your phone number
        </Text>
        
        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>OTP Code</Text>
          <TextInput
            style={styles.input}
            value={otp}
            onChangeText={setOtp}
            placeholder="Enter 6-digit OTP"
            keyboardType="number-pad"
            maxLength={6}
          />
        </View>
        
        <Text style={styles.timerText}>
          Time remaining: {formatTime(countdown)}
        </Text>
        
        <TouchableOpacity 
          style={[styles.button, countdown <= 0 && styles.disabledButton]} 
          onPress={handleVerifyOTP}
          disabled={loading || countdown <= 0}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Verify OTP</Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.backContainer}>
          <TouchableOpacity onPress={() => navigate('/login')}>
            <Text style={styles.backLink}>Back to Login</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
            Note: For demo purposes, OTP is only sent to the number 7259800637.
            If you're using a different number, please check the console logs for the OTP.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 5,
  },
  timerText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#2c3e50',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#95a5a6',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
  },
  backContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  backLink: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: 'bold',
  },
  noteContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 5,
  },
  noteText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default OtpVerification;