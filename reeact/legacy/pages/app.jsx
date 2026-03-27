const { useEffect, useState } = React;
const { useForm } = ReactHookForm;

const STORAGE_KEYS = {
    habitaciones: "hotel_habitaciones",
    servicios: "hotel_servicios",
    usuarios: "hotel_usuarios",
    reservas: "hotel_reservas",
    sesion: "hotel_sesion"
};

const DEFAULT_SERVICIOS = [
    { id: "srv-wifi", nombre: "WiFi" },
    { id: "srv-king", nombre: "Cama King Size" },
    { id: "srv-jardin", nombre: "Vista al jardin" },
    { id: "srv-aire", nombre: "Aire acondicionado" }
];

const DEFAULT_HABITACIONES = [
    {
        id: "hab-101-tzintzuntzan",
        nombre: "101 - Tzintzuntzan",
        descripcion:
            "Habitacion inspirada en el pueblo magico de Tzintzuntzan. Ofrece un ambiente tranquilo con decoracion tradicional y todas las comodidades necesarias para una estancia placentera.",
        servicios: ["WiFi", "Cama King Size", "Vista al jardin", "Aire acondicionado"],
        precio: 1000,
        imagen: "imagenes/Hotel4_mejorada.jpg"
    },
    {
        id: "hab-102-paracho",
        nombre: "102 - Paracho",
        descripcion:
            "Habitacion inspirada en el pueblo magico de Paracho. Ofrece un ambiente tranquilo con decoracion tradicional y todas las comodidades necesarias para una estancia placentera.",
        servicios: ["WiFi", "Cama King Size", "Vista al jardin", "Aire acondicionado"],
        precio: 1200,
        imagen: "imagenes/Hotel7_mejorada.jpg"
    },
    {
        id: "hab-103-yunuen",
        nombre: "103 - Yunuen",
        descripcion:
            "Habitacion inspirada en el pueblo magico de Yunuen. Ofrece un ambiente tranquilo con decoracion tradicional y todas las comodidades necesarias para una estancia placentera.",
        servicios: ["WiFi", "Cama King Size", "Vista al jardin", "Aire acondicionado"],
        precio: 1500,
        imagen: "imagenes/Hotel8_mejorada.jpg"
    }
];

const DEFAULT_USUARIOS = [
    {
        id: "usr-admin",
        nombre: "Administrador General",
        email: "admin@quintadalam.com",
        password: "Admin123*",
        rol: "admin"
    },
    {
        id: "usr-demo",
        nombre: "Huesped Demo",
        email: "usuario@quintadalam.com",
        password: "Usuario123*",
        rol: "usuario"
    }
];

function slugify(value) {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

function asArray(value) {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
}

function readStorage(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
        return fallback;
    }
}

function writeStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function money(value) {
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 0
    }).format(Number(value) || 0);
}

async function fetchSeed(url, fallback) {
    try {
        const response = await fetch(url);
        if (!response.ok) return fallback;
        return await response.json();
    } catch (error) {
        return fallback;
    }
}

