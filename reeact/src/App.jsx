import { useEffect, useMemo, useState } from "react";
import AuthModal from "./components/AuthModal";
import UserPanel from "./components/UserPanel";
import AdminPanel from "./components/AdminPanel";
import {
    DEFAULT_HABITACIONES,
    STORAGE_KEYS
} from "./constants/seeds";
import { asArray, money, resolvePublicAsset } from "./utils/helpers";
import "./styles/hotel.css";

const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL ||
    `http://${window.location.hostname}:8000`;

function sanitizeRoom(item) {
    if (!item || typeof item !== "object") return null;

    const id = String(item.id || item.id_custom || "").trim();
    const nombre = String(item.nombre || "").trim();
    const descripcion = String(item.descripcion || "").trim();
    const precio = Number(item.precio);
    const servicios = asArray(item.servicios)
        .map((value) => String(value || "").trim())
        .filter(Boolean);
    const imagen = String(item.imagen || "").trim();

    if (!id || !nombre || !descripcion) return null;
    if (!Number.isFinite(precio) || precio <= 0) return null;

    return {
        id,
        nombre,
        descripcion,
        precio,
        servicios: servicios.length > 0 ? servicios : ["WiFi"],
        imagen: imagen || "/imagenes/Hotel4_mejorada.jpg"
    };
}

function sanitizeRooms(value) {
    if (!Array.isArray(value)) return [];
    return value.map((item) => sanitizeRoom(item)).filter(Boolean);
}

