from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('memories', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='memory',
            name='file_data',
            field=models.BinaryField(blank=True, help_text='Sauvegarde binaire permanente', null=True),
        ),
        migrations.AddField(
            model_name='memory',
            name='mime_type',
            field=models.CharField(blank=True, default='', max_length=80),
        ),
    ]
