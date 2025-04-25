import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
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
  password: "root",
  database: "try",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

app.post("/gestion-surveillances", async (req, res) => {
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
        message: "L'assignation pour ce semestre a déjà été effectuée.",
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
            message: "Aucun enseignant trouvé pour ce module",
          });
          continue;
        }

        const salles = examen.salle.split("+").filter((s) => s.trim() !== ""); // Diviser les salles  sont séparées par '+'
        const nbrSE = salles.length * 2; // 2 surveillants  par salle

        await pool.query(
          `INSERT INTO base_surveillance 
                     (palier, specialite, semestre, section, date_exam, horaire, 
                      module, salle, code_enseignant, ordre, nbrSE, nbrSS, annee_universitaire)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 0, ?)`,
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
      "SELECT salle FROM exam WHERE semestre = ? AND annee_universitaire = ?",
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
                              code_enseignant, ordre, nbrSE, nbrSS, annee_universitaire)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    const [examens] = await pool.query("SELECT * FROM exam_temp");
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
      // Créer le dossier files s'il n'existe pas
      const filesDir = path.join(process.cwd(), "files");
      if (!fs.existsSync(filesDir)) {
          fs.mkdirSync(filesDir, { recursive: true });
      }

      // Créer le dossier assets s'il n'existe pas
      const assetsDir = path.join(process.cwd(), "assets");
      if (!fs.existsSync(assetsDir)) {
          fs.mkdirSync(assetsDir, { recursive: true });
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

      for (const { code_enseignant } of base_surveillance) {
          const [examens] = await pool.query(
              `SELECT palier, specialite, section, module, date_exam, horaire, salle, semestre
               FROM base_surveillance
               WHERE code_enseignant = ?`,
              [code_enseignant]
          );

          if (examens.length === 0) continue;

          const [enseignant] = await pool.query(
              `SELECT email1 FROM enseignants WHERE code_enseignant = ?`,
              [code_enseignant]
          );

          if (enseignant.length === 0 || !enseignant[0].email1) continue;

          const email = enseignant[0].email1;

          // Chemin absolu vers le logo
          const logoPath = path.join(assetsDir, "logo.png");
          
          // Vérifier si le logo existe, sinon utiliser un placeholder
          let logoImage;
          if (fs.existsSync(logoPath)) {
              logoImage = new ImageRun({
                  data: fs.readFileSync(logoPath),
                  transformation: {
                      width: 100,
                      height: 100
                  },
                  floating: {
                      horizontalPosition: {
                          relative: HorizontalPositionRelativeFrom.PAGE,
                          offset: 400000
                      }
                  }
              });
          }

          const doc = new Document({
              creator: "Système de Gestion des Examens",
              title: "Convocation de Surveillance",
              description: "Détail des examens à surveiller",
              styles: {
                  paragraphStyles: [
                      {
                          id: "headerStyle",
                          name: "En-tête",
                          run: {
                              size: 28,
                              bold: true,
                              color: "2d609b",
                              font: "Arial"
                          },
                          paragraph: {
                              spacing: { after: 200 },
                              alignment: AlignmentType.CENTER
                          }
                      },
                      {
                          id: "subheaderStyle",
                          name: "Sous-titre",
                          run: {
                              size: 22,
                              bold: true,
                              color: "444444",
                              font: "Arial"
                          },
                          paragraph: {
                              spacing: { after: 150 },
                              alignment: AlignmentType.CENTER
                          }
                      },
                      {
                          id: "tableHeader",
                          name: "En-tête tableau",
                          run: {
                              size: 12,
                              bold: true,
                              color: "FFFFFF",
                              font: "Arial"
                          }
                      },
                      {
                          id: "tableCell",
                          name: "Cellule tableau",
                          run: {
                              size: 11,
                              font: "Arial"
                          }
                      }
                  ]
              },
              sections: [{
                  properties: {
                      page: {
                          margin: {
                              top: 1000,
                              right: 1000,
                              bottom: 1000,
                              left: 1000
                          }
                      }
                  },
                  children: [
                      // En-tête avec logo et titre
                      new Paragraph({
                          children: [
                              ...(logoImage ? [logoImage] : []),
                              new TextRun({
                                  text: "Université des Sciences et Technologies",
                                  style: "headerStyle"
                              })
                          ],
                          alignment: AlignmentType.CENTER
                      }),

                      // Sous-titre
                      new Paragraph({
                          text: "Détail de vos surveillances d'examens",
                          style: "subheaderStyle"
                      }),

                      // Date de génération
                      new Paragraph({
                          text: `Généré le ${new Date().toLocaleDateString('fr-FR')}`,
                          alignment: AlignmentType.RIGHT,
                          spacing: { after: 300 }
                      }),

                      // Tableau des examens
                      new Table({
                          width: {
                              size: 100,
                              type: WidthType.PERCENTAGE
                          },
                          borders: {
                              top: { style: BorderStyle.SINGLE, size: 4, color: "2d609b" },
                              bottom: { style: BorderStyle.SINGLE, size: 4, color: "2d609b" },
                              left: { style: BorderStyle.SINGLE, size: 4, color: "2d609b" },
                              right: { style: BorderStyle.SINGLE, size: 4, color: "2d609b" },
                              insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "DDDDDD" },
                              insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "DDDDDD" }
                          },
                          rows: [
                              // En-tête du tableau
                              new TableRow({
                                  height: { value: 500, rule: HeightRule.EXACT },
                                  tableHeader: true,
                                  children: [
                                      "Module", "Niveau", "Spécialité", "Groupe", 
                                      "Date", "Horaire", "Salle", "Session"
                                  ].map(text => new TableCell({
                                      shading: { fill: "2d609b" },
                                      verticalAlign: VerticalAlign.CENTER,
                                      children: [new Paragraph({
                                          text,
                                          style: "tableHeader",
                                          alignment: AlignmentType.CENTER
                                      })]
                                  }))
                              }),
                              
                              // Lignes des examens
                              ...examens.map(exam => new TableRow({
                                  children: [
                                      exam.module,
                                      exam.palier,
                                      exam.specialite,
                                      exam.section,
                                      new Date(exam.date_exam).toLocaleDateString('fr-FR'),
                                      exam.horaire,
                                      exam.salle,
                                      exam.semestre
                                  ].map((text, index) => new TableCell({
                                      verticalAlign: VerticalAlign.CENTER,
                                      shading: index % 2 ? { fill: "f8f8f8" } : undefined,
                                      children: [new Paragraph({
                                          text: String(text),
                                          style: "tableCell",
                                          alignment: index === 0 ? AlignmentType.LEFT : AlignmentType.CENTER
                                      })]
                                  }))
                              }))
                          ]
                      }),

                      // Pied de page
                      new Paragraph({
                          text: "Merci pour votre collaboration",
                          alignment: AlignmentType.CENTER,
                          spacing: { before: 400 },
                          style: "subheaderStyle"
                      }),
                      
                      new Paragraph({
                          text: "Service des Examens - Département Informatique",
                          alignment: AlignmentType.CENTER,
                          spacing: { before: 100 }
                      })
                  ]
              }]
          });

      console.log("after docx");

      const filePath = path.join(filesDir, `${code_enseignant}_examens.docx`);

      try {
        const buffer = await Packer.toBuffer(doc);
        fs.writeFileSync(filePath, buffer);
      } catch (fileError) {
        console.error(`Erreur lors de la génération du fichier :`, fileError);
        continue;
      }

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
          attachments: [
            {
              filename: `${code_enseignant}_examens.docx`,
              path: filePath,
            },
          ],
        });

        console.log(`Email envoyé à ${email}`);
      } catch (emailError) {
        console.error(`Erreur lors de l'envoi de l'email :`, emailError);
      }
    }

    res.json({ success: true, message: "Emails envoyés avec succès." });
  } catch (error) {
    console.error("Erreur serveur :", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de l'envoi des emails.",
    });
  }
});
//PVs (Procès-Verbaux)
app.post("/envoyer-pv", async (req, res) => {
  try {
    const [examens] = await pool.query(`
        SELECT DISTINCT date_exam, horaire, salle, module FROM base_surveillance
      `);

    if (examens.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Aucun examen trouvé dans la base de données.",
      });
    }

    for (const examen of examens) {
      const { date_exam, horaire, salle, module } = examen;

      const [enseignants] = await pool.query(
        `
          SELECT b.*, e.nom, e.prenom, e.email1 
          FROM base_surveillance b
          JOIN enseignants e ON b.code_enseignant = e.code_enseignant
          WHERE b.date_exam = ? AND b.horaire = ? AND b.salle = ? AND b.module = ?
          ORDER BY b.ordre ASC
          `,
        [date_exam, horaire, salle, module]
      );

      if (enseignants.length === 0) {
        console.log(
          `Aucun enseignant trouvé pour l'examen : ${module}, salle : ${salle}, horaire : ${horaire}`
        );
        continue;
      }
      const professeurPrincipal = enseignants.find(
        (enseignant) => enseignant.ordre === 0
      );
      if (!professeurPrincipal) {
        console.log(
          `Aucun professeur principal trouvé pour l'examen : ${module}, salle : ${salle}, horaire : ${horaire}`
        );
        continue;
      }

      const emailProfesseurPrincipal = professeurPrincipal.email1;
      console.log("before creat file");
      if (!fs.existsSync("files")) {
        fs.mkdirSync("files");
      }

      console.log("after creat file");
      const doc = new Document({
        creator: "Administration des Examens",
        title: "Procès-Verbal de Surveillance",
        description: "Liste des enseignants pour l'examen",
        sections: [
          {
            children: [
              new Paragraph({
                text: "Procès-Verbal de Surveillance",
                heading: "Heading1",
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({
                text: `Examen : ${module}`,
                alignment: AlignmentType.LEFT,
              }),
              new Paragraph({
                text: `Salle : ${salle}, Horaire : ${horaire}, Date : ${date_exam}`,
                alignment: AlignmentType.LEFT,
              }),
              new Paragraph({ text: "\n" }), // Blank line for spacing
              new Table({
                rows: [
                  // Table Header
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph("Nom & Prénom")],
                      }),
                      new TableCell({ children: [new Paragraph("Email")] }),
                      new TableCell({ children: [new Paragraph("Palier")] }),
                      new TableCell({
                        children: [new Paragraph("Spécialité")],
                      }),
                      new TableCell({ children: [new Paragraph("Section")] }),
                      new TableCell({ children: [new Paragraph("Ordre")] }),
                    ],
                  }),

                  ...enseignants.map(
                    (enseignant) =>
                      new TableRow({
                        children: [
                          new TableCell({
                            children: [
                              new Paragraph(
                                `${enseignant.nom} ${enseignant.prenom}`
                              ),
                            ],
                          }),
                          new TableCell({
                            children: [new Paragraph(enseignant.email1)],
                          }),
                          new TableCell({
                            children: [new Paragraph(enseignant.palier)],
                          }),
                          new TableCell({
                            children: [new Paragraph(enseignant.specialite)],
                          }),
                          new TableCell({
                            children: [new Paragraph(enseignant.section)],
                          }),
                          new TableCell({
                            children: [new Paragraph(String(enseignant.ordre))],
                          }),
                        ],
                      })
                  ),
                ],
              }),
            ],
          },
        ],
      });

      const filePath = `files/PV_${module}_${date_exam}_${horaire}.docx`;
      try {
        const buffer = await Packer.toBuffer(doc);
        fs.writeFileSync(filePath, buffer);
        console.log(
          `PV généré pour le module ${module}, salle ${salle}, date ${date_exam}.`
        );
      } catch (fileError) {
        console.error(`Erreur lors de la génération du fichier :`, fileError);
        continue;
      }

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "departement.informatique.usthb@gmail.com",
          pass: "infoUSTHB",
        },
      });

      try {
        await transporter.sendMail({
          from: '"Administration des Examens" <departement.informatique.usthb@gmail.com>',
          to: emailProfesseurPrincipal,
          subject: `Procès-Verbal de Surveillance - Module ${module}`,
          text: `Cher professeur ${professeurPrincipal.nom} ${professeurPrincipal.prenom},\n\nVeuillez trouver ci-joint le procès-verbal de surveillance pour l'examen suivant :\n\nModule : ${module}\nSalle : ${salle}\nHoraire : ${horaire}\nDate : ${date_exam}\n\nCordialement,\nAdministration des Examens`,
          attachments: [
            {
              filename: `PV_${module}_${date_exam}.docx`,
              path: filePath,
            },
          ],
        });
        console.log(`E-mail envoyé avec succès à ${emailProfesseurPrincipal}.`);
      } catch (emailError) {
        console.error(`Erreur lors de l'envoi de l'e-mail :`, emailError);
      }
    }

    res.json({ success: true, message: "Procès-verbaux envoyés avec succès." });
  } catch (error) {
    console.error("Erreur serveur :", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de l'envoi des procès-verbaux.",
    });
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


// Démarrer le serveur
// app.listen(3000, () => {
//   console.log("Serveur démarré sur http://localhost:3000");
//   console.log("Route principale: POST /assigner-surveillants-principaux");
// });



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