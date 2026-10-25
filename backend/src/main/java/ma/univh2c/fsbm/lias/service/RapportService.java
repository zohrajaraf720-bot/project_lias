package ma.univh2c.fsbm.lias.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.itextpdf.io.image.ImageData;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.events.Event;
import com.itextpdf.kernel.events.IEventHandler;
import com.itextpdf.kernel.events.PdfDocumentEvent;
import com.itextpdf.kernel.geom.Rectangle;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfPage;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.PdfCanvas;
import com.itextpdf.layout.Canvas;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.element.Text;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.VerticalAlignment;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.univh2c.fsbm.lias.dto.RapportActiviteDTO;
import ma.univh2c.fsbm.lias.dto.RapportGenererRequest;
import ma.univh2c.fsbm.lias.entity.*;
import ma.univh2c.fsbm.lias.enums.*;
import ma.univh2c.fsbm.lias.exception.RessourceIntrouvableException;
import ma.univh2c.fsbm.lias.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.FileOutputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RapportService {

    private final RapportActiviteRepository rapportRepository;
    private final PublicationRepository publicationRepository;
    private final EvenementScientifiqueRepository evenementRepository;
    private final ActiviteRepository activiteRepository;
    private final MembreRepository membreRepository;
    private final EquipeRepository equipeRepository;
    private final ConventionRepository conventionRepository;
    private final MaterielRepository materielRepository;
    private final ReunionRepository reunionRepository;
    private final DemandeAdhesionRepository adhesionRepository;
    private final DemandeChangementEquipeRepository changementRepository;
    private final MandatRepository mandatRepository;
    private final LaboratoireRepository laboratoireRepository;
    private final AffectationRoleRepository affectationRoleRepository;
    private final NotificationService notificationService;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Value("${lias.upload.dir:uploads/}")
    private String uploadDir;

    // =========================================================================
    // TRADUCTIONS ET CONVERSIONS EN CLAIR DES ÉNUMÉRATIONS (HUMAN-READABLE)
    // =========================================================================

    public static String formaterStatutMembre(StatutMembre statut) {
        if (statut == null) return "Membre du Laboratoire";
        return switch (statut) {
            case PERMANENT -> "Enseignant-Chercheur Permanent";
            case DOCTORANT -> "Doctorant-Chercheur";
            case ASSOCIE -> "Chercheur Associé";
        };
    }

    public static String formaterRoleEquipe(Membre m, Equipe eq, Optional<Mandat> mandatChef) {
        if (mandatChef.isPresent() && mandatChef.get().getMembre() != null && mandatChef.get().getMembre().getId().equals(m.getId())) {
            return "Chef d'Équipe";
        }
        if (m.getStatut() == StatutMembre.DOCTORANT) {
            return "Doctorant-Chercheur";
        }
        if (m.getStatut() == StatutMembre.ASSOCIE) {
            return "Chercheur Associé";
        }
        return "Membre Titulaire";
    }

    public static String formaterTypePublication(TypePublication type) {
        if (type == null) return "Publication Scientifique";
        return switch (type) {
            case ARTICLE_JOURNAL -> "Article de Revue Internationale";
            case CONFERENCE_INTERNATIONALE -> "Conférence Internationale avec Actes";
            case CONFERENCE_NATIONALE -> "Conférence Nationale";
            case LIVRE -> "Ouvrage / Manuel Scientifique";
            case CHAPITRE_LIVRE -> "Chapitre d'Ouvrage";
            case BREVET -> "Brevet d'Invention";
            case THESE -> "Thèse de Doctorat";
            case AUTRE -> "Autre Contribution Scientifique";
        };
    }

    public static String formaterTypeEvenement(TypeEvenement type) {
        if (type == null) return "Manifestation Scientifique";
        return switch (type) {
            case CONFERENCE -> "Conférence Internationale";
            case SEMINAIRE -> "Séminaire de Recherche";
            case WORKSHOP -> "Atelier Thématique / Workshop";
        };
    }

    public static String formaterStatutEvenement(StatutEvenement statut) {
        if (statut == null) return "En préparation";
        return switch (statut) {
            case EN_PREPARATION -> "En cours de préparation";
            case TERMINE -> "Clôturé avec succès";
            case ARCHIVE -> "Archivé";
        };
    }

    public static String formaterStatutValidationEvenement(StatutValidationEvenement statut) {
        if (statut == null) return "En attente";
        return switch (statut) {
            case EN_ATTENTE_VALIDATION -> "En attente de validation par la Direction";
            case VALIDE -> "Officiellement validé par la Direction";
            case REJETE -> "Refusé par la Direction";
        };
    }

    public static String formaterStatutConvention(StatutConvention statut) {
        if (statut == null) return "En vigueur";
        return switch (statut) {
            case EN_COURS -> "En vigueur / Active";
            case TERMINEE -> "Échue / Clôturée";
            case SUSPENDUE -> "Suspendue temporairement";
        };
    }

    public static String formaterTypeInstitution(TypeInstitution type) {
        if (type == null) return "Partenaire Institutionnel";
        return switch (type) {
            case UNIVERSITE -> "Université / Établissement Académique";
            case ENTREPRISE -> "Entreprise / Secteur Industriel";
            case CENTRE_RECHERCHE -> "Centre ou Institut de Recherche";
            case AUTRE -> "Partenaire Scientifique";
        };
    }

    public static String formaterDate(LocalDate date) {
        if (date == null) return "Non renseignée";
        return date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
    }

    // =========================================================================
    // GÉNÉRATION & RÉGÉNÉRATION COMPLÈTE DU RAPPORT
    // =========================================================================

    @Transactional
    public RapportActiviteDTO genererBrouillon(RapportGenererRequest request) {
        int annee = request.getAnnee();

        Optional<RapportActivite> existantOpt = rapportRepository.findByAnnee(annee);

        // 1. Laboratoire & Gouvernance (Fiche d'Identité Détaillée)
        Laboratoire labo = laboratoireRepository.findAll().stream().findFirst().orElse(null);
        if (labo != null && (labo.getNom() == null || !labo.getNom().equals("Laboratoire d'Intelligence Artificielle et Systèmes"))) {
            labo.setNom("Laboratoire d'Intelligence Artificielle et Systèmes");
            labo.setAcronyme("LIAS");
            laboratoireRepository.save(labo);
        }
        String laboNom = (labo != null && labo.getNom() != null && !labo.getNom().isBlank()) ? labo.getNom() : "Laboratoire d'Intelligence Artificielle et Systèmes";
        String laboAcronyme = (labo != null && labo.getAcronyme() != null && !labo.getAcronyme().isBlank()) ? labo.getAcronyme() : "LIAS";
        String laboEtablissement = (labo != null && labo.getEtablissement() != null && !labo.getEtablissement().isBlank()) ? labo.getEtablissement() : "Faculté des Sciences Ben M'Sik (FSBM)";
        String laboUniversite = (labo != null && labo.getUniversite() != null && !labo.getUniversite().isBlank()) ? labo.getUniversite() : "Université Hassan II de Casablanca";
        String laboAdresse = (labo != null && labo.getAdresse() != null && !labo.getAdresse().isBlank()) ? labo.getAdresse() : "Avenue Cdt Driss El Harti, B.P 7955 Sidi Othmane, Casablanca, Maroc";
        String laboEmail = (labo != null && labo.getEmailContact() != null && !labo.getEmailContact().isBlank()) ? labo.getEmailContact() : "contact.lias@univh2c.ma";
        String laboTel = (labo != null && labo.getTelephone() != null && !labo.getTelephone().isBlank()) ? labo.getTelephone() : "+212 (0) 522 70 46 71";
        String laboSite = (labo != null && labo.getSiteWeb() != null && !labo.getSiteWeb().isBlank()) ? labo.getSiteWeb() : "https://lias.fsbm.univh2c.ma";
        String laboDesc = (labo != null && labo.getDescription() != null && !labo.getDescription().isBlank()) ? labo.getDescription() : "Pôle d'excellence en recherche scientifique pluridisciplinaire, ingénierie logicielle, intelligence artificielle, traitement du signal et modélisation des systèmes complexes.";
        String laboDateCreation = (labo != null && labo.getDateCreation() != null) ? labo.getDateCreation().toString() : "2016-09-15";

        // Directeur actuel
        Optional<Mandat> mandatDirecteur = mandatRepository.findByTypeMandatAndDateFinIsNull(TypeMandat.DIRECTEUR).stream().findFirst();
        String directeurNom = mandatDirecteur.map(m -> m.getMembre().getPrenom() + " " + m.getMembre().getNom()).orElse("Direction du Laboratoire");
        String directeurEmail = mandatDirecteur.map(m -> m.getMembre().getEmail()).orElse("direction.lias@univh2c.ma");
        String directeurDateDebut = mandatDirecteur.map(m -> m.getDateDebut() != null ? m.getDateDebut().toString() : "2020-01-01").orElse("2020-01-01");

        // 2. Équipes de recherche et Membres détaillés par équipe
        List<Equipe> toutesEquipes = equipeRepository.findByArchiveFalse();
        List<Map<String, Object>> equipesDetails = new ArrayList<>();

        for (Equipe eq : toutesEquipes) {
            Map<String, Object> eqMap = new HashMap<>();
            eqMap.put("id", eq.getId());
            eqMap.put("nom", eq.getNom());
            String acro = EquipeService.extraireAcronyme(eq.getNom());
            eqMap.put("acronyme", acro);
            eqMap.put("description", eq.getDescription() != null ? eq.getDescription() : "");
            eqMap.put("thematiques", eq.getThematiques() != null ? eq.getThematiques() : Collections.emptyList());

            // Chef d'équipe
            Optional<Mandat> mandatChef = mandatRepository.findByTypeMandatAndEquipeIdAndDateFinIsNull(TypeMandat.CHEF_EQUIPE, eq.getId());
            eqMap.put("chefNom", mandatChef.map(m -> m.getMembre().getPrenom() + " " + m.getMembre().getNom()).orElse("Non désigné"));
            eqMap.put("chefEmail", mandatChef.map(m -> m.getMembre().getEmail()).orElse(""));
            eqMap.put("chefDateDebut", mandatChef.map(m -> m.getDateDebut() != null ? m.getDateDebut().toString() : "").orElse(""));

            // 1. Tous les membres rattachés à cette équipe (relation Membre.equipeActuelle)
            List<Membre> membresDeCetteEquipe = membreRepository.findByEquipeActuelleId(eq.getId());

            // 2. Affectations de rôles explicites
            List<AffectationRole> affectations = affectationRoleRepository.findByEquipeIdAndDateFinIsNull(eq.getId());
            Map<Long, AffectationRole> affParMembre = new HashMap<>();
            for (AffectationRole a : affectations) {
                if (a.getMembre() != null) {
                    affParMembre.put(a.getMembre().getId(), a);
                }
            }

            // 3. Regroupement dédoublonné de tous les membres de l'équipe (chef en tête, puis membres)
            Map<Long, Membre> membresUniques = new LinkedHashMap<>();

            // Placer le chef d'équipe en premier s'il existe
            if (mandatChef.isPresent() && mandatChef.get().getMembre() != null) {
                Membre chef = mandatChef.get().getMembre();
                if (chef.getArchive() == null || !chef.getArchive()) {
                    membresUniques.put(chef.getId(), chef);
                }
            }

            // Ajouter les membres rattachés à l'équipe
            for (Membre m : membresDeCetteEquipe) {
                if (m != null && (m.getArchive() == null || !m.getArchive())) {
                    membresUniques.put(m.getId(), m);
                }
            }

            // Ajouter également les membres ayant une affectation active dans l'équipe
            for (AffectationRole aff : affectations) {
                if (aff.getMembre() != null && (aff.getMembre().getArchive() == null || !aff.getMembre().getArchive())) {
                    membresUniques.put(aff.getMembre().getId(), aff.getMembre());
                }
            }

            List<Map<String, Object>> membresEq = new ArrayList<>();
            for (Membre m : membresUniques.values()) {
                Map<String, Object> mMap = new HashMap<>();
                mMap.put("id", m.getId());
                mMap.put("nomComplet", m.getPrenom() + " " + m.getNom());
                mMap.put("prenom", m.getPrenom());
                mMap.put("nom", m.getNom());
                mMap.put("email", m.getEmail());
                mMap.put("statutCode", m.getStatut() != null ? m.getStatut().name() : "PERMANENT");
                mMap.put("statutLibelle", formaterStatutMembre(m.getStatut()));

                // Détermination du rôle
                boolean isChef = mandatChef.isPresent() && mandatChef.get().getMembre() != null
                        && mandatChef.get().getMembre().getId().equals(m.getId());
                if (isChef) {
                    mMap.put("roleEquipe", "Chef d'Équipe");
                } else if (affParMembre.containsKey(m.getId())) {
                    mMap.put("roleEquipe", formaterRoleEquipe(m, eq, mandatChef));
                } else {
                    if (m.getStatut() == StatutMembre.DOCTORANT) {
                        mMap.put("roleEquipe", "Doctorant-Chercheur");
                    } else if (m.getStatut() == StatutMembre.ASSOCIE) {
                        mMap.put("roleEquipe", "Chercheur Associé");
                    } else {
                        mMap.put("roleEquipe", "Membre Titulaire");
                    }
                }

                AffectationRole aff = affParMembre.get(m.getId());
                LocalDate dateAffil = (aff != null && aff.getDateDebut() != null)
                        ? aff.getDateDebut()
                        : (m.getDateAffiliation() != null ? m.getDateAffiliation() : m.getDateEmbauche());

                mMap.put("dateAffiliation", dateAffil != null ? dateAffil.toString() : "");
                mMap.put("dateAffiliationFormatee", dateAffil != null ? formaterDate(dateAffil) : "Depuis la fondation");
                mMap.put("etablissementOrigine", m.getEtablissementOrigine() != null ? m.getEtablissementOrigine() : laboEtablissement);
                mMap.put("biographie", m.getBiographie() != null ? m.getBiographie() : "");
                mMap.put("centresInteret", m.getCentresInteret() != null ? m.getCentresInteret() : Collections.emptyList());

                membresEq.add(mMap);
            }

            eqMap.put("nombreMembres", membresEq.size());
            eqMap.put("membres", membresEq);
            equipesDetails.add(eqMap);
        }

        // 3. Ressources Humaines Globales
        List<Membre> tousLesMembres = membreRepository.findAll();
        List<Membre> membresActifs = tousLesMembres.stream()
                .filter(m -> m.getEtatCompte() == EtatCompte.ACTIF)
                .collect(Collectors.toList());

        List<Membre> permanents = membresActifs.stream()
                .filter(m -> m.getStatut() == StatutMembre.PERMANENT)
                .collect(Collectors.toList());

        List<Membre> doctorants = membresActifs.stream()
                .filter(m -> m.getStatut() == StatutMembre.DOCTORANT)
                .collect(Collectors.toList());

        List<Membre> associes = membresActifs.stream()
                .filter(m -> m.getStatut() == StatutMembre.ASSOCIE)
                .collect(Collectors.toList());

        // 4. Production Scientifique (Publications de l'année)
        List<Publication> publicationsAnnee = publicationRepository.findAll().stream()
                .filter(p -> p.getAnnee() != null && p.getAnnee() == annee)
                .collect(Collectors.toList());

        List<Map<String, Object>> pubDetails = new ArrayList<>();
        for (Publication p : publicationsAnnee) {
            Map<String, Object> pMap = new HashMap<>();
            pMap.put("id", p.getId());
            pMap.put("titre", p.getTitre());
            pMap.put("typeCode", p.getType() != null ? p.getType().name() : "ARTICLE_JOURNAL");
            pMap.put("typeLibelle", formaterTypePublication(p.getType()));
            pMap.put("annee", p.getAnnee());
            pMap.put("doi", p.getLienDoi() != null ? p.getLienDoi() : "");
            pMap.put("resume", p.getResume() != null ? p.getResume() : "");
            pMap.put("equipeNom", p.getEquipe() != null ? p.getEquipe().getNom() : "Non rattachée");

            List<String> auteursList = new ArrayList<>();
            if (p.getAuteurs() != null) {
                p.getAuteurs().forEach(a -> auteursList.add(a.getPrenom() + " " + a.getNom()));
            }
            if (p.getCoAuteursExternes() != null) {
                auteursList.addAll(p.getCoAuteursExternes());
            }
            pMap.put("auteurs", auteursList);
            pubDetails.add(pMap);
        }

        // 5. Événements Scientifiques de l'année
        List<EvenementScientifique> evenementsAnnee = evenementRepository.findAll().stream()
                .filter(e -> e.getDateDebut() != null && e.getDateDebut().getYear() == annee)
                .collect(Collectors.toList());

        List<Map<String, Object>> evDetails = new ArrayList<>();
        for (EvenementScientifique ev : evenementsAnnee) {
            Map<String, Object> evMap = new HashMap<>();
            evMap.put("id", ev.getId());
            evMap.put("titre", ev.getTitre());
            evMap.put("typeCode", ev.getType() != null ? ev.getType().name() : "SEMINAIRE");
            evMap.put("typeLibelle", formaterTypeEvenement(ev.getType()));
            evMap.put("statutCode", ev.getStatut() != null ? ev.getStatut().name() : "EN_PREPARATION");
            evMap.put("statutLibelle", formaterStatutEvenement(ev.getStatut()));
            evMap.put("statutValidationCode", ev.getStatutValidation() != null ? ev.getStatutValidation().name() : "VALIDE");
            evMap.put("statutValidationLibelle", formaterStatutValidationEvenement(ev.getStatutValidation()));
            evMap.put("dateDebut", ev.getDateDebut() != null ? ev.getDateDebut().toString() : "");
            evMap.put("dateFin", ev.getDateFin() != null ? ev.getDateFin().toString() : "");
            evMap.put("lieu", ev.getLieu() != null ? ev.getLieu() : "FSBM Casablanca");
            evMap.put("description", ev.getDescription() != null ? ev.getDescription() : "");
            evDetails.add(evMap);
        }

        // 6. Conventions & Accords Bilatéraux actifs durant l'année
        List<Convention> conventions = conventionRepository.findAll().stream()
                .filter(c -> {
                    if (c.getDateSignature() != null && c.getDateSignature().getYear() == annee) return true;
                    if (c.getDateSignature() != null && c.getDateExpiration() != null) {
                        return c.getDateSignature().getYear() <= annee && c.getDateExpiration().getYear() >= annee;
                    }
                    return false;
                })
                .collect(Collectors.toList());

        List<Map<String, Object>> convDetails = new ArrayList<>();
        for (Convention c : conventions) {
            Map<String, Object> cMap = new HashMap<>();
            cMap.put("id", c.getId());
            cMap.put("titre", c.getTitre());
            cMap.put("statutCode", c.getStatut() != null ? c.getStatut().name() : "EN_COURS");
            cMap.put("statutLibelle", formaterStatutConvention(c.getStatut()));
            cMap.put("dateSignature", c.getDateSignature() != null ? c.getDateSignature().toString() : "");
            cMap.put("dateExpiration", c.getDateExpiration() != null ? c.getDateExpiration().toString() : "");
            if (c.getPartenaire() != null) {
                cMap.put("partenaireNom", c.getPartenaire().getNomInstitution());
                cMap.put("partenairePays", c.getPartenaire().getPays() != null ? c.getPartenaire().getPays() : "Maroc");
                cMap.put("typeInstitutionCode", c.getPartenaire().getTypeInstitution() != null ? c.getPartenaire().getTypeInstitution().name() : "UNIVERSITE");
                cMap.put("typeInstitutionLibelle", formaterTypeInstitution(c.getPartenaire().getTypeInstitution()));
            } else {
                cMap.put("partenaireNom", "Partenaire institutionnel");
                cMap.put("partenairePays", "Maroc");
                cMap.put("typeInstitutionCode", "UNIVERSITE");
                cMap.put("typeInstitutionLibelle", "Université / Académique");
            }
            convDetails.add(cMap);
        }

        // 7. Matériel & Équipements
        List<Materiel> materiels = materielRepository.findAll();
        long materielsAnnee = materiels.stream()
                .filter(m -> m.getDateArrivage() != null && m.getDateArrivage().getYear() == annee)
                .count();

        // 8. Réunions de coordination de l'année
        List<Reunion> reunionsAnnee = reunionRepository.findAll().stream()
                .filter(r -> r.getDateReunion() != null && r.getDateReunion().getYear() == annee)
                .collect(Collectors.toList());

        // 9. Nouvelles admissions & mobilités d'équipe
        long admissionsAnnee = adhesionRepository.findAll().stream()
                .filter(a -> a.getStatut() == StatutDemande.ACCEPTEE && a.getDateDecision() != null && a.getDateDecision().getYear() == annee)
                .count();

        long mobilitesAnnee = changementRepository.findAll().stream()
                .filter(c -> c.getStatut() == StatutDemande.ACCEPTEE && c.getDateDecision() != null && c.getDateDecision().getYear() == annee)
                .count();

        // Construction du Snapshot JSON complet
        Map<String, Object> snapshot = new HashMap<>();
        snapshot.put("annee", annee);
        snapshot.put("dateGeneration", LocalDateTime.now().toString());

        Map<String, Object> laboInfo = new HashMap<>();
        laboInfo.put("nom", laboNom);
        laboInfo.put("acronyme", laboAcronyme);
        laboInfo.put("etablissement", laboEtablissement);
        laboInfo.put("universite", laboUniversite);
        laboInfo.put("adresse", laboAdresse);
        laboInfo.put("email", laboEmail);
        laboInfo.put("telephone", laboTel);
        laboInfo.put("siteWeb", laboSite);
        laboInfo.put("description", laboDesc);
        laboInfo.put("dateCreation", laboDateCreation);
        laboInfo.put("directeurNom", directeurNom);
        laboInfo.put("directeurEmail", directeurEmail);
        laboInfo.put("directeurDateDebut", directeurDateDebut);
        snapshot.put("laboratoire", laboInfo);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalMembres", membresActifs.size());
        stats.put("totalPermanents", permanents.size());
        stats.put("totalDoctorants", doctorants.size());
        stats.put("totalAssocies", associes.size());
        stats.put("totalEquipes", toutesEquipes.size());
        stats.put("totalPublications", publicationsAnnee.size());
        stats.put("totalEvenements", evenementsAnnee.size());
        stats.put("totalConventions", conventions.size());
        stats.put("totalMateriels", materiels.size());
        stats.put("totalNouveauxMateriels", materielsAnnee);
        stats.put("totalReunions", reunionsAnnee.size());
        stats.put("totalNouvellesAdhesions", admissionsAnnee);
        stats.put("totalMobilites", mobilitesAnnee);
        snapshot.put("statistiques", stats);

        snapshot.put("equipes", equipesDetails);
        snapshot.put("publications", pubDetails);
        snapshot.put("evenements", evDetails);
        snapshot.put("conventions", convDetails);

        // Liste des membres résumée
        List<Map<String, Object>> membresResume = membresActifs.stream().map(m -> {
            Map<String, Object> mr = new HashMap<>();
            mr.put("id", m.getId());
            mr.put("nomComplet", m.getPrenom() + " " + m.getNom());
            mr.put("email", m.getEmail());
            mr.put("statutCode", m.getStatut() != null ? m.getStatut().name() : "PERMANENT");
            mr.put("statutLibelle", formaterStatutMembre(m.getStatut()));
            mr.put("equipeNom", m.getEquipeActuelle() != null ? m.getEquipeActuelle().getNom() : "Sans équipe");
            mr.put("dateAffiliation", m.getDateAffiliation() != null ? formaterDate(m.getDateAffiliation()) : "Non renseignée");
            mr.put("etablissementOrigine", m.getEtablissementOrigine() != null ? m.getEtablissementOrigine() : laboEtablissement);
            return mr;
        }).collect(Collectors.toList());
        snapshot.put("membres", membresResume);

        String snapshotJson;
        try {
            snapshotJson = objectMapper.writeValueAsString(snapshot);
        } catch (Exception e) {
            log.error("Erreur de sérialisation JSON du rapport: {}", e.getMessage());
            snapshotJson = "{}";
        }

        // Synthèse Markdown structurée et lisible
        String markdownContent = genererSyntheseMarkdown(annee, laboInfo, stats, equipesDetails, pubDetails, evDetails, convDetails);

        // PDF iText 7 élégant et complet
        String pdfRelativePath = genererPdfItext(annee, laboInfo, stats, equipesDetails, pubDetails, evDetails, convDetails);

        RapportActivite rapport = existantOpt.orElse(RapportActivite.builder().annee(annee).build());
        rapport.setDateGeneration(LocalDateTime.now());
        if (rapport.getStatut() == null) {
            rapport.setStatut(StatutRapport.BROUILLON);
        }
        rapport.setCheminFichierPdf(pdfRelativePath);
        rapport.setDonneesBrutes(snapshotJson);
        rapport.setContenuMarkdown(markdownContent);

        RapportActivite saved = rapportRepository.save(rapport);
        return convertirEnDTO(saved);
    }

    private String genererSyntheseMarkdown(int annee, Map<String, Object> labo, Map<String, Object> stats,
                                           List<Map<String, Object>> equipes, List<Map<String, Object>> publications,
                                           List<Map<String, Object>> evenements, List<Map<String, Object>> conventions) {
        StringBuilder sb = new StringBuilder();
        sb.append("# RAPPORT D'ACTIVITÉ ANNUEL — EXERCICE ").append(annee).append("\n\n");
        sb.append("### ").append(labo.get("nom")).append(" (").append(labo.get("acronyme")).append(")\n");
        sb.append("**Établissement :** ").append(labo.get("etablissement")).append(" — ").append(labo.get("universite")).append("\n");
        sb.append("**Direction :** ").append(labo.get("directeurNom")).append(" (").append(labo.get("directeurEmail")).append(")\n");
        sb.append("**Adresse :** ").append(labo.get("adresse")).append(" | **Contact :** ").append(labo.get("email")).append("\n\n");
        sb.append("---\n\n");

        sb.append("## 1. Synthèse Globale des Indicateurs Clés\n\n");
        sb.append("| Indicateur Stratégique | Volume Annuel |\n");
        sb.append("| :--- | :--- |\n");
        sb.append("| Effectif Total des Chercheurs | ").append(stats.get("totalMembres")).append(" membres |\n");
        sb.append("| — Enseignants-Chercheurs Permanents | ").append(stats.get("totalPermanents")).append(" |\n");
        sb.append("| — Doctorants-Chercheurs Rattachés | ").append(stats.get("totalDoctorants")).append(" |\n");
        sb.append("| — Chercheurs Associés | ").append(stats.get("totalAssocies")).append(" |\n");
        sb.append("| Équipes de Recherche Actives | ").append(stats.get("totalEquipes")).append(" structures |\n");
        sb.append("| Publications Scientifiques Indexées | ").append(stats.get("totalPublications")).append(" publications |\n");
        sb.append("| Manifestations & Séminaires Organisés | ").append(stats.get("totalEvenements")).append(" événements |\n");
        sb.append("| Conventions Bilatérales Actives | ").append(stats.get("totalConventions")).append(" conventions |\n");
        sb.append("| Réunions de Coordination Tenues | ").append(stats.get("totalReunions")).append(" réunions |\n\n");

        sb.append("## 2. Équipes de Recherche & Composition Détaillée (").append(equipes.size()).append(")\n\n");
        for (Map<String, Object> eq : equipes) {
            sb.append("### • [").append(eq.get("acronyme")).append("] ").append(eq.get("nom")).append("\n");
            sb.append("- **Chef d'Équipe :** ").append(eq.get("chefNom")).append(" (").append(eq.get("chefEmail")).append(")\n");
            sb.append("- **Effectif :** ").append(eq.get("nombreMembres")).append(" membres rattachés\n");
            List<String> thematiques = (List<String>) eq.get("thematiques");
            if (thematiques != null && !thematiques.isEmpty()) {
                sb.append("- **Axes thématiques :** ").append(String.join(", ", thematiques)).append("\n");
            }
            List<Map<String, Object>> membres = (List<Map<String, Object>>) eq.get("membres");
            if (membres != null && !membres.isEmpty()) {
                sb.append("- **Membres de l'équipe :**\n");
                for (Map<String, Object> m : membres) {
                    sb.append("  - **").append(m.get("nomComplet")).append("** — ").append(m.get("roleEquipe"))
                            .append(" (").append(m.get("statutLibelle")).append(")")
                            .append(" — *Rattaché le :* ").append(m.get("dateAffiliationFormatee"))
                            .append(" — *Email :* ").append(m.get("email")).append("\n");
                }
            }
            sb.append("\n");
        }

        sb.append("## 3. Production Scientifique (Publications ").append(annee).append(")\n\n");
        if (publications.isEmpty()) {
            sb.append("*Aucune publication scientifique n'a été répertoriée pour l'année ").append(annee).append(".*\n\n");
        } else {
            for (int i = 0; i < publications.size(); i++) {
                Map<String, Object> p = publications.get(i);
                sb.append(i + 1).append(". **").append(p.get("titre")).append("**\n");
                List<String> auteurs = (List<String>) p.get("auteurs");
                if (auteurs != null && !auteurs.isEmpty()) {
                    sb.append("   - *Auteurs :* ").append(String.join(", ", auteurs)).append("\n");
                }
                sb.append("   - *Type :* ").append(p.get("typeLibelle")).append("\n");
                if (p.get("doi") != null && !((String) p.get("doi")).isEmpty()) {
                    sb.append("   - *DOI :* ").append(p.get("doi")).append("\n");
                }
                sb.append("\n");
            }
        }

        sb.append("## 4. Manifestations & Séminaires Scientifiques (").append(evenements.size()).append(")\n\n");
        if (evenements.isEmpty()) {
            sb.append("*Aucun événement scientifique n'a été programmé pour l'année ").append(annee).append(".*\n\n");
        } else {
            for (Map<String, Object> ev : evenements) {
                sb.append("- **[").append(ev.get("typeLibelle")).append("]** ").append(ev.get("titre")).append("\n");
                sb.append("  - *Lieu :* ").append(ev.get("lieu")).append(" | *Statut :* ").append(ev.get("statutLibelle")).append("\n");
            }
            sb.append("\n");
        }

        sb.append("## 5. Conventions & Partenariats Internationaux (").append(conventions.size()).append(")\n\n");
        if (conventions.isEmpty()) {
            sb.append("*Aucune convention bilatérale active pour cet exercice.*\n\n");
        } else {
            for (Map<String, Object> c : conventions) {
                sb.append("- **").append(c.get("titre")).append("** — Partenaire : ").append(c.get("partenaireNom"))
                        .append(" (").append(c.get("partenairePays")).append(") — *Type :* ").append(c.get("typeInstitutionLibelle"))
                        .append(" — *Statut :* ").append(c.get("statutLibelle")).append("\n");
            }
            sb.append("\n");
        }

        return sb.toString();
    }

    private String genererPdfItext(int annee, Map<String, Object> labo, Map<String, Object> stats,
                                   List<Map<String, Object>> equipes, List<Map<String, Object>> publications,
                                   List<Map<String, Object>> evenements, List<Map<String, Object>> conventions) {
        try {
            Path dirPath = Paths.get(uploadDir, "rapports").toAbsolutePath().normalize();
            Files.createDirectories(dirPath);

            String fileName = "rapport_annuel_" + annee + "_" + UUID.randomUUID().toString().substring(0, 8) + ".pdf";
            Path filePath = dirPath.resolve(fileName);

            PdfWriter writer = new PdfWriter(new FileOutputStream(filePath.toFile()));
            PdfDocument pdf = new PdfDocument(writer);
            Document doc = new Document(pdf);
            doc.setMargins(26, 26, 28, 26);

            // Palette officielle identique à la charte graphique web
            DeviceRgb cDark = new DeviceRgb(15, 23, 42);          // Slate-900 (Bandeau Hero sombre)
            DeviceRgb cNavy = new DeviceRgb(30, 27, 75);          // Indigo-950 (Titres de section)
            DeviceRgb cBlue = new DeviceRgb(37, 99, 235);         // Blue-600
            DeviceRgb cLightBlue = new DeviceRgb(239, 246, 255);  // Blue-50
            DeviceRgb cCyan = new DeviceRgb(56, 189, 248);        // Sky-400 (Accents vifs)
            DeviceRgb cPurple = new DeviceRgb(124, 58, 237);      // Purple-600 (Chefs d'équipe)
            DeviceRgb cLightPurple = new DeviceRgb(250, 245, 255);// Purple-50
            DeviceRgb cBorderPurple = new DeviceRgb(221, 214, 254);// Purple-200
            DeviceRgb cEmerald = new DeviceRgb(5, 150, 105);      // Emerald-600 (Publications / Succès)
            DeviceRgb cLightEmerald = new DeviceRgb(236, 253, 245);// Emerald-50
            DeviceRgb cBorderEmerald = new DeviceRgb(167, 243, 208);// Emerald-200
            DeviceRgb cAmber = new DeviceRgb(217, 119, 6);        // Amber-600 (Événements)
            DeviceRgb cLightAmber = new DeviceRgb(254, 243, 199);  // Amber-50
            DeviceRgb cSlate50 = new DeviceRgb(248, 250, 252);
            DeviceRgb cSlate100 = new DeviceRgb(241, 245, 249);
            DeviceRgb cSlate200 = new DeviceRgb(226, 232, 240);
            DeviceRgb cSlate300 = new DeviceRgb(203, 213, 225);
            DeviceRgb cSlate400 = new DeviceRgb(148, 163, 184);
            DeviceRgb cSlate600 = new DeviceRgb(71, 85, 105);
            DeviceRgb cSlate700 = new DeviceRgb(51, 65, 85);
            DeviceRgb cSlate800 = new DeviceRgb(30, 41, 59);
            DeviceRgb cSlate900 = new DeviceRgb(15, 23, 42);
            DeviceRgb cWhite = new DeviceRgb(255, 255, 255);

            SolidBorder bSlate200 = new SolidBorder(cSlate200, 0.75f);

            // Gestionnaire d'événements pour En-tête courant et Pied de page avec pagination
            pdf.addEventHandler(PdfDocumentEvent.END_PAGE, new IEventHandler() {
                @Override
                public void handleEvent(Event event) {
                    PdfDocumentEvent docEvent = (PdfDocumentEvent) event;
                    PdfDocument pdfDoc = docEvent.getDocument();
                    PdfPage page = docEvent.getPage();
                    int pageNum = pdfDoc.getPageNumber(page);
                    Rectangle pageSize = page.getPageSize();
                    PdfCanvas pdfCanvas = new PdfCanvas(page);
                    Canvas canvas = new Canvas(pdfCanvas, pageSize);

                    // En-tête courant discret dès la page 2
                    if (pageNum > 1) {
                        Paragraph runningHeader = new Paragraph("LABORATOIRE LIAS — RAPPORT D'ACTIVITÉ ANNUEL " + annee + "  |  FSBM CASABLANCA")
                                .setFontSize(6.5f)
                                .setFontColor(cSlate400)
                                .setTextAlignment(TextAlignment.CENTER);
                        canvas.showTextAligned(runningHeader, pageSize.getWidth() / 2, pageSize.getHeight() - 16, TextAlignment.CENTER);
                    }

                    // Pied de page officiel sur toutes les pages
                    Paragraph runningFooter = new Paragraph("Document officiel de gouvernance édité par le LIAS — FSBM, Université Hassan II de Casablanca  |  Page " + pageNum)
                            .setFontSize(6.5f)
                            .setFontColor(cSlate400)
                            .setTextAlignment(TextAlignment.CENTER);
                    canvas.showTextAligned(runningFooter, pageSize.getWidth() / 2, 12, TextAlignment.CENTER);
                    canvas.close();
                }
            });

            // =========================================================================
            // CHARGEMENT DU LOGO OFFICIEL DU LABORATOIRE
            // =========================================================================
            Image logoImg = null;
            try {
                InputStream is = getClass().getResourceAsStream("/static/logo-white.png");
                if (is == null) {
                    is = getClass().getResourceAsStream("/static/logo.png");
                }
                byte[] logoBytes = null;
                if (is != null) {
                    logoBytes = is.readAllBytes();
                } else {
                    Path p = Paths.get("uploads", "logo-white.png");
                    if (!Files.exists(p)) p = Paths.get("uploads", "logo.png");
                    if (!Files.exists(p)) p = Paths.get("backend", "uploads", "logo-white.png");
                    if (!Files.exists(p)) p = Paths.get("frontend", "public", "logo-white.png");
                    if (!Files.exists(p)) p = Paths.get("..", "frontend", "public", "logo-white.png");
                    if (Files.exists(p)) {
                        logoBytes = Files.readAllBytes(p);
                    }
                }
                if (logoBytes != null && logoBytes.length > 0) {
                    ImageData imgData = ImageDataFactory.create(logoBytes);
                    logoImg = new Image(imgData);
                    logoImg.setMaxHeight(42f);
                    logoImg.setAutoScale(true);
                }
            } catch (Exception e) {
                log.warn("Chargement logo impossible: {}", e.getMessage());
            }

            // =========================================================================
            // BANDEAU HERO EXÉCUTIF (IDENTIQUE AU DESIGN DU SITE WEB AVEC LOGO)
            // =========================================================================
            Table heroBanner = new Table(UnitValue.createPercentArray(new float[]{100})).useAllAvailableWidth();
            Cell heroCell = new Cell().setBackgroundColor(cDark).setBorder(Border.NO_BORDER).setPadding(10);

            Table topRow = new Table(logoImg != null ? UnitValue.createPercentArray(new float[]{16, 84}) : UnitValue.createPercentArray(new float[]{100})).useAllAvailableWidth();

            if (logoImg != null) {
                Cell logoCell = new Cell().setBorder(Border.NO_BORDER).setPadding(2).setVerticalAlignment(VerticalAlignment.MIDDLE);
                logoCell.add(logoImg);
                topRow.addCell(logoCell);
            }

            Cell textCell = new Cell().setBorder(Border.NO_BORDER).setPadding(0);
            textCell.add(new Paragraph("UNIVERSITÉ HASSAN II DE CASABLANCA  •  FACULTÉ DES SCIENCES BEN M'SIK")
                    .setFontSize(7.5f)
                    .setBold()
                    .setFontColor(cSlate300)
                    .setMarginBottom(1));

            textCell.add(new Paragraph(String.valueOf(labo.get("nom")).replaceAll("(?i)\\s*\\(LIAS\\)\\s*", "").toUpperCase() + " (" + labo.get("acronyme") + ")")
                    .setFontSize(13f)
                    .setBold()
                    .setFontColor(ColorConstants.WHITE)
                    .setMarginBottom(1));

            textCell.add(new Paragraph("RAPPORT D'ACTIVITÉ SCIENTIFIQUE & BILAN DE GOUVERNANCE")
                    .setFontSize(9f)
                    .setBold()
                    .setFontColor(cCyan)
                    .setMarginBottom(3));

            topRow.addCell(textCell);
            heroCell.add(topRow);

            Table heroMeta = new Table(UnitValue.createPercentArray(new float[]{55, 45})).useAllAvailableWidth();
            heroMeta.setMarginTop(3);
            Cell metaLeft = new Cell().setBorder(Border.NO_BORDER).setPadding(0);
            metaLeft.add(new Paragraph("Exercice Annuel " + annee + "  •  Directeur : " + labo.get("directeurNom"))
                    .setFontSize(7.5f)
                    .setFontColor(cSlate300));
            metaLeft.add(new Paragraph("Contact officiel : " + labo.get("email") + "  •  " + labo.get("siteWeb"))
                    .setFontSize(6.8f)
                    .setFontColor(cSlate400));

            Cell metaRight = new Cell().setBorder(Border.NO_BORDER).setPadding(0).setTextAlignment(TextAlignment.RIGHT);
            metaRight.add(new Paragraph("Rapport Officiel Édité le " + LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                    .setFontSize(7.5f)
                    .setBold()
                    .setFontColor(cEmerald));
            metaRight.add(new Paragraph("Immatriculation & Archivage Institutionnel FSBM")
                    .setFontSize(6.8f)
                    .setFontColor(cSlate400));

            heroMeta.addCell(metaLeft);
            heroMeta.addCell(metaRight);
            heroCell.add(heroMeta);
            heroBanner.addCell(heroCell);
            doc.add(heroBanner);
            doc.add(new Paragraph(" ").setFontSize(3));

            // =========================================================================
            // GRILLE DES 6 CARTES KPI EXÉCUTIVES (IDENTIQUE AU SITE WEB)
            // =========================================================================
            Table kpiTable = new Table(UnitValue.createPercentArray(new float[]{16.66f, 16.66f, 16.66f, 16.66f, 16.66f, 16.66f})).useAllAvailableWidth();
            kpiTable.addCell(createKpiCard("MEMBRES ACTIFS", String.valueOf(stats.get("totalMembres")), stats.get("totalPermanents") + " perm. • " + stats.get("totalDoctorants") + " doct.", cSlate50, bSlate200, cSlate900, cBlue));
            kpiTable.addCell(createKpiCard("ÉQUIPES", String.valueOf(stats.get("totalEquipes")), "Axes de recherche", cSlate50, bSlate200, cSlate900, cPurple));
            kpiTable.addCell(createKpiCard("PUBLICATIONS", String.valueOf(stats.get("totalPublications")), "Indexées en " + annee, cSlate50, bSlate200, cSlate900, cEmerald));
            kpiTable.addCell(createKpiCard("ÉVÉNEMENTS", String.valueOf(stats.get("totalEvenements")), "Séminaires & conf.", cSlate50, bSlate200, cSlate900, cAmber));
            kpiTable.addCell(createKpiCard("CONVENTIONS", String.valueOf(stats.get("totalConventions")), "Accords actifs", cSlate50, bSlate200, cSlate900, cBlue));
            kpiTable.addCell(createKpiCard("ÉQUIPEMENTS", String.valueOf(stats.get("totalMateriels")), stats.get("totalNouveauxMateriels") + " acquis en " + annee, cSlate50, bSlate200, cSlate900, cSlate600));
            doc.add(kpiTable);
            doc.add(new Paragraph(" ").setFontSize(4));

            // =========================================================================
            // SECTION 1: FICHE D'IDENTITÉ & GOUVERNANCE DU LABORATOIRE
            // =========================================================================
            doc.add(createSectionHeader("1. FICHE D'IDENTITÉ DU LABORATOIRE & GOUVERNANCE", cNavy));

            Table identityTable = new Table(UnitValue.createPercentArray(new float[]{50, 50})).useAllAvailableWidth();
            Cell idLeft = new Cell().setBackgroundColor(cSlate50).setBorder(bSlate200).setPadding(6);
            idLeft.add(new Paragraph("IMPLANTATION & COORDONNÉES").setFontSize(6.5f).setBold().setFontColor(cBlue).setMarginBottom(3));
            idLeft.add(new Paragraph("• Établissement : " + labo.get("etablissement")).setFontSize(7f).setBold().setFontColor(cSlate800));
            idLeft.add(new Paragraph("• Université : " + labo.get("universite")).setFontSize(6.8f).setFontColor(cSlate600));
            idLeft.add(new Paragraph("• Adresse : " + labo.get("adresse")).setFontSize(6.8f).setFontColor(cSlate600));
            idLeft.add(new Paragraph("• Contacts : " + labo.get("email") + " | " + labo.get("telephone")).setFontSize(6.8f).setFontColor(cSlate600));
            idLeft.add(new Paragraph("• Portail Web : " + labo.get("siteWeb")).setFontSize(6.8f).setFontColor(cBlue));
            idLeft.add(new Paragraph("• Date de Création : " + labo.get("dateCreation")).setFontSize(6.8f).setFontColor(cSlate600));

            Cell idRight = new Cell().setBackgroundColor(cSlate50).setBorder(bSlate200).setPadding(6);
            
            // Direction Box
            Table dirBox = new Table(UnitValue.createPercentArray(new float[]{100})).useAllAvailableWidth();
            Cell dirCell = new Cell().setBackgroundColor(cLightPurple).setBorder(new SolidBorder(cBorderPurple, 0.75f)).setPadding(4);
            dirCell.add(new Paragraph("DIRECTION DU LABORATOIRE (MANDAT EN COURS)").setFontSize(6f).setBold().setFontColor(cPurple));
            dirCell.add(new Paragraph("Pr. " + labo.get("directeurNom") + " (" + labo.get("directeurEmail") + ")").setFontSize(7.5f).setBold().setFontColor(cSlate900));
            dirCell.add(new Paragraph("Prise de fonction officielle : " + labo.get("directeurDateDebut")).setFontSize(6.5f).setFontColor(cSlate600));
            dirBox.addCell(dirCell);
            idRight.add(dirBox);

            // Missions Text
            idRight.add(new Paragraph("MISSIONS & CHAMP D'ACTION SCIENTIFIQUE").setFontSize(6.5f).setBold().setFontColor(cSlate700).setMarginTop(3).setMarginBottom(1));
            idRight.add(new Paragraph("« " + labo.get("description") + " »").setFontSize(6.5f).setItalic().setFontColor(cSlate600));

            identityTable.addCell(idLeft);
            identityTable.addCell(idRight);
            doc.add(identityTable);
            doc.add(new Paragraph(" ").setFontSize(4));

            // =========================================================================
            // SECTION 2: STRUCTURES & ÉQUIPES DE RECHERCHE AVEC ROSTER NOMINATIF
            // =========================================================================
            doc.add(createSectionHeader("2. STRUCTURES & ÉQUIPES DE RECHERCHE (" + equipes.size() + " Équipes)", cNavy));

            for (Map<String, Object> eq : equipes) {
                // Carte d'en-tête de l'équipe
                Table eqHeader = new Table(UnitValue.createPercentArray(new float[]{70, 30})).useAllAvailableWidth();
                Cell eqTitleCell = new Cell().setBackgroundColor(cSlate100).setBorder(bSlate200).setPadding(4);
                eqTitleCell.add(new Paragraph("[" + eq.get("acronyme") + "] " + eq.get("nom"))
                        .setFontSize(8.5f).setBold().setFontColor(cBlue));
                List<String> thematiques = (List<String>) eq.get("thematiques");
                String themStr = (thematiques != null && !thematiques.isEmpty()) ? String.join(", ", thematiques) : "Axes transversaux de recherche";
                eqTitleCell.add(new Paragraph("Thématiques : " + themStr).setFontSize(6.5f).setFontColor(cSlate600));

                Cell eqCountCell = new Cell().setBackgroundColor(cSlate100).setBorder(bSlate200).setPadding(4).setTextAlignment(TextAlignment.RIGHT);
                eqCountCell.add(new Paragraph(eq.get("nombreMembres") + " Chercheurs Rattachés").setFontSize(7.5f).setBold().setFontColor(cSlate800));
                eqCountCell.add(new Paragraph("Chef : " + eq.get("chefNom")).setFontSize(6.5f).setFontColor(cPurple).setBold());

                eqHeader.addCell(eqTitleCell);
                eqHeader.addCell(eqCountCell);
                doc.add(eqHeader);

                // Tableau Nominatif Détaillé des Membres de l'équipe
                List<Map<String, Object>> membresEq = (List<Map<String, Object>>) eq.get("membres");
                if (membresEq != null && !membresEq.isEmpty()) {
                    Table mTable = new Table(UnitValue.createPercentArray(new float[]{28, 20, 22, 15, 15})).useAllAvailableWidth();
                    mTable.addHeaderCell(createTableHeaderCell("Membre & Contact"));
                    mTable.addHeaderCell(createTableHeaderCell("Rôle dans l'Équipe"));
                    mTable.addHeaderCell(createTableHeaderCell("Statut Académique"));
                    mTable.addHeaderCell(createTableHeaderCell("Date de Rattachement"));
                    mTable.addHeaderCell(createTableHeaderCell("Établissement"));

                    int mIndex = 0;
                    for (Map<String, Object> m : membresEq) {
                        boolean isChef = String.valueOf(m.get("roleEquipe")).toLowerCase().contains("chef");
                        DeviceRgb rowBg = isChef ? cLightPurple : (mIndex % 2 == 0 ? cWhite : cSlate50);

                        Cell cNom = new Cell().setBackgroundColor(rowBg).setBorder(new SolidBorder(cSlate200, 0.5f)).setPadding(2.5f);
                        cNom.add(new Paragraph((String) m.get("nomComplet")).setFontSize(6.8f).setBold().setFontColor(isChef ? cPurple : cSlate900));
                        cNom.add(new Paragraph((String) m.get("email")).setFontSize(5.8f).setFontColor(cSlate400));

                        Cell cRole = new Cell().setBackgroundColor(rowBg).setBorder(new SolidBorder(cSlate200, 0.5f)).setPadding(2.5f);
                        cRole.add(new Paragraph((String) m.get("roleEquipe")).setFontSize(6.5f).setBold().setFontColor(isChef ? cPurple : cBlue));

                        Cell cStatut = new Cell().setBackgroundColor(rowBg).setBorder(new SolidBorder(cSlate200, 0.5f)).setPadding(2.5f);
                        cStatut.add(new Paragraph((String) m.get("statutLibelle")).setFontSize(6.5f).setFontColor(cSlate800));

                        Cell cDate = new Cell().setBackgroundColor(rowBg).setBorder(new SolidBorder(cSlate200, 0.5f)).setPadding(2.5f);
                        cDate.add(new Paragraph((String) m.get("dateAffiliationFormatee")).setFontSize(6.5f).setFontColor(cSlate700));

                        Cell cEtab = new Cell().setBackgroundColor(rowBg).setBorder(new SolidBorder(cSlate200, 0.5f)).setPadding(2.5f);
                        cEtab.add(new Paragraph((String) m.get("etablissementOrigine")).setFontSize(6.5f).setFontColor(cSlate600));

                        mTable.addCell(cNom);
                        mTable.addCell(cRole);
                        mTable.addCell(cStatut);
                        mTable.addCell(cDate);
                        mTable.addCell(cEtab);
                        mIndex++;
                    }
                    doc.add(mTable);
                } else {
                    Paragraph emptyM = new Paragraph("Aucun membre actuellement rattaché à cette équipe.")
                            .setFontSize(6.5f).setItalic().setFontColor(cSlate400).setMarginLeft(8);
                    doc.add(emptyM);
                }
                doc.add(new Paragraph(" ").setFontSize(3));
            }

            // =========================================================================
            // SECTION 3: PRODUCTION SCIENTIFIQUE — PUBLICATIONS INDEXÉES
            // =========================================================================
            doc.add(createSectionHeader("3. PRODUCTION SCIENTIFIQUE — PUBLICATIONS " + annee + " (" + publications.size() + ")", cNavy));

            if (publications.isEmpty()) {
                Table emptyPubTable = new Table(UnitValue.createPercentArray(new float[]{100})).useAllAvailableWidth();
                emptyPubTable.addCell(new Cell().setBackgroundColor(cSlate50).setBorder(bSlate200).setPadding(6)
                        .add(new Paragraph("Aucune publication indexée pour l'exercice " + annee + ".").setFontSize(7f).setItalic().setFontColor(cSlate400)));
                doc.add(emptyPubTable);
            } else {
                for (int i = 0; i < publications.size(); i++) {
                    Map<String, Object> p = publications.get(i);
                    Table pubCard = new Table(UnitValue.createPercentArray(new float[]{70, 30})).useAllAvailableWidth();
                    pubCard.setMarginBottom(3);

                    Cell pHeadLeft = new Cell().setBackgroundColor(ColorConstants.WHITE).setBorder(bSlate200).setPadding(3);
                    pHeadLeft.add(new Paragraph((String) p.get("typeLibelle")).setFontSize(6f).setBold().setFontColor(cEmerald));
                    pHeadLeft.add(new Paragraph((i + 1) + ". " + p.get("titre")).setFontSize(7.5f).setBold().setFontColor(cSlate900));

                    List<String> auteurs = (List<String>) p.get("auteurs");
                    if (auteurs != null && !auteurs.isEmpty()) {
                        pHeadLeft.add(new Paragraph("Auteurs : " + String.join(", ", auteurs)).setFontSize(6.5f).setItalic().setFontColor(cSlate600));
                    }
                    String resume = (String) p.get("resume");
                    if (resume != null && !resume.isBlank()) {
                        pHeadLeft.add(new Paragraph("« " + resume + " »").setFontSize(6f).setItalic().setFontColor(cSlate400));
                    }

                    Cell pHeadRight = new Cell().setBackgroundColor(ColorConstants.WHITE).setBorder(bSlate200).setPadding(3).setTextAlignment(TextAlignment.RIGHT);
                    pHeadRight.add(new Paragraph("Équipe : " + p.get("equipeNom")).setFontSize(6.5f).setBold().setFontColor(cPurple));
                    String doi = (String) p.get("doi");
                    if (doi != null && !doi.isBlank()) {
                        pHeadRight.add(new Paragraph("DOI : " + doi).setFontSize(6f).setBold().setFontColor(cBlue));
                    }

                    pubCard.addCell(pHeadLeft);
                    pubCard.addCell(pHeadRight);
                    doc.add(pubCard);
                }
            }
            doc.add(new Paragraph(" ").setFontSize(4));

            // =========================================================================
            // SECTION 4: MANIFESTATIONS & ANIMATION SCIENTIFIQUE
            // =========================================================================
            doc.add(createSectionHeader("4. MANIFESTATIONS & ANIMATION SCIENTIFIQUE (" + evenements.size() + ")", cNavy));

            if (evenements.isEmpty()) {
                Table emptyEv = new Table(UnitValue.createPercentArray(new float[]{100})).useAllAvailableWidth();
                emptyEv.addCell(new Cell().setBackgroundColor(cSlate50).setBorder(bSlate200).setPadding(6)
                        .add(new Paragraph("Aucun événement recensé pour cette année.").setFontSize(7f).setItalic().setFontColor(cSlate400)));
                doc.add(emptyEv);
            } else {
                Table evTable = new Table(UnitValue.createPercentArray(new float[]{22, 38, 22, 18})).useAllAvailableWidth();
                evTable.addHeaderCell(createTableHeaderCell("Nature de la Manifestation"));
                evTable.addHeaderCell(createTableHeaderCell("Intitulé de l'Événement"));
                evTable.addHeaderCell(createTableHeaderCell("Statut & Validation"));
                evTable.addHeaderCell(createTableHeaderCell("Période & Lieu"));

                int evIdx = 0;
                for (Map<String, Object> ev : evenements) {
                    DeviceRgb rowBg = evIdx % 2 == 0 ? cWhite : cSlate50;
                    Cell c1 = new Cell().setBackgroundColor(rowBg).setBorder(new SolidBorder(cSlate200, 0.5f)).setPadding(2.5f)
                            .add(new Paragraph((String) ev.get("typeLibelle")).setFontSize(6.5f).setBold().setFontColor(cAmber));
                    Cell c2 = new Cell().setBackgroundColor(rowBg).setBorder(new SolidBorder(cSlate200, 0.5f)).setPadding(2.5f)
                            .add(new Paragraph((String) ev.get("titre")).setFontSize(6.8f).setFontColor(cSlate900));
                    Cell c3 = new Cell().setBackgroundColor(rowBg).setBorder(new SolidBorder(cSlate200, 0.5f)).setPadding(2.5f)
                            .add(new Paragraph(ev.get("statutLibelle") + " • " + ev.get("statutValidationLibelle")).setFontSize(6.2f).setFontColor(cBlue));
                    Cell c4 = new Cell().setBackgroundColor(rowBg).setBorder(new SolidBorder(cSlate200, 0.5f)).setPadding(2.5f)
                            .add(new Paragraph(ev.get("lieu") + " (" + ev.get("dateDebut") + ")").setFontSize(6.2f).setFontColor(cSlate600));

                    evTable.addCell(c1);
                    evTable.addCell(c2);
                    evTable.addCell(c3);
                    evTable.addCell(c4);
                    evIdx++;
                }
                doc.add(evTable);
            }
            doc.add(new Paragraph(" ").setFontSize(4));

            // =========================================================================
            // SECTION 5: CONVENTIONS BILATÉRALES & PARTENARIATS
            // =========================================================================
            doc.add(createSectionHeader("5. CONVENTIONS BILATÉRALES & PARTENARIATS (" + conventions.size() + ")", cNavy));

            if (conventions.isEmpty()) {
                Table emptyConv = new Table(UnitValue.createPercentArray(new float[]{100})).useAllAvailableWidth();
                emptyConv.addCell(new Cell().setBackgroundColor(cSlate50).setBorder(bSlate200).setPadding(6)
                        .add(new Paragraph("Aucune convention bilatérale active pour cet exercice.").setFontSize(7f).setItalic().setFontColor(cSlate400)));
                doc.add(emptyConv);
            } else {
                Table convTable = new Table(UnitValue.createPercentArray(new float[]{35, 25, 22, 18})).useAllAvailableWidth();
                convTable.addHeaderCell(createTableHeaderCell("Intitulé de l'Accord"));
                convTable.addHeaderCell(createTableHeaderCell("Partenaire & Pays"));
                convTable.addHeaderCell(createTableHeaderCell("Nature Institutionnelle"));
                convTable.addHeaderCell(createTableHeaderCell("Statut"));

                int cIdx = 0;
                for (Map<String, Object> c : conventions) {
                    DeviceRgb rowBg = cIdx % 2 == 0 ? cWhite : cSlate50;
                    Cell c1 = new Cell().setBackgroundColor(rowBg).setBorder(new SolidBorder(cSlate200, 0.5f)).setPadding(2.5f)
                            .add(new Paragraph((String) c.get("titre")).setFontSize(6.8f).setBold().setFontColor(cSlate900));
                    Cell c2 = new Cell().setBackgroundColor(rowBg).setBorder(new SolidBorder(cSlate200, 0.5f)).setPadding(2.5f)
                            .add(new Paragraph(c.get("partenaireNom") + " (" + c.get("partenairePays") + ")").setFontSize(6.5f).setFontColor(cSlate700));
                    Cell c3 = new Cell().setBackgroundColor(rowBg).setBorder(new SolidBorder(cSlate200, 0.5f)).setPadding(2.5f)
                            .add(new Paragraph((String) c.get("typeInstitutionLibelle")).setFontSize(6.5f).setFontColor(cBlue));
                    Cell c4 = new Cell().setBackgroundColor(rowBg).setBorder(new SolidBorder(cSlate200, 0.5f)).setPadding(2.5f)
                            .add(new Paragraph((String) c.get("statutLibelle")).setFontSize(6.5f).setBold().setFontColor(cEmerald));

                    convTable.addCell(c1);
                    convTable.addCell(c2);
                    convTable.addCell(c3);
                    convTable.addCell(c4);
                    cIdx++;
                }
                doc.add(convTable);
            }

            // =========================================================================
            // BLOC OFFICIEL DE VISA & SIGNATURES DE GOUVERNANCE
            // =========================================================================
            doc.add(new Paragraph(" ").setFontSize(6));
            Table signTable = new Table(UnitValue.createPercentArray(new float[]{50, 50})).useAllAvailableWidth();
            
            Cell signLeft = new Cell().setBorder(bSlate200).setBackgroundColor(cSlate50).setPadding(6);
            signLeft.add(new Paragraph("VISA DU CONSEIL DU LABORATOIRE").setFontSize(6.5f).setBold().setFontColor(cSlate800));
            signLeft.add(new Paragraph("Fait à Casablanca, le " + LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).setFontSize(6f).setFontColor(cSlate600));
            signLeft.add(new Paragraph("Attesté conforme pour l'exercice institutionnel " + annee).setFontSize(6f).setItalic().setFontColor(cSlate400));

            Cell signRight = new Cell().setBorder(bSlate200).setBackgroundColor(cSlate50).setPadding(6).setTextAlignment(TextAlignment.RIGHT);
            signRight.add(new Paragraph("LE DIRECTEUR DU LABORATOIRE LIAS").setFontSize(6.5f).setBold().setFontColor(cNavy));
            signRight.add(new Paragraph("Pr. " + labo.get("directeurNom")).setFontSize(7f).setBold().setFontColor(cSlate900));
            signRight.add(new Paragraph("[Cachet & Signature Électronique Validée]").setFontSize(5.8f).setItalic().setFontColor(cEmerald));

            signTable.addCell(signLeft);
            signTable.addCell(signRight);
            doc.add(signTable);

            doc.close();
            return "rapports/" + fileName;
        } catch (Exception e) {
            log.error("Erreur lors de la génération du PDF iText: {}", e.getMessage(), e);
            return "rapports/rapport_" + annee + ".pdf";
        }
    }

    private Table createSectionHeader(String title, DeviceRgb bgColor) {
        Table table = new Table(UnitValue.createPercentArray(new float[]{100})).useAllAvailableWidth();
        table.setMarginTop(6);
        table.setMarginBottom(3);
        Cell cell = new Cell()
                .setBackgroundColor(bgColor)
                .setBorder(Border.NO_BORDER)
                .setPaddingTop(4)
                .setPaddingBottom(4)
                .setPaddingLeft(6)
                .setPaddingRight(6);
        cell.add(new Paragraph(title)
                .setFontSize(8.5f)
                .setBold()
                .setFontColor(ColorConstants.WHITE));
        table.addCell(cell);
        return table;
    }

    private Cell createTableHeaderCell(String title) {
        return new Cell()
                .setBackgroundColor(new DeviceRgb(30, 41, 59))
                .setBorder(new SolidBorder(new DeviceRgb(51, 65, 85), 0.5f))
                .setPadding(3)
                .add(new Paragraph(title).setFontSize(6.5f).setBold().setFontColor(ColorConstants.WHITE));
    }

    private Cell createKpiCard(String label, String value, String subtext, DeviceRgb bg, SolidBorder border, DeviceRgb valColor, DeviceRgb subColor) {
        Cell cell = new Cell().setBackgroundColor(bg).setBorder(border).setPadding(4).setTextAlignment(TextAlignment.CENTER);
        cell.add(new Paragraph(label).setFontSize(5.5f).setBold().setFontColor(new DeviceRgb(100, 116, 139)).setMarginBottom(1));
        cell.add(new Paragraph(value).setFontSize(13f).setBold().setFontColor(valColor).setMarginBottom(0));
        cell.add(new Paragraph(subtext).setFontSize(5f).setFontColor(subColor));
        return cell;
    }

    @Transactional(readOnly = true)
    public RapportActiviteDTO getRapportDTOParAnnee(int annee) {
        RapportActivite r = rapportRepository.findByAnnee(annee)
                .orElseThrow(() -> new RessourceIntrouvableException("Aucun rapport trouvé pour l'année " + annee));
        return convertirEnDTO(r);
    }

    @Transactional
    public RapportActiviteDTO sauvegarderMarkdown(Long id, String contenuMarkdown) {
        RapportActivite r = rapportRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Rapport introuvable"));
        r.setContenuMarkdown(contenuMarkdown);
        RapportActivite saved = rapportRepository.save(r);
        return convertirEnDTO(saved);
    }

    @Transactional
    public RapportActiviteDTO finaliserEtRegenererPdf(Long id) {
        RapportActivite r = rapportRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Rapport introuvable"));
        r.finaliser();
        RapportActivite saved = rapportRepository.save(r);

        notificationService.notifierTousLesMembres(
                "Rapport d'Activité Annuel " + saved.getAnnee() + " disponible",
                "Le rapport d'activité annuel officiel " + saved.getAnnee() + " du Laboratoire LIAS a été finalisé et est disponible au téléchargement.",
                TypeNotification.RAPPORT,
                "/gouvernance/rapport-annuel"
        );

        return convertirEnDTO(saved);
    }

    @Transactional
    public void validerEtFermerRapport(Long id) {
        RapportActivite r = rapportRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Rapport introuvable"));
        r.finaliser();
        rapportRepository.save(r);
    }

    @Transactional(readOnly = true)
    public List<RapportActiviteDTO> listerRapports() {
        return rapportRepository.findAllByOrderByAnneeDesc().stream()
                .map(this::convertirEnDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RapportActivite getRapport(Long id) {
        return rapportRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Rapport introuvable"));
    }

    public RapportActiviteDTO convertirEnDTO(RapportActivite r) {
        return RapportActiviteDTO.builder()
                .id(r.getId())
                .annee(r.getAnnee())
                .dateGeneration(r.getDateGeneration())
                .statut(r.getStatut())
                .cheminFichierPdf(r.getCheminFichierPdf())
                .donneesBrutes(r.getDonneesBrutes())
                .contenuMarkdown(r.getContenuMarkdown() != null ? r.getContenuMarkdown() : r.getDonneesBrutes())
                .build();
    }
}
