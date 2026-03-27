export const STORAGE_KEYS = {
    habitaciones: "hotel_habitaciones",
    servicios: "hotel_servicios",
    usuarios: "hotel_usuarios",
    reservas: "hotel_reservas",
    sesion: "hotel_sesion"
};

export const DEFAULT_SERVICIOS = [
    { id: "srv-wifi", nombre: "WiFi" },
    { id: "srv-king", nombre: "Cama King Size" },
    { id: "srv-jardin", nombre: "Vista al jardin" },
    { id: "srv-aire", nombre: "Aire acondicionado" }
];

export const DEFAULT_HABITACIONES = [
    {
        id: "hab-101-tzintzuntzan",
        nombre: "101 - Tzintzuntzan",
        descripcion:
            "Habitacion inspirada en el pueblo magico de Tzintzuntzan. Ofrece un ambiente tranquilo con decoracion tradicional y todas las comodidades necesarias para una estancia placentera.",
        servicios: ["WiFi", "Cama King Size", "Vista al jardin", "Aire acondicionado"],
        precio: 1000,
        imagen: "/imagenes/Hotel4_mejorada.jpg"
    },
    {
        id: "hab-102-paracho",
        nombre: "102 - Paracho",
        descripcion:
            "Habitacion inspirada en el pueblo magico de Paracho. Ofrece un ambiente tranquilo con decoracion tradicional y todas las comodidades necesarias para una estancia placentera.",
        servicios: ["WiFi", "Cama King Size", "Vista al jardin", "Aire acondicionado"],
        precio: 1200,
        imagen: "/imagenes/Hotel7_mejorada.jpg"
    },
    {
        id: "hab-103-yunuen",
        nombre: "103 - Yunuen",
        descripcion:
            "Habitacion inspirada en el pueblo magico de Yunuen. Ofrece un ambiente tranquilo con decoracion tradicional y todas las comodidades necesarias para una estancia placentera.",
        servicios: ["WiFi", "Cama King Size", "Vista al jardin", "Aire acondicionado"],
        precio: 1500,
        imagen: "/imagenes/Hotel8_mejorada.jpg"
    }
];

export const DEFAULT_USUARIOS = [
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
