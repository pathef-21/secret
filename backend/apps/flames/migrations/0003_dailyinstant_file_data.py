from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('flames', '0002_dailyinstant_and_flameactivity_instant'),
    ]

    operations = [
        migrations.AddField(
            model_name='dailyinstant',
            name='file_data',
            field=models.BinaryField(blank=True, help_text='Sauvegarde binaire permanente', null=True),
        ),
        migrations.AddField(
            model_name='dailyinstant',
            name='mime_type',
            field=models.CharField(blank=True, default='', max_length=80),
        ),
    ]
