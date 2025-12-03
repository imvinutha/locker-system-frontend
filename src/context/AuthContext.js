import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Check if user is logged in on mount
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setLoading(false);
          return;
        }
        
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };
        
        const response = await axios.get(`${API_URL}/api/auth/me`, config);
        
        if (response.data && response.data.user) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    
    checkLoggedIn();
  }, []);
  
  // Register user
  const register = async (userData) => {
    try {
      console.log('AuthContext: Starting registration process');
      setError(null);
      
      console.log('AuthContext: Making API request to:', `${API_URL}/api/auth/register`);
      const response = await axios.post(`${API_URL}/api/auth/register`, userData);
      console.log('AuthContext: Registration API response:', response.data);
      
      if (response.data.token) {
        console.log('AuthContext: Token received, storing in localStorage');
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        console.log('AuthContext: User state updated');
      } else {
        console.log('AuthContext: No token in response');
      }
      
      return response.data;
    } catch (error) {
      console.error('AuthContext: Registration error:', error);
      console.error('AuthContext: Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      setError(error.response?.data?.message || 'Registration failed');
      throw error;
    }
  };
  
  // Login user
  const login = async (email, password) => {
    try {
      setError(null);
      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      
      // If OTP is required
      if (response.data.requiresOTP) {
        return response.data;
      }
      
      // If login is successful without OTP
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
      }
      
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };
  
  // Verify OTP
  const verifyOTP = async (userId, otp) => {
    try {
      setError(null);
      const response = await axios.post(`${API_URL}/api/auth/verify-otp`, {userId, otp });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
      }
      
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'OTP verification failed');
      throw error;
    }
  };
  
  // Passwordless: Request OTP by phone
  const requestOtpByPhone = async (phone) => {
    try {
      setError(null);
    
      const response = await axios.post(`${API_URL}/api/auth/otp/request`, { phone });
      return response.data;
    
    } catch (error) {
    
      // Extract readable error message
      const message =
        error.response?.data?.message ||        // backend error
        error.message ||                        // axios error
        'OTP request failed';                   // fallback
    
      setError(message);
    
      // For phone debugging - show alert popup
      alert("Error: " + message);
    
      throw error;
    }
    
  };

  // Passwordless: Verify OTP by phone
  const verifyOtpByPhone = async (phone, otp) => {
    try {
      setError(null);
      const response = await axios.post(`${API_URL}/api/auth/otp/verify`, { phone, otp });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
      }
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'OTP verification failed');
      throw error;
    }
  };
  
  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      register,
      login,
      verifyOTP,
      logout,
      isAuthenticated: !!user,
      requestOtpByPhone,
      verifyOtpByPhone,
    }}>
      {children}
    </AuthContext.Provider>
  );
};