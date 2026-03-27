import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { studioAPI, bookingAPI, userAPI, adminAPI } from '../services/api';
import * as SecureStore from 'expo-secure-store';

const SLOTS = [
  { number: 1, start: '08:00', end: '11:00' },
  { number: 2, start: '11:00', end: '14:00' },
  { number: 3, start: '14:00', end: '17:00' },
  { number: 4, start: '17:00', end: '20:00' },
];

LocaleConfig.locales['es'] = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  today: 'Hoy',
};
LocaleConfig.defaultLocale = 'es';

export default function CalendarScreen({ route }) {
  const { studio } = route.params;
  const isCompactLayout = Platform.OS !== 'web';
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [markedDates, setMarkedDates] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [holidays, setHolidays] = useState([]);

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
      return;
    }
    Alert.alert(title, message);
  };

  const showConfirm = (title, message, onConfirm) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed) {
        onConfirm();
      }
      return;
    }
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Aceptar', onPress: onConfirm },
    ]);
  };

  useEffect(() => {
    checkAdminStatus();
    fetchHolidays();
    fetchTimeSlots(selectedDate);
  }, [selectedDate]);

  const checkAdminStatus = async () => {
    try {
      const response = await userAPI.getProfile();
      setIsAdmin(response.data.role === 'admin');
    } catch (error) {
      console.log('Error checking admin status:', error);
    }
  };

  const fetchHolidays = async () => {
    try {
      const response = await studioAPI.getHolidays();
      setHolidays(response.data);
    } catch (error) {
      console.log('Error fetching holidays:', error);
    }
  };

  useEffect(() => {
    // Generar fechas marcadas para los próximos 60 días
    const marked = {};
    const today = new Date();
    for (let i = 0; i < 60; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      
      // Marcar fines de semana en rojo y deshabilitarlos solo para no-admin
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        marked[dateString] = {
          disabled: !isAdmin,
          disableTouchEvent: !isAdmin,
          textColor: '#ff0000',
          dotColor: '#ff0000',
        };
      }
      
      // Marcar festivos en rojo y deshabilitarlos solo para no-admin
      if (holidays.includes(dateString)) {
        marked[dateString] = {
          disabled: !isAdmin,
          disableTouchEvent: !isAdmin,
          textColor: '#ff0000',
          dotColor: '#ff0000',
        };
      }
    }
    
    // Agregar el día seleccionado
    if (selectedDate) {
      const selectedDay = new Date(selectedDate).getDay();
      const isHoliday = holidays.includes(selectedDate);
      if (isAdmin || (selectedDay !== 0 && selectedDay !== 6 && !isHoliday)) {
        marked[selectedDate] = {
          ...marked[selectedDate],
          selected: true,
          selectedColor: '#0E6BA8',
        };
      }
    }
    
    setMarkedDates(marked);
  }, [selectedDate, holidays, isAdmin]);

  const fetchTimeSlots = async (date) => {
    try {
      setLoading(true);
      const response = await studioAPI.getTimeSlots(studio.id, date);
      setTimeSlots(response.data);
    } catch (error) {
      showAlert('Error', 'No se pudieron cargar los horarios');
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlot = async (slot) => {
    // Si es admin y el slot está reservado, mostrar opciones
    if (isAdmin && slot.status === 'booked') {
      if (Platform.OS === 'web') {
        const confirmed = window.confirm(`Reservado por: ${slot.initials}\n¿Eliminar esta reserva?`);
        if (confirmed) {
          try {
            const bookingsResponse = await adminAPI.getAllBookings();
            const booking = bookingsResponse.data.find(
              b => b.time_slot_id === slot.id && b.status === 'confirmed'
            );

            if (booking) {
              await adminAPI.cancelBooking(booking.id);
              showAlert('Éxito', 'Reserva eliminada');
              fetchTimeSlots(selectedDate);
            }
          } catch (error) {
            showAlert('Error', 'No se pudo eliminar la reserva');
          }
        }
        return;
      }

      Alert.alert(
        'Gestión de Reserva',
        `Reservado por: ${slot.initials}\n¿Qué deseas hacer?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar reserva',
            style: 'destructive',
            onPress: async () => {
              try {
                const bookingsResponse = await adminAPI.getAllBookings();
                const booking = bookingsResponse.data.find(
                  b => b.time_slot_id === slot.id && b.status === 'confirmed'
                );

                if (booking) {
                  await adminAPI.cancelBooking(booking.id);
                  Alert.alert('Éxito', 'Reserva eliminada');
                  fetchTimeSlots(selectedDate);
                }
              } catch (error) {
                Alert.alert('Error', 'No se pudo eliminar la reserva');
              }
            },
          },
        ]
      );
      return;
    }

    if (slot.status === 'booked') {
      showAlert('No disponible', 'Este horario ya está reservado');
      return;
    }

    if (slot.status === 'blocked') {
      showAlert('Bloqueado', 'Este horario no está disponible');
      return;
    }

    const formattedDate = new Date(selectedDate).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const confirmMessage =
      `${studio.name}\n` +
      `${formattedDate}\n` +
      `${slot.start_time} - ${slot.end_time}\n\n` +
      '¿Confirmar?';

    showConfirm('Confirmar reserva', confirmMessage, async () => {
      setBooking(true);
      try {
        await bookingAPI.createBooking(studio.id, slot.id, selectedDate);
        showAlert('Éxito', 'Reserva realizada correctamente');
        fetchTimeSlots(selectedDate);
      } catch (error) {
        showAlert('Error', error.response?.data?.error || 'Error al realizar la reserva');
      } finally {
        setBooking(false);
      }
    });
  };

  const renderSlot = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.slotCard,
        isCompactLayout && styles.slotCardCompact,
        item.status === 'booked' && styles.slotBooked,
        item.status === 'blocked' && styles.slotBlocked,
      ]}
      onPress={() => handleBookSlot(item)}
      disabled={(!isAdmin && (item.status === 'booked' || item.status === 'blocked')) || booking}
    >
      <Text style={styles.slotTime}>{item.start_time} - {item.end_time}</Text>
      <Text style={[
        styles.slotStatus,
        item.status === 'booked' && styles.statusBooked,
        item.status === 'blocked' && styles.statusBlocked,
      ]}>
        {item.status === 'booked' 
          ? `Reservado: ${item.initials}${isAdmin ? ' (toca para eliminar)' : ''}` 
          : item.status === 'blocked'
          ? 'Bloqueado'
          : 'Disponible'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.calendarContainer, isCompactLayout && styles.calendarContainerCompact]}>
        <Calendar
          current={selectedDate}
          onDayPress={(day) => {
            const dayOfWeek = new Date(day.dateString).getDay();
            const isHoliday = holidays.includes(day.dateString);
            if (isAdmin || (dayOfWeek !== 0 && dayOfWeek !== 6 && !isHoliday)) {
              setSelectedDate(day.dateString);
            }
          }}
          markedDates={markedDates}
          minDate={new Date().toISOString().split('T')[0]}
          firstDay={1}
          hideExtraDays
          showSixWeeks={false}
          monthFormat={'MMMM yyyy'}
          theme={{
            selectedDayBackgroundColor: '#0E6BA8',
            selectedDayTextColor: '#fff',
            todayTextColor: '#0E6BA8',
            arrowColor: '#0E6BA8',
            textDisabledColor: '#ff0000',
            textDayFontSize: isCompactLayout ? 12 : 13,
            textMonthFontSize: isCompactLayout ? 14 : 15,
            'stylesheet.calendar.header': {
              header: {
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingLeft: isCompactLayout ? 8 : 10,
                paddingRight: isCompactLayout ? 8 : 10,
                marginTop: isCompactLayout ? 2 : 6,
                alignItems: 'center',
                paddingBottom: isCompactLayout ? 2 : 5,
              },
              monthText: {
                fontSize: isCompactLayout ? 14 : 15,
                fontWeight: 'bold',
                paddingTop: 0,
                paddingBottom: 0,
                color: '#0E6BA8',
                margin: 0,
              },
            },
            'stylesheet.day.basic': {
              base: {
                width: isCompactLayout ? 28 : 32,
                height: isCompactLayout ? 28 : 32,
                alignItems: 'center',
                justifyContent: 'center',
              },
              text: {
                marginTop: 0,
                fontSize: isCompactLayout ? 12 : 13,
                fontWeight: '300',
                color: '#2d4150',
              },
            },
          }}
          style={[
            styles.calendar,
            isCompactLayout && styles.calendarCompact,
          ]}
        />
      </View>

      <View style={[styles.slotsContainer, isCompactLayout && styles.slotsContainerCompact]}>
        <Text style={[styles.studioTitle, isCompactLayout && styles.studioTitleCompact]}>{studio.name}</Text>
        <Text style={[styles.dateText, isCompactLayout && styles.dateTextCompact]}>
          {new Date(selectedDate).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0E6BA8" />
          </View>
        ) : (
          <FlatList
            data={timeSlots}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderSlot}
            scrollEnabled={!isCompactLayout}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 800,
  },
  calendarContainer: {
    backgroundColor: '#fff',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  calendarContainerCompact: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  calendar: {
    paddingTop: 0,
    paddingBottom: 5,
  },
  calendarCompact: {
    paddingBottom: 2,
  },
  slotsContainer: {
    flex: 1,
    padding: 8,
  },
  slotsContainerCompact: {
    paddingTop: 4,
    paddingHorizontal: 6,
    paddingBottom: 6,
  },
  studioTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  studioTitleCompact: {
    fontSize: 16,
    marginBottom: 1,
  },
  dateText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 10,
    textTransform: 'capitalize',
  },
  dateTextCompact: {
    fontSize: 12,
    marginBottom: 6,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotCard: {
    backgroundColor: '#fff',
    borderRadius: 2,
    padding: 8,
    marginBottom: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  slotCardCompact: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  slotBooked: {
    borderLeftColor: '#f44336',
    opacity: 0.6,
  },
  slotTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  slotStatus: {
    fontSize: 12,
    color: '#4CAF50',
  },
  statusBooked: {
    color: '#f44336',
  },
});