function AuthModal({ open, mode, onModeChange, onClose, onLogin, onRegister }) {
    const loginForm = useForm({ defaultValues: { email: "", password: "" } });
    const registerForm = useForm({
        defaultValues: { nombre: "", email: "", password: "", passwordConfirm: "" }
    });

    if (!open) return null;

    const submitLogin = loginForm.handleSubmit((data) => {
        const result = onLogin(data);
        if (!result.ok) {
            loginForm.setError("root", { message: result.message });
            return;
        }
        loginForm.reset();
    });

    const submitRegister = registerForm.handleSubmit((data) => {
        if (data.password !== data.passwordConfirm) {
            registerForm.setError("passwordConfirm", {
                message: "Las contrasenas no coinciden."
            });
            return;
        }
        const result = onRegister(data);
        if (!result.ok) {
            registerForm.setError("root", { message: result.message });
            return;
        }
        registerForm.reset();
    });

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-card" onClick={(event) => event.stopPropagation()}>
                <button className="close-btn" type="button" onClick={onClose}>
                    x
                </button>
                <h3>Acceso a Quinta Dalam</h3>
                <div className="tab-row">
                    <button
                        className={`tab-btn ${mode === "login" ? "active" : ""}`}
                        type="button"
                        onClick={() => onModeChange("login")}
                    >
                        Iniciar sesion
                    </button>
                    <button
                        className={`tab-btn ${mode === "register" ? "active" : ""}`}
                        type="button"
                        onClick={() => onModeChange("register")}
                    >
                        Registrarse
                    </button>
                </div>

                {mode === "login" ? (
                    <form className="form-panel" onSubmit={submitLogin} noValidate>
                        <label htmlFor="login-email">Correo</label>
                        <input
                            id="login-email"
                            type="email"
                            {...loginForm.register("email", {
                                required: "El correo es obligatorio.",
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: "Correo invalido."
                                }
                            })}
                        />
                        {loginForm.formState.errors.email && (
                            <p className="error-msg">{loginForm.formState.errors.email.message}</p>
                        )}

                        <label htmlFor="login-password">Contrasena</label>
                        <input
                            id="login-password"
                            type="password"
                            {...loginForm.register("password", {
                                required: "La contrasena es obligatoria.",
                                minLength: { value: 6, message: "Minimo 6 caracteres." }
                            })}
                        />
                        {loginForm.formState.errors.password && (
                            <p className="error-msg">{loginForm.formState.errors.password.message}</p>
                        )}
                        {loginForm.formState.errors.root && (
                            <p className="error-msg">{loginForm.formState.errors.root.message}</p>
                        )}
                        <button className="btn btn-primary" type="submit">
                            Entrar
                        </button>
                    </form>
                ) : (
                    <form className="form-panel" onSubmit={submitRegister} noValidate>
                        <label htmlFor="register-name">Nombre completo</label>
                        <input
                            id="register-name"
                            type="text"
                            {...registerForm.register("nombre", {
                                required: "El nombre es obligatorio.",
                                minLength: { value: 3, message: "Minimo 3 caracteres." }
                            })}
                        />
                        {registerForm.formState.errors.nombre && (
                            <p className="error-msg">{registerForm.formState.errors.nombre.message}</p>
                        )}

                        <label htmlFor="register-email">Correo</label>
                        <input
                            id="register-email"
                            type="email"
                            {...registerForm.register("email", {
                                required: "El correo es obligatorio.",
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: "Correo invalido."
                                }
                            })}
                        />
                        {registerForm.formState.errors.email && (
                            <p className="error-msg">{registerForm.formState.errors.email.message}</p>
                        )}

                        <label htmlFor="register-password">Contrasena</label>
                        <input
                            id="register-password"
                            type="password"
                            {...registerForm.register("password", {
                                required: "La contrasena es obligatoria.",
                                minLength: { value: 6, message: "Minimo 6 caracteres." }
                            })}
                        />
                        {registerForm.formState.errors.password && (
                            <p className="error-msg">{registerForm.formState.errors.password.message}</p>
                        )}

                        <label htmlFor="register-password-confirm">Confirmar contrasena</label>
                        <input
                            id="register-password-confirm"
                            type="password"
                            {...registerForm.register("passwordConfirm", {
                                required: "Confirma tu contrasena."
                            })}
                        />
                        {registerForm.formState.errors.passwordConfirm && (
                            <p className="error-msg">
                                {registerForm.formState.errors.passwordConfirm.message}
                            </p>
                        )}
                        {registerForm.formState.errors.root && (
                            <p className="error-msg">{registerForm.formState.errors.root.message}</p>
                        )}
                        <button className="btn btn-primary" type="submit">
                            Crear cuenta
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

function UserPanel({
    currentUser,
    habitaciones,
    reservas,
    setReservas,
    preselectedRoom,
    onClose,
    notify
}) {
    const reservasUsuario = reservas.filter((item) => item.usuarioId === currentUser.id);
    const form = useForm({
        defaultValues: {
            nombre: currentUser.nombre,
            correo: currentUser.email,
            telefono: "",
            entrada: "",
            salida: "",
            personas: 1,
            habitacion: preselectedRoom || "",
            comentarios: ""
        }
    });

    useEffect(() => {
        form.reset({
            nombre: currentUser.nombre,
            correo: currentUser.email,
            telefono: "",
            entrada: "",
            salida: "",
            personas: 1,
            habitacion: preselectedRoom || "",
            comentarios: ""
        });
    }, [currentUser, preselectedRoom]);

    const submitReserva = form.handleSubmit((data) => {
        const entrada = new Date(`${data.entrada}T00:00:00`);
        const salida = new Date(`${data.salida}T00:00:00`);
        if (salida <= entrada) {
            form.setError("salida", {
                message: "La salida debe ser posterior a la entrada."
            });
            return;
        }

        const habitacion = habitaciones.find((item) => item.id === data.habitacion);
        if (!habitacion) {
            form.setError("habitacion", { message: "Selecciona una habitacion valida." });
            return;
        }

        const noches = Math.ceil((salida - entrada) / (1000 * 60 * 60 * 24));
        const nuevaReserva = {
            id: `res-${Date.now()}`,
            usuarioId: currentUser.id,
            nombre: data.nombre.trim(),
            correo: data.correo.trim(),
            telefono: data.telefono.trim(),
            habitacionId: habitacion.id,
            habitacionNombre: habitacion.nombre,
            entrada: data.entrada,
            salida: data.salida,
            personas: Number(data.personas),
            comentarios: data.comentarios.trim(),
            precioNoche: Number(habitacion.precio),
            noches,
            total: Number(habitacion.precio) * noches
        };

        setReservas((prev) => [nuevaReserva, ...prev]);
        form.reset({
            nombre: currentUser.nombre,
            correo: currentUser.email,
            telefono: "",
            entrada: "",
            salida: "",
            personas: 1,
            habitacion: "",
            comentarios: ""
        });
        notify("Reservacion registrada correctamente.");
    });

    const cancelarReserva = (idReserva) => {
        if (!window.confirm("Deseas cancelar esta reservacion?")) return;
        setReservas((prev) => prev.filter((item) => item.id !== idReserva));
        notify("Reservacion cancelada.");
    };

    return (
        <section className="panel">
            <div className="panel-header">
                <h2>Panel de usuario</h2>
                <button className="btn btn-ghost" type="button" onClick={onClose}>
                    Ocultar panel
                </button>
            </div>

            <form className="form-grid" onSubmit={submitReserva} noValidate>
                <div>
                    <label htmlFor="res-nombre">Nombre completo</label>
                    <input
                        id="res-nombre"
                        type="text"
                        {...form.register("nombre", {
                            required: "El nombre es obligatorio.",
                            minLength: { value: 3, message: "Minimo 3 caracteres." }
                        })}
                    />
                    {form.formState.errors.nombre && (
                        <p className="error-msg">{form.formState.errors.nombre.message}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="res-correo">Correo</label>
                    <input
                        id="res-correo"
                        type="email"
                        {...form.register("correo", {
                            required: "El correo es obligatorio.",
                            pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: "Correo invalido."
                            }
                        })}
                    />
                    {form.formState.errors.correo && (
                        <p className="error-msg">{form.formState.errors.correo.message}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="res-telefono">Telefono</label>
                    <input
                        id="res-telefono"
                        type="tel"
                        {...form.register("telefono", {
                            required: "El telefono es obligatorio.",
                            pattern: {
                                value: /^[0-9+\-\s()]{10,15}$/,
                                message: "Telefono invalido."
                            }
                        })}
                    />
                    {form.formState.errors.telefono && (
                        <p className="error-msg">{form.formState.errors.telefono.message}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="res-habitacion">Habitacion</label>
                    <select
                        id="res-habitacion"
                        {...form.register("habitacion", {
                            required: "Selecciona una habitacion."
                        })}
                    >
                        <option value="">Selecciona una habitacion</option>
                        {habitaciones.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.nombre} - {money(item.precio)}
                            </option>
                        ))}
                    </select>
                    {form.formState.errors.habitacion && (
                        <p className="error-msg">{form.formState.errors.habitacion.message}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="res-entrada">Entrada</label>
                    <input
                        id="res-entrada"
                        type="date"
                        {...form.register("entrada", {
                            required: "Selecciona fecha de entrada."
                        })}
                    />
                    {form.formState.errors.entrada && (
                        <p className="error-msg">{form.formState.errors.entrada.message}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="res-salida">Salida</label>
                    <input
                        id="res-salida"
                        type="date"
                        {...form.register("salida", {
                            required: "Selecciona fecha de salida."
                        })}
                    />
                    {form.formState.errors.salida && (
                        <p className="error-msg">{form.formState.errors.salida.message}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="res-personas">Personas</label>
                    <input
                        id="res-personas"
                        type="number"
                        min="1"
                        max="10"
                        {...form.register("personas", {
                            required: "Indica cuantas personas.",
                            min: { value: 1, message: "Minimo 1 persona." },
                            max: { value: 10, message: "Maximo 10 personas." }
                        })}
                    />
                    {form.formState.errors.personas && (
                        <p className="error-msg">{form.formState.errors.personas.message}</p>
                    )}
                </div>

                <div className="full-width">
                    <label htmlFor="res-comentarios">Comentarios</label>
                    <textarea id="res-comentarios" rows="3" {...form.register("comentarios")} />
                </div>

                <div className="full-width">
                    <button className="btn btn-primary" type="submit">
                        Completar reservacion
                    </button>
                </div>
            </form>

            <h3>Mis reservaciones</h3>
            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Habitacion</th>
                            <th>Fechas</th>
                            <th>Noches</th>
                            <th>Total</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reservasUsuario.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="empty-state">
                                    Aun no tienes reservaciones.
                                </td>
                            </tr>
                        ) : (
                            reservasUsuario.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.habitacionNombre}</td>
                                    <td>
                                        {item.entrada} - {item.salida}
                                    </td>
                                    <td>{item.noches}</td>
                                    <td>{money(item.total)}</td>
                                    <td>
                                        <button
                                            className="btn btn-danger btn-small"
                                            type="button"
                                            onClick={() => cancelarReserva(item.id)}
                                        >
                                            Cancelar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function AdminPanel({
    currentUser,
    habitaciones,
    setHabitaciones,
    servicios,
    setServicios,
    usuarios,
    setUsuarios,
    notify,
    onClose
}) {
    const [tab, setTab] = useState("habitaciones");
    const [editingRoomId, setEditingRoomId] = useState(null);

    const roomForm = useForm({
        defaultValues: {
            nombre: "",
            descripcion: "",
            precio: "",
            imagen: "imagenes/Hotel4_mejorada.jpg",
            serviciosSeleccionados: [],
            nuevoServicioRapido: ""
        }
    });
    const serviceForm = useForm({ defaultValues: { nombreServicio: "" } });
    const userForm = useForm({
        defaultValues: { nombre: "", email: "", password: "", rol: "usuario" }
    });

    const roomEditing = habitaciones.find((item) => item.id === editingRoomId);

    useEffect(() => {
        if (!roomEditing) {
            roomForm.reset({
                nombre: "",
                descripcion: "",
                precio: "",
                imagen: "imagenes/Hotel4_mejorada.jpg",
                serviciosSeleccionados: [],
                nuevoServicioRapido: ""
            });
            return;
        }
        roomForm.reset({
            nombre: roomEditing.nombre,
            descripcion: roomEditing.descripcion,
            precio: roomEditing.precio,
            imagen: roomEditing.imagen,
            serviciosSeleccionados: roomEditing.servicios,
            nuevoServicioRapido: ""
        });
    }, [editingRoomId, habitaciones]);

    const addServiceIfMissing = (name) => {
        const clean = name.trim();
        if (!clean) return "";
        const exists = servicios.some((item) => item.nombre.toLowerCase() === clean.toLowerCase());
        if (!exists) {
            setServicios((prev) => [
                ...prev,
                { id: `srv-${slugify(clean)}-${Date.now()}`, nombre: clean }
            ]);
        }
        return clean;
    };

    const addFastService = () => {
        const fast = roomForm.getValues("nuevoServicioRapido") || "";
        const clean = addServiceIfMissing(fast);
        if (!clean) {
            roomForm.setError("nuevoServicioRapido", {
                message: "Escribe un servicio antes de agregar."
            });
            return;
        }
        const selected = asArray(roomForm.getValues("serviciosSeleccionados"));
        if (!selected.includes(clean)) {
            roomForm.setValue("serviciosSeleccionados", [...selected, clean]);
        }
        roomForm.setValue("nuevoServicioRapido", "");
        notify("Servicio agregado al catalogo.");
    };

    const submitRoom = roomForm.handleSubmit((data) => {
        const checked = asArray(data.serviciosSeleccionados);
        const fast = addServiceIfMissing(data.nuevoServicioRapido || "");
        const finalServices = [...checked];
        if (fast && !finalServices.includes(fast)) {
            finalServices.push(fast);
        }
        if (!finalServices.length) {
            roomForm.setError("serviciosSeleccionados", {
                message: "Selecciona al menos un servicio."
            });
            return;
        }

        const payload = {
            id: editingRoomId || `hab-${slugify(data.nombre)}-${Date.now()}`,
            nombre: data.nombre.trim(),
            descripcion: data.descripcion.trim(),
            precio: Number(data.precio),
            imagen: data.imagen.trim(),
            servicios: finalServices
        };

        if (editingRoomId) {
            setHabitaciones((prev) =>
                prev.map((item) => (item.id === editingRoomId ? payload : item))
            );
            notify("Habitacion actualizada.");
        } else {
            setHabitaciones((prev) => [...prev, payload]);
            notify("Habitacion agregada.");
        }

        setEditingRoomId(null);
        roomForm.reset({
            nombre: "",
            descripcion: "",
            precio: "",
            imagen: "imagenes/Hotel4_mejorada.jpg",
            serviciosSeleccionados: [],
            nuevoServicioRapido: ""
        });
    });

    const deleteRoom = (id) => {
        if (!window.confirm("Eliminar esta habitacion?")) return;
        setHabitaciones((prev) => prev.filter((item) => item.id !== id));
        if (editingRoomId === id) setEditingRoomId(null);
        notify("Habitacion eliminada.");
    };

    const submitService = serviceForm.handleSubmit((data) => {
        const clean = data.nombreServicio.trim();
        if (!clean) return;
        const exists = servicios.some((item) => item.nombre.toLowerCase() === clean.toLowerCase());
        if (exists) {
            serviceForm.setError("nombreServicio", { message: "Ese servicio ya existe." });
            return;
        }
        setServicios((prev) => [
            ...prev,
            { id: `srv-${slugify(clean)}-${Date.now()}`, nombre: clean }
        ]);
        serviceForm.reset();
        notify("Servicio agregado.");
    });

    const deleteService = (service) => {
        if (!window.confirm(`Eliminar el servicio "${service.nombre}"?`)) return;
        setServicios((prev) => prev.filter((item) => item.id !== service.id));
        setHabitaciones((prev) =>
            prev.map((room) => ({
                ...room,
                servicios: room.servicios.filter((name) => name !== service.nombre)
            }))
        );
        notify("Servicio eliminado.");
    };

    const submitUser = userForm.handleSubmit((data) => {
        const email = data.email.trim().toLowerCase();
        const exists = usuarios.some((item) => item.email.toLowerCase() === email);
        if (exists) {
            userForm.setError("email", { message: "Ese correo ya esta registrado." });
            return;
        }
        setUsuarios((prev) => [
            ...prev,
            {
                id: `usr-${slugify(data.nombre)}-${Date.now()}`,
                nombre: data.nombre.trim(),
                email,
                password: data.password.trim(),
                rol: data.rol
            }
        ]);
        userForm.reset({ nombre: "", email: "", password: "", rol: "usuario" });
        notify("Usuario agregado.");
    });

    const updateUserRole = (userId, role) => {
        const user = usuarios.find((item) => item.id === userId);
        if (!user) return;
        if (user.rol === "admin" && role !== "admin") {
            const admins = usuarios.filter((item) => item.rol === "admin");
            if (admins.length === 1) {
                notify("Debe existir al menos un administrador.");
                return;
            }
        }
        setUsuarios((prev) =>
            prev.map((item) => (item.id === userId ? { ...item, rol: role } : item))
        );
        notify("Rol actualizado.");
    };

    const deleteUser = (userId) => {
        const user = usuarios.find((item) => item.id === userId);
        if (!user) return;
        if (user.id === currentUser.id) {
            notify("No puedes eliminar tu propio usuario activo.");
            return;
        }
        if (user.rol === "admin") {
            const admins = usuarios.filter((item) => item.rol === "admin");
            if (admins.length === 1) {
                notify("Debe existir al menos un administrador.");
                return;
            }
        }
        if (!window.confirm(`Eliminar al usuario ${user.nombre}?`)) return;
        setUsuarios((prev) => prev.filter((item) => item.id !== userId));
        notify("Usuario eliminado.");
    };

    return (
        <section className="panel">
            <div className="panel-header">
                <h2>Panel de administracion</h2>
                <button className="btn btn-ghost" type="button" onClick={onClose}>
                    Ocultar panel
                </button>
            </div>
            <div className="tab-row">
                <button className={`tab-btn ${tab === "habitaciones" ? "active" : ""}`} type="button" onClick={() => setTab("habitaciones")}>Habitaciones</button>
                <button className={`tab-btn ${tab === "servicios" ? "active" : ""}`} type="button" onClick={() => setTab("servicios")}>Servicios</button>
                <button className={`tab-btn ${tab === "usuarios" ? "active" : ""}`} type="button" onClick={() => setTab("usuarios")}>Usuarios</button>
            </div>

            {tab === "habitaciones" && (
                <div className="admin-grid">
                    <div className="card-panel">
                        <h3>{editingRoomId ? "Editar habitacion" : "Nueva habitacion"}</h3>
                        <form className="form-panel" onSubmit={submitRoom} noValidate>
                            <label htmlFor="room-name">Nombre</label>
                            <input id="room-name" type="text" {...roomForm.register("nombre", { required: "El nombre es obligatorio.", minLength: { value: 4, message: "Minimo 4 caracteres." } })} />
                            {roomForm.formState.errors.nombre && <p className="error-msg">{roomForm.formState.errors.nombre.message}</p>}
                            <label htmlFor="room-desc">Descripcion</label>
                            <textarea id="room-desc" rows="3" {...roomForm.register("descripcion", { required: "La descripcion es obligatoria.", minLength: { value: 20, message: "Minimo 20 caracteres." } })} />
                            {roomForm.formState.errors.descripcion && <p className="error-msg">{roomForm.formState.errors.descripcion.message}</p>}
                            <label htmlFor="room-price">Precio por noche</label>
                            <input id="room-price" type="number" min="1" {...roomForm.register("precio", { required: "El precio es obligatorio.", min: { value: 1, message: "Precio invalido." } })} />
                            {roomForm.formState.errors.precio && <p className="error-msg">{roomForm.formState.errors.precio.message}</p>}
                            <label htmlFor="room-image">Ruta de imagen</label>
                            <input id="room-image" type="text" {...roomForm.register("imagen", { required: "La imagen es obligatoria." })} />
                            {roomForm.formState.errors.imagen && <p className="error-msg">{roomForm.formState.errors.imagen.message}</p>}
                            <label>Servicios (checkboxes)</label>
                            <div className="checkbox-grid">
                                {servicios.map((srv) => (
                                    <label className="checkbox-item" key={srv.id}>
                                        <input type="checkbox" value={srv.nombre} {...roomForm.register("serviciosSeleccionados")} />
                                        <span>{srv.nombre}</span>
                                    </label>
                                ))}
                            </div>
                            {roomForm.formState.errors.serviciosSeleccionados && <p className="error-msg">{roomForm.formState.errors.serviciosSeleccionados.message}</p>}
                            <label htmlFor="room-fast-service">Agregar servicio al catalogo</label>
                            <div className="inline-actions">
                                <input id="room-fast-service" type="text" {...roomForm.register("nuevoServicioRapido")} />
                                <button className="btn btn-secondary btn-small" type="button" onClick={addFastService}>Agregar</button>
                            </div>
                            {roomForm.formState.errors.nuevoServicioRapido && <p className="error-msg">{roomForm.formState.errors.nuevoServicioRapido.message}</p>}
                            <div className="inline-actions">
                                <button className="btn btn-primary" type="submit">{editingRoomId ? "Guardar cambios" : "Crear habitacion"}</button>
                                {editingRoomId && <button className="btn btn-ghost" type="button" onClick={() => setEditingRoomId(null)}>Cancelar</button>}
                            </div>
                        </form>
                    </div>

                    <div className="card-panel">
                        <h3>Habitaciones registradas</h3>
                        <div className="table-wrap">
                            <table>
                                <thead><tr><th>Nombre</th><th>Precio</th><th>Servicios</th><th>Acciones</th></tr></thead>
                                <tbody>
                                    {habitaciones.map((room) => (
                                        <tr key={room.id}>
                                            <td>{room.nombre}</td><td>{money(room.precio)}</td><td>{room.servicios.join(", ")}</td>
                                            <td><div className="inline-actions compact"><button className="btn btn-secondary btn-small" type="button" onClick={() => setEditingRoomId(room.id)}>Editar</button><button className="btn btn-danger btn-small" type="button" onClick={() => deleteRoom(room.id)}>Eliminar</button></div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {tab === "servicios" && (
                <div className="admin-grid">
                    <div className="card-panel">
                        <h3>Nuevo servicio</h3>
                        <form className="form-panel" onSubmit={submitService} noValidate>
                            <label htmlFor="service-name">Nombre del servicio</label>
                            <input id="service-name" type="text" {...serviceForm.register("nombreServicio", { required: "El servicio es obligatorio.", minLength: { value: 3, message: "Minimo 3 caracteres." } })} />
                            {serviceForm.formState.errors.nombreServicio && <p className="error-msg">{serviceForm.formState.errors.nombreServicio.message}</p>}
                            <button className="btn btn-primary" type="submit">Agregar servicio</button>
                        </form>
                    </div>
                    <div className="card-panel">
                        <h3>Servicios registrados</h3>
                        <div className="table-wrap">
                            <table>
                                <thead><tr><th>Servicio</th><th>Acciones</th></tr></thead>
                                <tbody>
                                    {servicios.map((srv) => (
                                        <tr key={srv.id}>
                                            <td>{srv.nombre}</td>
                                            <td><button className="btn btn-danger btn-small" type="button" onClick={() => deleteService(srv)}>Eliminar</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {tab === "usuarios" && (
                <div className="admin-grid">
                    <div className="card-panel">
                        <h3>Nuevo usuario</h3>
                        <form className="form-panel" onSubmit={submitUser} noValidate>
                            <label htmlFor="user-name">Nombre</label>
                            <input id="user-name" type="text" {...userForm.register("nombre", { required: "El nombre es obligatorio.", minLength: { value: 3, message: "Minimo 3 caracteres." } })} />
                            {userForm.formState.errors.nombre && <p className="error-msg">{userForm.formState.errors.nombre.message}</p>}
                            <label htmlFor="user-email">Correo</label>
                            <input id="user-email" type="email" {...userForm.register("email", { required: "El correo es obligatorio.", pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Correo invalido." } })} />
                            {userForm.formState.errors.email && <p className="error-msg">{userForm.formState.errors.email.message}</p>}
                            <label htmlFor="user-password">Contrasena</label>
                            <input id="user-password" type="text" {...userForm.register("password", { required: "La contrasena es obligatoria.", minLength: { value: 6, message: "Minimo 6 caracteres." } })} />
                            {userForm.formState.errors.password && <p className="error-msg">{userForm.formState.errors.password.message}</p>}
                            <label htmlFor="user-role">Rol</label>
                            <select id="user-role" {...userForm.register("rol")}><option value="usuario">Usuario</option><option value="admin">Administrador</option></select>
                            <button className="btn btn-primary" type="submit">Agregar usuario</button>
                        </form>
                    </div>
                    <div className="card-panel">
                        <h3>Usuarios registrados</h3>
                        <div className="table-wrap">
                            <table>
                                <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Acciones</th></tr></thead>
                                <tbody>
                                    {usuarios.map((user) => (
                                        <tr key={user.id}>
                                            <td>{user.nombre}</td>
                                            <td>{user.email}</td>
                                            <td>
                                                <select value={user.rol} onChange={(event) => updateUserRole(user.id, event.target.value)}>
                                                    <option value="usuario">Usuario</option>
                                                    <option value="admin">Administrador</option>
                                                </select>
                                            </td>
                                            <td>
                                                <button className="btn btn-danger btn-small" type="button" onClick={() => deleteUser(user.id)}>
                                                    Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

function App() {
    const page = document.body.dataset.page || "inicio";
    const [ready, setReady] = useState(false);
    const [notice, setNotice] = useState("");
    const [authOpen, setAuthOpen] = useState(false);
    const [authMode, setAuthMode] = useState("login");
    const [showUserPanel, setShowUserPanel] = useState(page === "reservas");
    const [showAdminPanel, setShowAdminPanel] = useState(page === "admin");
    const [habitaciones, setHabitaciones] = useState([]);
    const [servicios, setServicios] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [reservas, setReservas] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [catalogText, setCatalogText] = useState("");
    const [catalogMaxPrice, setCatalogMaxPrice] = useState("");
    const [catalogSort, setCatalogSort] = useState("nombre");
    const [preselectedRoom, setPreselectedRoom] = useState("");

    useEffect(() => {
        let alive = true;
        async function init() {
            const [seedHabitaciones, seedServicios, seedUsuarios, seedReservas] = await Promise.all([
                fetchSeed("data/habitaciones.json", DEFAULT_HABITACIONES),
                fetchSeed("data/servicios.json", DEFAULT_SERVICIOS),
                fetchSeed("data/usuarios.json", DEFAULT_USUARIOS),
                fetchSeed("data/reservas.json", [])
            ]);
            if (!alive) return;
            const rooms = readStorage(STORAGE_KEYS.habitaciones, seedHabitaciones);
            const services = readStorage(STORAGE_KEYS.servicios, seedServicios);
            const users = readStorage(STORAGE_KEYS.usuarios, seedUsuarios);
            const bookings = readStorage(STORAGE_KEYS.reservas, seedReservas);
            const sessionId = localStorage.getItem(STORAGE_KEYS.sesion);
            const sessionUser = users.find((item) => item.id === sessionId) || null;
            setHabitaciones(rooms);
            setServicios(services);
            setUsuarios(users);
            setReservas(bookings);
            setCurrentUser(sessionUser);
            setReady(true);
        }
        init();
        return () => {
            alive = false;
        };
    }, []);

    useEffect(() => {
        if (!ready) return;
        writeStorage(STORAGE_KEYS.habitaciones, habitaciones);
    }, [habitaciones, ready]);
    useEffect(() => {
        if (!ready) return;
        writeStorage(STORAGE_KEYS.servicios, servicios);
    }, [servicios, ready]);
    useEffect(() => {
        if (!ready) return;
        writeStorage(STORAGE_KEYS.usuarios, usuarios);
    }, [usuarios, ready]);
    useEffect(() => {
        if (!ready) return;
        writeStorage(STORAGE_KEYS.reservas, reservas);
    }, [reservas, ready]);
    useEffect(() => {
        if (!ready) return;
        if (currentUser) localStorage.setItem(STORAGE_KEYS.sesion, currentUser.id);
        else localStorage.removeItem(STORAGE_KEYS.sesion);
    }, [currentUser, ready]);
    useEffect(() => {
        if (!ready || !currentUser) return;
        const updated = usuarios.find((item) => item.id === currentUser.id);
        if (!updated) {
            setCurrentUser(null);
            return;
        }
        if (
            updated.nombre !== currentUser.nombre ||
            updated.email !== currentUser.email ||
            updated.rol !== currentUser.rol
        ) {
            setCurrentUser(updated);
        }
    }, [usuarios, currentUser, ready]);
    useEffect(() => {
        if (!notice) return;
        const timer = setTimeout(() => setNotice(""), 5000);
        return () => clearTimeout(timer);
    }, [notice]);

    const notify = (message) => setNotice(message);

    const onLogin = (credentials) => {
        const email = credentials.email.trim().toLowerCase();
        const password = credentials.password.trim();
        const user = usuarios.find((item) => item.email.toLowerCase() === email && item.password === password);
        if (!user) return { ok: false, message: "Credenciales incorrectas." };
        setCurrentUser(user);
        setAuthOpen(false);
        notify(`Bienvenido, ${user.nombre}.`);
        return { ok: true };
    };

    const onRegister = (data) => {
        const email = data.email.trim().toLowerCase();
        const exists = usuarios.some((item) => item.email.toLowerCase() === email);
        if (exists) return { ok: false, message: "Ese correo ya esta registrado." };
        const newUser = {
            id: `usr-${slugify(data.nombre)}-${Date.now()}`,
            nombre: data.nombre.trim(),
            email,
            password: data.password.trim(),
            rol: "usuario"
        };
        setUsuarios((prev) => [...prev, newUser]);
        setCurrentUser(newUser);
        setAuthOpen(false);
        notify("Cuenta creada e inicio de sesion completado.");
        return { ok: true };
    };

    const logout = () => {
        setCurrentUser(null);
        setShowAdminPanel(false);
        setShowUserPanel(false);
        notify("Sesion cerrada.");
    };

    const onReserve = (roomId) => {
        if (!currentUser) {
            setAuthMode("login");
            setAuthOpen(true);
            notify("Inicia sesion para reservar.");
            return;
        }
        setPreselectedRoom(roomId);
        setShowUserPanel(true);
    };

    const filteredHabitaciones = habitaciones
        .filter((item) => item.nombre.toLowerCase().includes(catalogText.trim().toLowerCase()))
        .filter((item) => (catalogMaxPrice ? item.precio <= Number(catalogMaxPrice) : true))
        .sort((a, b) => {
            if (catalogSort === "precio-asc") return a.precio - b.precio;
            if (catalogSort === "precio-desc") return b.precio - a.precio;
            return a.nombre.localeCompare(b.nombre);
        });

    const renderPage = () => {
        if (page === "mision") {
            return (
                <section className="panel hero-lite">
                    <h2>Mision</h2>
                    <p>Brindar una experiencia autentica inspirada en los pueblos magicos de Michoacan, con hospitalidad y servicio de calidad.</p>
                    <img src="imagenes/Mision.png" alt="Mision del hotel" />
                </section>
            );
        }

        if (page === "vision") {
            return (
                <section className="panel hero-lite">
                    <h2>Vision</h2>
                    <p>Ser un referente de descanso, cultura y trato excepcional para viajeros nacionales e internacionales.</p>
                    <img src="imagenes/Vision.png" alt="Vision del hotel" />
                </section>
            );
        }

        if (page === "catalogo") {
            return (
                <section className="panel">
                    <h2>Catalogo de habitaciones</h2>
                    <div className="filters-grid">
                        <div>
                            <label htmlFor="catalog-search">Buscar</label>
                            <input id="catalog-search" type="text" value={catalogText} onChange={(event) => setCatalogText(event.target.value)} placeholder="Ej. Paracho" />
                        </div>
                        <div>
                            <label htmlFor="catalog-price">Precio maximo</label>
                            <input id="catalog-price" type="number" min="0" value={catalogMaxPrice} onChange={(event) => setCatalogMaxPrice(event.target.value)} />
                        </div>
                        <div>
                            <label htmlFor="catalog-sort">Orden</label>
                            <select id="catalog-sort" value={catalogSort} onChange={(event) => setCatalogSort(event.target.value)}>
                                <option value="nombre">Nombre</option>
                                <option value="precio-asc">Precio ascendente</option>
                                <option value="precio-desc">Precio descendente</option>
                            </select>
                        </div>
                    </div>
                    <div className="rooms-grid">
                        {filteredHabitaciones.map((room) => (
                            <article className="room-card" key={room.id}>
                                <img src={room.imagen} alt={room.nombre} />
                                <div className="room-card-content">
                                    <h3>{room.nombre}</h3>
                                    <p>{room.descripcion}</p>
                                    <ul>{room.servicios.map((srv) => <li key={`${room.id}-${srv}`}>{srv}</li>)}</ul>
                                    <div className="room-card-footer">
                                        <strong>{money(room.precio)} / noche</strong>
                                        <button className="btn btn-primary btn-small" type="button" onClick={() => onReserve(room.id)}>Reservar</button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            );
        }

        if (page === "contacto") {
            return (
                <section className="panel">
                    <h2>Contacto</h2>
                    <div className="social-row">
                        <a className="social-pill" href="https://www.facebook.com/profile.php?id=61584681841684">Facebook</a>
                        <a className="social-pill" href="https://www.instagram.com/quintadalam?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==">Instagram</a>
                        <a className="social-pill" href="https://www.tiktok.com/@quintadalam?lang=es">TikTok</a>
                        <a className="social-pill" href="https://web.whatsapp.com/">WhatsApp</a>
                    </div>
                    <iframe className="map-frame" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1328.0287655611223!2d-101.19273057049412!3d19.70271965365868!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x842d0e71a95bc4ed%3A0xaf13bc43e8e69af7!2sCatedral%20de%20Morelia!5e0!3m2!1ses!2smx!4v1772793607213!5m2!1ses!2smx" allowFullScreen loading="lazy" />
                </section>
            );
        }

        return (
            <section className="panel hero-main">
                <div className="hero-main-content">
                    <h2>Bienvenido a tu casa en Patzcuaro</h2>
                    <p>Tradicion, cultura y hospitalidad para una estancia memorable inspirada en los pueblos magicos.</p>
                    <a className="btn btn-primary" href="catalogo.html">Ver habitaciones</a>
                </div>
                <div className="rooms-grid compact">
                    {habitaciones.map((room) => (
                        <article className="room-card" key={room.id}>
                            <img src={room.imagen} alt={room.nombre} />
                            <div className="room-card-content">
                                <h3>{room.nombre}</h3>
                                <p>{room.descripcion}</p>
                                <div className="room-card-footer">
                                    <strong>{money(room.precio)} / noche</strong>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        );
    };

    if (!ready) {
        return (
            <div className="loading-screen">
                <p>Cargando aplicacion React...</p>
            </div>
        );
    }

    return (
        <div className="site-shell">
            <header className="topbar">
                <div className="brand-block">
                    <h1>Hotel Quinta Dalam</h1>
                    <p>Inspirado en los pueblos magicos de Michoacan</p>
                </div>
                <nav className="main-nav">
                    <a className={page === "inicio" ? "active" : ""} href="index.html">Inicio</a>
                    <a className={page === "mision" ? "active" : ""} href="mision.html">Mision</a>
                    <a className={page === "vision" ? "active" : ""} href="vision.html">Vision</a>
                    <a className={page === "catalogo" ? "active" : ""} href="catalogo.html">Catalogo</a>
                    <a className={page === "contacto" ? "active" : ""} href="contacto.html">Contacto</a>
                </nav>

                <div className="session-actions">
                    {currentUser ? (
                        <>
                            <span className="user-badge">{currentUser.nombre} ({currentUser.rol})</span>
                            {currentUser.rol === "admin" && (
                                <button className="btn btn-secondary btn-small" type="button" onClick={() => setShowAdminPanel((prev) => !prev)}>
                                    {showAdminPanel ? "Ocultar admin" : "Panel admin"}
                                </button>
                            )}
                            <button className="btn btn-secondary btn-small" type="button" onClick={() => setShowUserPanel((prev) => !prev)}>
                                {showUserPanel ? "Ocultar panel" : "Mi panel"}
                            </button>
                            <button className="btn btn-ghost btn-small" type="button" onClick={logout}>
                                Cerrar sesion
                            </button>
                        </>
                    ) : (
                        <button className="btn btn-primary btn-small" type="button" onClick={() => { setAuthMode("login"); setAuthOpen(true); }}>
                            Iniciar sesion / Registrarse
                        </button>
                    )}
                </div>
            </header>

            {notice && <p className="notice">{notice}</p>}

            <main className="main-content">{renderPage()}</main>

            {currentUser && showUserPanel && (
                <main className="main-content">
                    <UserPanel
                        currentUser={currentUser}
                        habitaciones={habitaciones}
                        reservas={reservas}
                        setReservas={setReservas}
                        preselectedRoom={preselectedRoom}
                        onClose={() => setShowUserPanel(false)}
                        notify={notify}
                    />
                </main>
            )}

            {currentUser?.rol === "admin" && showAdminPanel && (
                <main className="main-content">
                    <AdminPanel
                        currentUser={currentUser}
                        habitaciones={habitaciones}
                        setHabitaciones={setHabitaciones}
                        servicios={servicios}
                        setServicios={setServicios}
                        usuarios={usuarios}
                        setUsuarios={setUsuarios}
                        notify={notify}
                        onClose={() => setShowAdminPanel(false)}
                    />
                </main>
            )}

            <footer className="site-footer">
                <p>React + react-hook-form + JSON local (sin base de datos).</p>
                <p><a href="https://validator.w3.org/">Validador HTML</a> | <a href="https://jigsaw.w3.org/css-validator/">Validador CSS</a></p>
                <p className="demo-credentials">Admin demo: admin@quintadalam.com / Admin123*</p>
            </footer>

            <AuthModal
                open={authOpen}
                mode={authMode}
                onModeChange={setAuthMode}
                onClose={() => setAuthOpen(false)}
                onLogin={onLogin}
                onRegister={onRegister}
            />
        </div>
    );
}

const rootNode = document.getElementById("app-root");
ReactDOM.createRoot(rootNode).render(<App />);
