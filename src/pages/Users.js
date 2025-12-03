import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Modal } from 'react-native-web';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../config';

const Users = () => {
  const { user } = useContext(AuthContext);
  const [, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    employee_id: ''
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      window.location.href = '/dashboard';
    }
  }, [user]);

  const fetchUsers = async () => {
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
      
      const response = await axios.get(`${API_URL}/api/users`, config);
      setUsers(response.data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const openUserModal = (user, isEdit = false) => {
    setSelectedUser(user);
    setEditMode(isEdit);
    
    if (isEdit) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || '',
        employee_id: user.employee_id || ''
      });
    }
    
    setModalVisible(true);
    setActionError(null);
    setActionSuccess(null);
  };

  const closeUserModal = () => {
    setModalVisible(false);
    setSelectedUser(null);
    setEditMode(false);
    setActionError(null);
    setActionSuccess(null);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateUser = async () => {
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
      
      // Validate form data
      if (!formData.name || !formData.email || !formData.phone || !formData.role) {
        throw new Error('Please fill all required fields');
      }
      
      // If role is employee, employee_id is required
      if (formData.role === 'employee' && !formData.employee_id) {
        throw new Error('Employee ID is required for employees');
      }
      
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role
      };
      
      if (formData.role === 'employee') {
        updateData.employee_id = formData.employee_id;
      }
      
      const response = await axios.put(`${API_URL}/api/users/${selectedUser.id}`, updateData, config);
      
      // Update the user in the state
      const updatedUsers = users.map(u => {
        if (u.id === selectedUser.id) {
          return { ...u, ...response.data.user };
        }
        return u;
      });
      
      setUsers(updatedUsers);
      setActionSuccess('User updated successfully!');
      
      // Close modal after a short delay
      setTimeout(() => {
        closeUserModal();
        fetchUsers(); // Refresh the list to get the latest data
      }, 1500);
      
    } catch (err) {
      console.error('Error updating user:', err);
      setActionError(err.response?.data?.message || err.message || 'Failed to update user. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      setActionLoading(true);
      setActionError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      await axios.delete(`${API_URL}/api/users/${userId}`, config);
      
      // Remove the user from the state
      const updatedUsers = users.filter(u => u.id !== userId);
      setUsers(updatedUsers);
      
      // If the modal is open and showing the deleted user, close it
      if (selectedUser && selectedUser.id === userId) {
        closeUserModal();
      }
      
      alert('User deleted successfully!');
      
    } catch (err) {
      console.error('Error deleting user:', err);
      alert(err.response?.data?.message || 'Failed to delete user. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2c3e50" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUsers}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
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
      
      <ScrollView style={styles.userList}>
        {users.map((user) => (
          <View key={user.id} style={styles.userCard}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <View style={[styles.roleBadge, user.role === 'admin' ? styles.adminBadge : user.role === 'employee' ? styles.employeeBadge : styles.userBadge]}>
                <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
              </View>
            </View>
            
            <View style={styles.userDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email:</Text>
                <Text style={styles.detailValue}>{user.email}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone:</Text>
                <Text style={styles.detailValue}>{user.phone}</Text>
              </View>
              
              {user.employee_id && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Employee ID:</Text>
                  <Text style={styles.detailValue}>{user.employee_id}</Text>
                </View>
              )}
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Verified:</Text>
                <Text style={styles.detailValue}>{user.is_verified ? 'Yes' : 'No'}</Text>
              </View>
            </View>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.viewButton]}
                onPress={() => openUserModal(user)}
              >
                <Text style={styles.actionButtonText}>View</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.editButton]}
                onPress={() => openUserModal(user, true)}
              >
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>
              
              {/* Don't allow deleting yourself */}
              {user.id !== (window.user?.id) && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => deleteUser(user.id)}
                >
                  <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
      
      {/* User Detail/Edit Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeUserModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedUser && (
              <>
                <Text style={styles.modalTitle}>
                  {editMode ? 'Edit User' : 'User Details'}
                </Text>
                
                {actionError && (
                  <Text style={styles.actionError}>{actionError}</Text>
                )}
                
                {actionSuccess && (
                  <Text style={styles.actionSuccess}>{actionSuccess}</Text>
                )}
                
                {editMode ? (
                  <View style={styles.form}>
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Name</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.name}
                        onChangeText={(text) => handleInputChange('name', text)}
                        placeholder="Full Name"
                      />
                    </View>
                    
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Email</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.email}
                        onChangeText={(text) => handleInputChange('email', text)}
                        placeholder="Email Address"
                        keyboardType="email-address"
                      />
                    </View>
                    
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Phone</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.phone}
                        onChangeText={(text) => handleInputChange('phone', text)}
                        placeholder="Phone Number"
                        keyboardType="phone-pad"
                      />
                    </View>
                    
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Role</Text>
                      <View style={styles.pickerContainer}>
                        <select
                          style={styles.picker}
                          value={formData.role}
                          onChange={(e) => handleInputChange('role', e.target.value)}
                        >
                          <option value="">Select Role</option>
                          <option value="user">User</option>
                          <option value="employee">Employee</option>
                          <option value="admin">Admin</option>
                        </select>
                      </View>
                    </View>
                    
                    {formData.role === 'employee' && (
                      <View style={styles.formGroup}>
                        <Text style={styles.label}>Employee ID</Text>
                        <TextInput
                          style={styles.input}
                          value={formData.employee_id}
                          onChangeText={(text) => handleInputChange('employee_id', text)}
                          placeholder="Employee ID"
                        />
                      </View>
                    )}
                    
                    <TouchableOpacity 
                      style={styles.saveButton}
                      onPress={updateUser}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.userDetailsModal}>
                    <View style={styles.detailRowModal}>
                      <Text style={styles.detailLabelModal}>Name:</Text>
                      <Text style={styles.detailValueModal}>{selectedUser.name}</Text>
                    </View>
                    
                    <View style={styles.detailRowModal}>
                      <Text style={styles.detailLabelModal}>Email:</Text>
                      <Text style={styles.detailValueModal}>{selectedUser.email}</Text>
                    </View>
                    
                    <View style={styles.detailRowModal}>
                      <Text style={styles.detailLabelModal}>Phone:</Text>
                      <Text style={styles.detailValueModal}>{selectedUser.phone}</Text>
                    </View>
                    
                    <View style={styles.detailRowModal}>
                      <Text style={styles.detailLabelModal}>Role:</Text>
                      <Text style={styles.detailValueModal}>{selectedUser.role.toUpperCase()}</Text>
                    </View>
                    
                    {selectedUser.employee_id && (
                      <View style={styles.detailRowModal}>
                        <Text style={styles.detailLabelModal}>Employee ID:</Text>
                        <Text style={styles.detailValueModal}>{selectedUser.employee_id}</Text>
                      </View>
                    )}
                    
                    <View style={styles.detailRowModal}>
                      <Text style={styles.detailLabelModal}>Verified:</Text>
                      <Text style={styles.detailValueModal}>{selectedUser.is_verified ? 'Yes' : 'No'}</Text>
                    </View>
                    
                    <View style={styles.detailRowModal}>
                      <Text style={styles.detailLabelModal}>Created:</Text>
                      <Text style={styles.detailValueModal}>
                        {new Date(selectedUser.created_at).toLocaleString()}
                      </Text>
                    </View>
                    
                    <View style={styles.detailRowModal}>
                      <Text style={styles.detailLabelModal}>Last Updated:</Text>
                      <Text style={styles.detailValueModal}>
                        {new Date(selectedUser.updated_at).toLocaleString()}
                      </Text>
                    </View>
                    
                    <View style={styles.modalActions}>
                      <TouchableOpacity 
                        style={[styles.modalActionButton, styles.editButtonModal]}
                        onPress={() => setEditMode(true)}
                      >
                        <Text style={styles.modalActionButtonText}>Edit</Text>
                      </TouchableOpacity>
                      
                      {selectedUser.id !== (window.user?.id) && (
                        <TouchableOpacity 
                          style={[styles.modalActionButton, styles.deleteButtonModal]}
                          onPress={() => deleteUser(selectedUser.id)}
                        >
                          <Text style={styles.modalActionButtonText}>Delete</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
                
                <TouchableOpacity style={styles.closeModalButton} onPress={closeUserModal}>
                  <Text style={styles.closeModalButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  userList: {
    flex: 1,
  },
  userCard: {
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
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  roleBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  adminBadge: {
    backgroundColor: '#e74c3c',
  },
  employeeBadge: {
    backgroundColor: '#3498db',
  },
  userBadge: {
    backgroundColor: '#2ecc71',
  },
  roleText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userDetails: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 5,
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginLeft: 10,
  },
  viewButton: {
    backgroundColor: '#3498db',
  },
  editButton: {
    backgroundColor: '#f39c12',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  actionError: {
    color: '#e74c3c',
    marginBottom: 15,
    textAlign: 'center',
  },
  actionSuccess: {
    color: '#2ecc71',
    marginBottom: 15,
    textAlign: 'center',
  },
  form: {
    marginBottom: 20,
  },
  formGroup: {
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
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 40,
    backgroundColor: 'white',
    paddingHorizontal: 10,
  },
  saveButton: {
    backgroundColor: '#2ecc71',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userDetailsModal: {
    marginBottom: 20,
  },
  detailRowModal: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  detailLabelModal: {
    fontSize: 16,
    fontWeight: 'bold',
    width: '40%',
    color: '#666',
  },
  detailValueModal: {
    fontSize: 16,
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  modalActionButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginHorizontal: 10,
  },
  editButtonModal: {
    backgroundColor: '#f39c12',
  },
  deleteButtonModal: {
    backgroundColor: '#e74c3c',
  },
  modalActionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeModalButton: {
    backgroundColor: '#95a5a6',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Users;