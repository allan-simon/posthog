# Generated by Django 3.2.14 on 2022-09-15 12:26

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('posthog', '0258_team_recording_domains'),
    ]

    operations = [
        migrations.AlterField(
            model_name='organization',
            name='plugins_access_level',
            field=models.PositiveSmallIntegerField(choices=[(0, 'none'), (3, 'config'), (6, 'install'), (9, 'root')], default=3),
        ),
    ]
