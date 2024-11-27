import asyncHandler from '../middlewares/async.js';
import Zone from '../models/zoneModel.js';
import { v4 as uuidv4 } from 'uuid'; // Pour générer des identifiants uniques

// Fonction pour générer un code-barre unique
const generateCodeBarre = () => uuidv4().slice(0, 8); // Exemple : 8 caractères uniques

// @desc    Get all zones
// @route   GET /api/zones
// @access  Public
const getZones = asyncHandler(async (req, res) => {
  const zones = await Zone.find();
  res.status(200).json(zones);
});

// @desc    Create a new zone with auto-generated barcodes and default statuses
// @route   POST /api/zones
// @access  Public
const createZone = asyncHandler(async (req, res) => {
  const { nom, designation, lieu, observation } = req.body;

  // Générer automatiquement les parties avec codes-barres et statuts
  const parties = [
    { type: 'COMPTAGE', codeBarre: generateCodeBarre(), status: 'À faire' },
    { type: 'BIPAGE', codeBarre: generateCodeBarre(), status: 'À faire' },
    { type: 'CONTROLE', codeBarre: generateCodeBarre(), status: 'À faire' },
  ];

  const zone = new Zone({
    nom,
    designation,
    observation,
    lieu,
    parties,
  });

  const createdZone = await zone.save();
  res.status(201).json(createdZone);
});

// @desc    Get zone by ID
// @route   GET /api/zones/:id
// @access  Public
const getZoneById = asyncHandler(async (req, res) => {
  const zone = await Zone.findById(req.params.id);

  if (zone) {
    res.status(200).json(zone);
  } else {
    res.status(404);
    throw new Error('Zone not found');
  }
});

// @desc    Update zone and its parts
// @route   PUT /api/zones/:id
// @access  Public
const updateZone = asyncHandler(async (req, res) => {
  const { nom, designation, lieu, parties } = req.body;

  const zone = await Zone.findById(req.params.id);

  if (zone) {
    zone.nom = nom || zone.nom;
    zone.designation = designation || zone.designation;
    zone.lieu = lieu || zone.lieu;

    // Mettre à jour les parties si elles sont fournies
    if (parties) {
      const updatedParties = zone.parties.map((existingPart) => {
        const updatedPart = parties.find((p) => p.type === existingPart.type);
        return updatedPart
          ? { ...existingPart, ...updatedPart }
          : existingPart;
      });

      zone.parties = updatedParties;
    }

    const updatedZone = await zone.save();
    res.status(200).json(updatedZone);
  } else {
    res.status(404);
    throw new Error('Zone not found');
  }
});

// @desc    Delete zone
// @route   DELETE /api/zones/:id
// @access  Public
const deleteZone = asyncHandler(async (req, res) => {
  const zone = await Zone.findById(req.params.id);

  if (zone) {
    await zone.deleteOne();
    res.status(200).json({ message: 'Zone removed' });
  } else {
    res.status(404);
    throw new Error('Zone not found');
  }
});

// @desc    Get and update status of a zone part by barcode
// @route   PUT /api/zones/part-status
// @access  Public
const getAndUpdateZonePartStatus = asyncHandler(async (req, res) => {
  const { codeBarre, newStatus } = req.body;

  if (!codeBarre) {
    res.status(400);
    throw new Error("Veuillez fournir un code-barres.");
  }

  // Recherche de la zone contenant la partie avec le code-barre
  const zone = await Zone.findOne({ "parties.codeBarre": codeBarre });

  if (!zone) {
    res.status(404);
    throw new Error("Aucune zone trouvée contenant une partie avec ce code-barres.");
  }

  // Trouver la partie spécifique dans la zone
  const partie = zone.parties.find((p) => p.codeBarre === codeBarre);
  if (!partie) {
    res.status(404);
    throw new Error("Partie introuvable dans la zone.");
  }

  // Si `newStatus` est fourni, mettre à jour le statut de la partie
  if (newStatus) {
    if (!['À faire', 'En cours', 'Terminé'].includes(newStatus)) {
      res.status(400);
      throw new Error("Statut invalide. Utilisez 'À faire', 'En cours' ou 'Terminé'.");
    }

    partie.status = newStatus;

    // Sauvegarder la zone après modification
    await zone.save();

    res.status(200).json({
      message: "Statut de la partie mis à jour avec succès.",
      partie: {
        type: partie.type,
        codeBarre: partie.codeBarre,
        status: partie.status,
      },
    });
  } else {
    // Si `newStatus` n'est pas fourni, retourner simplement les détails actuels
    res.status(200).json({
      message: "Statut actuel de la partie récupéré avec succès.",
      partie: {
        type: partie.type,
        codeBarre: partie.codeBarre,
        status: partie.status,
      },
    });
  }
});


export {
  getZones,
  getAndUpdateZonePartStatus,
  createZone,
  getZoneById,
  updateZone,
  deleteZone,
};
