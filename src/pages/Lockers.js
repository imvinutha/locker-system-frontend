import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal, TextInput } from 'react-native-web';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../config';
import DirectLockerAccess from '../components/DirectLockerAccess';
import AccessCodeUnlock from '../components/AccessCodeUnlock';
import BookingSummaryCard from '../components/BookingSummaryCard';
import { colors, radii } from '../theme';

const Lockers = () => {
  const { user } = useContext(AuthContext);
  const [lockers, setLockers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLocker, setSelectedLocker] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [bookingReceipt, setBookingReceipt] = useState(null);
  const [paymentModal, setPaymentModal] = useState({
    visible: false,
    qrUrl: null,
    paymentId: null,
    amount: 0,
    lockerId: null,
    mode: 'book',
  });
  const PLAN_OPTIONS = useMemo(() => ([
    { id: '1h', label: 'Express', durationLabel: '1 hour', minutes: 60, price: 10 },
    { id: '2h', label: 'Short Stay', durationLabel: '2 hours', minutes: 120, price: 20 },
    { id: '5h', label: 'Half Day', durationLabel: '5 hours', minutes: 300, price: 50 },
    { id: '8h', label: 'Full Day', durationLabel: '8 hours', minutes: 480, price: 80 },
    { id: 'custom', label: 'Custom', durationLabel: 'Set hours', minutes: null, price: null },
  ]), []);
  const [selectedPlanId, setSelectedPlanId] = useState('1h');
  const [customHours, setCustomHours] = useState('12');

  const resolveSelectedPlan = () => {
    if (selectedPlanId === 'custom') {
      const hours = Math.max(1, parseInt(customHours || '1', 10));
      const minutes = hours * 60;
      const price = Math.ceil(minutes / 60) * 10;
      return {
        id: 'custom',
        label: `${hours} hr${hours === 1 ? '' : 's'}`,
        durationLabel: `${hours} hour${hours === 1 ? '' : 's'}`,
        minutes,
        price,
      };
    }
    return PLAN_OPTIONS.find((plan) => plan.id === selectedPlanId) || PLAN_OPTIONS[0];
  };

  const fetchLockers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const response = await axios.get(`${API_URL}/api/lockers`, config);
      const rawLockers = response.data.lockers || [];

      // Normalize backend fields to the frontend schema
      const normalized = rawLockers.map((locker) => ({
        ...locker,
        // Backend returns current_user_id and hardwareStatus
        user_id: locker.user_id !== undefined ? locker.user_id : locker.current_user_id ?? null,
        hardware_status: locker.hardware_status !== undefined ? locker.hardware_status : (locker.hardwareStatus ?? 'unknown'),
      }));

      // If this user already has an active locker, disable others on the UI
      const userHasActive = normalized.some(
        (l) => (user?.role === 'user' || user?.role === 'employee') && l.user_id === user?.id && l.status === 'occupied'
      );

      const finalLockers = normalized.map((l) => {
        if (userHasActive) {
          // Keep the active one enabled; disable others
          return {
            ...l,
            disabled: l.user_id !== user?.id,
          };
        }
        // No active locker for this user -> all enabled
        return { ...l, disabled: false };
      });

      setLockers(finalLockers);
    } catch (err) {
      console.error('Error fetching lockers:', err);
      // setError('Failed to load lockers. Please try again.');
      setError('Failde to load locker.please try again later');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    fetchLockers();
  }, [fetchLockers]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLockers();
  };

  const openLockerModal = (locker) => {
    setSelectedLocker(locker);
    setModalVisible(true);
    setActionError(null);
    setActionSuccess(null);
  };

  const closeLockerModal = () => {
    setModalVisible(false);
    setSelectedLocker(null);
    setActionError(null);
    setActionSuccess(null);
  };

  const getLockerStatus = async (lockerId) => {
    try {
      setActionLoading(true);
      setActionError(null);
      setActionSuccess(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      console.log(`Fetching status for locker ${lockerId}`);
      const response = await axios.get(`${API_URL}/api/lockers/${lockerId}/status`, config);
      console.log('Status response:', response.data);
      
      // Get the hardware status from the response
      const hardwareStatus = response.data.hardwareStatus || 'Status unavailable';
      console.log(`Parsed hardware status: ${hardwareStatus}`);
      
      // Update the locker status in the state
      const updatedLockers = lockers.map(locker => {
        if (locker.id === lockerId) {
          return { ...locker, hardware_status: hardwareStatus };
        }
        return locker;
      });
      
      setLockers(updatedLockers);
      setSelectedLocker({ ...selectedLocker, hardware_status: hardwareStatus });
      setActionSuccess(`Locker status: ${hardwareStatus}`);
    } catch (err) {
      console.error('Error getting locker status:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to get locker status. Please try again later.';
      console.log('Error details:', errorMessage);
      setActionError(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const openLocker = async (lockerId) => {
    try {
      setActionLoading(true);
      setActionError(null);
      setActionSuccess(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      console.log(`Opening locker ${lockerId}`);

      // For users: check dues if usage > 24h and collect before opening
      if (user.role === 'user') {
        const duesRes = await axios.get(`${API_URL}/api/payments/dues`, { params: { lockerId }, headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
        const due = duesRes.data?.due || 0;
        if (due > 0) {
          const createPay = await axios.post(`${API_URL}/api/payments/create`, { amount: due, lockerId }, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
          setPaymentModal({ visible: true, qrUrl: createPay.data.qrUrl, paymentId: createPay.data.paymentId, amount: due, lockerId, mode: 'dues' });
          let attempts = 0;
          while (attempts < 30) {
            await new Promise(r => setTimeout(r, 2000));
            const statusRes = await axios.get(`${API_URL}/api/payments/${createPay.data.paymentId}/status`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
            if (statusRes.data.status === 'success') {
              setPaymentModal({ visible: false, qrUrl: null, paymentId: null, amount: 0, lockerId: null, mode: 'dues' });
              break;
            }
            attempts += 1;
          }
          if (attempts >= 30) {
            setActionError('Payment timed out. Please try again.');
            return;
          }
        }
      }
      const response = await axios.put(`${API_URL}/api/lockers/${lockerId}/open`, {}, config);
      console.log('Open locker response:', response.data);
      
      // Treat as successful assignment immediately
      const hardwareStatus = response.data.hardwareStatus || 'unknown';
      const updatedLockers = lockers.map(locker => {
        if (locker.id === lockerId) {
          return { 
            ...locker, 
            status: 'occupied',
            hardware_status: hardwareStatus,
            user_id: user.id,
            is_open: true
          };
        }
        if ((user.role === 'user' || user.role === 'employee') && locker.id !== lockerId) {
          return { ...locker, disabled: true };
        }
        return locker;
      });
      
      setLockers(updatedLockers);
      setSelectedLocker({ 
        ...selectedLocker, 
        status: 'occupied',
        hardware_status: hardwareStatus,
        user_id: user.id,
        is_open: true
      });
      
      setActionSuccess('Locker open event logged. Locker assigned to you.');
      // Do not auto-release or re-check status; user can manually check status if needed
    } catch (err) {
      console.error('Error opening locker:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to open locker. Please try again later.';
      console.log('Error details:', errorMessage);
      setActionError(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const allotLocker = async (lockerId) => {
    try {
      setActionLoading(true);
      setActionError(null);
      setActionSuccess(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      const plan = resolveSelectedPlan();

      const response = await axios.post(`${API_URL}/api/lockers/${lockerId}/allot`, {
        durationMinutes: plan.minutes,
      }, config);

      const updatedLockers = lockers.map(locker => {
        if (locker.id === lockerId) {
          return {
            ...locker,
            status: 'occupied',
            user_id: user.id,
          };
        }
        if ((user.role === 'user' || user.role === 'employee') && locker.id !== lockerId) {
          return {
            ...locker,
            disabled: true
          };
        }
        return locker;
      });

      setLockers(updatedLockers);
      setSelectedLocker({
        ...selectedLocker,
        status: 'occupied',
        user_id: user.id
      });

      if (response.data?.booking) {
        setBookingReceipt({
          ...response.data.booking,
          durationLabel: response.data.booking.durationLabel || plan.durationLabel,
          amount: response.data.booking.amount ?? plan.price,
        });
      }

      setActionSuccess(response.data?.message || 'Locker allotted successfully');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to allot locker. Please try again later.';
      setActionError(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const closeLocker = async (lockerId) => {
    try {
      setActionLoading(true);
      setActionError(null);
      setActionSuccess(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      console.log(`Closing locker ${lockerId}`);
      const response = await axios.put(`${API_URL}/api/lockers/${lockerId}/close`, {}, config);
      console.log('Close locker response:', response.data);
      
      // Extract the hardware status from the response
      const hardwareStatus = response.data.hardwareStatus || 'Status unavailable';
      const lockerStatus = response.data.locker?.status || 'empty';
      
      console.log(`Parsed hardware status: ${hardwareStatus}, locker status: ${lockerStatus}`);
      
      // Update the locker status in the state
      const updatedLockers = lockers.map(locker => {
        if (locker.id === lockerId) {
          return { 
            ...locker, 
            status: 'empty',
            hardware_status: hardwareStatus,
            user_id: null
          };
        }
        // Re-enable all lockers for both regular users and employees
        if ((user.role === 'user' || user.role === 'employee') && locker.disabled) {
          return {
            ...locker,
            disabled: false
          };
        }
        return locker;
      });
      
      setLockers(updatedLockers);
      setSelectedLocker({ 
        ...selectedLocker, 
        status: 'empty',
        hardware_status: hardwareStatus,
        user_id: null
      });
      
      // Close the modal
      setModalVisible(false);
      
      // Refresh lockers to get the latest data
      await fetchLockers();
      
      alert('Locker closed successfully! The locker is now available for use.');
    } catch (err) {
      console.error('Error closing locker:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to close locker. Please try again later.';
      console.log('Error details:', errorMessage);
      setActionError(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (!status || status === 'undefined' || status === 'unknown') {
      return '#f39c12'; // Orange for unknown/undefined status
    } else if (status.toLowerCase().includes('open')) {
      return '#e74c3c'; // Red for open
    } else if (status.toLowerCase().includes('close')) {
      return '#2ecc71'; // Green for closed
    } else {
      return '#f39c12'; // Orange for timeout or other states
    }
  };

  const previewPlan = resolveSelectedPlan();

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2c3e50" />
        <Text style={styles.loadingText}>Loading lockers...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchLockers}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lockers</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
      
      {refreshing && (
        <View style={styles.refreshingContainer}>
          <ActivityIndicator size="small" color="#2c3e50" />
          <Text style={styles.refreshingText}>Refreshing...</Text>
        </View>
      )}
      
      {/* <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Pick a locker, choose hours, get instant access.</Text>
        <Text style={styles.heroSubtitle}>Transparent hourly pricing with secure OTP-free access codes.</Text>
      </View> */}

      {/* <AccessCodeUnlock /> */}

      {/* Direct Locker Hardware Access Component */}
      {/* <DirectLockerAccess /> */}
      
      <ScrollView style={styles.lockerList}>
        <View style={styles.lockerGrid}>
          {(() => {
            const userHasActive = lockers.some(l => (user?.role === 'user' || user?.role === 'employee') && l.user_id === user?.id && l.status === 'occupied');
            const listToShow = userHasActive
              ? lockers.filter(l => l.user_id === user?.id && l.status === 'occupied')
              : lockers;
            return listToShow.map((locker) => (
              <TouchableOpacity 
                key={locker.id} 
                style={[
                  styles.lockerCard, 
                  locker.status === 'occupied' && styles.occupiedLocker,
                  locker.disabled && styles.disabledLocker
                ]}
                onPress={() => !locker.disabled && openLockerModal(locker)}
                disabled={locker.disabled}
              >
                <Text style={styles.lockerNumber}>Locker {locker.locker_number}</Text>
                <View style={[styles.statusBadge, { backgroundColor: locker.status === 'occupied' ? '#e74c3c' : '#2ecc71' }]}>
                  <Text style={styles.statusText}>{locker.status.toUpperCase()}</Text>
                </View>
                <Text style={[styles.hardwareStatus, { color: getStatusColor(locker.hardware_status) }]}> 
                  {locker.hardware_status || 'Unknown'}
                </Text>
                {locker.user_id === user.id && (
                  <Text style={styles.yourLockerText}>Your Locker</Text>
                )}
                {locker.disabled && (
                  <View style={styles.disabledOverlay}>
                    <Text style={styles.disabledText}>Unavailable</Text>
                  </View>
                )}
              </TouchableOpacity>
            ));
          })()}
        </View>
      </ScrollView>
      
      {/* Locker Detail Modal */}
      <Modal
  visible={modalVisible}
  transparent={true}
  animationType="slide"
  onRequestClose={closeLockerModal}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalWrapper}>
      
      {/* Scrollable Content */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View style={styles.modalContent}>
          {selectedLocker && (
            <>
              {/* Title */}
              <Text style={styles.modalTitle}>Locker {selectedLocker.locker_number}</Text>

              {/* Locker Details */}
              <View style={styles.lockerDetails}>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      {
                        color:
                          selectedLocker.status === 'occupied'
                            ? '#e74c3c'
                            : '#2ecc71',
                      },
                    ]}
                  >
                    {selectedLocker.status.toUpperCase()}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Hardware Status:</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: getStatusColor(selectedLocker.hardware_status) },
                    ]}
                  >
                    {selectedLocker.hardware_status || 'Unknown'}
                  </Text>
                </View>

                {selectedLocker.user_id && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>In Use By:</Text>
                    <Text style={styles.detailValue}>
                      {selectedLocker.user_id === user.id ? 'You' : 'Another User'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Errors */}
              {actionError && <Text style={styles.actionError}>{actionError}</Text>}
              {actionSuccess && <Text style={styles.actionSuccess}>{actionSuccess}</Text>}

              {/* Action Buttons */}
              <View style={styles.actionButtons}>

                {/* PLAN SECTION */}
                {selectedLocker.status === 'empty' && (
                  <View style={styles.planSection}>
                    <Text style={styles.sectionTitle}>Choose your duration</Text>

                    <View style={styles.planGrid}>
                      {PLAN_OPTIONS.map((plan) => (
                        <TouchableOpacity
                          key={plan.id}
                          style={[
                            styles.planCard,
                            selectedPlanId === plan.id && styles.planCardActive,
                          ]}
                          onPress={() => setSelectedPlanId(plan.id)}
                        >
                          <Text style={styles.planLabel}>{plan.label}</Text>
                          <Text style={styles.planDuration}>{plan.durationLabel}</Text>
                          {plan.price && (
                            <Text style={styles.planPrice}>₹{plan.price}</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>

                    {selectedPlanId === 'custom' && (
                      <View style={styles.customInputRow}>
                        <TextInput
                          style={styles.customInput}
                          value={customHours}
                          onChangeText={setCustomHours}
                          keyboardType="numeric"
                        />
                        <Text style={styles.customInputLabel}>hours</Text>
                      </View>
                    )}

                    <View style={styles.planSummary}>
                      <Text style={styles.planSummaryText}>Total payable now</Text>
                      <Text style={styles.planSummaryPrice}>₹{previewPlan.price}</Text>
                    </View>
                  </View>
                )}

                {/* ALLOT BUTTON */}
                {(user.role === 'user' || user.role === 'employee') &&
                  selectedLocker.status === 'empty' &&
                  !selectedLocker.user_id && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => allotLocker(selectedLocker.id)}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.actionButtonText}>Allot me this locker</Text>
                      )}
                    </TouchableOpacity>
                  )}

                {/* GET STATUS */}
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => getLockerStatus(selectedLocker.id)}
                  disabled={
                    actionLoading ||
                    (user.role === 'user' && selectedLocker.user_id !== user.id)
                  }
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.actionButtonText}>Get Status</Text>
                  )}
                </TouchableOpacity>

                {/* OPEN LOCKER */}
                {((user.role === 'user' && selectedLocker.user_id === user.id) ||
                  (user.role !== 'user' &&
                    (selectedLocker.status === 'empty' ||
                      selectedLocker.user_id === user.id))) && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.openButton]}
                    onPress={() => openLocker(selectedLocker.id)}
                    disabled={
                      actionLoading ||
                      (user.role === 'user' && selectedLocker.user_id !== user.id)
                    }
                  >
                    {actionLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.actionButtonText}>Open Locker</Text>
                    )}
                  </TouchableOpacity>
                )}

                {/* CLOSE LOCKER */}
                {selectedLocker.user_id === user.id && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.closeButton]}
                    onPress={() => closeLocker(selectedLocker.id)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.actionButtonText}>Close Locker</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Close Button (Fixed) */}
      <TouchableOpacity
        style={styles.closeModalButton}
        onPress={closeLockerModal}
      >
        <Text style={styles.closeModalButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>


      <BookingSummaryCard summary={bookingReceipt} onDismiss={() => setBookingReceipt(null)} />
      {paymentModal.visible && (
        <View style={styles.paymentOverlay}>
          <View style={styles.paymentCard}>
            <Text style={styles.paymentTitle}>
              {paymentModal.mode === 'dues' ? 'Pending Dues' : 'Complete Payment'}
            </Text>
            <Text style={styles.paymentAmount}>₹{paymentModal.amount}</Text>
            {paymentModal.qrUrl ? (
              <>
                <Text style={styles.paymentNote}>Scan the QR to pay instantly.</Text>
                <img
                  src={paymentModal.qrUrl}
                  alt="Payment QR"
                  style={styles.qrImage}
                />
              </>
            ) : (
              <Text style={styles.paymentNote}>Waiting for confirmation...</Text>
            )}
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={() => setPaymentModal({
                visible: false,
                qrUrl: null,
                paymentId: null,
                amount: 0,
                lockerId: null,
                mode: 'book',
              })}
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  disabledLocker: {
    opacity: 0.6,
    position: 'relative',
  },
  disabledOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.lg,
  },
  disabledText: {
    color: colors.surface,
    fontWeight: 'bold',
    fontSize: 16,
  },
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  heroCard: {
    backgroundColor: colors.accentSoft,
    padding: 20,
    borderRadius: radii.lg,
    gap: 6,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  heroSubtitle: {
    color: colors.textMuted,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
  },
  refreshButton: {
    backgroundColor: colors.brand,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: radii.md,
  },
  refreshButtonText: {
    color: colors.surface,
    fontWeight: 'bold',
  },
  refreshingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  refreshingText: {
    color: colors.textMuted,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: colors.textMuted,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  errorText: {
    color: colors.danger,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.brandDark,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: radii.md,
  },
  retryButtonText: {
    color: colors.surface,
    fontWeight: 'bold',
  },
  lockerList: {
    flex: 1,
  },
  lockerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  lockerCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 18,
    width: '48%',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
    position: 'relative',
  },
  occupiedLocker: {
    borderColor: colors.brand,
    borderWidth: 2,
  },
  lockerNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: 'bold',
  },
  hardwareStatus: {
    fontSize: 14,
    marginTop: 5,
    color: colors.textMuted,
  },
  yourLockerText: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.brand,
    color: colors.surface,
    fontSize: 11,
    fontWeight: '700',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 24,
    width: '100%',
    maxWidth: 520,
    gap: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.text,
  },
  lockerDetails: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  detailValue: {
    color: colors.text,
    fontWeight: '600',
  },
  planSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  planGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  planCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 12,
    gap: 6,
  },
  planCardActive: {
    borderColor: colors.brand,
    backgroundColor: colors.accentSoft,
  },
  planLabel: {
    fontWeight: '700',
    color: colors.text,
  },
  planDuration: {
    color: colors.textMuted,
    fontSize: 13,
  },
  planPrice: {
    fontWeight: '700',
    color: colors.brandDark,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  customInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 10,
    flex: 1,
  },
  customInputLabel: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  planSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: 12,
  },
  planSummaryText: {
    color: colors.textMuted,
  },
  planSummaryPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.brandDark,
  },
  actionError: {
    color: colors.danger,
    textAlign: 'center',
  },
  actionSuccess: {
    color: colors.success,
    textAlign: 'center',
  },
  actionButtons: {
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: colors.brand,
    padding: 14,
    borderRadius: radii.md,
    alignItems: 'center',
    marginBottom: 10,
  },
  openButton: {
    backgroundColor: colors.brandDark,
  },
  closeButton: {
    backgroundColor: colors.danger,
  },
  actionButtonText: {
    color: colors.surface,
    fontWeight: '700',
  },
  closeModalButton: {
    backgroundColor: colors.textMuted,
    padding: 14,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: colors.surface,
    fontWeight: '600',
  },
  debugText: {
    color: colors.warning,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
  },
  paymentOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  paymentCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    gap: 12,
  },
  paymentTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.text,
  },
  paymentAmount: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.brandDark,
  },
  paymentNote: {
    textAlign: 'center',
    color: colors.textMuted,
  },
  qrImage: {
    width: 220,
    height: 220,
    alignSelf: 'center',
    borderRadius: radii.md,
  },
  dismissButton: {
    marginTop: 8,
    backgroundColor: colors.brand,
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
});

export default Lockers;


// can you add a button here called "allot me this locker" and allot that locker to that particular logged in user, and once allotted enable get status and open locker button