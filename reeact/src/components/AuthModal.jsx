import { useEffect, useMemo, useState } from "react";

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
    onRegister,
    onCheckEmailAvailability
}) {
    const [loginValues, setLoginValues] = useState({ email: "", password: "" });
    const [registerValues, setRegisterValues] = useState({
        nombre: "",
        email: "",
        password: "",
        passwordConfirm: ""
    });
    const [submitError, setSubmitError] = useState("");
    const [emailAvailability, setEmailAvailability] = useState({
        checking: false,
        available: null,
        message: ""
    });

    const loginErrors = useMemo(() => validateLogin(loginValues), [loginValues]);
    const registerErrors = useMemo(
        () => validateRegister(registerValues),
        [registerValues]
    );

    useEffect(() => {
        if (!open || mode !== "register") return;

        const email = registerValues.email.trim().toLowerCase();
        if (!email) {
            setEmailAvailability({
                checking: false,
                available: null,
                message: ""
            });
            return;
        }
        if (!EMAIL_RE.test(email)) {
            setEmailAvailability({
                checking: false,
                available: false,
                message: "Correo invalido."
            });
            return;
        }

        let cancelled = false;
        const timer = setTimeout(async () => {
            setEmailAvailability((prev) => ({ ...prev, checking: true, message: "" }));
            const result = await onCheckEmailAvailability(email);
            if (cancelled) return;

            if (!result.ok) {
                setEmailAvailability({
                    checking: false,
                    available: null,
                    message: result.message || "No se pudo validar el correo."
                });
                return;
            }

            setEmailAvailability({
                checking: false,
                available: result.available,
                message: result.available
                    ? "Correo disponible."
                    : "Ese correo ya esta en uso."
            });
        }, 350);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [open, mode, registerValues.email, onCheckEmailAvailability]);

    if (!open) return null;

    const submitLogin = async (event) => {
        event.preventDefault();
        if (Object.keys(loginErrors).length > 0) return;
        const result = await onLogin({
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
        if (emailAvailability.available === false) {
            setSubmitError("Ese correo ya esta en uso.");
            return;
        }

        const result = await onRegister({
            nombre: registerValues.nombre.trim(),
            email: registerValues.email.trim(),
            password: registerValues.password.trim()
        });
        if (!result.ok) {
            setSubmitError(result.message || "No se pudo registrar.");
            return;
        }
        setSubmitError("");
        setRegisterValues({
            nombre: "",
            email: "",
            password: "",
            passwordConfirm: ""
        });
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
                        {!registerErrors.email && registerValues.email.trim() && (
                            <p
                                className="error-msg"
                                style={{
                                    color:
                                        emailAvailability.available === true
                                            ? "#2f6f4e"
                                            : "#bd3a2e"
                                }}
                            >
                                {emailAvailability.checking
                                    ? "Validando correo..."
                                    : emailAvailability.message}
                            </p>
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
