import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import { adminAPI } from '../services/api';

export default function AdminScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [collapsedCategories, setCollapsedCategories] = useState({
    'PME': true,
    'EST-SUP': true,
    'ING': true,
    'PME+ING': true
  });
  const [sortBy, setSortBy] = useState('date'); // 'name' o 'date'
  const [sortDropdownVisible, setSortDropdownVisible] = useState(false);
  const [searchText, setSearchText] = useState(''); // Búsqueda de alumnos
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    category: 'PME',
    initials: '',
    role: 'alum',
    activo: true,
  });
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedUserForHistory, setSelectedUserForHistory] = useState(null);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllUsers();
      setUsers(response.data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const filterBySearch = (user) => {
    const searchLower = searchText.toLowerCase();
    return user.name.toLowerCase().includes(searchLower) || 
           user.email.toLowerCase().includes(searchLower) ||
           (user.initials && user.initials.toLowerCase().includes(searchLower));
  };

  const sortUsers = (usersList) => {
    return [...usersList].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        // Ordenar por fecha de registro (created_at)
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA; // Más reciente primero
      }
    });
  };

  const getUsersByCategory = () => {
    const categoryOrder = ['PME', 'EST-SUP', 'ING', 'PME+ING'];
    const groupedUsers = {};

    // Filtrar usuarios por searchText
    const filteredUsers = users.filter(filterBySearch);

    // Agrupar usuarios por categoría
    filteredUsers.forEach(user => {
      const category = user.category || 'Sin categoría';
      if (!groupedUsers[category]) {
        groupedUsers[category] = [];
      }
      groupedUsers[category].push(user);
    });

    // Convertir a formato SectionList ordenado
    return categoryOrder
      .filter(cat => groupedUsers[cat] && groupedUsers[cat].length > 0)
      .map(category => ({
        title: category,
        data: collapsedCategories[category] ? [] : sortUsers(groupedUsers[category]),
      }));
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setFormError('');
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      category: 'PME',
      initials: '',
      role: 'alum',
      activo: true,
    });
    setModalVisible(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormError('');
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      password: '', // No prellenar contraseña
      category: user.category,
      initials: user.initials,
      role: user.role,
      activo: user.activo,
    });
    setModalVisible(true);
  };

  const handleSaveUser = async () => {
    try {
      setFormError('');
      if (!formData.name || !formData.email || !formData.category || !formData.initials) {
        setFormError('Por favor completa todos los campos obligatorios');
        return;
      }

      const normalizedInitials = formData.initials.trim().toUpperCase();
      if (!normalizedInitials) {
        setFormError('Las iniciales son obligatorias');
        return;
      }
      if (normalizedInitials.length > 4) {
        setFormError('Las iniciales no pueden superar 4 caracteres');
        return;
      }

      if (!editingUser && !formData.password) {
        setFormError('La contraseña es obligatoria para nuevos usuarios');
        return;
      }

      const dataToSend = { ...formData, initials: normalizedInitials };
      
      // Si es edición y no hay contraseña, no la enviamos
      if (editingUser && !formData.password) {
        delete dataToSend.password;
      }

      if (editingUser) {
        await adminAPI.updateUser(editingUser.id, dataToSend);
        Alert.alert('Éxito', 'Usuario actualizado correctamente');
      } else {
        await adminAPI.createUser(dataToSend);
        Alert.alert('Éxito', 'Usuario creado correctamente');
      }

      setModalVisible(false);
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      const apiError = error.response?.data?.error || 'Error al guardar usuario';
      const normalizedError = apiError.toLowerCase();
      if (normalizedError.includes('iniciales') && (normalizedError.includes('uso') || normalizedError.includes('existe') || normalizedError.includes('duplicate'))) {
        setFormError('Ya existe un usuario con esas iniciales. Usa una combinación distinta.');
      } else {
        setFormError(apiError);
      }
    }
  };

  const handleDeleteUser = async (user) => {
    // For web compatibility, use window.confirm
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`¿Estás seguro de eliminar a ${user.name}?`);
      if (confirmed) {
        try {
          await adminAPI.deleteUser(user.id);
          Alert.alert('Éxito', 'Usuario eliminado correctamente');
          fetchUsers();
        } catch (error) {
          Alert.alert('Error', 'No se pudo eliminar el usuario');
        }
      }
    } else {
      Alert.alert(
        'Confirmar eliminación',
        `¿Estás seguro de eliminar a ${user.name}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              try {
                await adminAPI.deleteUser(user.id);
                Alert.alert('Éxito', 'Usuario eliminado correctamente');
                fetchUsers();
              } catch (error) {
                Alert.alert('Error', 'No se pudo eliminar el usuario');
              }
            },
          },
        ]
      );
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await adminAPI.updateUser(user.id, { activo: !user.activo });
      fetchUsers();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado del usuario');
    }
  };

  const handleViewHistory = async (user) => {
    try {
      setSelectedUserForHistory(user);
      setLoadingHistory(true);
      setHistoryModalVisible(true);
      const response = await adminAPI.getUserBookingHistory(user.id);
      setBookingHistory(response.data);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el historial de reservas');
      console.error(error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const renderUserItem = ({ item }) => {
    const roleLabel = item.role === 'user' ? 'ALUMN' : (item.role || '').toUpperCase();
    return (
      <View style={styles.userCard}>
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.userName}>{item.name}</Text>
              {item.initials && (
                <Text style={styles.initialsLarge}>{item.initials}</Text>
              )}
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.userEmail}>{item.email}</Text>
              <Text style={[styles.badge, styles.categoryBadge]}>{item.category}</Text>
            </View>
            {item.fin_acceso && (
              <View style={styles.infoRow}>
                <Text style={styles.userDate}>
                  Acceso hasta: {new Date(item.fin_acceso).toLocaleDateString('es-ES')}
                </Text>
                <Text style={[styles.badge, styles.roleBadge]}>{roleLabel}</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditUser(item)}
        >
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.historyButton]}
          onPress={() => handleViewHistory(item)}
        >
          <Text style={styles.actionButtonText}>Historial</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteUser(item)}
        >
          <Text style={styles.actionButtonText}>Eliminar</Text>
        </TouchableOpacity>
        </View>
      </View>
    );
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
      <View style={styles.header}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddUser}>
          <Text style={styles.addButtonText}>+ Agregar Alumno</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sortContainer}>
        <View style={styles.sortDropdownWrapper}>
          <TouchableOpacity
            style={styles.sortDropdownButton}
            onPress={() => setSortDropdownVisible(!sortDropdownVisible)}
          >
            <Text style={styles.sortDropdownText}>
              Ordenar: {sortBy === 'name' ? 'Nombre' : 'Fecha'} ▼
            </Text>
          </TouchableOpacity>
          {sortDropdownVisible && (
            <View style={styles.sortDropdownMenu}>
              <TouchableOpacity
                style={styles.sortDropdownOption}
                onPress={() => {
                  setSortBy('date');
                  setSortDropdownVisible(false);
                }}
              >
                <Text style={[styles.sortDropdownOptionText, sortBy === 'date' && styles.sortDropdownOptionTextActive]}>Fecha</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sortDropdownOption}
                onPress={() => {
                  setSortBy('name');
                  setSortDropdownVisible(false);
                }}
              >
                <Text style={[styles.sortDropdownOptionText, sortBy === 'name' && styles.sortDropdownOptionTextActive]}>Nombre</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#999"
        />
      </View>

      <SectionList
        sections={getUsersByCategory()}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => renderUserItem({ item })}
        renderSectionHeader={({ section: { title } }) => (
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleCategory(title)}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionCollapse}>
                {collapsedCategories[title] ? '▶' : '▼'}
              </Text>
              <Text style={styles.sectionTitle}>{title}</Text>
            </View>
            <Text style={styles.sectionCount}>
              {users.filter(u => u.category === title && filterBySearch(u)).length} alumno{users.filter(u => u.category === title && filterBySearch(u)).length !== 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={true}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {editingUser ? 'Editar Alumno' : 'Nuevo Alumno'}
              </Text>

              {!!formError && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{formError}</Text>
                </View>
              )}

              <TextInput
                style={styles.input}
                placeholder="Nombre completo (incluir ambos apellidos) *"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              <TextInput
                style={styles.input}
                placeholder="Email *"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                style={styles.input}
                placeholder="Teléfono"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
              />

              <TextInput
                style={styles.input}
                placeholder={editingUser ? 'Contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                secureTextEntry
              />

              <TextInput
                style={styles.input}
                placeholder="Iniciales (hasta 4 caracteres) *"
                value={formData.initials}
                onChangeText={(text) => setFormData({ ...formData, initials: text.toUpperCase() })}
                maxLength={4}
                autoCapitalize="characters"
              />

              <Text style={styles.label}>Categoría:</Text>
              <View style={styles.categoryButtons}>
                {['PME', 'EST-SUP', 'ING', 'PME+ING'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryButton,
                      formData.category === cat && styles.categoryButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, category: cat })}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        formData.category === cat && styles.categoryButtonTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Rol:</Text>
              <View style={styles.roleButtons}>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    formData.role === 'user' && styles.roleButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, role: 'user' })}
                >
                  <Text
                    style={[
                      styles.roleButtonText,
                      formData.role === 'user' && styles.roleButtonTextActive,
                    ]}
                  >
                    Usuario
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    formData.role === 'admin' && styles.roleButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, role: 'admin' })}
                >
                  <Text
                    style={[
                      styles.roleButtonText,
                      formData.role === 'admin' && styles.roleButtonTextActive,
                    ]}
                  >
                    Administrador
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalToggleContainer}>
                <Text style={styles.label}>Estado del alumno:</Text>
                <View style={styles.modalToggleWrapper}>
                  <Switch
                    value={formData.activo}
                    onValueChange={(value) => setFormData({ ...formData, activo: value })}
                    trackColor={{ false: '#ccc', true: '#0E6BA8' }}
                    thumbColor={formData.activo ? '#fff' : '#f4f3f4'}
                    style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                  />
                  <Text style={[styles.toggleLabel, formData.activo ? styles.toggleActive : styles.toggleInactive]}>
                    {formData.activo ? 'Activo' : 'Inactivo'}
                  </Text>
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveUser}
                >
                  <Text style={styles.saveButtonText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={historyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Historial de Reservas - {selectedUserForHistory?.name}
            </Text>
            
            {loadingHistory ? (
              <ActivityIndicator size="large" color="#0E6BA8" style={{ marginVertical: 20 }} />
            ) : (
              <ScrollView style={{ maxHeight: 500 }}>
                {bookingHistory.length === 0 ? (
                  <Text style={styles.emptyHistoryText}>No hay reservas en el historial</Text>
                ) : (
                  bookingHistory.map((booking, index) => (
                    <View key={index} style={styles.historyItem}>
                      <View style={styles.historyHeader}>
                        <Text style={styles.historyStudio}>{booking.studio_name}</Text>
                        <Text style={[
                          styles.historyStatus,
                          booking.status === 'cancelled' && styles.historyCancelled,
                          booking.status === 'completed' && styles.historyCompleted,
                          booking.status === 'confirmed' && styles.historyConfirmed
                        ]}>
                          {booking.status === 'cancelled' ? 'CANCELADA' : 
                           booking.status === 'completed' ? 'COMPLETADA' : 'CONFIRMADA'}
                        </Text>
                      </View>
                      <Text style={styles.historyDate}>
                        {new Date(booking.slot_date).toLocaleDateString('es-ES', {
                          weekday: 'short',
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        })}
                      </Text>
                      <Text style={styles.historyTime}>
                        {booking.start_time} - {booking.end_time}
                      </Text>
                      <Text style={styles.historyCreated}>
                        Reservada: {new Date(booking.created_at).toLocaleDateString('es-ES')}
                      </Text>
                    </View>
                  ))
                )}
              </ScrollView>
            )}
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setHistoryModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cerrar</Text>
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
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 900,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#0E6BA8',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 2,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 15,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 2,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  userInfo: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  initialsLarge: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0E6BA8',
    letterSpacing: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  userDate: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoryBadge: {
    backgroundColor: '#E3F2FD',
    color: '#0E6BA8',
  },
  roleBadge: {
    backgroundColor: '#F3E5F5',
    color: '#7B1FA2',
  },
  actionsContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
    alignItems: 'center',
  },
  toggleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 2,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  toggleLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 6,
  },
  toggleActive: {
    color: '#0E6BA8',
  },
  toggleInactive: {
    color: '#999',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 2,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#0E6BA8',
  },
  historyButton: {
    backgroundColor: '#2E7D32',
  },
  deleteButton: {
    backgroundColor: '#D32F2F',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 10,
    zIndex: 999,
  },
  sortDropdownWrapper: {
    position: 'relative',
    zIndex: 1000,
  },
  sortDropdownButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    minWidth: 160,
  },
  sortDropdownText: {
    fontSize: 14,
    color: '#333',
  },
  sortDropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderTopWidth: 0,
    borderRadius: 4,
    marginTop: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1001,
  },
  sortDropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sortDropdownOptionText: {
    fontSize: 14,
    color: '#333',
  },
  sortDropdownOptionTextActive: {
    fontWeight: 'bold',
    color: '#0E6BA8',
  },
  searchInput: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    fontSize: 14,
    color: '#333',
    width: 180,
  },
  sectionHeader: {
    backgroundColor: '#0E6BA8',
    paddingVertical: 12,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionCollapse: {
    fontSize: 14,
    color: '#fff',
    marginRight: 10,
    width: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionCount: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
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
    maxHeight: '90%',
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
  errorBox: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#D32F2F',
    borderRadius: 2,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },
  errorText: {
    color: '#B71C1C',
    fontSize: 13,
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
  },
  categoryButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#0E6BA8',
  },
  categoryButtonActive: {
    backgroundColor: '#0E6BA8',
  },
  categoryButtonText: {
    color: '#0E6BA8',
    fontWeight: 'bold',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#7B1FA2',
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#7B1FA2',
  },
  roleButtonText: {
    color: '#7B1FA2',
    fontWeight: 'bold',
  },
  roleButtonTextActive: {
    color: '#fff',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalToggleContainer: {
    marginBottom: 20,
  },
  modalToggleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 2,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 2,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#999',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#0E6BA8',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  historyItem: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 2,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#0E6BA8',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyStudio: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  historyStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
  },
  historyCancelled: {
    backgroundColor: '#FFEBEE',
    color: '#D32F2F',
  },
  historyCompleted: {
    backgroundColor: '#E8F5E9',
    color: '#2E7D32',
  },
  historyConfirmed: {
    backgroundColor: '#E3F2FD',
    color: '#0E6BA8',
  },
  historyDate: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  historyTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  historyCreated: {
    fontSize: 12,
    color: '#999',
  },
  emptyHistoryText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginVertical: 20,
  },
});
