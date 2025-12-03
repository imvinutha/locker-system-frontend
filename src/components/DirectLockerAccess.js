import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native-web';
import { LOCKER_API_URL } from '../config';
import { colors, radii } from '../theme';

/**
 * Custom function to communicate with locker hardware using raw fetch
 * This handles HTTP/0.9 responses that standard libraries reject
 * @param {string} path - The path to request (e.g., '/S3' or '/03')
 * @returns {Promise<string>} - Raw response from the locker hardware
 */
const fetchLockerRaw = async (path) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
  
  try {
    // Use fetch with text mode and manual mode to handle non-standard responses
    const response = await fetch(`${LOCKER_API_URL}${path}`, {
      method: 'GET',
      signal: controller.signal,
      // Disable automatic redirect following
      redirect: 'manual',
      // Request as text to handle non-standard responses
      headers: {
        'Accept': 'text/plain,*/*'
      }
    });
    
    // Get the raw text response regardless of status code
    const text = await response.text();
    return {
      ok: true,
      text,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    // Handle fetch errors (network errors, aborts, etc.)
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    
    // For other errors, try to use XMLHttpRequest as a fallback
    // This is more tolerant of non-standard HTTP responses
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', `${LOCKER_API_URL}${path}`, true);
      
      // Set appropriate headers for mobile compatibility
      xhr.setRequestHeader('Accept', 'text/plain,*/*');
      xhr.setRequestHeader('Cache-Control', 'no-cache');
      
      xhr.onload = function() {
        const success = (xhr.status >= 200 && xhr.status < 300) || xhr.responseText.length > 0;
        resolve({
          ok: success, // Consider any response with content as successful
          text: xhr.responseText,
          status: xhr.status,
          statusText: xhr.statusText,
          headers: {}
        });
      };
      
      xhr.onerror = function() {
        // Even if there's an error, we might have received some response text
        if (xhr.responseText) {
          resolve({
            ok: false,
            text: xhr.responseText,
            status: xhr.status,
            statusText: 'Error',
            headers: {}
          });
        } else {
          reject(new Error('Network error accessing locker hardware. Please check your connection.'));
        }
      };
      
      xhr.ontimeout = function() {
        reject(new Error('Request timed out. The locker hardware is not responding.'));
      };
      
      xhr.timeout = 8000; // Increase timeout for mobile connections
      xhr.send();
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

const DirectLockerAccess = () => {
  const [lockerNumber, setLockerNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);
  const [action, setAction] = useState(null); // 'status' or 'open'

  const getLockerStatus = async () => {
    if (!lockerNumber || isNaN(parseInt(lockerNumber)) || parseInt(lockerNumber) < 1 || parseInt(lockerNumber) > 8) {
      setError('Please enter a valid locker number (1-8)');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);
    setAction('status');

    try {
      // Direct API call to hardware using our custom raw fetch function
      const path = `/S${lockerNumber}`;
      console.log(`Directly accessing locker status at: ${LOCKER_API_URL}${path}`);
      
      const response = await fetchLockerRaw(path);

      // Log the complete raw response for debugging
      console.log('Direct status response (raw):', response.text);
      console.log('Response headers:', response.headers);
      console.log('Response status:', response.status);
      console.log('Response text bytes:', Array.from(new TextEncoder().encode(response.text)));
      console.log('Response text hex:', Array.from(new TextEncoder().encode(response.text)).map(b => b.toString(16).padStart(2, '0')).join(' '));
      
      // Convert response to string and trim whitespace
      const responseText = String(response.text).trim();
      console.log('Response text (first 100 chars):', responseText.substring(0, 100));
      console.log('Response text (full):', responseText);
      
      // Split the response by lines to analyze each line
      const lines = responseText.split(/\r?\n|<br>|<br\/>|<br \/>/i);
      console.log('Response lines:', lines);
      
      // Look for status pattern in each line
      let statusLine = '';
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        console.log(`Line ${i}:`, line);
        
        if (line.includes('Status=')) {
          statusLine = line;
          console.log('Found status line:', statusLine);
          break;
        }
      }
      
      // Extract status from the line
      let parsedStatus = 'Unknown status';
      let statusType = 'unknown'; // 'open', 'closed', or 'unknown'
      
      if (statusLine) {
        // Try to extract just the Status=XXX_Y part
        const statusMatch = statusLine.match(/Status=(Open|Close)_\d+/);
        if (statusMatch) {
          parsedStatus = statusMatch[0];
          statusType = statusMatch[1].toLowerCase() === 'open' ? 'open' : 'closed';
          console.log('Extracted status:', parsedStatus, 'Type:', statusType);
        } else {
          parsedStatus = statusLine;
          console.log('Using full status line:', parsedStatus);
        }
      }
      
      // If no status line was found but we have a response, check the entire response
      if (!statusLine && responseText) {
        const fullMatch = responseText.match(/Status=(Open|Close)_\d+/);
        if (fullMatch) {
          parsedStatus = fullMatch[0];
          statusType = fullMatch[1].toLowerCase() === 'open' ? 'open' : 'closed';
          console.log('Extracted status from full response:', parsedStatus, 'Type:', statusType);
        }
      }
      
      // Show the complete response data for debugging
      setResponse({
        rawResponse: response.text,
        parsedStatus: parsedStatus,
        statusType: statusType,
        responseInfo: `Status code: ${response.status}, Status text: ${response.statusText || 'unknown'}`
      });
    } catch (err) {
      console.error('Error accessing locker directly:', err);
      
      // Extract detailed error information
      let errorMessage = `Failed to access locker: ${err.message}`;
      
      // Handle specific network errors
      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Connection timeout: The locker hardware is not responding within the time limit.';
      } else if (err.code === 'ECONNRESET') {
        errorMessage = 'Connection reset: The locker hardware closed the connection unexpectedly.';
      } else if (err.code === 'ECONNREFUSED') {
        errorMessage = 'Connection refused: Unable to connect to the locker hardware.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const openLocker = async () => {
    if (!lockerNumber || isNaN(parseInt(lockerNumber)) || parseInt(lockerNumber) < 1 || parseInt(lockerNumber) > 8) {
      setError('Please enter a valid locker number (1-8)');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);
    setAction('open');

    try {
      // Direct API call to hardware using our custom raw fetch function
      const path = `/0${lockerNumber}`;
      console.log(`Directly opening locker at: ${LOCKER_API_URL}${path}`);
      
      const response = await fetchLockerRaw(path);

      // Log the complete raw response for debugging
      console.log('Direct open response (raw):', response.text);
      console.log('Response headers:', response.headers);
      console.log('Response status:', response.status);
      console.log('Response text bytes:', Array.from(new TextEncoder().encode(response.text)));
      console.log('Response text hex:', Array.from(new TextEncoder().encode(response.text)).map(b => b.toString(16).padStart(2, '0')).join(' '));
      
      // Convert response to string and trim whitespace
      const responseText = String(response.text).trim();
      console.log('Response text (full):', responseText);
      
      // Split the response by lines to analyze each line
      const lines = responseText.split(/\r?\n|<br>|<br\/>|<br \/>/i);
      console.log('Response lines:', lines);
      
      // For open commands, check if we got a status response
      let parsedStatus = 'Command sent to open locker';
      let statusType = 'unknown';
      
      // Check if the response contains a status indicator
      const statusMatch = responseText.match(/Status=(Open|Close)_\d+/);
      if (statusMatch) {
        parsedStatus = statusMatch[0];
        statusType = statusMatch[1].toLowerCase() === 'open' ? 'open' : 'closed';
        console.log('Extracted status from open response:', parsedStatus, 'Type:', statusType);
      } else if (responseText.includes('Press Any one key')) {
        // If we see the success message, assume it opened
        parsedStatus = 'Locker opened successfully';
        statusType = 'open';
      }
      
      setResponse({
        rawResponse: response.text,
        parsedStatus: parsedStatus,
        statusType: statusType,
        responseInfo: `Status code: ${response.status}, Status text: ${response.statusText || 'unknown'}`
      });
    } catch (err) {
      console.error('Error opening locker directly:', err);
      
      // Extract detailed error information
      let errorMessage = `Failed to open locker: ${err.message}`;
      
      // Handle specific network errors
      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Connection timeout: The locker hardware is not responding within the time limit.';
      } else if (err.code === 'ECONNRESET') {
        errorMessage = 'Connection reset: The locker hardware closed the connection unexpectedly.';
      } else if (err.code === 'ECONNREFUSED') {
        errorMessage = 'Connection refused: Unable to connect to the locker hardware.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Direct Locker Hardware Access</Text>
      <Text style={styles.subtitle}>Bypass backend and access locker hardware directly</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Locker Number (1-8):</Text>
        <TextInput
          style={styles.input}
          value={lockerNumber}
          onChangeText={setLockerNumber}
          keyboardType="numeric"
          placeholder="Enter locker number"
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.statusButton]} 
          onPress={getLockerStatus}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Get Status</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.openButton]} 
          onPress={openLocker}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Open Locker</Text>
        </TouchableOpacity>
      </View>
      
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>
            {action === 'status' ? 'Getting locker status...' : 'Opening locker...'}
          </Text>
        </View>
      )}
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {response && (
        <View style={styles.responseContainer}>
          <Text style={styles.responseTitle}>
            {action === 'status' ? 'Locker Status:' : 'Open Locker Result:'}
          </Text>
          
          <View style={[styles.statusContainer, 
            response.statusType === 'open' ? styles.openStatusContainer : 
            response.statusType === 'closed' ? styles.closedStatusContainer : 
            styles.unknownStatusContainer
          ]}>
            <Text style={[styles.statusText, 
              response.statusType === 'open' ? styles.openStatusText : 
              response.statusType === 'closed' ? styles.closedStatusText : 
              styles.unknownStatusText
            ]}>{response.parsedStatus}</Text>
          </View>
          
          {response.responseInfo && (
            <View style={styles.responseInfoContainer}>
              <Text style={styles.responseInfoText}>{response.responseInfo}</Text>
            </View>
          )}
          
          <Text style={styles.rawResponseTitle}>Raw Response:</Text>
          <ScrollView style={styles.responseScroll}>
            <Text style={styles.responseText}>{response.rawResponse}</Text>
          </ScrollView>
          
          <Text style={styles.rawResponseTitle}>Response Details:</Text>
          <ScrollView style={styles.responseScroll}>
            <Text style={styles.responseText}>
              Text Length: {response.rawResponse ? response.rawResponse.length : 0} characters\n
              First 10 bytes: {response.rawResponse ? Array.from(new TextEncoder().encode(response.rawResponse.substring(0, 10))).map(b => b.toString(16).padStart(2, '0')).join(' ') : 'N/A'}
            </Text>
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  openStatusContainer: {
    backgroundColor: '#FEF2F2',
  },
  closedStatusContainer: {
    backgroundColor: '#ECFDF3',
  },
  unknownStatusContainer: {
    backgroundColor: '#FFF7E6',
  },
  openStatusText: {
    color: colors.danger,
    fontWeight: 'bold',
  },
  closedStatusText: {
    color: colors.success,
    fontWeight: 'bold',
  },
  unknownStatusText: {
    color: colors.warning,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
    gap: 6,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: colors.textMuted,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 12,
    backgroundColor: colors.background,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  statusButton: {
    backgroundColor: colors.brandDark,
  },
  openButton: {
    backgroundColor: colors.brand,
  },
  buttonText: {
    color: colors.surface,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    padding: 15,
    borderRadius: radii.md,
    marginVertical: 10,
  },
  errorText: {
    color: colors.danger,
  },
  responseContainer: {
    marginTop: 20,
    gap: 12,
  },
  responseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  statusContainer: {
    padding: 15,
    borderRadius: radii.md,
    marginBottom: 15,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  responseInfoContainer: {
    backgroundColor: colors.accentSoft,
    padding: 10,
    borderRadius: radii.md,
    marginBottom: 15,
  },
  responseInfoText: {
    fontSize: 14,
    color: colors.text,
    fontFamily: 'monospace',
  },
  rawResponseTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: colors.textMuted,
  },
  responseScroll: {
    maxHeight: 200,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 10,
  },
  responseText: {
    fontFamily: 'monospace',
    color: colors.text,
  },
});

export default DirectLockerAccess;