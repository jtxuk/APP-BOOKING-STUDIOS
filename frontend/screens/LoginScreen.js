import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { authAPI } from '../services/api';
import Colors from '../constants/Colors';
import { GlobalStyles } from '../constants/GlobalStyles';
import storage from '../utils/storage';

export default function LoginScreen({ setUserToken }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa email y contraseña');
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 Intentando login...');
      const response = await authAPI.login(email, password);
      const { token, user } = response.data;
      
      console.log('✅ Login exitoso, guardando token...');
      await storage.setItem('userToken', token);
      await storage.setItem('user', JSON.stringify(user));
      
      console.log('✅ Token guardado, verificando...');
      const savedToken = await storage.getItem('userToken');
      console.log('🔍 Token recuperado después de guardar:', savedToken ? 'Sí' : 'No');
      
      // Actualizar el estado para navegar a la app
      setUserToken(token);
    } catch (error) {
      console.error('❌ Login error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.title}>Booking Millenia</Text>
          <Text style={styles.subtitle}>Acceso Restringido</Text>

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
        </View>
      </View>
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
});
