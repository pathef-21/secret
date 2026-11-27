from django.contrib import admin
from .models import Flame, FlameActivity, DailyInstant

admin.site.register(Flame)
admin.site.register(FlameActivity)
admin.site.register(DailyInstant)
