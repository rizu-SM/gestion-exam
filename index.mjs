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




app.post('/gestion-surveillances', async (req, res) => {
    try {
        /*****************************************************************
         * ÉTAPE 1: Assignation des professeurs de cours comme surveillants
         * (anciennement route '/assignerProfDeCour')
         *****************************************************************/
        const { semestre, pourcentagePermanent, annee_universitaire } = req.body;

        // Vérification de l'assignation existante
        const [existe] = await pool.query(
            "SELECT * FROM base_surveillance WHERE semestre = ? AND annee_universitaire = ?",
            [semestre, annee_universitaire]
        );
        
        if (existe.length > 0) {
            return res.status(400).json({
                success: false,
                message: "L'assignation pour ce semestre a déjà été effectuée."
            });
        }

        // Assignation des surveillants principaux
        const [examens] = await pool.query(
            "SELECT * FROM exam WHERE semestre = ? AND annee_universitaire = ?",
            [semestre, annee_universitaire]
        );

        const resultatsAssignation = [];
        const erreursAssignation = [];

        for (const examen of examens) {
            try {
                const [enseignants] = await pool.query(
                    `SELECT code_enseignant FROM charge_enseignement 
                     WHERE palier = ? AND specialite = ? AND section = ? 
                     AND intitule_module = ? AND type = 'cours'`, 
                    [examen.palier, examen.specialite, examen.section, examen.module]
                );

                if (enseignants.length === 0) {
                    erreursAssignation.push({
                        examen_id: examen.id,
                        message: "Aucun enseignant trouvé pour ce module"
                    });
                    continue;
                }

                

                const salles = examen.salle.split('+').filter(s => s.trim() !== ''); // Diviser les salles  sont séparées par '+'
                const nbrSE = salles.length * 2; // 2 surveillants  par salle
                

                await pool.query(
                    `INSERT INTO base_surveillance 
                     (palier, specialite, semestre, section, date_exam, horaire, 
                      module, salle, code_enseignant, ordre, nbrSE, nbrSS, annee_universitaire)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 0, ?)`,
                    [examen.palier, examen.specialite, semestre, examen.section, 
                     examen.date_exam, examen.horaire, examen.module, 
                     examen.salle, enseignants[0].code_enseignant, nbrSE, annee_universitaire]
                );

                resultatsAssignation.push({
                    examen_id: examen.id,
                    code_enseignant: enseignants[0].code_enseignant,
                    message: "Surveillant principal assigné"
                });
            } catch (error) {
                erreursAssignation.push({
                    examen_id: examen.id,
                    message: "Erreur d'assignation",
                    error: error.message
                });
            }
        }

        /*****************************************************************
         * ÉTAPE 2: Calcul du nombre total de surveillants nécessaires
         * (anciennement route '/total-surveillants')
         *****************************************************************/
        const [sallesData] = await pool.query(
            "SELECT salle FROM exam WHERE semestre = ? AND annee_universitaire = ?", 
            [semestre, annee_universitaire]
        );
        let totalSalles = 0;

        for (let row of sallesData) {
            if (row.salle) {
                const salles = row.salle.split('+').filter(part => part.trim() !== '');
                totalSalles += salles.length;
            }
        }

        console.log(totalSalles);
        console.log("-------------------------------------------------------------------")
        const totalSurveillants = totalSalles * 2 ;

        /*****************************************************************
         * ÉTAPE 3: Répartition des surveillances entre enseignants
         *****************************************************************/
        // Validation du pourcentage
        if (pourcentagePermanent === undefined || pourcentagePermanent < 0 || pourcentagePermanent > 100) {
            return res.status(400).json({ 
                success: false,
                message: 'Le pourcentage doit être entre 0 et 100' 
            });
        }

        // Récupération des enseignants
        const [permanents] = await pool.query(
            'SELECT * FROM enseignants WHERE type = "Permanant" AND etat = "admin"'
        );
        const [vacataires] = await pool.query(
            'SELECT * FROM enseignants WHERE type = "Vacataire" AND etat = "admin"'
        );

        // Calcul de la répartition
        const surveillancesPermanent = Math.round((totalSurveillants * pourcentagePermanent) / 100);
        const surveillancesVacataire = totalSurveillants - surveillancesPermanent;

        // Distribution des quotas
        const updateQueries = [];
        
        // Pour les permanents
        const basePermanent = Math.floor(surveillancesPermanent / permanents.length);
        let restePermanent = surveillancesPermanent % permanents.length;
        
        permanents.forEach((enseignant, index) => {
            let quotap = basePermanent + (index < restePermanent ? 1 : 0);
            
            updateQueries.push(
                pool.query(
                    'UPDATE enseignants SET surveillances = ? WHERE code_enseignant = ?', 
                    [quotap, enseignant.code_enseignant]
                )
            );
        }
    );

        // Pour les vacataires
        const baseVacataire = Math.floor(surveillancesVacataire / vacataires.length);
        let resteVacataire = surveillancesVacataire % vacataires.length;
        
        vacataires.forEach((enseignant, index) => {
            let quotas = baseVacataire + (index < resteVacataire ? 1 : 0);
            
            updateQueries.push(
                pool.query(
                    'UPDATE enseignants SET surveillances = ? WHERE code_enseignant = ?', 
                    [quotas, enseignant.code_enseignant]
                )
            );
        });
        //pour les prof de cour déja assigné on update leur avaibilité (surveillances) avec -1

        const [enseignantassigne] = await pool.query(
            "SELECT code_enseignant FROM base_surveillance WHERE semestre = ? AND annee_universitaire = ?",
            [semestre, annee_universitaire]
        );

        enseignantassigne.forEach((ens, index) => {
            updateQueries.push(
                pool.query(
                    'UPDATE enseignants SET surveillances = surveillances - 1 WHERE code_enseignant = ?',
                    [ens.code_enseignant]
                )
            )
        })
        
        /***************************************************************** 
         * // ÉTAPE 4: Assignation des surveillants secondaires par examen
        **********************************************************************/

        try {
            
    
            for (const examen of examens) {
                const salles = examen.salle.split('+').filter(s => s.trim() !== '');
                const surveillantsSecondairesCount = salles.length * 2;
    
                const [enseignantsDisponibles] = await pool.query(
                    `SELECT code_enseignant, surveillances FROM enseignants
                    WHERE etat = 'admin' AND surveillances > 0
                    AND code_enseignant NOT IN (
                            SELECT code_enseignant FROM base_surveillance
                            WHERE date_exam = ? AND horaire = ?
                    )
                    ORDER BY surveillances ASC
                    LIMIT ?`,
                    [examen.date_exam, examen.horaire, surveillantsSecondairesCount]
                );
    
                let enseignantIndex = 0;
                let ordre = 2;
    
                for (const salle of salles) {
                    for (let i = 0; i < 2; i++) {
                        if (enseignantIndex >= enseignantsDisponibles.length) break;
    
                        const enseignant = enseignantsDisponibles[enseignantIndex];
                        enseignantIndex++;
    
                        await pool.query(
                            `INSERT INTO base_surveillance 
                             (palier, specialite, semestre, section, date_exam, horaire, module, salle, 
                              code_enseignant, ordre, nbrSE, nbrSS, annee_universitaire)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                examen.palier, examen.specialite, examen.semestre, examen.section,
                                examen.date_exam, examen.horaire, examen.module,
                                salle, enseignant.code_enseignant, ordre, salles.length * 2, 1,
                                annee_universitaire
                            ]
                        );
                        await pool.query(
                            `UPDATE enseignants SET surveillances = surveillances - 1 WHERE code_enseignant = ?`,
                            [enseignant.code_enseignant]
                        );
    
                        ordre++;
                    }
                }
            }

        } catch (error) {
            console.error('Erreur lors de l\'affectation des surveillants secondaires :', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }

        await Promise.all(updateQueries);

        /*****************************************************************
         * RÉPONSE FINALE
         *****************************************************************/
        res.json({ 
            success: true,
            assignation: {
                reussites: resultatsAssignation.length,
                echecs: erreursAssignation.length,
                details_erreurs: erreursAssignation
            },
            calcul_surveillants: {
                totalSalles,
                totalSurveillants
            },
            repartition: {
                permanents: {
                    count: permanents.length,
                    surveillances: surveillancesPermanent
                },
                vacataires: {
                    count: vacataires.length,
                    surveillances: surveillancesVacataire
                }
            }
        });

    } catch (error) {
        console.error('Erreur globale:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur serveur lors de la gestion des surveillances',
            error: error.message
        });
    }
});


app.post('/affecter-surveillants-secondaires', async (req, res) => {
    try {
        // Récupérer tous les examens depuis la table `exam`
        const [examens] = await pool.query(
            `SELECT palier, specialite, section, date_exam, horaire, module, salle, semestre
             FROM exam`
        );

        for (const examen of examens) {
            const salles = examen.salle.split('+').filter(s => s.trim() !== '');
            const surveillantsSecondairesCount = salles.length * 2;

            const [enseignantsDisponibles] = await pool.query(
                `SELECT code_enseignant, surveillances FROM enseignants
                WHERE etat = 'admin' AND surveillances > 0
                AND code_enseignant NOT IN (
                        SELECT code_enseignant FROM base_surveillance
                        WHERE date_exam = ? AND horaire = ?
                )
                ORDER BY surveillances ASC
                LIMIT ?`,
                [examen.date_exam, examen.horaire, surveillantsSecondairesCount]
            );

            let enseignantIndex = 0;
            let ordre = 2;

            for (const salle of salles) {
                for (let i = 0; i < 2; i++) {
                    if (enseignantIndex >= enseignantsDisponibles.length) break;

                    const enseignant = enseignantsDisponibles[enseignantIndex];
                    enseignantIndex++;

                    await pool.query(
                        `INSERT INTO base_surveillance 
                         (palier, specialite, semestre, section, date_exam, horaire, module, salle, code_enseignant, ordre, nbrSE, nbrSS)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            examen.palier, examen.specialite, examen.semestre, examen.section,
                            examen.date_exam, examen.horaire, examen.module,
                            salle, enseignant.code_enseignant, ordre, salles.length * 2, 1
                        ]
                    );

                    await pool.query(
                        `UPDATE enseignants SET surveillances = surveillances - 1 WHERE code_enseignant = ?`,
                        [enseignant.code_enseignant]
                    );

                    ordre++;
                }
            }
        }

        res.status(200).json({ message: 'Surveillants secondaires affectés avec succès.' });
    } catch (error) {
        console.error('Erreur lors de l\'affectation des surveillants secondaires :', error);
        res.status(500).json({ error: 'Erreur serveur' });
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


app.delete('/supprimer-examen/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const [result] = await pool.query("DELETE FROM exam_temp WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Examen introuvable." });
        }

        res.json({ success: true, message: "Examen supprimé avec succès." });
    } catch (error) {
        console.error("Erreur lors de la suppression de l'examen :", error);
        res.status(500).json({ success: false, message: "Erreur serveur lors de la suppression." });
    }
});


