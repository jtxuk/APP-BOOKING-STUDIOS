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
  const [sortBy, setSortBy] = useState('name'); // 'name' o 'date'
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

    // Agrupar usuarios por categoría
    users.forEach(user => {
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
      if (!formData.name || !formData.email || !formData.category || !formData.initials) {
        Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
        return;
      }

      if (!editingUser && !formData.password) {
        Alert.alert('Error', 'La contraseña es obligatoria para nuevos usuarios');
        return;
      }

      const dataToSend = { ...formData };
      
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
      Alert.alert('Error', error.response?.data?.error || 'Error al guardar usuario');
    }
  };

  const handleDeleteUser = (user) => {
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
  };

  const handleToggleActive = async (user) => {
    try {
      await adminAPI.updateUser(user.id, { activo: !user.activo });
      fetchUsers();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado del usuario');
    }
  };

  const renderUserItem = ({ item }) => (
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
              <Text style={[styles.badge, styles.roleBadge]}>{item.role}</Text>
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
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteUser(item)}
        >
          <Text style={styles.actionButtonText}>Eliminar</Text>
        </TouchableOpacity>
        <View style={styles.toggleContainer}>
          <Switch
            value={item.activo}
            onValueChange={() => handleToggleActive(item)}
            trackColor={{ false: '#ccc', true: '#0E6BA8' }}
            thumbColor={item.activo ? '#fff' : '#f4f3f4'}
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
          <Text style={[styles.toggleLabel, item.activo ? styles.toggleActive : styles.toggleInactive]}>
            {item.activo ? 'Activo' : 'Inactivo'}
          </Text>
        </View>
      </View>
    </View>
  );

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
        <Text style={styles.sortLabel}>Ordenar por:</Text>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'name' && styles.sortButtonActive]}
          onPress={() => setSortBy('name')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'name' && styles.sortButtonTextActive]}>Nombre</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'date' && styles.sortButtonActive]}
          onPress={() => setSortBy('date')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'date' && styles.sortButtonTextActive]}>Fecha</Text>
        </TouchableOpacity>
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
              {users.filter(u => u.category === title).length} alumno{users.filter(u => u.category === title).length !== 1 ? 's' : ''}
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
                placeholder="Iniciales (3 letras) *"
                value={formData.initials}
                onChangeText={(text) => setFormData({ ...formData, initials: text.toUpperCase() })}
                maxLength={3}
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

              <View style={styles.switchContainer}>
                <Text style={styles.label}>Alumno Activo:</Text>
                <Switch
                  value={formData.activo}
                  onValueChange={(value) => setFormData({ ...formData, activo: value })}
                  trackColor={{ false: '#ccc', true: '#0E6BA8' }}
                />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sortLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  sortButton: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#0E6BA8',
    marginRight: 8,
  },
  sortButtonActive: {
    backgroundColor: '#0E6BA8',
  },
  sortButtonText: {
    fontSize: 13,
    color: '#0E6BA8',
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: '#fff',
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
});
