import { useEffect, useMemo, useState } from "react";
import { asArray, money, normalizeImagePath, slugify } from "../utils/helpers";

const EMAIL_RE = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

function roomErrors(values) {
    const errors = {};
    if (!values.nombre.trim()) errors.nombre = "El nombre es obligatorio.";
    else if (values.nombre.trim().length < 4) errors.nombre = "Minimo 4 caracteres.";
    if (!values.descripcion.trim()) errors.descripcion = "La descripcion es obligatoria.";
    else if (values.descripcion.trim().length < 20) {
        errors.descripcion = "Minimo 20 caracteres.";
    }
    if (!String(values.precio).trim()) errors.precio = "El precio es obligatorio.";
    else if (Number(values.precio) <= 0) errors.precio = "Precio invalido.";
    if (!String(values.imagen).trim()) errors.imagen = "La imagen es obligatoria.";
    return errors;
}

function serviceErrors(values) {
    const errors = {};
    if (!values.nombre.trim()) errors.nombre = "El servicio es obligatorio.";
    else if (values.nombre.trim().length < 3) errors.nombre = "Minimo 3 caracteres.";
    return errors;
}

function userErrors(values) {
    const errors = {};
    if (!values.nombre.trim()) errors.nombre = "El nombre es obligatorio.";
    else if (values.nombre.trim().length < 3) errors.nombre = "Minimo 3 caracteres.";
    if (!values.email.trim()) errors.email = "El correo es obligatorio.";
    else if (!EMAIL_RE.test(values.email.trim())) errors.email = "Correo invalido.";
    if (!values.password.trim()) errors.password = "La contrasena es obligatoria.";
    else if (values.password.trim().length < 6) errors.password = "Minimo 6 caracteres.";
    return errors;
}

