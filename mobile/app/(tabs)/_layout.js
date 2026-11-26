import React, { useEffect, useRef, useState } from 'react';
import { Platform, View, Text } from 'react-native';
import { Tabs, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { initNotifications, showLocalNotification } from '../../src/services/notifications';
import { COLORS } from '../../src/theme/colors';

export default function TabLayout() {
  const { user, couple } = useAuth();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const lastNotifiedIdRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (user) {
      initNotifications();
    }
  }, [user]);

  useEffect(() => {
    if (!user || !couple) return;

    const checkUnread = async () => {
      try {
        let count = 0;
        let latest = null;
        try {
          const res = await api.get('/chat/unread-count/');
          count = res.data?.unread_count || 0;
          latest = res.data?.latest_unread || null;
        } catch {
          // Fallback if backend hasn't redeployed /chat/unread-count/ yet
          const res = await api.get('/chat/messages/');
          const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
          const myId = String(user?.id || '');
          const unreadMsgs = list.filter((m) => {
            if (String(m.sender?.id || '') === myId) return false;
            const statuses = m.statuses || [];
            if (statuses.length === 0) return false;
            const myStatus = statuses.find((s) => String(s.recipient?.id || '') === myId);
            return myStatus ? myStatus.status !== 'read' : statuses.some((s) => s.status !== 'read');
          });
          count = unreadMsgs.length;
          if (unreadMsgs[0]) {
            latest = {
              id: String(unreadMsgs[0].id),
              sender_name:
                unreadMsgs[0].sender?.profile?.nickname ||
                unreadMsgs[0].sender?.first_name ||
                'Mon Bae',
              content: unreadMsgs[0].content || 'Nouveau message',
            };
          }
        }

        const isOnChat = pathname?.includes('chat');
        const visibleCount = isOnChat ? 0 : count;
        setUnreadCount(visibleCount);

        if (Platform.OS === 'web' && typeof document !== 'undefined') {
          document.title = visibleCount > 0 ? `(${visibleCount}) Man Ak Bae ❤️` : 'Man Ak Bae ❤️';
        }

        if (latest && latest.id) {
          if (initializedRef.current && latest.id !== lastNotifiedIdRef.current && !isOnChat) {
            showLocalNotification(`💌 ${latest.sender_name}`, latest.content);
          }
          lastNotifiedIdRef.current = latest.id;
        }
        initializedRef.current = true;
      } catch {
        // Ignore silent polling errors
      }
    };

    checkUnread();
    const interval = setInterval(checkUnread, 3500);
    return () => clearInterval(interval);
  }, [user, couple, pathname]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.surfaceBorder,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.primaryRose,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'heart' : 'heart-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ position: 'relative' }}>
              <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={size} color={color} />
              {unreadCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -10,
                    minWidth: 19,
                    height: 19,
                    borderRadius: 10,
                    backgroundColor: '#FF3B6B',
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 4,
                    borderWidth: 1.5,
                    borderColor: COLORS.surface,
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800' }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          title: 'Jeux',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'sparkles' : 'sparkles-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="memories"
        options={{
          title: 'Souvenirs',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'images' : 'images-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
