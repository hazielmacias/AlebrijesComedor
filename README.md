# Casa Club Alebrijes Teotihuacán · Registro QR del Comedor

App web para registrar las comidas de los jugadores de la casa club mediante QR.

- **Jugadores:** inician sesión y ven su credencial con QR digital + tarjeta imprimible (PDF).
- **Cocineras:** escanean el QR con la cámara del celular para registrar Desayuno, Comida y Cena. Bloquea duplicados y registra faltas manuales.
- **Administrador:** crea usuarios, configura horarios con tolerancia y ve el reporte de faltas (automáticas y manuales), pudiendo justificarlas.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | HTML + CSS + JS puro (sin build) |
| Hospedaje | GitHub Pages |
| Base de datos + Auth | Supabase (plan gratis) |

---

## 1. Requisitos

- Cuenta en [GitHub](https://github.com) (para publicar la app).
- Proyecto en [Supabase](https://supabase.com) (ya configurado con las tablas y permisos).

## 2. Subir la app a GitHub Pages

1. En GitHub, crea un repositorio nuevo (público o privado).
2. Sube a ese repositorio **todo el contenido de esta carpeta**: `index.html`, `css/`, `js/`, `assets/` (no hace falta instalar nada, la app no requiere build).
   - En la web de GitHub: *Add file → Upload files* y arrastra los archivos.
3. En el repositorio: **Settings → Pages** → en *Build and deployment* elige:
   - Source: **Deploy from a branch**
   - Branch: `main` · folder: `/ (root)`
   - Guardar con *Save*.
4. Espera 1–2 minutos y entra a la URL que aparece (formato `https://TUUSUARIO.github.io/NOMBRE-REPO/`).

> La app necesita HTTPS (GitHub Pages lo da) para que la cámara del celular funcione al escanear.

## 3. Accesos iniciales (cámbialos apenas entres)

| Rol | Usuario | Contraseña |
|---|---|---|
| Administrador | `admin@alebrijes.club` | `Admin2026!` |
| Cocinera (prueba) | `cocinera@alebrijes.club` | `Prueba123!` |
| Jugador (prueba) | `jugador@alebrijes.club` | `Prueba123!` |

## 4. Uso diario

1. **El administrador** entra, va a *Panel → Jugadores* y crea a cada jugador (nombre, folio, usuario y contraseña).
2. **El jugador** entra con su usuario, ve su credencial con QR y pulsa *Imprimir / Guardar PDF* para llevarla impresa.
3. **La cocinera** abre la app en su celular, pulsa *Escanear*, elige la comida (se preselecciona la del momento) y apunta la cámara al QR de cada jugador.
   - Dentro del horario (+ tolerancia): se registra la comida.
   - Fuera de horario: avisa y permite registrar falta manual.
   - QR repetido en la misma comida: avisa «ya registrado», no duplica.
4. **El administrador** ve el *Reporte* de faltas por rango de fechas, las justifica con motivo, y puede corregir registros.

## 5. Horarios por defecto

| Comida | Horario | Tolerancia |
|---|---|---|
| Desayuno | 07:00 – 09:00 | 15 min |
| Comida | 13:00 – 15:00 | 15 min |
| Cena | 19:00 – 21:00 | 15 min |

Se cambian en *Panel → Horarios*. Una falta automática cuenta cuando el jugador **no escanea** dentro del horario + tolerancia de una comida activa.

## Notas de seguridad

- La clave pública de Supabase está en `js/config.js`; es de solo lectura para datos privados (los permisos reales los impone la base de datos).
- El jugador solo ve su propio perfil; las cocineras solo registran; solo el admin administra usuarios y justifica faltas.