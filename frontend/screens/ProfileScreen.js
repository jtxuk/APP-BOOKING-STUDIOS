import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { userAPI } from '../services/api';
import Colors from '../constants/Colors';
import { GlobalStyles } from '../constants/GlobalStyles';
import storage from '../utils/storage';

export default function ProfileScreen({ setUserToken, navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getProfile();
      setUser(response.data);
    } catch (error) {
      console.error('Profile error:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', onPress: () => {} },
        {
          text: 'Sí, cerrar sesión',
          onPress: async () => {
            try {
              await storage.removeItem('userToken');
              await storage.removeItem('user');
              setUserToken(null);
            } catch (error) {
              console.log('Error logging out:', error);
            }
          },
        },
      ]
    );
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas nuevas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setChangingPassword(true);
      await userAPI.changePassword(currentPassword, newPassword);
      Alert.alert('Éxito', 'Contraseña cambiada correctamente');
      setModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'No se pudo cambiar la contraseña');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0E6BA8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <View style={styles.initialsCircle}>
          <Text style={styles.initials}>{user?.initials}</Text>
        </View>
        <Text style={styles.username}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {user?.category && (
          <Text style={styles.category}>Curso: {user.category}</Text>
        )}
        {user?.fin_acceso && (
          <Text style={styles.accessDate}>
            Acceso válido hasta: {new Date(user.fin_acceso).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </Text>
        )}
      </View>

      {user?.role === 'admin' && (
        <TouchableOpacity
          style={styles.adminButton}
          onPress={() => navigation.navigate('Admin')}
        >
          <Text style={styles.adminButtonText}>Gestión Alumnos</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.changePasswordButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.changePasswordText}>Cambiar Contraseña</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cambiar Contraseña</Text>

            <TextInput
              style={styles.input}
              placeholder="Contraseña actual"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />

            <TextInput
              style={styles.input}
              placeholder="Nueva contraseña"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <TextInput
              style={styles.input}
              placeholder="Confirmar nueva contraseña"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleChangePassword}
                disabled={changingPassword}
              >
                {changingPassword ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...GlobalStyles.container,
    padding: 20,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 600,
  },
  centerContainer: GlobalStyles.centerContainer,
  profileCard: {
    ...GlobalStyles.card,
    padding: 30,
    alignItems: 'center',
    marginTop: 30,
  },
  initialsCircle: {
    width: 80,
    height: 80,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  initials: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.textWhite,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  email: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  category: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 5,
  },
  accessDate: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 8,
    fontWeight: '600',
  },
  adminButton: {
    ...GlobalStyles.buttonPrimary,
    marginTop: 20,
  },
  adminButtonText: {
    ...GlobalStyles.buttonPrimaryText,
  },
  changePasswordButton: {
    backgroundColor: '#0E6BA8',
    padding: 15,
    borderRadius: 2,
    alignItems: 'center',
    marginTop: 15,
  },
  changePasswordText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    ...GlobalStyles.buttonDanger,
    marginTop: 40,
  },
  logoutText: {
    ...GlobalStyles.buttonDangerText,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 2,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 2,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 2,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#0E6BA8',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
