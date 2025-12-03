import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native-web';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../config';

const LockerOpenTransactions = ( user ) => {
  const { user } = useContext(AuthContext);
  const [openEvents, setOpenEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [lockerQuery, setLockerQuery] = useState('');

  const fetchOpenEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const response = await axios.get(`${API_URL}/api/lockers/open-events`, config);
      setOpenEvents(response.data.events || []);
    } catch (err) {
      setError('Failed to load locker open events. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchOpenEvents(); }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOpenEvents();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const filtered = openEvents.filter(e => {
    const openedAt = e.opened_at ? new Date(e.opened_at) : null;
    if (fromDate && openedAt && openedAt < new Date(fromDate)) return false;
    if (toDate && openedAt && openedAt > new Date(toDate)) return false;
    if (lockerQuery && String(e.locker_number).indexOf(lockerQuery) === -1) return false;
    return true;
  });

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2c3e50" />
        <Text style={styles.loadingText}>Loading locker open events...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchOpenEvents}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Locker Open Events</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersRow}>
        <View style={styles.filterItem}>
          <Text>From</Text>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </View>
        <View style={styles.filterItem}>
          <Text>To</Text>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </View>
        <View style={styles.filterItem}>
          <Text>Locker</Text>
          <input type="text" placeholder="#" value={lockerQuery} onChange={(e) => setLockerQuery(e.target.value)} />
        </View>
      </View>
      {refreshing && (
        <View style={styles.refreshingContainer}>
          <ActivityIndicator size="small" color="#2c3e50" />
          <Text style={styles.refreshingText}>Refreshing...</Text>
        </View>
      )}
      {filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No events match your filters.</Text>
        </View>
      ) : (
        <ScrollView style={styles.transactionList}>
          {filtered.map((event) => (
            <View key={event.id} style={styles.transactionCard}>
              <Text style={styles.lockerNumber}>Locker #{event.locker_number}</Text>
              <Text style={styles.detail}>Opened At: {formatDate(event.opened_at)}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold' },
  refreshButton: { backgroundColor: '#2c3e50', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 5 },
  refreshButtonText: { color: 'white', fontWeight: 'bold' },
  refreshingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  refreshingText: { marginLeft: 10, color: '#666' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#666' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: '#e74c3c', fontSize: 16, marginBottom: 20, textAlign: 'center' },
  retryButton: { backgroundColor: '#2c3e50', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5 },
  retryButtonText: { color: 'white', fontWeight: 'bold' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 16, color: '#666' },
  transactionList: { flex: 1 },
  transactionCard: { backgroundColor: 'white', borderRadius: 10, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 5 },
  lockerNumber: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  detail: { fontSize: 14, marginBottom: 4 },
  filtersRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  filterItem: { alignItems: 'center' },
});

export default LockerOpenTransactions;
