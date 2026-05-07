import React from 'react';
import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius, ThemeColors, typography } from '@/design/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export function BottomNavBar() {
  const { colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const styles = createStyles(colors);

  const tabs = [
    { name: 'Home', icon: 'home', route: '/dashboard' },
    { name: 'Analytics', icon: 'pie-chart', route: '/analytics' },
    { name: 'Add', icon: 'add', route: '/add-transaction', isCenter: true },
    { name: 'Budgets', icon: 'wallet', route: '/budgets' },
    { name: 'Account', icon: 'person', route: '/account' },
  ];

  const navigate = (route: string) => {
    if (pathname === route) return;
    router.replace(route as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {tabs.map((tab) => {
          const isActive = pathname === tab.route;
          
          if (tab.isCenter) {
            return (
              <Pressable key={tab.name} style={styles.centerButtonWrap} onPress={() => navigate(tab.route)}>
                <View style={styles.centerButton}>
                  <Ionicons name={tab.icon as any} size={30} color="#FFFFFF" />
                </View>
              </Pressable>
            );
          }

          return (
            <Pressable key={tab.name} style={styles.tab} onPress={() => navigate(tab.route)}>
              <Ionicons 
                name={(isActive ? tab.icon : `${tab.icon}-outline`) as any} 
                size={24} 
                color={isActive ? colors.primary : colors.textSecondary} 
              />
              <Text style={[styles.label, isActive && styles.labelActive]}>{tab.name}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'transparent',
    },
    bar: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      height: Platform.OS === 'ios' ? 85 : 70,
      borderTopWidth: 1,
      borderTopColor: colors.line,
      paddingBottom: Platform.OS === 'ios' ? 20 : 0,
      alignItems: 'center',
      justifyContent: 'space-around',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
        android: {
          elevation: 20,
        },
      }),
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    label: {
      ...typography.caption,
      fontSize: 10,
      color: colors.textSecondary,
    },
    labelActive: {
      color: colors.primary,
      fontWeight: '700',
    },
    centerButtonWrap: {
      top: -20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    centerButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 8,
    },
  });
