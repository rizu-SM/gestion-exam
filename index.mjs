import express from "express";
import cors from "cors";
import mysql from "mysql2/promise"
import puppeteer from "puppeteer";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  BorderStyle,
  WidthType,
  HeightRule,
  VerticalAlign,
  ImageRun,
  HorizontalPositionRelativeFrom
} from "docx";
  import fs from "fs";
  import nodemailer from "nodemailer";
  import path from "path";

  //departement.informatique.usthb@gmail.com
  //infoUSTHB


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
  queueLimit: 0,
});

app.post("/gestion-surveillances", async (req, res) => {
  try {
    /*****************************************************************
     * ÉTAPE 1: Assignation des professeurs de cours comme surveillants principal
     * (anciennement route '/assignerProfDeCour')
     *****************************************************************/
    const { semestre, pourcentagePermanent } = req.body;

     // Détermination automatique de l'année universitaire
     const currentDate = new Date();
     const currentMonth = currentDate.getMonth() + 1; // Les mois commencent à 0
     const currentYear = currentDate.getFullYear();
     
     // Si nous sommes après août (mois 8), l'année universitaire commence
     // Sinon, nous sommes dans l'année universitaire précédente
     let annee_universitaire;
     if (currentMonth >= 9) {
         annee_universitaire = `${currentYear}-${currentYear + 1}`;
     } else {
         annee_universitaire = `${currentYear - 1}-${currentYear}`;
     }

    // Vérification de l'assignation existante
    const [existe] = await pool.query(
      "SELECT * FROM base_surveillance WHERE semestre = ? AND annee_universitaire = ?",
      [semestre, annee_universitaire]
    );

    if (existe.length > 0) {
      return res.status(400).json({
        success: false,
        message: "L'assignation pour ce semestre a déjà été effectuée.",
      });
    }

    console.log(annee_universitaire);
    console.log(semestre);
    // Assignation des surveillants principaux
    const [examens] = await pool.query(
      `SELECT * FROM exam 
       WHERE semestre = ? AND annee_universitaire = ? 
       AND module IN (SELECT module FROM formation WHERE module_info = 'oui')`,
      [semestre, annee_universitaire]
    );
    console.log(examens);

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
            message: "Aucun enseignant trouvé pour ce module - Examen ignoré",
          });
          continue; // On saute complètement cet examen
        }

        const salles = examen.salle.split("+").filter((s) => s.trim() !== ""); // Diviser les salles  sont séparées par '+'
        const nbrSE = salles.length * 2; // 2 surveillants  par salle

        await pool.query(
          `INSERT INTO base_surveillance 
                     (palier, specialite, semestre, section, date_exam, horaire, 
                      module, salle, code_enseignant, ordre, nbrSE, annee_universitaire)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
          [
            examen.palier,
            examen.specialite,
            semestre,
            examen.section,
            examen.date_exam,
            examen.horaire,
            examen.module,
            examen.salle,
            enseignants[0].code_enseignant,
            nbrSE,
            annee_universitaire,
          ]
        );

        resultatsAssignation.push({
          examen_id: examen.id,
          code_enseignant: enseignants[0].code_enseignant,
          message: "Surveillant principal assigné",
        });
      } catch (error) {
        erreursAssignation.push({
          examen_id: examen.id,
          message: "Erreur d'assignation",
          error: error.message,
        });
      }
    }

    /*****************************************************************
     * ÉTAPE 2: Calcul du nombre total de surveillants nécessaires
     * (anciennement route '/total-surveillants')
     *****************************************************************/
    const [sallesData] = await pool.query(
      `SELECT salle FROM exam WHERE semestre = ? AND annee_universitaire = ? 
      AND module IN (SELECT module FROM formation WHERE module_info = 'oui')` ,
      [semestre, annee_universitaire]
    );
    let totalSalles = 0;

    for (let row of sallesData) {
      if (row.salle) {
        const salles = row.salle
          .split("+")
          .filter((part) => part.trim() !== "");
        totalSalles += salles.length;
      }
    }

    console.log(totalSalles);
    console.log(
      "-------------------------------------------------------------------"
    );
    const totalSurveillants = totalSalles * 2;

    /*****************************************************************
     * ÉTAPE 3: Répartition des surveillances entre enseignants
     *****************************************************************/
    // Validation du pourcentage
    if (
      pourcentagePermanent === undefined ||
      pourcentagePermanent < 0 ||
      pourcentagePermanent > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Le pourcentage doit être entre 0 et 100",
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
    const surveillancesPermanent = Math.round(
      (totalSurveillants * pourcentagePermanent) / 100
    );
    const surveillancesVacataire = totalSurveillants - surveillancesPermanent;

    // Distribution des quotas
    const updateQueries = [];

    // Pour les permanents
    const basePermanent = Math.floor(
      surveillancesPermanent / permanents.length
    );
    let restePermanent = surveillancesPermanent % permanents.length;

    permanents.forEach((enseignant, index) => {
      let quotap = basePermanent + (index < restePermanent ? 1 : 0);

      updateQueries.push(
        pool.query(
          "UPDATE enseignants SET surveillances = ? WHERE code_enseignant = ?",
          [quotap, enseignant.code_enseignant]
        )
      );
    });

    // Pour les vacataires
    const baseVacataire = Math.floor(
      surveillancesVacataire / vacataires.length
    );
    let resteVacataire = surveillancesVacataire % vacataires.length;

    vacataires.forEach((enseignant, index) => {
      let quotas = baseVacataire + (index < resteVacataire ? 1 : 0);

      updateQueries.push(
        pool.query(
          "UPDATE enseignants SET surveillances = ? WHERE code_enseignant = ?",
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
          "UPDATE enseignants SET surveillances = surveillances - 1 WHERE code_enseignant = ?",
          [ens.code_enseignant]
        )
      );
    });

    /*****************************************************************
     * // ÉTAPE 4: Assignation des surveillants secondaires par examen
     **********************************************************************/

    try {
      for (const examen of examens) {
        const salles = examen.salle.split("+").filter((s) => s.trim() !== "");
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
                              code_enseignant, ordre, nbrSE, annee_universitaire)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,  ?)`,
              [
                examen.palier,
                examen.specialite,
                examen.semestre,
                examen.section,
                examen.date_exam,
                examen.horaire,
                examen.module,
                salle,
                enseignant.code_enseignant,
                ordre,
                salles.length * 2,
                annee_universitaire,
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
      console.error(
        "Erreur lors de l'affectation des surveillants secondaires :",
        error
      );
      res.status(500).json({ error: "Erreur serveur" });
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
        details_erreurs: erreursAssignation,
      },
      calcul_surveillants: {
        totalSalles,
        totalSurveillants,
      },
      repartition: {
        permanents: {
          count: permanents.length,
          surveillances: surveillancesPermanent,
        },
        vacataires: {
          count: vacataires.length,
          surveillances: surveillancesVacataire,
        },
      },
    });
  } catch (error) {
    console.error("Erreur globale:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la gestion des surveillances",
      error: error.message,
    });
  }
});

