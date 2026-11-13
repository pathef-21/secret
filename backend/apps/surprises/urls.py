from django.urls import path
from .views import (
    LoveLettersView,
    OpenLoveLetterView,
    SurprisesView,
    RevealSurpriseView
)

urlpatterns = [
    path('letters/', LoveLettersView.as_view(), name='love_letters'),
    path('letters/<uuid:letter_id>/open/', OpenLoveLetterView.as_view(), name='open_love_letter'),
    path('surprises/', SurprisesView.as_view(), name='surprises_list'),
    path('surprises/<uuid:surprise_id>/reveal/', RevealSurpriseView.as_view(), name='reveal_surprise'),
]

