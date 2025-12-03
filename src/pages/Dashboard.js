import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native-web';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../config';
import GuideModal from '../components/GuideModal';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalLockers: 0,
    availableLockers: 0,
    occupiedLockers: 0,
    userTransactions: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    // Show the guide once per session after successful login/auth
    if (user && !sessionStorage.getItem('guideShown')) {
      setShowGuide(true);
      sessionStorage.setItem('guideShown', 'true');
    }
  }, [user]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };
        
        // Get lockers data
        const lockersResponse = await axios.get(`${API_URL}/api/lockers`, config);
        const lockers = lockersResponse.data.lockers || [];
        
        // Get transactions data
        const transactionsResponse = await axios.get(`${API_URL}/api/transactions`, config);
        const transactions = transactionsResponse.data.transactions || [];
        
        // Calculate stats
        const totalLockers = lockers.length;
        const availableLockers = lockers.filter(locker => locker.status === 'empty').length;
        const occupiedLockers = lockers.filter(locker => locker.status === 'occupied').length;
        
        // For users, only count their transactions
        const userTransactions = user.role === 'user' 
          ? transactions.length 
          : transactions.filter(t => t.user_id === user.id).length;
        
        setStats({
          totalLockers,
          availableLockers,
          occupiedLockers,
          userTransactions
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading dashboard data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <GuideModal visible={showGuide} onClose={() => setShowGuide(false)} />
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, {user?.name || 'User'}!</Text>
        <Text style={styles.roleText}>{user?.role.charAt(0).toUpperCase() + user?.role.slice(1)}</Text>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalLockers}</Text>
          <Text style={styles.statLabel}>Total Lockers</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.availableLockers}</Text>
          <Text style={styles.statLabel}>Available Lockers</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.occupiedLockers}</Text>
          <Text style={styles.statLabel}>Occupied Lockers</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.userTransactions}</Text>
          <Text style={styles.statLabel}>{user?.role === 'user' ? 'Your Transactions' : 'Total Transactions'}</Text>
        </View>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>System Information</Text>
        <Text style={styles.infoText}>
          This is the Locker Management System dashboard. From here, you can navigate to different sections
          of the application using the navigation menu above.
        </Text>
        
        <Text style={styles.infoSubtitle}>Quick Guide:</Text>
        <Text style={styles.infoText}>• Lockers: View and manage lockers</Text>
        <Text style={styles.infoText}>• Transactions: View your transaction history</Text>
        {user?.role === 'admin' && (
          <Text style={styles.infoText}>• Users: Manage system users (Admin only)</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  header: {
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  roleText: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  infoContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
    lineHeight: 20,
  },
});

export default Dashboard;