app.post("/affecter-surveillants-secondaires", async (req, res) => {
  try {
    // Récupérer tous les examens depuis la table `exam`
    const [examens] = await pool.query(
      `SELECT palier, specialite, section, date_exam, horaire, module, salle, semestre
             FROM exam`
    );

    for (const examen of examens) {
      const salles = examen.salle.split("+").filter((s) => s.trim() !== "");
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
              examen.palier,
              examen.specialite,
              examen.semestre,
              examen.section,
              examen.date_exam,
              examen.horaire,
              examen.module,
              salle,
              enseignant.code_enseignant,
              ordre,
              salles.length * 2,
              1,
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

    res
      .status(200)
      .json({ message: "Surveillants secondaires affectés avec succès." });
  } catch (error) {
    console.error(
      "Erreur lors de l'affectation des surveillants secondaires :",
      error
    );
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.get("/envoyer-formation", async (req, res) => {
  try {
    const [formations] = await pool.query("SELECT * FROM formation");
    console.log(formations); // Affiche les données dans la console
    res.json(formations); // Envoie les données des formations au frontend
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur serveur");
  }
});

app.delete("/supprimer-examen/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const [result] = await pool.query("DELETE FROM exam_temp WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Examen introuvable." });
    }

    res.json({ success: true, message: "Examen supprimé avec succès." });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'examen :", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Erreur serveur lors de la suppression.",
      });
  }
});



