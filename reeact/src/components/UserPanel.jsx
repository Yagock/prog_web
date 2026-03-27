import { useEffect, useMemo, useState } from "react";
import { money } from "../utils/helpers";

const EMAIL_RE = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const PHONE_RE = /^[0-9+\-\s()]{10,15}$/;

function validate(values) {
    const errors = {};
    if (!values.nombre.trim()) errors.nombre = "El nombre es obligatorio.";
    else if (values.nombre.trim().length < 3) errors.nombre = "Minimo 3 caracteres.";

    if (!values.correo.trim()) errors.correo = "El correo es obligatorio.";
    else if (!EMAIL_RE.test(values.correo.trim())) errors.correo = "Correo invalido.";

    if (!values.telefono.trim()) errors.telefono = "El telefono es obligatorio.";
    else if (!PHONE_RE.test(values.telefono.trim())) errors.telefono = "Telefono invalido.";

    if (!values.habitacion) errors.habitacion = "Selecciona una habitacion.";
    if (!values.entrada) errors.entrada = "Selecciona fecha de entrada.";
    if (!values.salida) errors.salida = "Selecciona fecha de salida.";

    const personas = Number(values.personas);
    if (!values.personas) errors.personas = "Indica cuantas personas.";
    else if (Number.isNaN(personas) || personas < 1) errors.personas = "Minimo 1 persona.";
    else if (personas > 10) errors.personas = "Maximo 10 personas.";

    if (values.entrada && values.salida) {
        const entrada = new Date(`${values.entrada}T00:00:00`);
        const salida = new Date(`${values.salida}T00:00:00`);
        if (salida <= entrada) {
            errors.salida = "La salida debe ser posterior a la entrada.";
        }
    }

    return errors;
}

export default function UserPanel({
    currentUser,
    habitaciones,
    reservas,
    setReservas,
    preselectedRoom,
    onClose,
    notify
}) {
    const [values, setValues] = useState({
        nombre: currentUser.nombre,
        correo: currentUser.email,
        telefono: "",
        entrada: "",
        salida: "",
        personas: 1,
        habitacion: preselectedRoom || "",
        comentarios: ""
    });
    const errors = useMemo(() => validate(values), [values]);
    const reservasUsuario = useMemo(
        () => reservas.filter((item) => item.usuarioId === currentUser.id),
        [reservas, currentUser.id]
    );

    useEffect(() => {
        setValues({
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

    const setField = (name, value) => {
        setValues((prev) => ({ ...prev, [name]: value }));
    };

    const submit = (event) => {
        event.preventDefault();
        if (Object.keys(errors).length > 0) return;

        const habitacion = habitaciones.find((item) => item.id === values.habitacion);
        if (!habitacion) {
            notify("Selecciona una habitacion valida.");
            return;
        }

        const entrada = new Date(`${values.entrada}T00:00:00`);
        const salida = new Date(`${values.salida}T00:00:00`);
        const noches = Math.ceil((salida - entrada) / (1000 * 60 * 60 * 24));
        const total = Number(habitacion.precio) * noches;

        const nuevaReserva = {
            id: `res-${Date.now()}`,
            usuarioId: currentUser.id,
            nombre: values.nombre.trim(),
            correo: values.correo.trim(),
            telefono: values.telefono.trim(),
            habitacionId: habitacion.id,
            habitacionNombre: habitacion.nombre,
            entrada: values.entrada,
            salida: values.salida,
            personas: Number(values.personas),
            comentarios: values.comentarios.trim(),
            precioNoche: Number(habitacion.precio),
            noches,
            total
        };

        setReservas((prev) => [nuevaReserva, ...prev]);
        setValues({
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
    };

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

            <form className="form-grid" onSubmit={submit} noValidate>
                <div>
                    <label htmlFor="res-nombre">Nombre completo</label>
                    <input
                        id="res-nombre"
                        type="text"
                        value={values.nombre}
                        onChange={(event) => setField("nombre", event.target.value)}
                    />
                    {errors.nombre && <p className="error-msg">{errors.nombre}</p>}
                </div>

                <div>
                    <label htmlFor="res-correo">Correo</label>
                    <input
                        id="res-correo"
                        type="email"
                        value={values.correo}
                        onChange={(event) => setField("correo", event.target.value)}
                    />
                    {errors.correo && <p className="error-msg">{errors.correo}</p>}
                </div>

                <div>
                    <label htmlFor="res-telefono">Telefono</label>
                    <input
                        id="res-telefono"
                        type="tel"
                        value={values.telefono}
                        onChange={(event) => setField("telefono", event.target.value)}
                    />
                    {errors.telefono && <p className="error-msg">{errors.telefono}</p>}
                </div>

                <div>
                    <label htmlFor="res-habitacion">Habitacion</label>
                    <select
                        id="res-habitacion"
                        value={values.habitacion}
                        onChange={(event) => setField("habitacion", event.target.value)}
                    >
                        <option value="">Selecciona una habitacion</option>
                        {habitaciones.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.nombre} - {money(item.precio)}
                            </option>
                        ))}
                    </select>
                    {errors.habitacion && <p className="error-msg">{errors.habitacion}</p>}
                </div>

                <div>
                    <label htmlFor="res-entrada">Entrada</label>
                    <input
                        id="res-entrada"
                        type="date"
                        value={values.entrada}
                        onChange={(event) => setField("entrada", event.target.value)}
                    />
                    {errors.entrada && <p className="error-msg">{errors.entrada}</p>}
                </div>

                <div>
                    <label htmlFor="res-salida">Salida</label>
                    <input
                        id="res-salida"
                        type="date"
                        value={values.salida}
                        onChange={(event) => setField("salida", event.target.value)}
                    />
                    {errors.salida && <p className="error-msg">{errors.salida}</p>}
                </div>

                <div>
                    <label htmlFor="res-personas">Personas</label>
                    <input
                        id="res-personas"
                        type="number"
                        min="1"
                        max="10"
                        value={values.personas}
                        onChange={(event) => setField("personas", event.target.value)}
                    />
                    {errors.personas && <p className="error-msg">{errors.personas}</p>}
                </div>

                <div className="full-width">
                    <label htmlFor="res-comentarios">Comentarios</label>
                    <textarea
                        id="res-comentarios"
                        rows="3"
                        value={values.comentarios}
                        onChange={(event) => setField("comentarios", event.target.value)}
                    />
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
