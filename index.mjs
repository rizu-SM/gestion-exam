import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";


const app = express();
app.use(express.json());
app.use(cors());

// Configuration de la base de données
const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "supra_2006",
    database: "try",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});




// Route pour assigner les enseignants de cours comme surveillants principaux
app.post('/assigner', async (req, res) => {
    // Vérifier si l'assignation a déjà été faite
    const [existe] = await pool.query(
        "SELECT * FROM base_surveillance WHERE semestre = ?",
        [req.body.semestre] // Utilisation du nom correct
    );

    if (existe.length > 0) {
        return res.status(400).json({
            success: false,
            message: "L'assignation pour ce semestre a déjà été effectuée."
        });
    }

    try {
        // Récupérer tous les examens avec le semestre correspondant
        const [examens] = await pool.query(
            "SELECT * FROM exam WHERE semestre = ?",
            [req.body.semestre] // Filtrer par semestre
        );

        console.log("Examens récupérés :", examens);
        const resultats = [];
        const erreurs = [];

        // Traitement de chaque examen
        for (const examen of examens) {
            try {
                console.log("Valeurs utilisées pour la requête :", examen.palier, examen.specialite, examen.section, examen.module);

                // Trouver l'enseignant responsable du cours
                const [enseignants] = await pool.query(
                    `SELECT code_enseignant 
                     FROM charge_enseignement 
                     WHERE palier = ? 
                       AND specialite = ? 
                       AND section = ? 
                       AND intitule_module = ? 
                       AND type = 'cours'`, 
                    [examen.palier, examen.specialite, 
                     examen.section, examen.module]
                );

                if (enseignants.length === 0) {
                    erreurs.push({
                        examen_id: examen.id,
                        message: "Aucun enseignant trouvé pour ce module/section",
                        details: examen
                    });
                    continue;
                }

                const code_enseignant = enseignants[0].code_enseignant;

                // Insérer dans `base_surveillance`
                await pool.query(
                    `INSERT INTO base_surveillance 
                     (palier, specialite, semestre, section, date_exam, horaire, 
                      module, salle, code_enseignant, ordre, nbrSE, nbrSS)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 4, 0)`,
                    [examen.palier, examen.specialite, req.body.semestre, // Utilisation correcte
                     examen.section, examen.date_exam, examen.horaire,
                     examen.module, examen.salle, code_enseignant]
                );

                resultats.push({
                    examen_id: examen.id,
                    code_enseignant,
                    message: "Surveillant principal assigné avec succès"
                });

            } catch (error) {
                erreurs.push({
                    examen_id: examen.id,
                    message: "Erreur lors de l'assignation",
                    error: error.message
                });
            }
        }

        // Retourner le rapport
        res.json({
            success: true,
            assignes: resultats,
            erreurs: erreurs,
            message: `Assignation terminée. ${resultats.length} réussites, ${erreurs.length} échecs`
        });

    } catch (error) {
        console.error("Erreur globale:", error);
        res.status(500).json({
            success: false,
            error: "Erreur serveur lors de l'assignation",
            details: error.message
        });
    }
});



app.post('/calculer-surveillance', async (req, res) => {
  const { pourcentageX } = req.body;
  if (!pourcentageX || pourcentageX < 0 || pourcentageX > 100) 
    return res.status(400).json({ message: 'Valeur invalide.' });

  try {
    const [enseignants] = await pool.query('SELECT * FROM enseignants');
    const nmbrtotalsurveillance = 100, pourcentageY = 100 - pourcentageX;

    await Promise.all(enseignants.map(async (enseignant) => {
      let surveillances;
      if (enseignant.type === 'Permanant') {
          surveillances = (nmbrtotalsurveillance * pourcentageX) / 100;
      } else {
          surveillances = (nmbrtotalsurveillance * pourcentageY) / 100;
      }


      await pool.query('UPDATE enseignants SET surveillances = ? WHERE code_enseignant = ?', 
        [Math.round(surveillances), enseignant.code_enseignant]);
    }));

    res.json({ message: 'Surveillances mises à jour.' });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
});

app.post('/ajouter-examen', async (req, res) => {
    const { palier, specialite, section, module, date, heure, salle, semestre } = req.body;

    // Vérifier si les champs sont valides
    if (!palier || !specialite || !section || !module || !date || !heure || !salle || !semestre) {
        return res.status(400).json({ success: false, message: 'Tous les champs sont obligatoires.' });
    }

    try {
        // Insérer l'examen dans la table exam_temp
        await pool.query(
            `INSERT INTO exam_temp (palier, specialite, section, module, date_exam, horaire, salle, semestre)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [palier, specialite, section, module, date, heure, salle, semestre]
        );

        res.json({ success: true, message: 'Examen ajouté avec succès dans exam_temp.' });
    } catch (error) {
        console.error('Erreur lors de l\'insertion dans exam_temp:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur lors de l\'ajout de l\'examen.' });
    }
});

app.get('/total-surveillants', async (req, res) => {
    try {
        // Vérifier la connexion avant d'exécuter la requête
        const [rows] = await pool.query("SELECT salle FROM exam");

        if (!rows.length) {
            return res.json({
                message: "Aucune donnée trouvée dans la table exam.",
                totalClasses: 0,
                totalSurveillants: 0
            });
        }

        let totalSalles = 0;

        for (let row of rows) {
            if (row.salle) {
                const salles = row.salle.split('+').filter(part => part.trim() !== '');
                totalSalles += salles.length;
            }
        }

        const totalSurveillants = totalSalles * 2;

        res.json({
            totalClasses: totalSalles,
            totalSurveillants
        });

    } catch (error) {
        console.error("Erreur lors du calcul du nombre de surveillants :", error);
        res.status(500).json({
            message: "Erreur serveur lors du calcul du nombre de surveillants.",
            error: error.message
        });
    }
});


app.get('/envoyer-formation', async (req, res) => {
    try {
        const [formations] = await pool.query("SELECT * FROM formation");
        console.log(formations);  // Affiche les données dans la console
        res.json(formations);     // Envoie les données des formations au frontend
    } catch (error) {
        console.error(error);
        res.status(500).send('Erreur serveur');
    }
});



// Démarrer le serveur
app.listen(3000, () => {
    console.log('Serveur démarré sur http://localhost:3000');
    console.log('Route principale: POST /assigner-surveillants-principaux');
});