function buildServicesFromRooms(rooms) {
    const names = new Set();
    for (const room of rooms) {
        for (const serviceName of asArray(room?.servicios)) {
            const clean = String(serviceName || "").trim();
            if (clean) names.add(clean);
        }
    }
    return Array.from(names).map((name, index) => ({
        id: `srv-auto-${index}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        nombre: name
    }));
}

function sanitizeUser(item) {
    if (!item || typeof item !== "object") return null;
    const id = String(item.id || "").trim();
    const email = String(item.email || "").trim().toLowerCase();
    const nombre = String(item.nombre || "").trim();
    const rol = String(item.rol || "usuario").trim().toLowerCase();
    if (!id || !email || !nombre) return null;
    return { id, email, nombre, rol: rol === "admin" ? "admin" : "usuario" };
}

function sanitizeUsers(value) {
    if (!Array.isArray(value)) return [];
    return value.map((item) => sanitizeUser(item)).filter(Boolean);
}

export default function App() {
    const [ready, setReady] = useState(false);
    const [notice, setNotice] = useState("");
    const [authOpen, setAuthOpen] = useState(false);
    const [authMode, setAuthMode] = useState("login");
    const [page, setPage] = useState("inicio");
    const [showUserPanel, setShowUserPanel] = useState(false);
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [catalogText, setCatalogText] = useState("");
    const [catalogMaxPrice, setCatalogMaxPrice] = useState("");
    const [catalogSort, setCatalogSort] = useState("nombre");
    const [preselectedRoom, setPreselectedRoom] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    const [habitaciones, setHabitaciones] = useState([]);
    const [servicios, setServicios] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [reservas, setReservas] = useState([]);

    const safeHabitaciones = useMemo(() => sanitizeRooms(habitaciones), [habitaciones]);

    useEffect(() => {
        let alive = true;
        async function init() {
            try {
                // Prioridad absoluta: MariaDB via API de Django
                const [roomsResponse, usersResponse] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/habitaciones/`),
                    fetch(`${API_BASE_URL}/api/usuarios/`)
                ]);
                if (!roomsResponse.ok) {
                    throw new Error("No se pudo leer la API de habitaciones.");
                }
                if (!usersResponse.ok) {
                    throw new Error("No se pudo leer la API de usuarios.");
                }
                const [dataFromDB, usersFromDB] = await Promise.all([
                    roomsResponse.json(),
                    usersResponse.json()
                ]);
                
                if (!alive) return;

                // Seed local solo cuando DB venga vacia o no valida
                const roomsFromDB = sanitizeRooms(dataFromDB);
                const roomsForUI =
                    roomsFromDB.length > 0
                        ? roomsFromDB
                        : sanitizeRooms(DEFAULT_HABITACIONES);
                setHabitaciones(roomsForUI);
                setServicios(buildServicesFromRooms(roomsForUI));
                setUsuarios(sanitizeUsers(usersFromDB));

                // 2. RECUPERAR SESIÓN
                const sessionId = localStorage.getItem(STORAGE_KEYS.sesion);
                if (sessionId) {
                    if (sessionId === '1' || sessionId.includes('admin') || localStorage.getItem('is_admin') === 'true') {
                        setCurrentUser({
                            id: sessionId,
                            nombre: "Administrador",
                            email: "Administrador@gmail.com",
                            rol: "admin",
                            ok: true
                        });
                    }
                }
                setReady(true);
            } catch (error) {
                console.error("Error en init:", error);
                // Si backend/DB no responde, usamos seed local como respaldo.
                const fallbackRooms = sanitizeRooms(DEFAULT_HABITACIONES);
                setHabitaciones(fallbackRooms);
                setServicios(buildServicesFromRooms(fallbackRooms));
                setReady(true);
            }
        }
        init();
        return () => { alive = false; };
    }, []);

    // SEGUNDO EFECTO: Solo guarda cuando el usuario existe REALMENTE
    useEffect(() => {
        if (ready && currentUser) {
            localStorage.setItem(STORAGE_KEYS.sesion, currentUser.id);
            if(currentUser.rol === 'admin') localStorage.setItem('is_admin', 'true');
        }
    }, [currentUser, ready]);

    /*
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
    */

    useEffect(() => {
        if (!notice) return;
        const timer = setTimeout(() => setNotice(""), 5000);
        return () => clearTimeout(timer);
    }, [notice]);

    useEffect(() => {
        const bgImage = resolvePublicAsset("/imagenes/Hotel1_mejorada.jpg");
        document.body.style.backgroundImage = `linear-gradient(rgba(55, 27, 15, 0.54), rgba(55, 27, 15, 0.42)), url("${bgImage}")`;
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundPosition = "center";
        document.body.style.backgroundAttachment = "fixed";
    }, []);

    const notify = (message) => setNotice(message);

    const updateHabitacionEnDB = async (
        habitacionActualizada,
        method = "PUT",
        options = {}
    ) => {
        const { notifySuccess = true } = options;
        const targetId = String(habitacionActualizada?.id || "").trim();
        if (!targetId) {
            notify("No se pudo guardar: la habitacion no tiene ID valido.");
            return { ok: false };
        }

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/habitaciones/${encodeURIComponent(targetId)}/`,
                {
                    method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(habitacionActualizada)
                }
            );
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                const message = data.error || "No se pudo persistir en MariaDB.";
                throw new Error(message);
            }

            const persistedRoom = sanitizeRoom(data) || sanitizeRoom(habitacionActualizada);
            if (!persistedRoom) {
                throw new Error("La API devolvio una habitacion invalida.");
            }

            setHabitaciones((prev) => {
                const idx = prev.findIndex((item) => item.id === persistedRoom.id);
                if (idx >= 0) {
                    const next = [...prev];
                    next[idx] = persistedRoom;
                    return next;
                }
                return [...prev, persistedRoom];
            });
            if (notifySuccess) notify("Cambio guardado en MariaDB.");
            return { ok: true, room: persistedRoom };
        } catch (error) {
            console.error("Error al guardar:", error);
            notify(`Error al conectar con la base de datos: ${error.message}`);
            return { ok: false, error };
        }
    };

    const deleteHabitacionEnDB = async (id) => {
        const targetId = String(id || "").trim();
        if (!targetId) {
            notify("No se pudo eliminar: ID invalido.");
            return { ok: false };
        }

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/habitaciones/${encodeURIComponent(targetId)}/`,
                { method: "DELETE" }
            );
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                const message = data.error || "No se pudo eliminar en MariaDB.";
                throw new Error(message);
            }
            setHabitaciones((prev) => prev.filter((item) => item.id !== targetId));
            notify("Habitacion eliminada en MariaDB.");
            return { ok: true };
        } catch (error) {
            console.error("Error al eliminar:", error);
            notify(`Error al eliminar en base de datos: ${error.message}`);
            return { ok: false, error };
        }
    };

    const onLogin = async (credentials) => {
        const email = credentials.email.trim();
        const password = credentials.password.trim();

        try {
            console.log("Intentando conectar con Django en:", `${API_BASE_URL}/api/login/`);
            
            const response = await fetch(`${API_BASE_URL}/api/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            // Si Django responde (aunque sea error 401)
            const data = await response.json();
            console.log("Respuesta de Django:", data);

            if (response.ok && data.ok) {
                if (data.email === 'Administrador@gmail.com') {
                    data.rol = 'admin';
                }

                setCurrentUser(data);
                setAuthOpen(false);
                notify(`Bienvenido, ${data.nombre}.`);
                return { ok: true }; 
            } else {
                const msg = data.message || "Credenciales incorrectas en MariaDB";
                alert(msg); 
                return { ok: false, message: msg };
            }
        } catch (error) {
            console.error("ERROR DE CONEXIÓN:", error);
            alert("No hay conexión con el servidor. ¿Prendiste Django con 0.0.0.0?");
            return { ok: false, message: "Error de red" };
        }
    };

    const onRegister = async (payload) => {
        const email = payload.email.trim().toLowerCase();
        const nombre = payload.nombre.trim();
        const password = payload.password.trim();

        try {
            const response = await fetch(`${API_BASE_URL}/api/registro/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nombre, email, password })
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                return {
                    ok: false,
                    message: data.error || "No se pudo registrar en Django."
                };
            }

            const user = sanitizeUser({
                id: String(data.id || `usr-${Date.now()}`),
                nombre,
                email,
                rol: "usuario"
            });
            if (!user) {
                return { ok: false, message: "El servidor devolvio un usuario invalido." };
            }
            setUsuarios((prev) => [...prev, user]);
            setCurrentUser(user);
            setAuthOpen(false);
            notify("Cuenta creada en MariaDB e inicio de sesion completado.");
            return { ok: true };
        } catch (error) {
            return {
                ok: false,
                message: `No se pudo conectar con el servidor Django (${API_BASE_URL}).`
            };
        }
    };

    const createUsuarioEnDB = async (payload) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/usuarios/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                return { ok: false, message: data.error || "No se pudo crear el usuario." };
            }
            const user = sanitizeUser(data);
            if (!user) return { ok: false, message: "Usuario invalido devuelto por API." };
            setUsuarios((prev) => [...prev, user]);
            return { ok: true, user };
        } catch (error) {
            return { ok: false, message: "Error de red al crear usuario." };
        }
    };

    const updateUsuarioEnDB = async (id, payload) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/usuarios/${id}/`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                return { ok: false, message: data.error || "No se pudo actualizar el usuario." };
            }
            const user = sanitizeUser(data);
            if (!user) return { ok: false, message: "Usuario invalido devuelto por API." };
            setUsuarios((prev) =>
                prev.map((item) => (item.id === String(id) ? user : item))
            );
            setCurrentUser((prev) => (prev && String(prev.id) === String(id) ? user : prev));
            return { ok: true, user };
        } catch (error) {
            return { ok: false, message: "Error de red al actualizar usuario." };
        }
    };

    const deleteUsuarioEnDB = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/usuarios/${id}/`, {
                method: "DELETE"
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                return { ok: false, message: data.error || "No se pudo eliminar el usuario." };
            }
            setUsuarios((prev) => prev.filter((item) => String(item.id) !== String(id)));
            return { ok: true };
        } catch (error) {
            return { ok: false, message: "Error de red al eliminar usuario." };
        }
    };

    const checkEmailAvailability = async (email) => {
        const clean = String(email || "").trim().toLowerCase();
        if (!clean) return { ok: false, available: false, message: "Email requerido" };
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/usuarios/check-email/?email=${encodeURIComponent(clean)}`
            );
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                return {
                    ok: false,
                    available: false,
                    message: data.error || "No se pudo validar el correo"
                };
            }
            return { ok: true, available: Boolean(data.available) };
        } catch (error) {
            return {
                ok: false,
                available: false,
                message: `No se pudo conectar al validar correo (${API_BASE_URL})`
            };
        }
    };

    const logout = () => {
        localStorage.clear();
        setCurrentUser(null);
        setShowAdminPanel(false);
        setShowUserPanel(false);
        notify("Sesion cerrada.");
    };

    const handleReserveFromCatalog = (roomId) => {
        if (!currentUser) {
            setAuthMode("login");
            setAuthOpen(true);
            notify("Inicia sesion para reservar.");
            return;
        }
        setPreselectedRoom(roomId);
        setShowUserPanel(true);
    };

    const filteredHabitaciones = useMemo(
        () =>
            safeHabitaciones
                .filter((item) =>
                    item.nombre.toLowerCase().includes(catalogText.trim().toLowerCase())
                )
                .filter((item) =>
                    catalogMaxPrice
                        ? Number(item.precio) <= Number(catalogMaxPrice)
                        : true
                )
                .sort((a, b) => {
                    if (catalogSort === "precio-asc") return a.precio - b.precio;
                    if (catalogSort === "precio-desc") return b.precio - a.precio;
                    return a.nombre.localeCompare(b.nombre);
                }),
        [safeHabitaciones, catalogText, catalogMaxPrice, catalogSort]
    );

    const renderPage = () => {
        if (page === "mision") {
            return (
                <section className="panel hero-lite">
                    <h2>Mision</h2>
                    <p>
                        Brindar una experiencia autentica inspirada en los pueblos
                        magicos de Michoacan, con hospitalidad y servicio de calidad.
                    </p>
                    <img
                        src={resolvePublicAsset("/imagenes/Mision.png")}
                        alt="Mision del hotel"
                    />
                </section>
            );
        }

        if (page === "vision") {
            return (
                <section className="panel hero-lite">
                    <h2>Vision</h2>
                    <p>
                        Ser un referente de descanso, cultura y trato excepcional para
                        viajeros nacionales e internacionales.
                    </p>
                    <img
                        src={resolvePublicAsset("/imagenes/Vision.png")}
                        alt="Vision del hotel"
                    />
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
                            <input
                                id="catalog-search"
                                type="text"
                                value={catalogText}
                                onChange={(event) => setCatalogText(event.target.value)}
                                placeholder="Ej. Paracho"
                            />
                        </div>
                        <div>
                            <label htmlFor="catalog-price">Precio maximo</label>
                            <input
                                id="catalog-price"
                                type="number"
                                min="0"
                                value={catalogMaxPrice}
                                onChange={(event) =>
                                    setCatalogMaxPrice(event.target.value)
                                }
                            />
                        </div>
                        <div>
                            <label htmlFor="catalog-sort">Orden</label>
                            <select
                                id="catalog-sort"
                                value={catalogSort}
                                onChange={(event) => setCatalogSort(event.target.value)}
                            >
                                <option value="nombre">Nombre</option>
                                <option value="precio-asc">Precio ascendente</option>
                                <option value="precio-desc">Precio descendente</option>
                            </select>
                        </div>
                    </div>

                    <div className="rooms-grid">
                        {filteredHabitaciones.length === 0 ? (
                            <article className="card-panel">
                                <p className="empty-state">
                                    {safeHabitaciones.length === 0
                                        ? "No hay habitaciones cargadas. Recarga la app para restaurar los datos base."
                                        : "No hay resultados con los filtros actuales."}
                                </p>
                            </article>
                        ) : (
                            filteredHabitaciones.map((room) => (
                                <article className="room-card" key={room.id}>
                                    <img
                                        src={resolvePublicAsset(room.imagen)}
                                        alt={room.nombre}
                                    />
                                    <div className="room-card-content">
                                        <h3>{room.nombre}</h3>
                                        <p>{room.descripcion}</p>
                                        <ul>
                                            {asArray(room.servicios).map((srv) => (
                                                <li key={`${room.id}-${srv}`}>{srv}</li>
                                            ))}
                                        </ul>
                                        <div className="room-card-footer">
                                            <strong>{money(room.precio)} / noche</strong>
                                            <button
                                                className="btn btn-primary btn-small"
                                                type="button"
                                                onClick={() =>
                                                    handleReserveFromCatalog(room.id)
                                                }
                                            >
                                                Reservar
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))
                        )}
                    </div>
                </section>
            );
        }

        if (page === "contacto") {
            return (
                <section className="panel">
                    <h2>Contacto</h2>
                    <div className="social-row">
                        <a
                            className="social-pill"
                            href="https://www.facebook.com/profile.php?id=61584681841684"
                        >
                            Facebook
                        </a>
                        <a
                            className="social-pill"
                            href="https://www.instagram.com/quintadalam?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                        >
                            Instagram
                        </a>
                        <a
                            className="social-pill"
                            href="https://www.tiktok.com/@quintadalam?lang=es"
                        >
                            TikTok
                        </a>
                        <a className="social-pill" href="https://web.whatsapp.com/">
                            WhatsApp
                        </a>
                    </div>
                    <iframe
                        className="map-frame"
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1328.0287655611223!2d-101.19273057049412!3d19.70271965365868!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x842d0e71a95bc4ed%3A0xaf13bc43e8e69af7!2sCatedral%20de%20Morelia!5e0!3m2!1ses!2smx!4v1772793607213!5m2!1ses!2smx"
                        title="Mapa del hotel"
                        allowFullScreen
                        loading="lazy"
                    />
                </section>
            );
        }

        return (
            <section className="panel hero-main">
                <div
                    className="hero-main-content"
                    style={{
                        backgroundImage: `linear-gradient(rgba(80, 36, 18, 0.58), rgba(80, 36, 18, 0.52)), url("${resolvePublicAsset("/imagenes/Hotel2_mejorada.jpg")}")`
                    }}
                >
                    <h2>Bienvenido a tu casa en Patzcuaro</h2>
                    <p>
                        Tradicion, cultura y hospitalidad para una estancia memorable
                        inspirada en los pueblos magicos.
                    </p>
                    <button
                        className="btn btn-primary"
                        type="button"
                        onClick={() => setPage("catalogo")}
                    >
                        Ver habitaciones
                    </button>
                </div>
                <div className="rooms-grid compact">
                    {safeHabitaciones.map((room) => (
                        <article className="room-card" key={room.id}>
                            <img
                                src={resolvePublicAsset(room.imagen)}
                                alt={room.nombre}
                            />
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
                    <button
                        className={page === "inicio" ? "active" : ""}
                        type="button"
                        onClick={() => setPage("inicio")}
                    >
                        Inicio
                    </button>
                    <button
                        className={page === "mision" ? "active" : ""}
                        type="button"
                        onClick={() => setPage("mision")}
                    >
                        Mision
                    </button>
                    <button
                        className={page === "vision" ? "active" : ""}
                        type="button"
                        onClick={() => setPage("vision")}
                    >
                        Vision
                    </button>
                    <button
                        className={page === "catalogo" ? "active" : ""}
                        type="button"
                        onClick={() => setPage("catalogo")}
                    >
                        Catalogo
                    </button>
                    <button
                        className={page === "contacto" ? "active" : ""}
                        type="button"
                        onClick={() => setPage("contacto")}
                    >
                        Contacto
                    </button>
                </nav>

                <div className="session-actions">
                    {currentUser ? (
                        <>
                            <span className="user-badge">
                                {currentUser.nombre} ({currentUser.rol})
                            </span>
                            {currentUser.rol === "admin" && (
                                <button
                                    className="btn btn-secondary btn-small"
                                    type="button"
                                    onClick={() => setShowAdminPanel((prev) => !prev)}
                                >
                                    {showAdminPanel ? "Ocultar admin" : "Panel admin"}
                                </button>
                            )}
                            <button
                                className="btn btn-secondary btn-small"
                                type="button"
                                onClick={() => setShowUserPanel((prev) => !prev)}
                            >
                                {showUserPanel ? "Ocultar panel" : "Mi panel"}
                            </button>
                            <button
                                className="btn btn-ghost btn-small"
                                type="button"
                                onClick={logout}
                            >
                                Cerrar sesion
                            </button>
                        </>
                    ) : (
                        <button
                            className="btn btn-primary btn-small"
                            type="button"
                            onClick={() => {
                                setAuthMode("login");
                                setAuthOpen(true);
                            }}
                        >
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
                        habitaciones={safeHabitaciones}
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
                        habitaciones={safeHabitaciones}
                        updateHabitacionEnDB={updateHabitacionEnDB}
                        deleteHabitacionEnDB={deleteHabitacionEnDB}
                        reservas={reservas}
                        setReservas={setReservas}
                        servicios={servicios}
                        setServicios={setServicios}
                        usuarios={usuarios}
                        createUsuarioEnDB={createUsuarioEnDB}
                        updateUsuarioEnDB={updateUsuarioEnDB}
                        deleteUsuarioEnDB={deleteUsuarioEnDB}
                        notify={notify}
                        onClose={() => setShowAdminPanel(false)}
                    />
                </main>
            )}

            <footer className="site-footer">
                <p>
                    <a href="https://jigsaw.w3.org/css-validator/check/referer">
                        <img
                            style={{ border: 0, width: "88px", height: "31px" }}
                            src="https://jigsaw.w3.org/css-validator/images/vcss-blue"
                            alt="¡CSS Válido!"
                        />
                    </a>
                </p>
                <p>
                    <img
                        alt="Valid HTML4.01"
                        src="https://www.w3.org/Icons/valid-html401-blue.png"
                    />
                </p>
            </footer>

            <AuthModal
                open={authOpen}
                mode={authMode}
                onModeChange={setAuthMode}
                onClose={() => setAuthOpen(false)}
                onLogin={onLogin}
                onRegister={onRegister}
                onCheckEmailAvailability={checkEmailAvailability}
            />
        </div>
    );
}

