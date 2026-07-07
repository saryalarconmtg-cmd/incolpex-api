const authModel = require('./auth.model');
const authService = require('./auth.service');

async function register(req, res) {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Faltan campos requeridos: nombre, email, password' });
  }

  try {
    const existente = await authModel.findByEmail(email);
    if (existente) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese email' });
    }

    const password_hash = await authService.hashPassword(password);
    const usuario = await authModel.create({ nombre, email, password_hash });

    return res.status(201).json(usuario);
  } catch (error) {
    return res.status(500).json({ error: 'Error al registrar el usuario' });
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Faltan campos requeridos: email, password' });
  }

  try {
    const usuario = await authModel.findByEmail(email);
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const passwordValida = await authService.comparePassword(password, usuario.password_hash);
    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = authService.generarToken(usuario);

    return res.status(200).json({
      token,
      usuario: {
        id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error al iniciar sesión' });
  }
}

module.exports = { register, login };
