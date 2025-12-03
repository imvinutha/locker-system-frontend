import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { View, StyleSheet } from 'react-native-web';

// Components
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Lockers from './pages/Lockers';
import Transactions from './pages/Transactions';
import Users from './pages/Users';
import OtpVerification from './pages/OtpVerification';
import LockerOpenTransactions from './pages/LockerOpenTransactions';

// Context
import { AuthProvider } from './context/AuthContext';
import { colors } from './theme';

function App() {
  return (
    <AuthProvider>
      <Router>
        <View style={styles.container}>
          <Header />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<OtpVerification />} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/lockers" element={
              <ProtectedRoute>
                <Lockers />
              </ProtectedRoute>
            } />
            
            <Route path="/transactions" element={
              <ProtectedRoute>
                <Transactions />
              </ProtectedRoute>
            } />
            
            <Route path="/users" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Users />
              </ProtectedRoute>
            } />

            <Route path="/locker-open-transactions" element={
              <ProtectedRoute>
                <LockerOpenTransactions />
              </ProtectedRoute>
            } />
            
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </View>
      </Router>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    minHeight: '100vh',
  },
});

export default App;