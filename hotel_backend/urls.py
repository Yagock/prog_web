"""
URL configuration for hotel_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from core import views
from django.contrib import admin
from django.urls import path
from core.views import (
    registro_usuario,
    lista_habitaciones,
    detalle_habitacion,
    check_email_disponible,
    lista_usuarios,
    detalle_usuario
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/registro/', registro_usuario),
    path('api/usuarios/check-email/', check_email_disponible),
    path('api/usuarios/', lista_usuarios),
    path('api/usuarios/<str:id>/', detalle_usuario),
    path('api/habitaciones/', lista_habitaciones),
    path('api/habitaciones/<str:id>/', detalle_habitacion),
    path('api/login/', views.api_login),
]
