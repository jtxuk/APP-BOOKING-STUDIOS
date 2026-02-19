import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { studioAPI } from '../services/api';

export default function StudioListScreen({ navigation }) {
  const [studios, setStudios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudios();
  }, []);

  const fetchStudios = async () => {
    try {
      setLoading(true);
      const response = await studioAPI.getStudios();
      setStudios(response.data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los estudios');
    } finally {
      setLoading(false);
    }
  };

  const handleStudioPress = (studio) => {
    navigation.navigate('Calendar', { studio });
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
      <FlatList
        data={studios}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.studioCard}
            onPress={() => handleStudioPress(item)}
          >
            <View style={styles.studioHeader}>
              <Text style={styles.studioName}>{item.name}</Text>
              {item.categories && (
                <View style={styles.categoriesContainer}>
                  {item.categories.split(',').map((cat, index) => (
                    <Text key={index} style={styles.categoryBadge}>
                      {cat.trim()}
                    </Text>
                  ))}
                </View>
              )}
            </View>
            <Text style={styles.studioDescription}>{item.description || 'Estudio de grabación'}</Text>
            <Text style={styles.linkText}>Reservar →</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />
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
  listContent: {
    padding: 15,
  },
  studioCard: {
    backgroundColor: '#fff',
    borderRadius: 2,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  studioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  studioName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  categoriesContainer: {
    flexDirection: 'row',
    gap: 5,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    backgroundColor: '#0E6BA8',
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  studioDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  linkText: {
    fontSize: 14,
    color: '#0E6BA8',
    fontWeight: '600',
  },
});
