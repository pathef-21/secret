from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='avatar_data',
            field=models.BinaryField(blank=True, help_text="Sauvegarde binaire permanente de l'avatar", null=True),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='avatar_mime_type',
            field=models.CharField(blank=True, default='', max_length=80),
        ),
    ]
