import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native-web';

const GuideModal = ({ visible, onClose }) => {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <Text style={styles.title}>Welcome to the Locker App</Text>
        <Text style={styles.subtitle}>Here’s how it works, step by step:</Text>

        <View style={styles.stepList}>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.stepText}><Text style={styles.emphasis}>Login:</Text> Enter your phone number and OTP to securely sign in.</Text>
          </View>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.stepText}><Text style={styles.emphasis}>Dashboard:</Text> See quick stats and navigate to Lockers or Transactions.</Text>
          </View>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.stepText}><Text style={styles.emphasis}>Lockers:</Text> Browse available lockers and open one when needed.</Text>
          </View>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>4</Text>
            <Text style={styles.stepText}><Text style={styles.emphasis}>Store Items:</Text> Place your items in the locker, then close to secure.</Text>
          </View>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>5</Text>
            <Text style={styles.stepText}><Text style={styles.emphasis}>Transactions:</Text> Review your locker usage and history anytime.</Text>
          </View>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>6</Text>
            <Text style={styles.stepText}><Text style={styles.emphasis}>Payments:</Text> Complete payments when required for locker usage.</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={onClose}>
          <Text style={styles.primaryButtonText}>Got it, let’s start!</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>Tip: You can access Lockers and Transactions from the navigation bar.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#006666',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#006666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  stepList: {
    marginTop: 8,
    marginBottom: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ff4da6',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: 'bold',
    marginRight: 10,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  emphasis: {
    color: '#ff4da6',
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#006666',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footerNote: {
    marginTop: 12,
    fontSize: 12,
    color: '#006666',
    textAlign: 'center',
  },
});

export default GuideModal;