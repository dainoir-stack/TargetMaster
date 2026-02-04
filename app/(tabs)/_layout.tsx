import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerTitle: "TargetMaster",
        headerTitleStyle: {
          fontSize: 22,
          fontWeight: '800',
          color: '#5D4037',
          letterSpacing: -0.5,
        },
        headerStyle: {
          backgroundColor: '#FCFBF4',
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarStyle: {
          backgroundColor: '#FFF',
          borderTopWidth: 1,
          borderTopColor: '#F0EFEA',
          height: Platform.OS === 'ios' ? 95 : 75,
          paddingBottom: Platform.OS === 'ios' ? 35 : 12,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 13,        // Larger font size
          fontWeight: '700',   
          letterSpacing: -0.2, 
          marginTop: 2,        
        },
        tabBarActiveTintColor: '#5D4037',
        tabBarInactiveTintColor: '#A1887F', 
      }}>
      
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: "Targets",
          tabBarIcon: ({ color }) => (
            // Switched to Target icon here
            <MaterialCommunityIcons name="target" size={28} color={color} />
          )
        }} 
      />
      
      <Tabs.Screen 
        name="planner" 
        options={{ 
          title: "Planner",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="calendar-check" size={26} color={color} />
          )
        }} 
      />
      
      <Tabs.Screen 
        name="store" 
        options={{ 
          title: "Store",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="storefront" size={26} color={color} />
          )
        }} 
      />
      
    </Tabs>
  );
}