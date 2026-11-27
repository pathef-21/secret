from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('messaging', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='messageattachment',
            name='file_data',
            field=models.BinaryField(blank=True, help_text='Sauvegarde binaire permanente pour les vocaux', null=True),
        ),
        migrations.AddField(
            model_name='messageattachment',
            name='mime_type',
            field=models.CharField(blank=True, default='', max_length=80),
        ),
    ]
