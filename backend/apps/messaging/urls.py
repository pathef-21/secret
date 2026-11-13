from django.urls import path
from .views import (
    ConversationMessagesView,
    SendMessageView,
    ReactToMessageView,
    MarkMessagesAsReadView,
    DeleteMessageView
)

urlpatterns = [
    path('messages/', ConversationMessagesView.as_view(), name='conversation_messages'),
    path('send/', SendMessageView.as_view(), name='send_message'),
    path('messages/<uuid:message_id>/react/', ReactToMessageView.as_view(), name='react_message'),
    path('messages/read/', MarkMessagesAsReadView.as_view(), name='read_messages'),
    path('messages/<uuid:message_id>/', DeleteMessageView.as_view(), name='delete_message'),
]

