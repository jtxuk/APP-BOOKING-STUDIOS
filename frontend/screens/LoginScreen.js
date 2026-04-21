import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import { authAPI } from '../services/api';
import Colors from '../constants/Colors';
import { GlobalStyles } from '../constants/GlobalStyles';
import storage from '../utils/storage';

export default function LoginScreen({ setUserToken, initialResetToken = '' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotStep, setForgotStep] = useState('email'); // 'email' o 'token'
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!initialResetToken) {
      return;
    }

    setShowForgotModal(true);
    setForgotStep('token');
    setResetToken(initialResetToken);
    setForgotMessage('');

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('reset-token');
      window.history.replaceState({}, '', url.toString());
    }
  }, [initialResetToken]);

  const handleLogin = async () => {
    setErrorMessage(''); 
    
    if (!email || !password) {
      setErrorMessage('Por favor ingresa email y contraseña');
      return;
    }

    setLoading(true);
    try {
      console.log('Intentando login con:', email);
      const response = await authAPI.login(email, password);
      const { token, user } = response.data;
      
      console.log('Login exitoso');
      await storage.setItem('userToken', token);
      await storage.setItem('user', JSON.stringify(user));
      
      const savedToken = await storage.getItem('userToken');
      console.log('Token guardado:', savedToken ? 'Sí' : 'No');
      
      setUserToken(token);
    } catch (error) {
      console.error('Login error completo:', error);
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
      console.error('Message:', error.message);
      
      let errorMsg = 'Error al iniciar sesión. Verifica tus credenciales.';
      if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.response?.status === 401) {
        errorMsg = 'Credenciales inválidas';
      } else if (error.message === 'Network Error') {
        errorMsg = 'Error de conexión. Verifica tu conexión a internet.';
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      setErrorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setForgotMessage('');

    if (!forgotEmail) {
      setForgotMessage('Por favor ingresa tu email');
      return;
    }

    setForgotLoading(true);
    try {
      await authAPI.forgotPassword(forgotEmail);
      setForgotMessage('Te hemos enviado un email con un código de recuperación');
      setForgotStep('token');
    } catch (error) {
      console.error('Forgot password error:', error);
      setForgotMessage(error.response?.data?.error || 'Error al procesar la solicitud');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setForgotMessage('');

    if (!resetToken || !newPassword || !confirmPassword) {
      setForgotMessage('Por favor completa todos los campos');
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotMessage('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      setForgotMessage('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setForgotLoading(true);
    try {
      await authAPI.resetPassword(resetToken, newPassword);
      setForgotMessage('Contraseña actualizada correctamente. Ahora puedes iniciar sesión.');
      setTimeout(() => {
        closeForgotModal();
      }, 2000);
    } catch (error) {
      console.error('Reset password error:', error);
      setForgotMessage(error.response?.data?.error || 'Error al resetear contraseña');
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotStep('email');
    setForgotEmail('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotMessage('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.loginBox}>
        <Image
          source={require('../assets/logo-millenia-v2-png.webp')}
          style={styles.logo}
          resizeMode="contain"
        />
        
        <View style={styles.content}>
          <Text style={styles.title}>Reservas Millenia</Text>
          <Text style={styles.subtitle}>Acceso Restringido</Text>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowForgotModal(true)}
            disabled={loading}
          >
            <Text style={styles.forgotText}>Recuperar contraseña</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal de recuperación de contraseña */}
      <Modal
        visible={showForgotModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <TouchableOpacity onPress={closeForgotModal} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Recuperar Contraseña</Text>

            {forgotMessage ? (
              <View style={[
                styles.messageBox,
                forgotMessage.includes('Error') || forgotMessage.includes('no coinciden') 
                  ? styles.errorBox 
                  : styles.successBox
              ]}>
                <Text style={[
                  styles.messageText,
                  forgotMessage.includes('Error') || forgotMessage.includes('no coinciden')
                    ? styles.errorText
                    : styles.successText
                ]}>
                  {forgotMessage}
                </Text>
              </View>
            ) : null}

            {forgotStep === 'email' ? (
              <>
                <Text style={styles.stepDescription}>
                  Pon tu email para recibir instrucciones de recuperación
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Tu email"
                  value={forgotEmail}
                  onChangeText={setForgotEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!forgotLoading}
                />
                <TouchableOpacity
                  style={[styles.button, forgotLoading && styles.buttonDisabled]}
                  onPress={handleForgotPassword}
                  disabled={forgotLoading}
                >
                  {forgotLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Enviar Email de Recuperación</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.stepDescription}>
                  Revisa tu email y copia el código
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Código de recuperación"
                  value={resetToken}
                  onChangeText={setResetToken}
                  autoCapitalize="none"
                  editable={!forgotLoading}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Nueva contraseña"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  editable={!forgotLoading}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  editable={!forgotLoading}
                />
                <TouchableOpacity
                  style={[styles.button, forgotLoading && styles.buttonDisabled]}
                  onPress={handleResetPassword}
                  disabled={forgotLoading}
                >
                  {forgotLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Cambiar Contraseña</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loginBox: {
    width: '100%',
    maxWidth: 400,
  },
  logo: {
    width: 280,
    height: 120,
    alignSelf: 'center',
    marginBottom: 40,
  },
  content: {
    backgroundColor: Colors.white,
    borderRadius: 2,
    padding: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 30,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#ef5350',
    borderRadius: 4,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  successBox: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#66bb6a',
    borderRadius: 4,
    padding: 12,
    marginBottom: 20,
  },
  successText: {
    color: '#2e7d32',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  input: {
    ...GlobalStyles.input,
  },
  button: {
    ...GlobalStyles.buttonPrimary,
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.textWhite,
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotText: {
    color: Colors.primary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 15,
    textDecorationLine: 'underline',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  closeButton: {
    alignSelf: 'flex-end',
    paddingBottom: 10,
  },
  closeButtonText: {
    fontSize: 28,
    color: Colors.textSecondary,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  messageBox: {
    borderRadius: 4,
    padding: 12,
    marginBottom: 20,
  },
  messageText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});

