import { StyleSheet } from 'react-native';
import Colors from './Colors';

export const GlobalStyles = StyleSheet.create({
  // Headers para navegación
  headerStyle: {
    backgroundColor: Colors.primary,
  },
  headerTitleStyle: {
    fontWeight: 'bold',
    color: Colors.textWhite,
  },
  
  // Containers
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Cards
  card: {
    backgroundColor: Colors.white,
    borderRadius: 2,
    padding: 15,
    marginBottom: 15,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  
  // Buttons
  buttonPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: 2,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonPrimaryText: {
    color: Colors.textWhite,
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  buttonSecondary: {
    backgroundColor: Colors.white,
    borderRadius: 2,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonSecondaryText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  buttonDanger: {
    backgroundColor: Colors.error,
    borderRadius: 2,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDangerText: {
    color: Colors.textWhite,
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Inputs
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 2,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: Colors.white,
  },
  
  // Text styles
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  bodyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  smallText: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  
  // Badges
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
    fontSize: 12,
    fontWeight: 'bold',
  },
  badgeBlue: {
    backgroundColor: Colors.badgeBlue,
    color: Colors.categoryBlue,
  },
  badgePurple: {
    backgroundColor: Colors.badgePurple,
    color: Colors.categoryPurple,
  },
  badgeOrange: {
    backgroundColor: Colors.badgeOrange,
    color: Colors.categoryOrange,
  },
  
  // List
  listContent: {
    padding: 15,
  },
});

// Configuración común para Stack Navigators
export const stackScreenOptions = {
  headerStyle: {
    backgroundColor: Colors.primary,
  },
  headerTintColor: Colors.textWhite,
  headerTitleStyle: {
    fontWeight: 'bold',
  },
  headerBackTitle: 'Volver',
};
