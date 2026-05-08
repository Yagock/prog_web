import { useMemo, useState } from "react";

const EMAIL_RE = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

function validateLogin(values) {
    const errors = {};
    if (!values.email.trim()) errors.email = "El correo es obligatorio.";
    else if (!EMAIL_RE.test(values.email.trim())) errors.email = "Correo invalido.";
    if (!values.password.trim()) errors.password = "La contrasena es obligatoria.";
    else if (values.password.trim().length < 6) {
        errors.password = "Minimo 6 caracteres.";
    }
    return errors;
}

function validateRegister(values) {
    const errors = {};
    if (!values.nombre.trim()) errors.nombre = "El nombre es obligatorio.";
    else if (values.nombre.trim().length < 3) errors.nombre = "Minimo 3 caracteres.";
    if (!values.email.trim()) errors.email = "El correo es obligatorio.";
    else if (!EMAIL_RE.test(values.email.trim())) errors.email = "Correo invalido.";
    if (!values.password.trim()) errors.password = "La contrasena es obligatoria.";
    else if (values.password.trim().length < 6) {
        errors.password = "Minimo 6 caracteres.";
    }
    if (!values.passwordConfirm.trim()) {
        errors.passwordConfirm = "Confirma tu contrasena.";
    } else if (values.password !== values.passwordConfirm) {
        errors.passwordConfirm = "Las contrasenas no coinciden.";
    }
    return errors;
}

export default function AuthModal({
    open,
    mode,
    onModeChange,
    onClose,
    onLogin,
    onRegister
}) {
    const [loginValues, setLoginValues] = useState({ email: "", password: "" });
    const [registerValues, setRegisterValues] = useState({
        nombre: "",
        email: "",
        password: "",
        passwordConfirm: ""
    });
    const [submitError, setSubmitError] = useState("");

    const loginErrors = useMemo(() => validateLogin(loginValues), [loginValues]);
    const registerErrors = useMemo(
        () => validateRegister(registerValues),
        [registerValues]
    );

    if (!open) return null;

    const submitLogin = (event) => {
        event.preventDefault();
        if (Object.keys(loginErrors).length > 0) return;
        const result = onLogin({
            email: loginValues.email.trim(),
            password: loginValues.password.trim()
        });
        if (!result.ok) {
            setSubmitError(result.message);
            return;
        }
        setSubmitError("");
        setLoginValues({ email: "", password: "" });
    };

    const submitRegister = async (event) => {
        event.preventDefault();
        if (Object.keys(registerErrors).length > 0) return;

        try {
            const response = await fetch('http://127.0.0.1:8000/api/registro/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nombre: registerValues.nombre.trim(),
                    email: registerValues.email.trim(),
                    password: registerValues.password.trim()
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert("¡Cuenta creada correctamente en MariaDB!");
                setSubmitError("");
                setRegisterValues({
                    nombre: "",
                    email: "",
                    password: "",
                    passwordConfirm: ""
                });
                onClose(); // Cerramos el modal al tener éxito
            } else {
                // Si el correo ya existe, Django enviará el error que escribimos en views.py
                setSubmitError(data.error || "Error al registrar.");
            }
        } catch (error) {
            setSubmitError("No se pudo conectar con el servidor Django.");
        }
    };

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
                        onClick={() => {
                            setSubmitError("");
                            onModeChange("login");
                        }}
                    >
                        Iniciar sesion
                    </button>
                    <button
                        className={`tab-btn ${mode === "register" ? "active" : ""}`}
                        type="button"
                        onClick={() => {
                            setSubmitError("");
                            onModeChange("register");
                        }}
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
                            value={loginValues.email}
                            onChange={(event) =>
                                setLoginValues((prev) => ({
                                    ...prev,
                                    email: event.target.value
                                }))
                            }
                        />
                        {loginErrors.email && <p className="error-msg">{loginErrors.email}</p>}

                        <label htmlFor="login-password">Contrasena</label>
                        <input
                            id="login-password"
                            type="password"
                            value={loginValues.password}
                            onChange={(event) =>
                                setLoginValues((prev) => ({
                                    ...prev,
                                    password: event.target.value
                                }))
                            }
                        />
                        {loginErrors.password && (
                            <p className="error-msg">{loginErrors.password}</p>
                        )}
                        {submitError && <p className="error-msg">{submitError}</p>}
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
                            value={registerValues.nombre}
                            onChange={(event) =>
                                setRegisterValues((prev) => ({
                                    ...prev,
                                    nombre: event.target.value
                                }))
                            }
                        />
                        {registerErrors.nombre && (
                            <p className="error-msg">{registerErrors.nombre}</p>
                        )}

                        <label htmlFor="register-email">Correo</label>
                        <input
                            id="register-email"
                            type="email"
                            value={registerValues.email}
                            onChange={(event) =>
                                setRegisterValues((prev) => ({
                                    ...prev,
                                    email: event.target.value
                                }))
                            }
                        />
                        {registerErrors.email && (
                            <p className="error-msg">{registerErrors.email}</p>
                        )}

                        <label htmlFor="register-password">Contrasena</label>
                        <input
                            id="register-password"
                            type="password"
                            value={registerValues.password}
                            onChange={(event) =>
                                setRegisterValues((prev) => ({
                                    ...prev,
                                    password: event.target.value
                                }))
                            }
                        />
                        {registerErrors.password && (
                            <p className="error-msg">{registerErrors.password}</p>
                        )}

                        <label htmlFor="register-password-confirm">Confirmar contrasena</label>
                        <input
                            id="register-password-confirm"
                            type="password"
                            value={registerValues.passwordConfirm}
                            onChange={(event) =>
                                setRegisterValues((prev) => ({
                                    ...prev,
                                    passwordConfirm: event.target.value
                                }))
                            }
                        />
                        {registerErrors.passwordConfirm && (
                            <p className="error-msg">{registerErrors.passwordConfirm}</p>
                        )}
                        {submitError && <p className="error-msg">{submitError}</p>}
                        <button className="btn btn-primary" type="submit">
                            Crear cuenta
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