export default function AdminPanel({
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

    const [roomForm, setRoomForm] = useState({
        nombre: "",
        descripcion: "",
        precio: "",
        imagen: "/imagenes/Hotel4_mejorada.jpg",
        serviciosSeleccionados: [],
        nuevoServicioRapido: ""
    });
    const [serviceForm, setServiceForm] = useState({ nombre: "" });
    const [userForm, setUserForm] = useState({
        nombre: "",
        email: "",
        password: "",
        rol: "usuario"
    });

    const roomFormErrors = useMemo(() => roomErrors(roomForm), [roomForm]);
    const serviceFormErrors = useMemo(() => serviceErrors(serviceForm), [serviceForm]);
    const userFormErrors = useMemo(() => userErrors(userForm), [userForm]);

    const roomEditing = useMemo(
        () => habitaciones.find((item) => item.id === editingRoomId),
        [habitaciones, editingRoomId]
    );

    useEffect(() => {
        if (!roomEditing) {
            setRoomForm({
                nombre: "",
                descripcion: "",
                precio: "",
                imagen: "/imagenes/Hotel4_mejorada.jpg",
                serviciosSeleccionados: [],
                nuevoServicioRapido: ""
            });
            return;
        }
        setRoomForm({
            nombre: roomEditing.nombre,
            descripcion: roomEditing.descripcion,
            precio: String(roomEditing.precio),
            imagen: roomEditing.imagen,
            serviciosSeleccionados: roomEditing.servicios,
            nuevoServicioRapido: ""
        });
    }, [roomEditing]);

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

    const toggleRoomService = (serviceName, checked) => {
        const selected = asArray(roomForm.serviciosSeleccionados);
        if (checked) {
            if (!selected.includes(serviceName)) {
                setRoomForm((prev) => ({
                    ...prev,
                    serviciosSeleccionados: [...selected, serviceName]
                }));
            }
            return;
        }
        setRoomForm((prev) => ({
            ...prev,
            serviciosSeleccionados: selected.filter((item) => item !== serviceName)
        }));
    };

    const addFastService = () => {
        const clean = addServiceIfMissing(roomForm.nuevoServicioRapido);
        if (!clean) {
            notify("Escribe un servicio antes de agregar.");
            return;
        }
        const selected = asArray(roomForm.serviciosSeleccionados);
        if (!selected.includes(clean)) {
            setRoomForm((prev) => ({
                ...prev,
                serviciosSeleccionados: [...selected, clean],
                nuevoServicioRapido: ""
            }));
        } else {
            setRoomForm((prev) => ({ ...prev, nuevoServicioRapido: "" }));
        }
        notify("Servicio agregado al catalogo.");
    };

    const submitRoom = (event) => {
        event.preventDefault();
        if (Object.keys(roomFormErrors).length > 0) return;

        const selected = asArray(roomForm.serviciosSeleccionados);
        const fast = addServiceIfMissing(roomForm.nuevoServicioRapido);
        const finalServices = fast && !selected.includes(fast) ? [...selected, fast] : selected;
        if (!finalServices.length) {
            notify("Selecciona al menos un servicio.");
            return;
        }

        const payload = {
            id: editingRoomId || `hab-${slugify(roomForm.nombre)}-${Date.now()}`,
            nombre: roomForm.nombre.trim(),
            descripcion: roomForm.descripcion.trim(),
            precio: Number(roomForm.precio),
            imagen: normalizeImagePath(roomForm.imagen),
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
    };

    const deleteRoom = (id) => {
        if (!window.confirm("Eliminar esta habitacion?")) return;
        setHabitaciones((prev) => prev.filter((item) => item.id !== id));
        if (editingRoomId === id) setEditingRoomId(null);
        notify("Habitacion eliminada.");
    };

    const submitService = (event) => {
        event.preventDefault();
        if (Object.keys(serviceFormErrors).length > 0) return;
        const clean = serviceForm.nombre.trim();
        const exists = servicios.some((item) => item.nombre.toLowerCase() === clean.toLowerCase());
        if (exists) {
            notify("Ese servicio ya existe.");
            return;
        }
        setServicios((prev) => [
            ...prev,
            { id: `srv-${slugify(clean)}-${Date.now()}`, nombre: clean }
        ]);
        setServiceForm({ nombre: "" });
        notify("Servicio agregado.");
    };

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

    const submitUser = (event) => {
        event.preventDefault();
        if (Object.keys(userFormErrors).length > 0) return;
        const email = userForm.email.trim().toLowerCase();
        const exists = usuarios.some((item) => item.email.toLowerCase() === email);
        if (exists) {
            notify("Ese correo ya esta registrado.");
            return;
        }
        setUsuarios((prev) => [
            ...prev,
            {
                id: `usr-${slugify(userForm.nombre)}-${Date.now()}`,
                nombre: userForm.nombre.trim(),
                email,
                password: userForm.password.trim(),
                rol: userForm.rol
            }
        ]);
        setUserForm({ nombre: "", email: "", password: "", rol: "usuario" });
        notify("Usuario agregado.");
    };

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
                <button
                    className={`tab-btn ${tab === "habitaciones" ? "active" : ""}`}
                    type="button"
                    onClick={() => setTab("habitaciones")}
                >
                    Habitaciones
                </button>
                <button
                    className={`tab-btn ${tab === "servicios" ? "active" : ""}`}
                    type="button"
                    onClick={() => setTab("servicios")}
                >
                    Servicios
                </button>
                <button
                    className={`tab-btn ${tab === "usuarios" ? "active" : ""}`}
                    type="button"
                    onClick={() => setTab("usuarios")}
                >
                    Usuarios
                </button>
            </div>

            {tab === "habitaciones" && (
                <div className="admin-grid">
                    <div className="card-panel">
                        <h3>{editingRoomId ? "Editar habitacion" : "Nueva habitacion"}</h3>
                        <form className="form-panel" onSubmit={submitRoom} noValidate>
                            <label htmlFor="room-name">Nombre</label>
                            <input
                                id="room-name"
                                type="text"
                                value={roomForm.nombre}
                                onChange={(event) =>
                                    setRoomForm((prev) => ({
                                        ...prev,
                                        nombre: event.target.value
                                    }))
                                }
                            />
                            {roomFormErrors.nombre && (
                                <p className="error-msg">{roomFormErrors.nombre}</p>
                            )}

                            <label htmlFor="room-desc">Descripcion</label>
                            <textarea
                                id="room-desc"
                                rows="3"
                                value={roomForm.descripcion}
                                onChange={(event) =>
                                    setRoomForm((prev) => ({
                                        ...prev,
                                        descripcion: event.target.value
                                    }))
                                }
                            />
                            {roomFormErrors.descripcion && (
                                <p className="error-msg">{roomFormErrors.descripcion}</p>
                            )}

                            <label htmlFor="room-price">Precio por noche</label>
                            <input
                                id="room-price"
                                type="number"
                                min="1"
                                value={roomForm.precio}
                                onChange={(event) =>
                                    setRoomForm((prev) => ({
                                        ...prev,
                                        precio: event.target.value
                                    }))
                                }
                            />
                            {roomFormErrors.precio && (
                                <p className="error-msg">{roomFormErrors.precio}</p>
                            )}

                            <label htmlFor="room-image">Ruta de imagen</label>
                            <input
                                id="room-image"
                                type="text"
                                value={roomForm.imagen}
                                onChange={(event) =>
                                    setRoomForm((prev) => ({
                                        ...prev,
                                        imagen: event.target.value
                                    }))
                                }
                            />
                            {roomFormErrors.imagen && (
                                <p className="error-msg">{roomFormErrors.imagen}</p>
                            )}

                            <label>Servicios (checkboxes)</label>
                            <div className="checkbox-grid">
                                {servicios.map((srv) => {
                                    const checked = asArray(
                                        roomForm.serviciosSeleccionados
                                    ).includes(srv.nombre);
                                    return (
                                        <label className="checkbox-item" key={srv.id}>
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={(event) =>
                                                    toggleRoomService(
                                                        srv.nombre,
                                                        event.target.checked
                                                    )
                                                }
                                            />
                                            <span>{srv.nombre}</span>
                                        </label>
                                    );
                                })}
                            </div>

                            <label htmlFor="room-fast-service">Agregar servicio al catalogo</label>
                            <div className="inline-actions">
                                <input
                                    id="room-fast-service"
                                    type="text"
                                    value={roomForm.nuevoServicioRapido}
                                    onChange={(event) =>
                                        setRoomForm((prev) => ({
                                            ...prev,
                                            nuevoServicioRapido: event.target.value
                                        }))
                                    }
                                />
                                <button
                                    className="btn btn-secondary btn-small"
                                    type="button"
                                    onClick={addFastService}
                                >
                                    Agregar
                                </button>
                            </div>

                            <div className="inline-actions">
                                <button className="btn btn-primary" type="submit">
                                    {editingRoomId ? "Guardar cambios" : "Crear habitacion"}
                                </button>
                                {editingRoomId && (
                                    <button
                                        className="btn btn-ghost"
                                        type="button"
                                        onClick={() => setEditingRoomId(null)}
                                    >
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    <div className="card-panel">
                        <h3>Habitaciones registradas</h3>
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Precio</th>
                                        <th>Servicios</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {habitaciones.map((room) => (
                                        <tr key={room.id}>
                                            <td>{room.nombre}</td>
                                            <td>{money(room.precio)}</td>
                                            <td>{room.servicios.join(", ")}</td>
                                            <td>
                                                <div className="inline-actions compact">
                                                    <button
                                                        className="btn btn-secondary btn-small"
                                                        type="button"
                                                        onClick={() => setEditingRoomId(room.id)}
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        className="btn btn-danger btn-small"
                                                        type="button"
                                                        onClick={() => deleteRoom(room.id)}
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
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
                            <input
                                id="service-name"
                                type="text"
                                value={serviceForm.nombre}
                                onChange={(event) =>
                                    setServiceForm({ nombre: event.target.value })
                                }
                            />
                            {serviceFormErrors.nombre && (
                                <p className="error-msg">{serviceFormErrors.nombre}</p>
                            )}
                            <button className="btn btn-primary" type="submit">
                                Agregar servicio
                            </button>
                        </form>
                    </div>

                    <div className="card-panel">
                        <h3>Servicios registrados</h3>
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Servicio</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {servicios.map((srv) => (
                                        <tr key={srv.id}>
                                            <td>{srv.nombre}</td>
                                            <td>
                                                <button
                                                    className="btn btn-danger btn-small"
                                                    type="button"
                                                    onClick={() => deleteService(srv)}
                                                >
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

            {tab === "usuarios" && (
                <div className="admin-grid">
                    <div className="card-panel">
                        <h3>Nuevo usuario</h3>
                        <form className="form-panel" onSubmit={submitUser} noValidate>
                            <label htmlFor="user-name">Nombre</label>
                            <input
                                id="user-name"
                                type="text"
                                value={userForm.nombre}
                                onChange={(event) =>
                                    setUserForm((prev) => ({
                                        ...prev,
                                        nombre: event.target.value
                                    }))
                                }
                            />
                            {userFormErrors.nombre && (
                                <p className="error-msg">{userFormErrors.nombre}</p>
                            )}

                            <label htmlFor="user-email">Correo</label>
                            <input
                                id="user-email"
                                type="email"
                                value={userForm.email}
                                onChange={(event) =>
                                    setUserForm((prev) => ({
                                        ...prev,
                                        email: event.target.value
                                    }))
                                }
                            />
                            {userFormErrors.email && (
                                <p className="error-msg">{userFormErrors.email}</p>
                            )}

                            <label htmlFor="user-password">Contrasena</label>
                            <input
                                id="user-password"
                                type="text"
                                value={userForm.password}
                                onChange={(event) =>
                                    setUserForm((prev) => ({
                                        ...prev,
                                        password: event.target.value
                                    }))
                                }
                            />
                            {userFormErrors.password && (
                                <p className="error-msg">{userFormErrors.password}</p>
                            )}

                            <label htmlFor="user-role">Rol</label>
                            <select
                                id="user-role"
                                value={userForm.rol}
                                onChange={(event) =>
                                    setUserForm((prev) => ({
                                        ...prev,
                                        rol: event.target.value
                                    }))
                                }
                            >
                                <option value="usuario">Usuario</option>
                                <option value="admin">Administrador</option>
                            </select>

                            <button className="btn btn-primary" type="submit">
                                Agregar usuario
                            </button>
                        </form>
                    </div>

                    <div className="card-panel">
                        <h3>Usuarios registrados</h3>
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Correo</th>
                                        <th>Rol</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usuarios.map((user) => (
                                        <tr key={user.id}>
                                            <td>{user.nombre}</td>
                                            <td>{user.email}</td>
                                            <td>
                                                <select
                                                    value={user.rol}
                                                    onChange={(event) =>
                                                        updateUserRole(
                                                            user.id,
                                                            event.target.value
                                                        )
                                                    }
                                                >
                                                    <option value="usuario">Usuario</option>
                                                    <option value="admin">Administrador</option>
                                                </select>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-danger btn-small"
                                                    type="button"
                                                    onClick={() => deleteUser(user.id)}
                                                >
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
