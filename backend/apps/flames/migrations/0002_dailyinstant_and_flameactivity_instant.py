import apps.flames.models
import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('couples', '0001_initial'),
        ('flames', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='flameactivity',
            name='has_sent_instant',
            field=models.BooleanField(default=False),
        ),
        migrations.CreateModel(
            name='DailyInstant',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('instant_date', models.DateField(db_index=True, default=apps.flames.models.get_current_dakar_date)),
                ('media_file', models.FileField(upload_to='instants/')),
                ('media_type', models.CharField(choices=[('image', 'Photo'), ('video', 'Vidéo')], default='image', max_length=10)),
                ('caption', models.CharField(blank=True, default='', max_length=160)),
                ('viewed_by_partner', models.BooleanField(default=False)),
                ('viewed_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('couple', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='instants', to='couples.couple')),
                ('sender', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sent_instants', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
