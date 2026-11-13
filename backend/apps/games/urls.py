from django.urls import path
from .views import (
    AvailableGamesView,
    RandomQuestionView,
    ActiveSessionsView,
    SubmitGameAnswerView
)

urlpatterns = [
    path('list/', AvailableGamesView.as_view(), name='game_list'),
    path('question/<str:game_type>/', RandomQuestionView.as_view(), name='game_random_question'),
    path('sessions/', ActiveSessionsView.as_view(), name='game_sessions'),
    path('sessions/<uuid:session_id>/answer/', SubmitGameAnswerView.as_view(), name='game_submit_answer'),
]

