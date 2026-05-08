from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Habitacion
import json
from django.contrib.auth import authenticate

@csrf_exempt
def registro_usuario(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            if User.objects.filter(username=data['email']).exists():
                return JsonResponse({"error": "El correo ya está registrado"}, status=400)
                
            user = User.objects.create_user(
                username=data['email'],
                email=data['email'],
                password=data['password']
            )
            return JsonResponse({"message": "Usuario creado con éxito", "id": user.id}, status=201)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    return JsonResponse({"error": "Método no permitido"}, status=405)

def lista_habitaciones(request):
    habitaciones = Habitacion.objects.all()
    data = []
    
    for h in habitaciones:
        data.append({
            "id": h.id_custom,
            "nombre": h.nombre,
            "descripcion": h.descripcion,
            "precio": float(h.precio),
            "imagen": h.imagen,
            "servicios": [s.nombre for s in h.servicios.all()]
        })
    
    return JsonResponse(data, safe=False)

@csrf_exempt
def api_login(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            password = data.get('password')

            # En Django, por defecto el 'username' es el que se usa para autenticar
            # Si al crear tu admin pusiste tu email como username, esto funcionará:
            user = authenticate(username=email, password=password)

            if user is not None:
                return JsonResponse({
                    "id": user.id,
                    "nombre": user.first_name or user.username,
                    "email": user.email,
                    "ok": True
                })
            else:
                return JsonResponse({"ok": False, "message": "Usuario no encontrado en MariaDB"}, status=401)
        except Exception as e:
            return JsonResponse({"ok": False, "message": str(e)}, status=400)
    return JsonResponse({"ok": False}, status=405)