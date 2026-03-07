import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { View, Text, StyleSheet } from 'react-native'

import { HomeScreen } from '../screens/HomeScreen'
import { MarketDetailScreen } from '../screens/MarketDetailScreen'
import { CreateMarketScreen } from '../screens/CreateMarketScreen'
import { PortfolioScreen } from '../screens/PortfolioScreen'
import { SettingsScreen } from '../screens/SettingsScreen'
import { colors, spacing } from '../components/ui/theme'

// Stack navigator for Markets tab (Home -> MarketDetail)
export type MarketsStackParamList = {
  Home: undefined
  MarketDetail: { marketId: string }
}

const MarketsStack = createNativeStackNavigator<MarketsStackParamList>()

const MarketsStackNavigator = () => (
  <MarketsStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.text,
      headerTitleStyle: { fontWeight: '600' },
      contentStyle: { backgroundColor: colors.background },
    }}
  >
    <MarketsStack.Screen
      name="Home"
      component={HomeScreen}
      options={{ headerShown: false }}
    />
    <MarketsStack.Screen
      name="MarketDetail"
      component={MarketDetailScreen}
      options={{ title: 'Market' }}
    />
  </MarketsStack.Navigator>
)

// Bottom Tab Navigator
export type TabParamList = {
  Markets: undefined
  Create: undefined
  Portfolio: undefined
  Settings: undefined
}

const Tab = createBottomTabNavigator<TabParamList>()

// Simple tab icon component
const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  const icons: Record<string, string> = {
    Markets: '📊',
    Create: '➕',
    Portfolio: '💼',
    Settings: '⚙️',
  }

  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
        {icons[name]}
      </Text>
    </View>
  )
}

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarIcon: ({ focused }) => (
            <TabIcon name={route.name} focused={focused} />
          ),
        })}
      >
        <Tab.Screen
          name="Markets"
          component={MarketsStackNavigator}
          options={{ title: 'Markets' }}
        />
        <Tab.Screen
          name="Create"
          component={CreateMarketScreen}
          options={{ title: 'Create' }}
        />
        <Tab.Screen
          name="Portfolio"
          component={PortfolioScreen}
          options={{ title: 'Portfolio' }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    height: 60,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.6,
  },
  tabIconFocused: {
    opacity: 1,
  },
})
