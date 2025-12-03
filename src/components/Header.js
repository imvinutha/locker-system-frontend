import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native-web';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { colors, radii, shadows } from '../theme';

const Header = () => {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if the device is mobile based on screen width
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Don't show header on login, register, and OTP verification pages
  if (
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/verify-otp'
  ) {
    return null;
  }

  return (
    <View style={styles.header}>
      <Text style={styles.logo}>Locker System</Text>
      
      {isAuthenticated && (
        <>
          {/* Hamburger menu button for mobile */}
          {isMobile && (
            <TouchableOpacity 
              style={styles.hamburger} 
              onPress={() => setMenuOpen(!menuOpen)}
            >
              <View style={styles.hamburgerLine}></View>
              <View style={styles.hamburgerLine}></View>
              <View style={styles.hamburgerLine}></View>
            </TouchableOpacity>
          )}
          
          {/* Navigation container - desktop always visible, mobile only when menu is open */}
          <View style={[styles.navContainer, isMobile && styles.mobileNavContainer, isMobile && !menuOpen && styles.hiddenNav]}>
            <TouchableOpacity 
              style={[styles.navItem, isMobile && styles.mobileNavItem]} 
              onPress={() => {
                navigate('/dashboard');
                if (isMobile) setMenuOpen(false);
              }}
            >
              <Text style={styles.navText}>Dashboard</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.navItem, isMobile && styles.mobileNavItem]} 
              onPress={() => {
                navigate('/lockers');
                if (isMobile) setMenuOpen(false);
              }}
            >
              <Text style={styles.navText}>Lockers</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.navItem, isMobile && styles.mobileNavItem]} 
              onPress={() => {
                navigate('/transactions');
                if (isMobile) setMenuOpen(false);
              }}
            >
              <Text style={styles.navText}>Transactions</Text>
            </TouchableOpacity>
            
            {user && user.role === 'admin' && (
              <TouchableOpacity 
                style={[styles.navItem, isMobile && styles.mobileNavItem]} 
                onPress={() => {
                  navigate('/users');
                  if (isMobile) setMenuOpen(false);
                }}
              >
                <Text style={styles.navText}>Users</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.navItem, isMobile && styles.mobileNavItem]} 
              onPress={() => {
                navigate('/locker-open-transactions');
                if (isMobile) setMenuOpen(false);
              }}
            >
              <Text style={styles.navText}>Locker Open Transaction</Text>
            </TouchableOpacity>
            
            <View style={[styles.userInfo, isMobile && styles.mobileUserInfo]}>
              <Text style={styles.userName}>{user?.name || 'User'}</Text>
              <Text style={styles.userRole}>({user?.role || 'user'})</Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.logoutButton, isMobile && styles.mobileLogoutButton]} 
              onPress={() => {
                handleLogout();
                if (isMobile) setMenuOpen(false);
              }}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.card,
    zIndex: 1000,
  },
  logo: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  // Hamburger menu styles
  hamburger: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: 30,
    height: 20,
    zIndex: 1001,
  },
  hamburgerLine: {
    width: '100%',
    height: 3,
    backgroundColor: colors.text,
    borderRadius: 3,
  },
  // Navigation container styles
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mobileNavContainer: {
    position: 'absolute',
    top: 70,
    right: 0,
    backgroundColor: colors.surface,
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: radii.md,
    borderBottomRightRadius: radii.md,
    borderColor: colors.border,
    borderWidth: 1,
    ...shadows.card,
    zIndex: 999,
  },
  hiddenNav: {
    display: 'none',
  },
  // Navigation item styles
  navItem: {
    marginLeft: 20,
  },
  mobileNavItem: {
    marginLeft: 0,
    marginBottom: 15,
    width: '100%',
  },
  navText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  // User info styles
  userInfo: {
    marginLeft: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mobileUserInfo: {
    marginLeft: 0,
    marginBottom: 15,
    marginTop: 10,
    width: '100%',
  },
  userName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  userRole: {
    color: colors.textMuted,
    fontSize: 14,
    marginLeft: 5,
  },
  // Logout button styles
  logoutButton: {
    marginLeft: 20,
    backgroundColor: colors.danger,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: radii.sm,
  },
  mobileLogoutButton: {
    marginLeft: 0,
    marginTop: 5,
    width: '100%',
    alignItems: 'center',
  },
  logoutText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
});

export default Header;