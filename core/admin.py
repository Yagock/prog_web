from django.contrib import admin
from .models import Servicio, Habitacion, Reserva

admin.site.register(Servicio)
admin.site.register(Habitacion)
admin.site.register(Reserva)