app.delete('/supprimer-examen/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const [result] = await pool.query("DELETE FROM exam_temp WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Examen introuvable." });
        }

        res.json({ success: true, message: "Examen supprimé avec succès." });
    } catch (error) {
        console.error("Erreur lors de la suppression de l'examen :", error);
        res.status(500).json({ success: false, message: "Erreur serveur lors de la suppression." });
    }
});

// Endpoint pour récupérer tous les examens
app.get('/examens', async (req, res) => {
    try {
        const [examens] = await pool.query("SELECT * FROM exam_temp");
        res.json(examens);
    } catch (error) {
        console.error("Erreur lors de la récupération des examens:", error);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
});

app.put('/modifier-examen/:id', async (req, res) => {
    const id = req.params.id;
    const { palier, specialite, section, module, date, heure, salle, semestre } = req.body;

    if (!palier || !specialite || !section || !module || !date || !heure || !salle || !semestre) {
        return res.status(400).json({ success: false, message: 'Tous les champs sont obligatoires.' });
    }

    try {
        const [result] = await pool.query(
            `UPDATE exam_temp 
             SET palier = ?, specialite = ?, section = ?, module = ?, date_exam = ?, horaire = ?, salle = ?, semestre = ?
             WHERE id = ?`,
            [palier, specialite, section, module, date, heure, salle, semestre, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Examen introuvable." });
        }

        res.json({ success: true, message: "Examen modifié avec succès." });
    } catch (error) {
        console.error("Erreur lors de la modification :", error);
        res.status(500).json({ success: false, message: "Erreur serveur lors de la modification." });
    }
});

app.post('/ajouter-examen', async (req, res) => {
    const { palier, specialite, section, module, date, heure, salle, semestre } = req.body;

    // Vérification des champs obligatoires (sans annee_universitaire)
    if (!palier || !specialite || !section || !module || !date || !heure || !salle || !semestre) {
        return res.status(400).json({ success: false, message: 'Tous les champs sont obligatoires.' });
    }

    try {
        // Calcul de l'année universitaire automatique
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // Les mois sont 0-indexés (0-11)
        
        let annee_universitaire;
        if (currentMonth >= 9) { // Si nous sommes à partir de septembre
            annee_universitaire = `${currentYear}-${currentYear + 1}`;
        } else {
            annee_universitaire = `${currentYear - 1}-${currentYear}`;
        }

        await pool.query(
            `INSERT INTO exam_temp (palier, specialite, section, module, date_exam, horaire, salle, semestre, annee_universitaire)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [palier, specialite, section, module, date, heure, salle, semestre, annee_universitaire]
        );

        res.json({ success: true, message: 'Examen ajouté avec succès dans exam_temp.' });
    } catch (error) {
        console.error('Erreur lors de l\'insertion dans exam_temp:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur lors de l\'ajout de l\'examen.' });
    }
});


// Démarrer le serveur
app.listen(3000, () => {
    console.log('Serveur démarré sur http://localhost:3000');
    console.log('Route principale: POST /assigner-surveillants-principaux');
});