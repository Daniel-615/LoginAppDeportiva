const db = require("../models");
const RolPermiso = db.getModel("RolPermiso");
const Rol = db.getModel("Rol");
const Permiso = db.getModel("Permiso");
const { Op } = require("sequelize");

class RolPermisoController {
  
  async permisosNoAsignados(req, res) {
    const { rolId } = req.params;

    if (!rolId) {
      return res.status(400).json({ message: "rolId es requerido." });
    }

    try {
      const asignados = await RolPermiso.findAll({
        where: { rolId },
        attributes: ['permisoId']
      });

      const idsAsignados = asignados.map(rp => rp.permisoId);

      const noAsignados = await Permiso.findAll({
        where: {
          id: {
            [Op.notIn]: idsAsignados.length > 0 ? idsAsignados : [0] // [0] evita excluir todo si vacío
          }
        },
        attributes: ['id', 'nombre']
      });

      return res.status(200).json({ success: true, data: noAsignados });
    } catch (err) {
      console.error("Error en permisosNoAsignados:", err);
      return res.status(500).json({ message: "Error al obtener permisos no asignados.", error: err.message });
    }
  }
  async create(req, res) {
    const { rolId, permisoId } = req.body;

    if (!rolId || !permisoId) {
      return res.status(400).json({ message: "rolId y permisoId son obligatorios." });
    }

    try {
      const existing = await RolPermiso.findOne({ where: { rolId, permisoId } });

      if (existing) {
        return res.status(400).json({ message: "La relación rol-permiso ya existe." });
      }

      const nuevaRelacion = await RolPermiso.create({ rolId, permisoId });

      return res.status(201).json({
        message: "Relación rol-permiso creada exitosamente.",
        rolPermiso: nuevaRelacion
      });
    } catch (err) {
      console.error("Error en create:", err);
      return res.status(500).json({ message: "Error al crear la relación rol-permiso.", error: err.message });
    }
  }

  async findAll(req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
      const { count, rows } = await RolPermiso.findAndCountAll({
        include: [
          {
            model: Rol,
            as: 'rol',
            attributes: ['id', 'nombre'],
            required: true // INNER JOIN
          },
          {
            model: Permiso,
            as: 'permiso',
            attributes: ['id', 'nombre'],
            required: true // INNER JOIN
          }
        ],
        limit,
        offset
      });

      const totalPages = Math.ceil(count / limit);

      return res.status(200).json({
        data: rows,
        total: count,
        page,
        totalPages
      });
    } catch (err) {
      console.error("Error en findAll:", err);
      return res.status(500).json({
        message: "Error al obtener las relaciones rol-permiso.",
        error: err.message
      });
    }
  }


  async findOne(req, res) {
    const { rolId, permisoId } = req.params;

    if (!rolId || !permisoId) {
      return res.status(400).json({ message: "rolId y permisoId son requeridos como parámetros." });
    }

    try {
      const relacion = await RolPermiso.findOne({
        where: { rolId, permisoId },
        include: [
          { model: Rol, as:'rol',attributes: ["id", "nombre"] },
          { model: Permiso, as: 'permiso', attributes: ["id", "nombre"] }
        ]
      });

      if (!relacion) {
        return res.status(404).json({ message: "Relación rol-permiso no encontrada." });
      }

      return res.status(200).json(relacion);
    } catch (err) {
      console.error("Error en findOne:", err);
      return res.status(500).json({ message: "Error al obtener la relación.", error: err.message });
    }
  }

  async delete(req, res) {
    const { rolId, permisoId } = req.params;

    if (!rolId || !permisoId) {
      return res.status(400).json({ message: "rolId y permisoId son requeridos como parámetros." });
    }

    try {
      const deleted = await RolPermiso.destroy({ where: { rolId, permisoId } });

      if (deleted === 1) {
        return res.json({ message: "Relación eliminada exitosamente." });
      } else {
        return res.status(404).json({ message: "Relación no encontrada." });
      }
    } catch (err) {
      console.error("Error en delete:", err);
      return res.status(500).json({ message: "Error al eliminar la relación.", error: err.message });
    }
  }
}

module.exports = RolPermisoController;
