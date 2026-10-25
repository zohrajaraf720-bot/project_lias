package ma.univh2c.fsbm.lias.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.univh2c.fsbm.lias.entity.*;
import ma.univh2c.fsbm.lias.enums.*;
import ma.univh2c.fsbm.lias.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Component
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class RealLabDataSeeder implements CommandLineRunner {

    private final MembreRepository membreRepository;
    private final EquipeRepository equipeRepository;
    private final MandatRepository mandatRepository;
    private final EvenementScientifiqueRepository evenementRepository;
    private final PublicationRepository publicationRepository;
    private final PeriodeAffiliationRepository periodeAffiliationRepository;
    private final CanalDiscussionRepository canalDiscussionRepository;
    private final PasswordEncoder passwordEncoder;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Override
    @Transactional
    public void run(String... args) {
        log.info("🌱 Démarrage de l'initialisation des données réelles du LIAS à partir des fichiers JSON...");

        String defaultPassword = passwordEncoder.encode("Lias2026!");

        seedEquipes();
        seedMembres(defaultPassword);
        seedMandats();
        seedEvenements();
        seedPublications();

        log.info("🚀 Données réelles du LIAS initialisées avec succès !");
    }

    private void seedEquipes() {
        try {
            ClassPathResource resource = new ClassPathResource("data/real_lab/equipes.json");
            if (!resource.exists()) {
                log.warn("Fichier data/real_lab/equipes.json non trouvé.");
                return;
            }

            try (InputStream is = resource.getInputStream()) {
                List<Map<String, Object>> equipesData = objectMapper.readValue(is, new TypeReference<>() {});
                for (Map<String, Object> eqMap : equipesData) {
                    String nom = (String) eqMap.get("nom");
                    String description = (String) eqMap.get("description");
                    @SuppressWarnings("unchecked")
                    List<String> thematiques = (List<String>) eqMap.get("thematiques");

                    if (equipeRepository.findByNomIgnoreCase(nom).isEmpty()) {
                        Equipe equipe = Equipe.builder()
                                .nom(nom)
                                .description(description)
                                .thematiques(thematiques != null ? thematiques : new ArrayList<>())
                                .build();
                        equipe = equipeRepository.save(equipe);

                        // Canal d'équipe associé
                        if (canalDiscussionRepository.findByEquipeId(equipe.getId()).isEmpty()) {
                            CanalDiscussion canal = CanalDiscussion.builder()
                                    .titre("Équipe " + nom)
                                    .typeCanal(TypeCanal.EQUIPE)
                                    .dateCreation(LocalDateTime.now())
                                    .equipe(equipe)
                                    .build();
                            canalDiscussionRepository.save(canal);
                        }
                        log.info("✅ Équipe réelle créée : {}", nom);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Erreur lors du seeding des équipes réelles : {}", e.getMessage(), e);
        }
    }

    private void seedMembres(String defaultPassword) {
        try {
            ClassPathResource resource = new ClassPathResource("data/real_lab/membres.json");
            if (!resource.exists()) {
                log.warn("Fichier data/real_lab/membres.json non trouvé.");
                return;
            }

            try (InputStream is = resource.getInputStream()) {
                List<Map<String, Object>> membresData = objectMapper.readValue(is, new TypeReference<>() {});
                for (Map<String, Object> mMap : membresData) {
                    String email = (String) mMap.get("email");
                    String nom = (String) mMap.get("nom");
                    String prenom = (String) mMap.get("prenom");
                    String equipeNom = (String) mMap.get("equipeNom");
                    @SuppressWarnings("unchecked")
                    List<String> centresInteret = (List<String>) mMap.get("centresInteret");
                    String statutStr = (String) mMap.getOrDefault("statut", "PERMANENT");
                    String roleStr = (String) mMap.getOrDefault("roleSysteme", "UTILISATEUR");
                    String etatStr = (String) mMap.getOrDefault("etatCompte", "ACTIF");
                    String etablissement = (String) mMap.getOrDefault("etablissementOrigine", "FSBM");
                    String labo = (String) mMap.getOrDefault("laboratoireOrigine", "LIAS");
                    String dateAffStr = (String) mMap.get("dateAffiliation");

                    if (membreRepository.findByEmailIgnoreCase(email).isEmpty()) {
                        Equipe equipe = (equipeNom != null)
                                ? equipeRepository.findByNomIgnoreCase(equipeNom).orElse(null)
                                : null;

                        LocalDate dateAffiliation = (dateAffStr != null)
                                ? LocalDate.parse(dateAffStr)
                                : LocalDate.of(2020, 9, 1);

                        Membre m = Membre.builder()
                                .nom(nom)
                                .prenom(prenom)
                                .email(email)
                                .motDePasse(defaultPassword)
                                .roleSysteme(RoleSysteme.valueOf(roleStr))
                                .statut(StatutMembre.valueOf(statutStr))
                                .etatCompte(EtatCompte.valueOf(etatStr))
                                .doitChangerMotDePasse(false)
                                .etablissementOrigine(etablissement)
                                .laboratoireOrigine(labo)
                                .dateAffiliation(dateAffiliation)
                                .centresInteret(centresInteret != null ? centresInteret : new ArrayList<>())
                                .equipeActuelle(equipe)
                                .build();

                        m = membreRepository.save(m);

                        PeriodeAffiliation affiliation = PeriodeAffiliation.builder()
                                .dateDebut(dateAffiliation)
                                .membre(m)
                                .build();
                        periodeAffiliationRepository.save(affiliation);

                        log.info("✅ Membre réel créé : {} {} ({})", prenom, nom, email);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Erreur lors du seeding des membres réels : {}", e.getMessage(), e);
        }
    }

    private void seedMandats() {
        try {
            ClassPathResource resource = new ClassPathResource("data/real_lab/mandats.json");
            if (!resource.exists()) return;

            try (InputStream is = resource.getInputStream()) {
                List<Map<String, Object>> mandatsData = objectMapper.readValue(is, new TypeReference<>() {});
                for (Map<String, Object> map : mandatsData) {
                    String typeStr = (String) map.get("typeMandat");
                    String membreEmail = (String) map.get("membreEmail");
                    String equipeNom = (String) map.get("equipeNom");
                    String dateDebutStr = (String) map.get("dateDebut");

                    TypeMandat type = TypeMandat.valueOf(typeStr);
                    LocalDate dateDebut = dateDebutStr != null ? LocalDate.parse(dateDebutStr) : LocalDate.of(2023, 1, 1);

                    membreRepository.findByEmailIgnoreCase(membreEmail).ifPresent(membre -> {
                        if (type == TypeMandat.DIRECTEUR) {
                            boolean hasDirecteur = mandatRepository.findByMembreId(membre.getId())
                                    .stream().anyMatch(m -> m.getTypeMandat() == TypeMandat.DIRECTEUR && m.estActif());
                            if (!hasDirecteur) {
                                Mandat mandat = Mandat.builder()
                                        .typeMandat(TypeMandat.DIRECTEUR)
                                        .membre(membre)
                                        .dateDebut(dateDebut)
                                        .build();
                                mandatRepository.save(mandat);
                                log.info("🎖️ Mandat Directeur attribué à : {} {}", membre.getPrenom(), membre.getNom());
                            }
                        } else if (type == TypeMandat.VICE_DIRECTEUR) {
                            boolean hasVice = mandatRepository.findByMembreId(membre.getId())
                                    .stream().anyMatch(m -> m.getTypeMandat() == TypeMandat.VICE_DIRECTEUR && m.estActif());
                            if (!hasVice) {
                                Mandat mandat = Mandat.builder()
                                        .typeMandat(TypeMandat.VICE_DIRECTEUR)
                                        .membre(membre)
                                        .dateDebut(dateDebut)
                                        .build();
                                mandatRepository.save(mandat);
                                log.info("🎖️ Mandat Vice-Directeur attribué à : {} {}", membre.getPrenom(), membre.getNom());
                            }
                        } else if (type == TypeMandat.CHEF_EQUIPE && equipeNom != null) {
                            equipeRepository.findByNomIgnoreCase(equipeNom).ifPresent(equipe -> {
                                boolean hasChef = mandatRepository.findByTypeMandatAndEquipeIdAndDateFinIsNull(TypeMandat.CHEF_EQUIPE, equipe.getId()).isPresent();
                                if (!hasChef) {
                                    Mandat mandat = Mandat.builder()
                                            .typeMandat(TypeMandat.CHEF_EQUIPE)
                                            .equipe(equipe)
                                            .membre(membre)
                                            .dateDebut(dateDebut)
                                            .build();
                                    mandatRepository.save(mandat);
                                    log.info("🎖️ Chef d'équipe {} nommé : {} {}", equipe.getNom(), membre.getPrenom(), membre.getNom());
                                }
                            });
                        }
                    });
                }
            }
        } catch (Exception e) {
            log.error("Erreur lors du seeding des mandats : {}", e.getMessage(), e);
        }
    }

    private void seedEvenements() {
        try {
            ClassPathResource resource = new ClassPathResource("data/real_lab/evenements.json");
            if (!resource.exists()) return;

            try (InputStream is = resource.getInputStream()) {
                List<Map<String, Object>> eventsData = objectMapper.readValue(is, new TypeReference<>() {});
                for (Map<String, Object> map : eventsData) {
                    String titre = (String) map.get("titre");
                    String description = (String) map.get("description");
                    String typeStr = (String) map.get("type");
                    String edition = (String) map.get("edition");
                    String dateDebutStr = (String) map.get("dateDebut");
                    String dateFinStr = (String) map.get("dateFin");
                    String statutStr = (String) map.getOrDefault("statut", "TERMINE");
                    String statutValStr = (String) map.getOrDefault("statutValidation", "VALIDE");
                    String dateValStr = (String) map.get("dateValidation");
                    String valideurEmail = (String) map.get("valideurEmail");
                    @SuppressWarnings("unchecked")
                    List<String> orgEmails = (List<String>) map.get("organisateursEmails");
                    String canalTitre = (String) map.get("canalTitre");
                    String lieu = (String) map.getOrDefault("lieu", "FSBM Casablanca, Salle des Actes");
                    String lienWebinaire = (String) map.get("lienWebinaire");
                    String programmeDetaille = (String) map.get("programmeDetaille");

                    boolean existe = evenementRepository.findAll().stream()
                            .anyMatch(e -> e.getTitre().equalsIgnoreCase(titre));

                    if (!existe) {
                        Membre valideur = (valideurEmail != null)
                                ? membreRepository.findByEmailIgnoreCase(valideurEmail).orElse(null)
                                : null;

                        Set<Membre> organisateurs = new HashSet<>();
                        if (orgEmails != null) {
                            for (String oe : orgEmails) {
                                membreRepository.findByEmailIgnoreCase(oe).ifPresent(organisateurs::add);
                            }
                        }

                        EvenementScientifique ev = EvenementScientifique.builder()
                                .titre(titre)
                                .description(description)
                                .type(TypeEvenement.valueOf(typeStr))
                                .edition(edition)
                                .dateDebut(LocalDateTime.parse(dateDebutStr))
                                .dateFin(LocalDateTime.parse(dateFinStr))
                                .lieu(lieu)
                                .lienWebinaire(lienWebinaire)
                                .programmeDetaille(programmeDetaille)
                                .statut(StatutEvenement.valueOf(statutStr))
                                .statutValidation(StatutValidationEvenement.valueOf(statutValStr))
                                .dateValidation(dateValStr != null ? LocalDateTime.parse(dateValStr) : LocalDateTime.now())
                                .valideur(valideur)
                                .organisateurs(organisateurs)
                                .build();

                        ev = evenementRepository.save(ev);

                        if (canalTitre != null) {
                            CanalDiscussion canal = CanalDiscussion.builder()
                                    .titre(canalTitre)
                                    .typeCanal(TypeCanal.EVENEMENT)
                                    .evenement(ev)
                                    .dateCreation(LocalDateTime.now())
                                    .participants(new HashSet<>(organisateurs))
                                    .build();
                            canalDiscussionRepository.save(canal);
                        }

                        log.info("✅ Événement réel créé : {}", titre);
                    }
                }

                // Mettre à jour les lieux pour tous les événements existants qui ont un lieu vide
                for (EvenementScientifique ev : evenementRepository.findAll()) {
                    if (ev.getLieu() == null || ev.getLieu().isBlank()) {
                        String t = ev.getTitre() != null ? ev.getTitre().toLowerCase() : "";
                        if (t.contains("iot")) {
                            ev.setLieu("Salle des Séminaires, FSBM Casablanca");
                        } else if (t.contains("icais")) {
                            ev.setLieu("Amphithéâtre 1, FSBM Casablanca");
                        } else if (t.contains("doctorale")) {
                            ev.setLieu("Salle des Thèses, FSBM Casablanca");
                        } else if (t.contains("ia et la décision")) {
                            ev.setLieu("Amphithéâtre 1, FSBM Casablanca");
                        } else {
                            ev.setLieu("FSBM Casablanca");
                        }
                        evenementRepository.save(ev);
                        log.info("📍 Lieu mis à jour pour l'événement #{}: {}", ev.getId(), ev.getLieu());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Erreur lors du seeding des événements : {}", e.getMessage(), e);
        }
    }

    private void seedPublications() {
        try {
            ClassPathResource resource = new ClassPathResource("data/real_lab/publications.json");
            if (!resource.exists()) return;

            try (InputStream is = resource.getInputStream()) {
                List<Map<String, Object>> pubsData = objectMapper.readValue(is, new TypeReference<>() {});
                for (Map<String, Object> map : pubsData) {
                    String titre = (String) map.get("titre");
                    String resume = (String) map.get("resume");
                    String lienDoi = (String) map.get("lienDoi");
                    Integer annee = (Integer) map.get("annee");
                    String equipeNom = (String) map.get("equipeNom");
                    @SuppressWarnings("unchecked")
                    List<String> auteursEmails = (List<String>) map.get("auteursInternesEmails");
                    @SuppressWarnings("unchecked")
                    List<String> coAuteursExternes = (List<String>) map.get("coAuteursExternes");
                    String typeStr = (String) map.get("type");
                    TypePublication type = TypePublication.ARTICLE_JOURNAL;
                    if (typeStr != null) {
                        try {
                            type = TypePublication.valueOf(typeStr);
                        } catch (Exception ignored) {}
                    }

                    boolean existe = publicationRepository.findAll().stream()
                            .anyMatch(p -> p.getTitre().equalsIgnoreCase(titre));

                    if (!existe) {
                        Equipe eq = (equipeNom != null)
                                ? equipeRepository.findByNomIgnoreCase(equipeNom).orElse(null)
                                : null;

                        Set<Membre> auteurs = new HashSet<>();
                        if (auteursEmails != null) {
                            for (String ae : auteursEmails) {
                                membreRepository.findByEmailIgnoreCase(ae).ifPresent(auteurs::add);
                            }
                        }

                        Publication pub = Publication.builder()
                                .titre(titre)
                                .type(type)
                                .resume(resume)
                                .lienDoi(lienDoi)
                                .annee(annee != null ? annee : 2024)
                                .equipe(eq)
                                .coAuteursExternes(coAuteursExternes != null ? coAuteursExternes : new ArrayList<>())
                                .auteurs(auteurs)
                                .build();

                        publicationRepository.save(pub);
                        log.info("✅ Publication réelle créée : {}", titre);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Erreur lors du seeding des publications : {}", e.getMessage(), e);
        }
    }
}
