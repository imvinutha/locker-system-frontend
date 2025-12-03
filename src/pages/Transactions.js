import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native-web';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../config';

const Transactions = () => {
  const { user } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [lockerQuery, setLockerQuery] = useState('');

  const fetchTransactions = async () => {
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
      
      const response = await axios.get(`${API_URL}/api/transactions`, config);
      
      // Sort transactions by date (newest first)
      const sortedTransactions = (response.data.transactions || []).sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
      });
      
      setTransactions(sortedTransactions);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusBadgeStyle = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return styles.completedBadge;
      case 'in_progress':
        return styles.inProgressBadge;
      case 'cancelled':
        return styles.cancelledBadge;
      default:
        return styles.defaultBadge;
    }
  };

  const getStatusTextStyle = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return styles.completedText;
      case 'in_progress':
        return styles.inProgressText;
      case 'cancelled':
        return styles.cancelledText;
      default:
        return styles.defaultText;
    }
  };

  const formatStatus = (status) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const filtered = transactions.filter(t => {
    // Status filter
    if (statusFilter !== 'all' && t.status?.toLowerCase() !== statusFilter) return false;
    // Date range filter (by created_at)
    const createdAt = t.created_at ? new Date(t.created_at) : null;
    if (fromDate && createdAt && createdAt < new Date(fromDate)) return false;
    if (toDate && createdAt && createdAt > new Date(toDate)) return false;
    // Locker number search
    if (lockerQuery && String(t.locker_number).indexOf(lockerQuery) === -1) return false;
    return true;
  });

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2c3e50" />
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchTransactions}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersRow}>
        <View style={styles.filterItem}>
          <Text>Status</Text>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="active">active</option>
            <option value="completed">completed</option>
            <option value="cancelled">cancelled</option>
          </select>
        </View>
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
          <Text style={styles.emptyText}>No transactions match your filters.</Text>
        </View>
      ) : (
        <ScrollView style={styles.transactionList}>
          {filtered.map((transaction) => (
            <View key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                <Text style={styles.lockerNumber}>Locker #{transaction.locker_number}</Text>
                <View style={[styles.statusBadge, getStatusBadgeStyle(transaction.status)]}>
                  <Text style={[styles.statusText, getStatusTextStyle(transaction.status)]}>
                    {formatStatus(transaction.status)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.transactionDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Transaction ID:</Text>
                  <Text style={styles.detailValue}>{transaction.id}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Started:</Text>
                  <Text style={styles.detailValue}>{formatDate(transaction.created_at)}</Text>
                </View>
                
                {transaction.completed_at && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Completed:</Text>
                    <Text style={styles.detailValue}>{formatDate(transaction.completed_at)}</Text>
                  </View>
                )}
                
                {transaction.amount !== undefined && transaction.amount !== null && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Amount:</Text>
                    <Text style={styles.detailValue}>
                      {Number.isFinite(Number(transaction.amount)) ? `Rs ${Number(transaction.amount).toFixed(2)}` : String(transaction.amount)}
                    </Text>
                  </View>
                )}
                
                {transaction.access_code && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Access Code:</Text>
                    <Text style={styles.detailValueHighlight}>{transaction.access_code}</Text>
                  </View>
                )}
                
                {transaction.reservation_minutes && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Reserved:</Text>
                    <Text style={styles.detailValue}>
                      {(transaction.reservation_minutes / 60).toFixed(1)} hrs
                    </Text>
                  </View>
                )}
                
                {user.role !== 'user' && transaction.user_name && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>User:</Text>
                    <Text style={styles.detailValue}>{transaction.user_name}</Text>
                  </View>
                )}
                
                {transaction.notes && (
                  <View style={styles.notesContainer}>
                    <Text style={styles.notesLabel}>Notes:</Text>
                    <Text style={styles.notesText}>{transaction.notes}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  refreshButton: {
    backgroundColor: '#2c3e50',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  refreshingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  refreshingText: {
    marginLeft: 10,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#2c3e50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  transactionList: {
    flex: 1,
  },
  transactionCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  lockerNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  completedBadge: {
    backgroundColor: '#e8f5e9',
  },
  inProgressBadge: {
    backgroundColor: '#e3f2fd',
  },
  cancelledBadge: {
    backgroundColor: '#ffebee',
  },
  defaultBadge: {
    backgroundColor: '#f5f5f5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  completedText: {
    color: '#2e7d32',
  },
  inProgressText: {
    color: '#1565c0',
  },
  cancelledText: {
    color: '#c62828',
  },
  defaultText: {
    color: '#757575',
  },
  transactionDetails: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    width: '30%',
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    flex: 1,
  },
  notesContainer: {
    marginTop: 10,
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 5,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#666',
  },
  notesText: {
    fontSize: 14,
    color: '#333',
  },
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  filterItem: {
    flexDirection: 'column',
    alignItems: 'center',
    marginHorizontal: 10,
  },
});

export default Transactions;