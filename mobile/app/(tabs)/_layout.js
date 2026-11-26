import React, { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
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
          const unreadMsgs = list.filter((m) => {
            if (m.sender?.id === user?.id) return false;
            const myStatus = (m.statuses || []).find((s) => s.recipient?.id === user?.id);
            return myStatus && myStatus.status !== 'read';
          });
          count = unreadMsgs.length;
          if (unreadMsgs[0]) {
            latest = {
              id: String(unreadMsgs[0].id),
              sender_name:
                unreadMsgs[0].sender?.profile?.nickname ||
                unreadMsgs[0].sender?.first_name ||
                'Mon Bae',
              content: unreadMsgs[0].content || '📷 Photo partagée',
            };
          }
        }

        const isOnChat = pathname?.includes('chat');
        const visibleCount = isOnChat ? 0 : count;
        setUnreadCount(visibleCount);

        // Update browser tab title on Web
        if (Platform.OS === 'web' && typeof document !== 'undefined') {
          document.title = visibleCount > 0 ? `(${visibleCount}) Man Ak Bae ❤️` : 'Man Ak Bae ❤️';
        }

        // Trigger notification when a brand new unread message arrives
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
    const interval = setInterval(checkUnread, 4000);
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
          tabBarBadge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#FF3B6B',
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: '800',
          },
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={size} color={color} />
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
