from django.db import models
from django.contrib.auth.models import User

class Servicio(models.Model):
    id_custom = models.CharField(max_length=50, primary_key=True) 
    nombre = models.CharField(max_length=100)

    def __str__(self):
        return self.nombre

class Habitacion(models.Model):
    id_custom = models.CharField(max_length=100, primary_key=True) 
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField()
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    imagen = models.CharField(max_length=500, default="/imagenes/Hotel4_mejorada.jpg")
    servicios = models.ManyToManyField(Servicio, blank=True)

    def __str__(self):
        return self.nombre

class Reserva(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    habitacion = models.ForeignKey(Habitacion, on_delete=models.CASCADE)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    fecha_registro = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Reserva de {self.usuario.username} - {self.habitacion.nombre}"