// Endpoint pour récupérer tous les examens
app.get("/examens", async (req, res) => {
  try {
    const [examens] = await pool.query(`
      SELECT id, palier, specialite, section, module, 
             DATE_FORMAT(date_exam, '%Y-%m-%d') AS date_exam, 
             horaire, salle, semestre, annee_universitaire 
      FROM exam_temp
    `);
    res.json(examens);
  } catch (error) {
    console.error("Erreur lors de la récupération des examens:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

app.put("/modifier-examen/:id", async (req, res) => {
  const id = req.params.id;
  const { palier, specialite, section, module, date_exam, horaire, salle } = req.body;

  if (!palier || !specialite || !section || !module || !date_exam || !horaire || !salle) {
    return res
      .status(400)
      .json({ success: false, message: "Tous les champs sont obligatoires." });
  }

  try {
    const [result] = await pool.query(
      `UPDATE exam_temp 
       SET palier = ?, specialite = ?, section = ?, module = ?, date_exam = ?, horaire = ?, salle = ?
       WHERE id = ?`,
      [palier, specialite, section, module, date_exam, horaire, salle, id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Examen introuvable." });
    }

    res.json({ success: true, message: "Examen modifié avec succès." });
  } catch (error) {
    console.error("Erreur lors de la modification :", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Erreur serveur lors de la modification.",
      });
  }
});

app.post("/ajouter-examen", async (req, res) => {
  const { palier, specialite, section, module, date, heure, salle, semestre } =
    req.body;

  // Vérification des champs obligatoires (sans annee_universitaire)
  if (
    !palier ||
    !specialite ||
    !section ||
    !module ||
    !date ||
    !heure ||
    !salle ||
    !semestre
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Tous les champs sont obligatoires." });
  }

  try {
    // Calcul de l'année universitaire automatique
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // Les mois sont 0-indexés (0-11)

    let annee_universitaire;
    if (currentMonth >= 9) {
      // Si nous sommes à partir de septembre
      annee_universitaire = `${currentYear}-${currentYear + 1}`;
    } else {
      annee_universitaire = `${currentYear - 1}-${currentYear}`;
    }

    await pool.query(
      `INSERT INTO exam_temp (palier, specialite, section, module, date_exam, horaire, salle, semestre, annee_universitaire)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        palier,
        specialite,
        section,
        module,
        date,
        heure,
        salle,
        semestre,
        annee_universitaire,
      ]
    );

    res.json({
      success: true,
      message: "Examen ajouté avec succès dans exam_temp.",
    });
  } catch (error) {
    console.error("Erreur lors de l'insertion dans exam_temp:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Erreur serveur lors de l'ajout de l'examen.",
      });
  }
});

app.get('/verifier-erreurs-examens', async (req, res) => {
  try {
      const [examens] = await pool.query("SELECT * FROM exam_temp");
      const [planingV] = await pool.query("SELECT * FROM planingV");

      const erreurs = [];

      for (let i = 0; i < examens.length; i++) {
          for (let j = i + 1; j < examens.length; j++) {
              const exam1 = examens[i];
              const exam2 = examens[j];

              const date1 = new Date(exam1.date_exam).toISOString().split('T')[0];
              const date2 = new Date(exam2.date_exam).toISOString().split('T')[0];

              const heure1 = exam1.horaire.toString().trim();
              const heure2 = exam2.horaire.toString().trim();

              const salle1 = exam1.salle.toString().trim();
              const salle2 = exam2.salle.toString().trim();

              // 1. Conflit de salle
              if (
                  date1 === date2 &&
                  heure1 === heure2 &&
                  salle1 === salle2 &&
                  exam1.section !== exam2.section
              ) {
                  erreurs.push({
                      type: "Conflit de salle",
                      message: `Conflit entre les sections ${exam1.section} et ${exam2.section} dans la salle ${salle1} à ${heure1} le ${date1}`,
                      examens: [exam1.id, exam2.id]
                  });
              }

              // 2. Doublon exact
              if (
                  exam1.section === exam2.section &&
                  exam1.module === exam2.module &&
                  date1 === date2 &&
                  heure1 === heure2 &&
                  salle1 === salle2
              ) {
                  erreurs.push({
                      type: "Doublon exact",
                      message: `Le module ${exam1.module} est dupliqué pour la section ${exam1.section} à la même date, heure et salle.`,
                      examens: [exam1.id, exam2.id]
                  });
              }

              // 3. Module incohérent
              if (
                  exam1.section === exam2.section &&
                  exam1.module === exam2.module &&
                  (date1 !== date2 || heure1 !== heure2 || salle1 !== salle2)
              ) {
                  erreurs.push({
                      type: "Incohérence module",
                      message: `Le module ${exam1.module} pour la section ${exam1.section} est planifié à des moments différents.`,
                      examens: [exam1.id, exam2.id]
                  });
              }
          }

          // 4. Vérification de la disponibilité de la salle
          const exam = examens[i];
          const isSalleDisponible = planingV.some(
              (plan) =>
                  plan.salle === exam.salle &&
                  plan.horaire === exam.horaire &&
                  new Date(plan.date_exam).toISOString().split('T')[0] ===
                      new Date(exam.date_exam).toISOString().split('T')[0]
          );

          if (!isSalleDisponible) {
              erreurs.push({
                  type: "Salle indisponible",
                  message: `La salle ${exam.salle} n'est pas disponible à ${exam.horaire} le ${exam.date_exam}.`,
                  examen: exam.id
              });
          }
      }

      res.json({ 
          success: erreurs.length === 0,
          erreurs,
          message: erreurs.length > 0 ? `${erreurs.length} erreur(s) détectée(s).` : "Aucune erreur détectée."
      });

  } catch (error) {
      console.error("Erreur de vérification :", error);
      res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});

app.post("/envoyer-mail", async (req, res) => {
  try {
    // Create files directory if it doesn't exist
    const filesDir = path.join(process.cwd(), "files");
    if (!fs.existsSync(filesDir)) {
      fs.mkdirSync(filesDir, { recursive: true });
    }

    const [base_surveillance] = await pool.query(
      "SELECT DISTINCT code_enseignant FROM base_surveillance"
    );

    if (base_surveillance.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Aucun enseignant trouvé dans base_surveillance.",
      });
    }

    // Launch a browser instance once for all PDF generations
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    for (const { code_enseignant } of base_surveillance) {
      const [examens] = await pool.query(
        `SELECT palier, specialite, section, module, date_exam, horaire, salle, semestre
         FROM base_surveillance
         WHERE code_enseignant = ?`,
        [code_enseignant]
      );

      if (examens.length === 0) continue;

      const [enseignant] = await pool.query(
        `SELECT email1, nom, prenom, grade, departement FROM enseignants WHERE code_enseignant = ?`,
        [code_enseignant]
      );

      if (enseignant.length === 0 || !enseignant[0].email1) continue;

      const email = enseignant[0].email1;
      const nomComplet = `${enseignant[0].prenom} ${enseignant[0].nom}`;
      const grade = enseignant[0].grade;
      const departement = enseignant[0].departement;

      // Format date and time for display
      const now = new Date();
      const printDate = now.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      // Helper function to format exam dates
      const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      };

      // Prepare surveillance data for HTML template
      const surveillances = examens.map(exam => ({
        module: exam.module,
        palier: exam.palier,
        specialite: exam.specialite,
        section: exam.section,
        date_exam: exam.date_exam,
        horaire: exam.horaire,
        salle: exam.salle,
        semestre: exam.semestre
      }));

      // Generate HTML content using the provided design
      const logoPath = path.resolve("logo.png");

      const htmlContent = `
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Détail de vos surveillances d'examens</title>
          <style>
            @page { size: A4; margin: 1cm; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              padding: 20px;
            }
            .print-header { 
              text-align: center;
              margin-bottom: 20px;
              padding-bottom: 15px;
              border-bottom: 2px solid #4361ee;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 20px;
            }
            
            .header-text {
              flex: 1;
            }
            .print-title {
              color: #2c3e50;
              margin-bottom: 5px;
              font-size: 1.5em;
            }
            .print-subtitle {
              color: #7f8c8d;
              font-weight: normal;
              margin-top: 0;
              font-size: 1.1em;
            }
            .print-section { 
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            .section-title {
              color: #4361ee;
              border-bottom: 1px solid #eee;
              padding-bottom: 5px;
              margin-bottom: 15px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
              margin-bottom: 20px;
            }
            .info-item {
              margin-bottom: 10px;
            }
            .info-label {
              font-weight: bold;
              color: #7f8c8d;
              font-size: 0.9em;
            }
            .print-table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
              font-size: 0.9em;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
            }
            .print-table th {
              background-color: #4361ee;
              color: white;
              text-align: left;
              padding: 10px 12px;
            }
            .print-table td {
              padding: 8px 12px;
              border-bottom: 1px solid #ddd;
            }
            .print-table tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .print-footer {
              margin-top: 30px;
              font-size: 0.8em;
              color: #7f8c8d;
              text-align: right;
              border-top: 1px solid #eee;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="print-header">
              
            <div class="header-text">
              <h1 class="print-title">Université de science et de technologie Houari Boumediene</h1>
              <p class="print-subtitle">Faculté d'informatique</p>
            </div>
          </div>

          <div class="print-section">
            <h2 class="section-title">Informations de Base</h2>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Nom complet</div>
                <div>${nomComplet}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Grade</div>
                <div>${grade}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Département</div>
                <div>${departement}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Total surveillances</div>
                <div>${surveillances.length}</div>
              </div>
            </div>
          </div>

          <div class="print-section">
            <h2 class="section-title">Surveillances Assignées</h2>
            ${surveillances.length > 0 ? `
            <table class="print-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Horaire</th>
                  <th>Module</th>
                  <th>Salle</th>
                  <th>Spécialité</th>
                </tr>
              </thead>
              <tbody>
                ${surveillances.map(surv => `
                  <tr>
                    <td>${formatDate(surv.date_exam)}</td>
                    <td>${surv.horaire}</td>
                    <td>${surv.module}</td>
                    <td>${surv.salle}</td>
                    <td>${surv.specialite}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ` : '<p>Aucune surveillance enregistrée</p>'}
          </div>
        </body>
        </html>
      `;

      // Generate PDF from HTML
      const page = await browser.newPage();
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0'
      });
      
      const pdfPath = path.join(filesDir, `${code_enseignant}_examens.pdf`);
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        margin: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm'
        },
        printBackground: true
      });
      await page.close();

      // Configuration du transporteur email
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "departement.informatique.usthb@gmail.com",
          pass: "pcvt nomo ocsf cows",
        },
      });

      try {
        await transporter.sendMail({
          from: '"Administration des examens" <hamrounsamiabdelmalek@gmail.com>',
          to: email,
          subject: "Vos examens à surveiller",
          text: "Veuillez trouver ci-joint vos examens à surveiller.",
          html: "<p>Veuillez trouver ci-joint le PDF contenant vos examens à surveiller.</p>",
          attachments: [
            {
              filename: `Surveillances_${nomComplet.replace(/\s+/g, '_')}.pdf`,
              path: pdfPath,
            },
          ],
        });

        console.log(`Email envoyé à ${email}`);
        
        // Delete the PDF file after sending
        fs.unlinkSync(pdfPath);
      } catch (emailError) {
        console.error(`Erreur lors de l'envoi de l'email :`, emailError);
      }
    }

    // Close the browser when done
    await browser.close();
    res.json({ success: true, message: "Emails envoyés avec succès." });
  } catch (error) {
    console.error("Erreur serveur :", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de l'envoi des emails.",
    });
  }
});
//PV 
app.post("/envoyer-pv", async (req, res) => {
  try {
    const [examens] = await pool.query(`
      SELECT DISTINCT date_exam, horaire, salle, module 
      FROM base_surveillance
    `);

    if (examens.length === 0) {
      return res.status(404).json({ success: false, message: "Aucun examen trouvé." });
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    for (const examen of examens) {
      const { date_exam, horaire, salle, module } = examen;

      const [principaux] = await pool.query(`
        SELECT b.*, e.nom, e.prenom, e.email1 
        FROM base_surveillance b
        JOIN enseignants e ON b.code_enseignant = e.code_enseignant
        WHERE b.date_exam = ? AND b.horaire = ? AND b.salle = ? AND b.module = ? AND b.ordre = 1
        LIMIT 1
      `, [date_exam, horaire, salle, module]);

      if (principaux.length === 0) {
        console.log(`Aucun professeur principal trouvé pour ${module} (${salle} ${horaire})`);
        continue;
      }

      const professeurPrincipal = principaux[0];

      const [sec] = await pool.query(`
        SELECT b.code_enseignant, e.nom, e.prenom, e.email1, b.ordre
        FROM base_surveillance b
        JOIN enseignants e ON b.code_enseignant = e.code_enseignant
        WHERE b.date_exam = ? AND b.horaire = ? AND b.salle = ? AND b.module = ? AND b.ordre != 1
        ORDER BY b.ordre
      `, [date_exam, horaire, salle, module]);

      const tousEnseignants = [professeurPrincipal, ...sec];

      const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Détails de Surveillance</title>
    <style>
        @page { 
            size: A4; 
            margin: 1cm; 
        }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            padding: 20px;
        }
        .print-header { 
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #4361ee;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 20px;
        }
        
        .header-text {
            flex: 1;
        }
        .print-title {
            color: #2c3e50;
            margin-bottom: 5px;
            font-size: 1.5em;
        }
        .print-subtitle {
            color: #7f8c8d;
            font-weight: normal;
            margin-top: 0;
            font-size: 1.1em;
        }
        .print-section { 
            margin-bottom: 25px;
            page-break-inside: avoid;
        }
        .section-title {
            color: #4361ee;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .info-item {
            margin-bottom: 10px;
        }
        .info-label {
            font-weight: bold;
            color: #7f8c8d;
            font-size: 0.9em;
        }
        .proctors-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        .proctor-card {
            border: 1px solid #eee;
            border-radius: 5px;
            padding: 12px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .proctor-card.principal {
            border-left: 3px solid #4361ee;
            background-color: #f8f9fe;
        }
        .proctor-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background-color: #e3e9fd;
            color: #4361ee;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            flex-shrink: 0;
        }
        .proctor-info {
            flex-grow: 1;
        }
        .proctor-name {
            font-weight: 500;
            margin-bottom: 2px;
        }
        .proctor-role {
            font-size: 0.85em;
            color: #7f8c8d;
        }
        .optional-section {
            background-color: #f9f9f9;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 20px;
        }
        .print-footer {
            margin-top: 30px;
            font-size: 0.8em;
            color: #7f8c8d;
            text-align: right;
            border-top: 1px solid #eee;
            padding-top: 10px;
        }
        @media print {
            body { padding: 0; }
        }
    </style>
</head>
<body>
    <div class="print-header">
        <div class="header-text">
            <h1 class="print-title">Université de science et de technologie Houari Boumediene</h1>
            <p class="print-subtitle">Faculté d'informatique</p>
            <p class="print-subtitle">Détails de Surveillance - Examen du <span id="print-exam-date">${new Date(date_exam).toLocaleDateString('fr-FR')}</span></p>
        </div>
    </div>
    
    <div class="print-section">
        <h2 class="section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Informations de l'examen
        </h2>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Date</div>
                <div id="exam-date">${new Date(date_exam).toLocaleDateString('fr-FR')}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Heure</div>
                <div id="exam-time">${horaire}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Salle</div>
                <div id="exam-room">${salle}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Module</div>
                <div id="exam-module">${module}</div>
            </div>
        </div>
    </div>
    
    <div class="print-section">
        <h2 class="section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Équipe de surveillance
        </h2>
        <div class="proctors-grid">
            ${tousEnseignants.map((enseignant, index) => `
                <div class="proctor-card ${index === 0 ? 'principal' : ''}">
                    <div class="proctor-avatar">${enseignant.nom.charAt(0)}${enseignant.prenom.charAt(0)}</div>
                    <div class="proctor-info">
                        <div class="proctor-name">${enseignant.nom} ${enseignant.prenom}</div>
                        <div class="proctor-role">
                          ${index === 0 
                            ? 'Professeur Principal' 
                            : `email: ${enseignant.email1}`} 
                          (Ordre: ${enseignant.ordre})
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
    
    <div class="print-footer">
        Généré le <span id="print-date">${new Date().toLocaleDateString()}</span> à <span id="print-time">${new Date().toLocaleTimeString()}</span>
    </div>
</body>
</html>
`;


      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: "networkidle0" });

      const dateExamString = new Date(date_exam).toISOString().split('T')[0]; // "YYYY-MM-DD"
      const pdfPath = path.join(
        process.cwd(),
        "files",
        `PV_${module}_${dateExamString.replace(/-/g, '')}_${horaire.replace(/:/g, '')}.pdf`
      );

      await page.pdf({
        path: pdfPath,
        format: "A4",
        printBackground: true,
        margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
      });
      await page.close();

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER || "departement.informatique.usthb@gmail.com",
          pass: process.env.EMAIL_PASS || "pcvt nomo ocsf cows",
        },
      });

      try {
        await transporter.sendMail({
          from: '"Administration des Examens" <departement.informatique.usthb@gmail.com>',
          to: professeurPrincipal.email1,
          subject: `Procès-Verbal - Module ${module}`,
          html: `
            <p>Cher professeur ${professeurPrincipal.nom} ${professeurPrincipal.prenom},</p>
            <p>Voici le procès-verbal pour :</p>
            <ul>
              <li><strong>Module :</strong> ${module}</li>
              <li><strong>Salle :</strong> ${salle}</li>
              <li><strong>Date :</strong> ${new Date(date_exam).toLocaleDateString('fr-FR')}</li>
              <li><strong>Horaire :</strong> ${horaire}</li>
            </ul>
            <p>Cordialement,<br>Administration des Examens</p>
          `,
          attachments: [{
            filename: `PV_${module}_${dateExamString}.pdf`,
            path: pdfPath,
            contentType: 'application/pdf'
          }],
        });

        console.log(`Email envoyé à ${professeurPrincipal.email1}`);
        fs.unlinkSync(pdfPath);

      } catch (emailError) {
        console.error(`Erreur lors de l'envoi de l'email:`, emailError);
      }
    }

    await browser.close();
    res.json({ success: true, message: "Tous les PV ont été envoyés." });

  } catch (error) {
    console.error("Erreur serveur:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});


//email poue un seul enseignant

app.post("/envoyer-mail-enseignant", async (req, res) => {
  try {
    const { code_enseignant } = req.body;

    if (!code_enseignant) {
      return res.status(400).json({ success: false, message: "Code enseignant requis." });
    }

    const filesDir = path.join(process.cwd(), "files");
    if (!fs.existsSync(filesDir)) {
      fs.mkdirSync(filesDir, { recursive: true });
    }

    const [examens] = await pool.query(
      `SELECT palier, specialite, section, module, date_exam, horaire, salle, semestre
       FROM base_surveillance
       WHERE code_enseignant = ?`,
      [code_enseignant]
    );

    if (examens.length === 0) {
      return res.status(404).json({ success: false, message: "Aucun examen trouvé pour cet enseignant." });
    }

    const [enseignant] = await pool.query(
      `SELECT email1, nom, prenom, grade, departement FROM enseignants WHERE code_enseignant = ?`,
      [code_enseignant]
    );

    if (enseignant.length === 0 || !enseignant[0].email1) {
      return res.status(404).json({ success: false, message: "Enseignant introuvable ou email manquant." });
    }

    const email = enseignant[0].email1;
    const nomComplet = `${enseignant[0].prenom} ${enseignant[0].nom}`;
    const grade = enseignant[0].grade;
    const departement = enseignant[0].departement;

    const now = new Date();
    const printDate = now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const surveillances = examens.map(exam => ({
      module: exam.module,
      palier: exam.palier,
      specialite: exam.specialite,
      section: exam.section,
      date_exam: exam.date_exam,
      horaire: exam.horaire,
      salle: exam.salle,
      semestre: exam.semestre
    }));

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    const logoPath = path.resolve("logo.png");

    const htmlContent = `
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Détail de vos surveillances d'examens</title>
        <style>
          @page { size: A4; margin: 1cm; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            padding: 20px;
          }
          .print-header { 
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #4361ee;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 20px;
          }
          .header-text {
            flex: 1;
          }
          .print-title {
            color: #2c3e50;
            margin-bottom: 5px;
            font-size: 1.5em;
          }
          .print-subtitle {
            color: #7f8c8d;
            font-weight: normal;
            margin-top: 0;
            font-size: 1.1em;
          }
          .print-section { 
            margin-bottom: 25px;
            page-break-inside: avoid;
          }
          .section-title {
            color: #4361ee;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
            margin-bottom: 15px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
          }
          .info-item {
            margin-bottom: 10px;
          }
          .info-label {
            font-weight: bold;
            color: #7f8c8d;
            font-size: 0.9em;
          }
          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 0.9em;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
          }
          .print-table th {
            background-color: #4361ee;
            color: white;
            text-align: left;
            padding: 10px 12px;
          }
          .print-table td {
            padding: 8px 12px;
            border-bottom: 1px solid #ddd;
          }
          .print-table tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .print-footer {
            margin-top: 30px;
            font-size: 0.8em;
            color: #7f8c8d;
            text-align: right;
            border-top: 1px solid #eee;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <div class="header-text">
            <h1 class="print-title">Université de science et de technologie Houari Boumediene</h1>
            <p class="print-subtitle">Faculté d'informatique</p>
          </div>
        </div>

        <div class="print-section">
          <h2 class="section-title">Informations de Base</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Nom complet</div>
              <div>${nomComplet}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Grade</div>
              <div>${grade}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Département</div>
              <div>${departement}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Total surveillances</div>
              <div>${surveillances.length}</div>
            </div>
          </div>
        </div>

        <div class="print-section">
          <h2 class="section-title">Surveillances Assignées</h2>
          ${surveillances.length > 0 ? `
          <table class="print-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Horaire</th>
                <th>Module</th>
                <th>Salle</th>
                <th>Spécialité</th>
              </tr>
            </thead>
            <tbody>
              ${surveillances.map(surv => `
                <tr>
                  <td>${formatDate(surv.date_exam)}</td>
                  <td>${surv.horaire}</td>
                  <td>${surv.module}</td>
                  <td>${surv.salle}</td>
                  <td>${surv.specialite}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ` : '<p>Aucune surveillance enregistrée</p>'}
        </div>

        <div class="print-footer">
          <p>Document généré le ${printDate}</p>
        </div>
      </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfPath = path.join(filesDir, `${code_enseignant}_examens.pdf`);
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      margin: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      },
      printBackground: true
    });
    await page.close();
    await browser.close();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "departement.informatique.usthb@gmail.com",
        pass: "pcvt nomo ocsf cows",
      },
    });

    await transporter.sendMail({
      from: '"Administration des examens" <hamrounsamiabdelmalek@gmail.com>',
      to: email,
      subject: "Vos examens à surveiller",
      text: "Veuillez trouver ci-joint vos examens à surveiller.",
      html: "<p>Veuillez trouver ci-joint le PDF contenant vos examens à surveiller.</p>",
      attachments: [
        {
          filename: `Surveillances_${nomComplet.replace(/\s+/g, '_')}.pdf`,
          path: pdfPath,
        },
      ],
    });

    console.log(`Email envoyé à ${email}`);
    fs.unlinkSync(pdfPath);

    res.json({ success: true, message: "Email envoyé avec succès." });
  } catch (error) {
    console.error("Erreur serveur :", error);
    res.status(500).json({ success: false, message: "Erreur serveur lors de l'envoi de l'email." });
  }
});





app.post('/inserer-surveillance', async (req, res) => {
  const {
    palier, specialite, semestre, section,
    date_exam, horaire, module, salle, code_enseignant
  } = req.body;

  // Vérification des champs
  if (!palier || !specialite || !semestre || !section || !date_exam || !horaire || !module || !salle || !code_enseignant) {
    return res.status(400).json({ success: false, message: "Tous les champs sont requis." });
  }

  try {
    // Vérifier si l'enseignant existe
    const [enseignant] = await pool.query(
      "SELECT * FROM enseignants WHERE code_enseignant = ?",
      [code_enseignant]
    );

    if (enseignant.length === 0) {
      return res.status(404).json({ success: false, message: "Enseignant non trouvé." });
    }

    // Calculer l'ordre (nombre de surveillances existantes pour cette date, heure et salle + 1)
    const [surveillancesExistantes] = await pool.query(
      "SELECT COUNT(*) as count FROM base_surveillance WHERE date_exam = ? AND horaire = ? AND salle = ?",
      [date_exam, horaire, salle]
    );
    
    const ordre = surveillancesExistantes[0].count + 1;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // janvier = 0 donc +1

    const annee_universitaire = month >= 9 
        ? `${year}-${year + 1}` 
        : `${year - 1}-${year}`;

    // Insérer dans base_surveillance
    await pool.query(
      `INSERT INTO base_surveillance (palier, specialite, semestre, section, date_exam, horaire, module, salle, code_enseignant, annee_universitaire, ordre)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [palier, specialite, semestre, section, date_exam, horaire, module, salle, code_enseignant, annee_universitaire, ordre]
    );
    
    res.json({ success: true, message: "Surveillance insérée avec succès." });

  } catch (error) {
    console.error("Erreur insertion :", error);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

app.get('/enseignants', async (req, res) => {
  try {
    const [enseignants] = await pool.query("SELECT * FROM enseignants");
    res.json(enseignants);
  } catch (error) {
    console.error("Erreur récupération enseignants:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});


app.get('/update-surveillances', async (req, res) => {
  try {
    // 1. Récupérer tous les enseignants
    const [enseignants] = await pool.query("SELECT code_enseignant FROM enseignants");
    
    // 2. Pour chaque enseignant, compter les surveillances
    for (const enseignant of enseignants) {
      const [result] = await pool.query(
        "SELECT COUNT(*) as count FROM base_surveillance WHERE code_enseignant = ?",
        [enseignant.code_enseignant]
      );
      
      const nbrSS = result[0].count;
      
      // 3. Mettre à jour le compteur dans la table enseignants
      console.log("before insert");
      await pool.query(
        "UPDATE enseignants SET nbrSS = ? WHERE code_enseignant = ?",
        [nbrSS, enseignant.code_enseignant]
      );
    }
    
    res.json({ success: true, message: "Compteurs de surveillance mis à jour" });
  } catch (error) {
    console.error("Erreur mise à jour surveillances:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// Nouvelle route pour récupérer les surveillances d'un enseignant
app.get('/surveillances-enseignant/:id', async (req, res) => {
  try {
    const [surveillances] = await pool.query(`
      SELECT * FROM base_surveillance 
      WHERE code_enseignant = ?
      ORDER BY date_exam DESC
    `, [req.params.id]);

    res.json(surveillances);
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route pour supprimer une surveillance
app.delete('/surveillances/:id', async (req, res) => {
  try {
    // 1. Vérifier si la surveillance existe
    const [surveillance] = await pool.query(
      'SELECT * FROM base_surveillance WHERE id = ?',
      [req.params.id]
    );

    if (surveillance.length === 0) {
      return res.status(404).json({ success: false, message: "Surveillance non trouvée" });
    }

    // 2. Supprimer la surveillance
    await pool.query(
      'DELETE FROM base_surveillance WHERE id = ?',
      [req.params.id]
    );

    // 3. Mettre à jour le compteur nbrSS de l'enseignant
    await pool.query(
      'UPDATE enseignants SET nbrSS = nbrSS - 1 WHERE code_enseignant = ?',
      [surveillance[0].code_enseignant]
    );

    res.json({ 
      success: true,
      message: "Surveillance supprimée avec succès"
    });

  } catch (error) {
    console.error("Erreur suppression surveillance:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
});

app.get('/surveillances/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM base_surveillance WHERE id = ?', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Surveillance non trouvée' });
    }

    res.json(rows[0]); // ✅ important : retourne bien un objet JSON
  } catch (error) {
    console.error("Erreur GET :", error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


// Route pour modifier une surveillance
app.put('/surveillances/:id', async (req, res) => {
  try {
    const { date_exam, horaire, module, salle, specialite } = req.body;

    // Validation des données
    if (!date_exam || !horaire || !module || !salle || !specialite ) {
      return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    // 1. Vérifier que la surveillance existe
    const [existing] = await pool.query(
      'SELECT * FROM base_surveillance WHERE id = ?',
      [req.params.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: "Surveillance non trouvée" });
    }

    // 2. Mettre à jour la surveillance
    await pool.query(
      `UPDATE base_surveillance 
       SET date_exam = ?, horaire = ?, module = ?, salle = ?, specialite = ?
       WHERE id = ?`,
      [date_exam, horaire, module, salle, specialite, req.params.id]
    );


    res.json({ success: true, message: "Surveillance mise à jour" });
  } catch (error) {
    console.error("Erreur modification:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});




app.get('/surveillance', async (req, res) => {
  try {
    const [surveillance] = await pool.query("SELECT * FROM base_surveillance ORDER BY date_exam ASC, horaire ASC");
    res.json(surveillance);
  } catch (error) {
    console.error("Erreur récupération des surveillances:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});


// Exam stats endpoint
app.get('/exam-stats', async (req, res) => {
  try {
      console.log('Fetching exam stats...');
      const [totalRows] = await pool.query('SELECT COUNT(*) as total FROM exam');
      const [changeRows] = await pool.query(`
          SELECT COUNT(*) as change_count FROM exam 
          WHERE date_exam >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      `);
      
      res.json({
          success: true,
          total: totalRows[0].total,
          weeklyChange: changeRows[0].change_count
      });
  } catch (error) {
      console.error('Exam stats error:', error);
      res.status(500).json({ 
          success: false,
          error: error.message
      });
  }
});

// Surveillance stats endpoint
app.get('/surveillance-stats', async (req, res) => {
  try {
      console.log('Fetching surveillance stats...');
      const [totalRows] = await pool.query('SELECT COUNT(*) as total FROM base_surveillance');
      const [changeRows] = await pool.query(`
          SELECT COUNT(*) as change_count FROM base_surveillance 
          WHERE date_exam >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
      `);
      
      res.json({
          success: true,
          total: totalRows[0].total,
          dailyChange: changeRows[0].change_count
      });
  } catch (error) {
      console.error('Surveillance stats error:', error);
      res.status(500).json({ 
          success: false,
          error: error.message
      });
  }
});


app.post('/export-examens', async (req, res) => {
  try {
    // Copier les examens de exam_temp vers exam
    await pool.query(`
      INSERT INTO exam (palier, specialite, section, module, date_exam, horaire, salle, semestre, annee_universitaire)
      SELECT palier, specialite, section, module, date_exam, horaire, salle, semestre, annee_universitaire FROM exam_temp
    `);
    // Vider exam_temp
    await pool.query('DELETE FROM exam_temp');
    res.json({ success: true, message: "Exportation réussie." });
  } catch (error) {
    console.error("Erreur export examens:", error);
    res.status(500).json({ success: false, message: "Erreur lors de l'exportation." });
  }
});



const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} est déjà utilisé.`);
        const server = app.listen(0, () => {
          console.log(`Serveur démarré sur http://localhost:${server.address().port}`);
        });
    } else {
        console.error('Erreur du serveur:', err);
    }
});