from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Habitacion, Servicio
import json
from django.contrib.auth import authenticate


def _serialize_habitacion(habitacion):
    return {
        "id": habitacion.id_custom,
        "nombre": habitacion.nombre,
        "descripcion": habitacion.descripcion,
        "precio": float(habitacion.precio),
        "imagen": habitacion.imagen,
        "servicios": [servicio.nombre for servicio in habitacion.servicios.all()]
    }


def _service_id_from_name(name):
    base = "".join(ch.lower() if ch.isalnum() else "-" for ch in name).strip("-")
    base = "-".join(part for part in base.split("-") if part)
    if not base:
        base = "servicio"
    return f"srv-{base[:40]}"


def _serialize_user(user):
    return {
        "id": str(user.id),
        "nombre": user.first_name or user.username,
        "email": user.email or user.username,
        "rol": "admin" if (user.is_staff or user.is_superuser) else "usuario"
    }


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

@csrf_exempt
def check_email_disponible(request):
    if request.method != "GET":
        return JsonResponse({"error": "Metodo no permitido"}, status=405)

    email = (request.GET.get("email") or "").strip().lower()
    if not email:
        return JsonResponse(
            {"ok": False, "available": False, "message": "Email requerido"},
            status=400
        )

    exists = User.objects.filter(username=email).exists()
    return JsonResponse({"ok": True, "available": not exists})


@csrf_exempt
def lista_usuarios(request):
    if request.method not in ["GET", "POST"]:
        return JsonResponse({"error": "Metodo no permitido"}, status=405)

    if request.method == "GET":
        users = User.objects.all().order_by("id")
        return JsonResponse([_serialize_user(user) for user in users], safe=False)

    try:
        data = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON invalido"}, status=400)

    nombre = (data.get("nombre") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = (data.get("password") or "").strip()
    rol = (data.get("rol") or "usuario").strip().lower()

    if not nombre or not email or not password:
        return JsonResponse({"error": "Faltan campos requeridos"}, status=400)
    if User.objects.filter(username=email).exists():
        return JsonResponse({"error": "Ese correo ya esta registrado"}, status=400)

    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        first_name=nombre
    )
    user.is_staff = rol == "admin"
    user.save()
    return JsonResponse(_serialize_user(user), status=201)


@csrf_exempt
def detalle_usuario(request, id):
    if request.method not in ["PUT", "PATCH", "DELETE"]:
        return JsonResponse({"error": "Metodo no permitido"}, status=405)

    try:
        user = User.objects.get(id=id)
    except User.DoesNotExist:
        return JsonResponse({"error": "Usuario no encontrado"}, status=404)

    if request.method == "DELETE":
        if user.is_superuser:
            return JsonResponse({"error": "No se puede eliminar un superusuario"}, status=400)
        user.delete()
        return JsonResponse({"ok": True})

    try:
        data = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON invalido"}, status=400)

    if "nombre" in data:
        user.first_name = (data.get("nombre") or "").strip() or user.first_name
    if "rol" in data:
        next_role = (data.get("rol") or "").strip().lower()
        if next_role not in ["admin", "usuario"]:
            return JsonResponse({"error": "Rol invalido"}, status=400)
        user.is_staff = next_role == "admin"
    user.save()
    return JsonResponse(_serialize_user(user))


def lista_habitaciones(request):
    habitaciones = Habitacion.objects.all()
    data = [_serialize_habitacion(habitacion) for habitacion in habitaciones]
    return JsonResponse(data, safe=False)


@csrf_exempt
def detalle_habitacion(request, id):
    if request.method not in ["GET", "PUT", "POST", "DELETE"]:
        return JsonResponse({"error": "Metodo no permitido"}, status=405)
    if request.method in ["GET", "DELETE", "PUT"]:
        try:
            habitacion = Habitacion.objects.get(pk=id)
        except Habitacion.DoesNotExist:
            return JsonResponse({"error": "Habitacion no encontrada"}, status=404)

        if request.method == "GET":
            return JsonResponse(_serialize_habitacion(habitacion), safe=False)

        if request.method == "DELETE":
            habitacion.delete()
            return JsonResponse({"ok": True, "message": "Habitacion eliminada"})
    else:
        habitacion = Habitacion.objects.filter(pk=id).first()

    try:
        payload = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON invalido"}, status=400)

    creating = False
    if habitacion is None:
        creating = True
        habitacion = Habitacion(id_custom=id)

    habitacion.nombre = payload.get("nombre", habitacion.nombre)
    habitacion.descripcion = payload.get("descripcion", habitacion.descripcion)
    habitacion.precio = payload.get("precio", habitacion.precio)
    habitacion.imagen = payload.get("imagen", habitacion.imagen or "/imagenes/Hotel4_mejorada.jpg")

    if not habitacion.nombre or not habitacion.descripcion or habitacion.precio is None:
        return JsonResponse({"error": "Faltan campos requeridos para la habitacion"}, status=400)

    habitacion.save()

    if "servicios" in payload and isinstance(payload["servicios"], list):
        service_names = [
            str(name).strip() for name in payload["servicios"] if str(name).strip()
        ]
        servicio_objs = []
        for service_name in service_names:
            existing = Servicio.objects.filter(nombre__iexact=service_name).first()
            if existing:
                servicio_objs.append(existing)
                continue

            base_id = _service_id_from_name(service_name)
            service_id = base_id
            suffix = 1
            while Servicio.objects.filter(id_custom=service_id).exists():
                service_id = f"{base_id}-{suffix}"
                suffix += 1

            servicio_objs.append(
                Servicio.objects.create(id_custom=service_id, nombre=service_name)
            )

        habitacion.servicios.set(servicio_objs)

    status_code = 201 if creating else 200
    return JsonResponse(_serialize_habitacion(habitacion), safe=False, status=status_code)


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
                    "rol": "admin" if (user.is_staff or user.is_superuser) else "usuario",
                    "ok": True
                })
            else:
                return JsonResponse({"ok": False, "message": "Usuario no encontrado en MariaDB"}, status=401)
        except Exception as e:
            return JsonResponse({"ok": False, "message": str(e)}, status=400)
    return JsonResponse({"ok": False}, status=405)
