import React from 'react';
import { View, Platform, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../src/theme/theme';
import { ActiveTripDock } from '../../src/components/trips/ActiveTripDock';
import { useResponsiveLayout } from '../../src/hooks/useResponsiveLayout';

interface WebTabButtonProps {
  children?: React.ReactNode;
  onPress?: (e: any) => void;
  style?: StyleProp<ViewStyle>;
  [key: string]: any;
}

export const WebTabButton = React.forwardRef<any, WebTabButtonProps>((props, ref) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  const handlePress = (e: any) => {
    if (Platform.OS === 'web' && e && typeof e.preventDefault === 'function') {
      const hasModifierKey = e.metaKey || e.altKey || e.ctrlKey || e.shiftKey;
      if (!hasModifierKey) {
        e.preventDefault();
      }
    }
    props.onPress?.(e);
  };

  return (
    <Pressable
      ref={ref}
      {...props}
      onPress={handlePress}
      onHoverIn={(e: any) => {
        setIsHovered(true);
        props.onHoverIn?.(e);
      }}
      onHoverOut={(e: any) => {
        setIsHovered(false);
        props.onHoverOut?.(e);
      }}
      onFocus={(e: any) => {
        setIsFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e: any) => {
        setIsFocused(false);
        props.onBlur?.(e);
      }}
      style={[
        props.style,
        styles.webTabButton,
        isHovered && styles.webTabButtonHovered,
        isFocused && styles.webTabButtonFocused,
      ]}
    >
      {props.children}
    </Pressable>
  );
});

WebTabButton.displayName = 'WebTabButton';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom;
  const { isWide } = useResponsiveLayout();
  const isDesktopWeb = Platform.OS === 'web' && isWide;

  const mobileTabBarStyle: ViewStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderTopColor: theme.colors.surfaceContainer,
    height: 76 + bottomInset,
    paddingTop: 6,
    paddingBottom: Math.max(bottomInset, 10),
    ...theme.shadows.card,
  };

  const desktopTabBarStyle: ViewStyle = {
    position: 'absolute',
    bottom: 16,
    marginBottom: 16,
    left: '50%',
    transform: [{ translateX: -270 }],
    width: 540,
    maxWidth: 540,
    height: 68,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(117, 155, 113, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingTop: 6,
    paddingBottom: 6,
    ...theme.shadows.card,
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.brandForest,
          tabBarInactiveTintColor: theme.colors.outline,
          tabBarStyle: isDesktopWeb ? desktopTabBarStyle : mobileTabBarStyle,
          tabBarButton: isDesktopWeb ? (props) => <WebTabButton {...props} /> : undefined,
          tabBarLabelStyle: {
            ...theme.typography.labelSm,
            fontWeight: '600',
            fontSize: 12,
            lineHeight: 16,
          },
        }}
      >
        <Tabs.Screen
          name="(explore)"
          options={{
            title: 'Inicial',
            tabBarLabel: 'Inicial',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
            ),
          }}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault();
              navigation.navigate('(explore)', { screen: 'index' });
            },
          })}
        />
        <Tabs.Screen
          name="(routes)"
          options={{
            title: 'Rotas',
            tabBarLabel: 'Rotas',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'compass' : 'compass-outline'} size={size} color={color} />
            ),
          }}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault();
              navigation.navigate('(routes)', { screen: 'index' });
            },
          })}
        />
        <Tabs.Screen
          name="(profile)"
          options={{
            title: 'Perfil',
            tabBarLabel: 'Perfil',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
            ),
          }}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault();
              navigation.navigate('(profile)', { screen: 'index' });
            },
          })}
        />
      </Tabs>
      <ActiveTripDock />
    </View>
  );
}

const styles = StyleSheet.create({
  webTabButton: {
    cursor: 'pointer' as any,
    borderRadius: 16,
    marginVertical: 4,
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webTabButtonHovered: {
    backgroundColor: 'rgba(51, 96, 30, 0.08)',
  },
  webTabButtonFocused: {
    outlineWidth: 2,
    outlineStyle: 'solid',
    outlineColor: theme.colors.brandForest,
    outlineOffset: 2,
    backgroundColor: 'rgba(51, 96, 30, 0.06)',
  } as any,
});

