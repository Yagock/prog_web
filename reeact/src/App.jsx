import { useEffect, useMemo, useState } from "react";
import AuthModal from "./components/AuthModal";
import UserPanel from "./components/UserPanel";
import AdminPanel from "./components/AdminPanel";
import {
    DEFAULT_HABITACIONES,
    DEFAULT_SERVICIOS,
    DEFAULT_USUARIOS,
    STORAGE_KEYS
} from "./constants/seeds";
import usePersistentState from "./hooks/usePersistentState";
import { asArray, money, resolvePublicAsset } from "./utils/helpers";
import { fetchSeed } from "./utils/storage";
import "./styles/hotel.css";

function sanitizeRoom(item, index) {
    if (!item || typeof item !== "object") return null;

    const nombre = String(item.nombre || "").trim();
    const descripcion = String(item.descripcion || "").trim();
    const precio = Number(item.precio);
    const servicios = asArray(item.servicios)
        .map((value) => String(value || "").trim())
        .filter(Boolean);
    const imagen = String(item.imagen || "").trim();

    if (!nombre || !descripcion) return null;
    if (!Number.isFinite(precio) || precio <= 0) return null;

    return {
        id: String(item.id || `hab-auto-${Date.now()}-${index}`),
        nombre,
        descripcion,
        precio,
        servicios: servicios.length > 0 ? servicios : ["WiFi"],
        imagen: imagen || "/imagenes/Hotel4_mejorada.jpg"
    };
}

function sanitizeRooms(value) {
    if (!Array.isArray(value)) return [];
    return value
        .map((item, index) => sanitizeRoom(item, index))
        .filter(Boolean);
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
                // 1. Siempre traer habitaciones frescas de MariaDB
                const response = await fetch('http://192.168.1.12:8000/api/habitaciones/');
                const dataFromDB = await response.json();
                
                if (!alive) return;

                // CORRECCIÓN: Solo si la respuesta falla o es nula usamos DEFAULT
                // Si la DB responde (aunque sea un array vacío), usamos la DB
                if (Array.isArray(dataFromDB)) {
                    setHabitaciones(sanitizeRooms(dataFromDB));
                } else {
                    setHabitaciones(sanitizeRooms(DEFAULT_HABITACIONES));
                }

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
                // En caso de error de red real, cargamos los default para que la app no muera
                setHabitaciones(sanitizeRooms(DEFAULT_HABITACIONES));
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

    const updateHabitacionEnDB = async (habitacionActualizada) => {
        try {
            await fetch(`http://192.168.1.12:8000/api/habitaciones/${habitacionActualizada.id}/`, {
                method: 'PUT', // Verifica si tu Django usa PUT o POST para editar
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(habitacionActualizada)
            });
            // Sincronizamos la RAM solo después de avisar a MariaDB
            setHabitaciones(prev => prev.map(h => h.id === habitacionActualizada.id ? habitacionActualizada : h));
            notify("Cambio guardado en MariaDB.");
        } catch (error) {
            console.error("Error al guardar:", error);
            notify("Error al conectar con la base de datos.");
        }
    };

    const onLogin = async (credentials) => {
        const email = credentials.email.trim();
        const password = credentials.password.trim();

        try {
            console.log("Intentando conectar con Django en:", 'http://192.168.1.12:8000/api/login/');
            
            const response = await fetch('http://192.168.1.12:8000/api/login/', {
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

    const onRegister = (payload) => {
        const email = payload.email.trim().toLowerCase();
        const exists = usuarios.some((item) => item.email.toLowerCase() === email);
        if (exists) return { ok: false, message: "Ese correo ya esta registrado." };
        const user = {
            id: `usr-${Date.now()}`,
            nombre: payload.nombre.trim(),
            email,
            password: payload.password.trim(),
            rol: "usuario"
        };
        setUsuarios((prev) => [...prev, user]);
        setCurrentUser(user);
        setAuthOpen(false);
        notify("Cuenta creada e inicio de sesion completado.");
        return { ok: true };
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
            />
        </div>
    );
}
