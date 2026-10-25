package ma.univh2c.fsbm.lias.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.univh2c.fsbm.lias.entity.*;
import ma.univh2c.fsbm.lias.enums.*;
import ma.univh2c.fsbm.lias.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Component
@org.springframework.core.annotation.Order(1)
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final LaboratoireRepository laboratoireRepository;
    private final MembreRepository membreRepository;
    private final EquipeRepository equipeRepository;
    private final MandatRepository mandatRepository;
    private final AffectationRoleRepository affectationRoleRepository;
    private final PeriodeAffiliationRepository periodeRepository;
    private final PublicationRepository publicationRepository;
    private final EvenementScientifiqueRepository evenementRepository;
    private final ActiviteRepository activiteRepository;
    private final PartenaireRepository partenaireRepository;
    private final ConventionRepository conventionRepository;
    private final MaterielRepository materielRepository;
    private final ReunionRepository reunionRepository;
    private final CanalDiscussionRepository canalRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        laboratoireRepository.findAll().forEach(l -> {
            if (l.getNom() == null || !l.getNom().equals("Laboratoire d'Intelligence Artificielle et Systèmes")) {
                l.setNom("Laboratoire d'Intelligence Artificielle et Systèmes");
                l.setAcronyme("LIAS");
                laboratoireRepository.save(l);
                log.info("Nom du laboratoire synchronisé : {}", l.getNom());
            }
        });

        if (laboratoireRepository.count() > 0) {
            log.info("Base de donnÃƒÂ©es dÃƒÂ©jÃƒÂ  initialisÃƒÂ©e, passage de la graine de donnÃƒÂ©es.");
            return;
        }

        log.info("Initialisation complÃƒÂ¨te des donnÃƒÂ©es de dÃƒÂ©monstration du laboratoire LIAS...");

        // 1. Laboratoire
        Laboratoire labo = Laboratoire.builder()
                .nom("Laboratoire d'Intelligence Artificielle et Systèmes")
                .acronyme("LIAS")
                .etablissement("FacultÃƒÂ© des Sciences Ben M'Sik")
                .universite("UniversitÃƒÂ© Hassan II de Casablanca")
                .dateCreation(LocalDate.of(2010, 9, 15))
                .description("Le laboratoire LIAS de la FacultÃƒÂ© des Sciences Ben M'Sik dÃƒÂ©veloppe des recherches d'excellence en intelligence artificielle, science des donnÃƒÂ©es, systÃƒÂ¨mes distribuÃƒÂ©s et optimisation pour l'aide ÃƒÂ  la dÃƒÂ©cision.")
                .adresse("FacultÃƒÂ© des Sciences Ben M'Sik, Bd Cdt Driss El Harti, Casablanca")
                .emailContact("contact@lias.fsbm.ma")
                .telephone("+212 522 70 46 71")
                .siteWeb("http://lias.fsbm.ma")
                .build();
        laboratoireRepository.save(labo);

        // 2. Ãƒâ€°quipes
        Equipe sdia = Equipe.builder()
                .nom("Sciences des DonnÃƒÂ©es et IA (SDIA)")
                .description("Recherche avancÃƒÂ©e en Machine Learning, Deep Learning, traitement du langage naturel et Big Data Analytics.")
                .thematiques(List.of("Machine Learning", "Deep Learning", "NLP", "Big Data", "Computer Vision"))
                .build();
        sdia = equipeRepository.save(sdia);

        Equipe seiot = Equipe.builder()
                .nom("SystÃƒÂ¨mes EmbarquÃƒÂ©s et IoT (SEIOT)")
                .description("DÃƒÂ©veloppement de protocoles IoT, sÃƒÂ©curitÃƒÂ© des systÃƒÂ¨mes cyber-physiques et Edge Computing.")
                .thematiques(List.of("Internet des Objets", "Edge Computing", "SystÃƒÂ¨mes Temps RÃƒÂ©el", "SÃƒÂ©curitÃƒÂ© RÃƒÂ©seaux"))
                .build();
        seiot = equipeRepository.save(seiot);

        // Canaux d'ÃƒÂ©quipe
        CanalDiscussion canalSdia = CanalDiscussion.builder()
                .titre("Ãƒâ€°quipe SDIA")
                .typeCanal(TypeCanal.EQUIPE)
                .dateCreation(LocalDateTime.now())
                .equipe(sdia)
                .build();
        canalRepository.save(canalSdia);

        CanalDiscussion canalSeiot = CanalDiscussion.builder()
                .titre("Ãƒâ€°quipe SEIOT")
                .typeCanal(TypeCanal.EQUIPE)
                .dateCreation(LocalDateTime.now())
                .equipe(seiot)
                .build();
        canalRepository.save(canalSeiot);

        CanalDiscussion canalGeneral = CanalDiscussion.builder()
                .titre("Laboratoire LIAS (Général)")
                .typeCanal(TypeCanal.GENERAL)
                .dateCreation(LocalDateTime.now())
                .build();
        canalRepository.save(canalGeneral);

        // 3. Administrateur SystÃƒÂ¨me
        Membre admin = Membre.builder()
                .nom("SystÃƒÂ¨me")
                .prenom("Administrateur")
                .email("admin@lias.ma")
                .motDePasse(passwordEncoder.encode("Password123!"))
                .doitChangerMotDePasse(false)
                .roleSysteme(RoleSysteme.ADMIN)
                .statut(StatutMembre.PERMANENT)
                .etatCompte(EtatCompte.ACTIF)
                .etablissementOrigine("FSBM - Casablanca")
                .laboratoireOrigine("LIAS")
                .biographie("Compte technique d'administration globale de la plateforme LIAS.")
                .dateAffiliation(LocalDate.of(2010, 9, 15))
                .build();
        admin = membreRepository.save(admin);
        periodeRepository.save(PeriodeAffiliation.builder().dateDebut(LocalDate.of(2010, 9, 15)).membre(admin).build());

        // 4. Directeur du Laboratoire
        Membre directeur = Membre.builder()
                .nom("Bennani")
                .prenom("Karim")
                .email("directeur@lias.ma")
                .motDePasse(passwordEncoder.encode("Password123!"))
                .doitChangerMotDePasse(false)
                .roleSysteme(RoleSysteme.UTILISATEUR)
                .statut(StatutMembre.PERMANENT)
                .etatCompte(EtatCompte.ACTIF)
                .etablissementOrigine("FSBM - UniversitÃƒÂ© Hassan II")
                .laboratoireOrigine("LIAS")
                .biographie("Professeur de l'enseignement supÃƒÂ©rieur, Directeur du laboratoire LIAS. SpÃƒÂ©cialiste des systÃƒÂ¨mes d'aide ÃƒÂ  la dÃƒÂ©cision et des architectures Big Data.")
                .centresInteret(List.of("Gouvernance scientifique", "SystÃƒÂ¨mes dÃƒÂ©cisionnels", "IA Responsable"))
                .dateNaissance(LocalDate.of(1972, 4, 18))
                .dateEmbauche(LocalDate.of(2001, 9, 1))
                .dateAffiliation(LocalDate.of(2010, 9, 15))
                .equipeActuelle(sdia)
                .build();
        directeur = membreRepository.save(directeur);
        periodeRepository.save(PeriodeAffiliation.builder().dateDebut(LocalDate.of(2010, 9, 15)).membre(directeur).build());

        // Mandat Directeur actif
        Mandat mandatDir = Mandat.builder()
                .typeMandat(TypeMandat.DIRECTEUR)
                .dateDebut(LocalDate.of(2022, 1, 1))
                .membre(directeur)
                .build();
        mandatRepository.save(mandatDir);

        affectationRoleRepository.save(AffectationRole.builder()
                .typeRole(TypeRole.MEMBRE_EQUIPE)
                .dateDebut(LocalDate.of(2010, 9, 15))
                .membre(directeur)
                .equipe(sdia)
                .build());

        // 5. Chef d'ÃƒÂ©quipe SEIOT
        Membre chefSeiot = Membre.builder()
                .nom("Alami")
                .prenom("Mohamed")
                .email("prof.alami@lias.ma")
                .motDePasse(passwordEncoder.encode("Password123!"))
                .doitChangerMotDePasse(false)
                .roleSysteme(RoleSysteme.UTILISATEUR)
                .statut(StatutMembre.PERMANENT)
                .etatCompte(EtatCompte.ACTIF)
                .etablissementOrigine("FSBM - UniversitÃƒÂ© Hassan II")
                .laboratoireOrigine("LIAS")
                .biographie("Professeur en gÃƒÂ©nie informatique et rÃƒÂ©seaux, Chef de l'ÃƒÂ©quipe SEIOT.")
                .centresInteret(List.of("Internet des Objets", "RÃƒÂ©seaux de capteurs", "CybersÃƒÂ©curitÃƒÂ©"))
                .dateNaissance(LocalDate.of(1978, 8, 24))
                .dateEmbauche(LocalDate.of(2008, 10, 1))
                .dateAffiliation(LocalDate.of(2012, 1, 10))
                .equipeActuelle(seiot)
                .build();
        chefSeiot = membreRepository.save(chefSeiot);
        periodeRepository.save(PeriodeAffiliation.builder().dateDebut(LocalDate.of(2012, 1, 10)).membre(chefSeiot).build());

        Mandat mandatChef = Mandat.builder()
                .typeMandat(TypeMandat.CHEF_EQUIPE)
                .dateDebut(LocalDate.of(2021, 9, 1))
                .membre(chefSeiot)
                .equipe(seiot)
                .build();
        mandatRepository.save(mandatChef);

        // 6. Membre permanent SDIA
        Membre profBenjelloun = Membre.builder()
                .nom("Benjelloun")
                .prenom("Fatima-Zahra")
                .email("dr.benjelloun@lias.ma")
                .motDePasse(passwordEncoder.encode("Password123!"))
                .doitChangerMotDePasse(false)
                .roleSysteme(RoleSysteme.UTILISATEUR)
                .statut(StatutMembre.PERMANENT)
                .etatCompte(EtatCompte.ACTIF)
                .etablissementOrigine("FSBM - UniversitÃƒÂ© Hassan II")
                .laboratoireOrigine("LIAS")
                .biographie("Enseignante-chercheuse en Deep Learning et vision par ordinateur.")
                .centresInteret(List.of("Deep Learning", "Vision par ordinateur", "Imagerie mÃƒÂ©dicale"))
                .dateNaissance(LocalDate.of(1985, 3, 12))
                .dateEmbauche(LocalDate.of(2015, 9, 1))
                .dateAffiliation(LocalDate.of(2015, 9, 1))
                .equipeActuelle(sdia)
                .build();
        profBenjelloun = membreRepository.save(profBenjelloun);
        periodeRepository.save(PeriodeAffiliation.builder().dateDebut(LocalDate.of(2015, 9, 1)).membre(profBenjelloun).build());
        affectationRoleRepository.save(AffectationRole.builder()
                .typeRole(TypeRole.MEMBRE_EQUIPE)
                .dateDebut(LocalDate.of(2015, 9, 1))
                .membre(profBenjelloun)
                .equipe(sdia)
                .build());

        // 7. Membre associÃƒÂ©
        Membre associe = Membre.builder()
                .nom("Dupont")
                .prenom("Jean-Pierre")
                .email("associe.dupont@univ-paris.fr")
                .motDePasse(passwordEncoder.encode("Password123!"))
                .doitChangerMotDePasse(false)
                .roleSysteme(RoleSysteme.UTILISATEUR)
                .statut(StatutMembre.ASSOCIE)
                .etatCompte(EtatCompte.ACTIF)
                .etablissementOrigine("Sorbonne UniversitÃƒÂ© - Paris")
                .laboratoireOrigine("LIP6")
                .biographie("Chercheur associÃƒÂ© collaborant sur les projets d'optimisation distribuÃƒÂ©e.")
                .centresInteret(List.of("Calcul haute performance", "Optimisation combinatoire"))
                .dateAffiliation(LocalDate.of(2019, 1, 15))
                .build();
        associe = membreRepository.save(associe);
        periodeRepository.save(PeriodeAffiliation.builder().dateDebut(LocalDate.of(2019, 1, 15)).membre(associe).build());

        // 8. Doctorant
        Membre doctorant = Membre.builder()
                .nom("Karimi")
                .prenom("Yassine")
                .email("doctorant.karimi@lias.ma")
                .motDePasse(passwordEncoder.encode("Password123!"))
                .doitChangerMotDePasse(false)
                .roleSysteme(RoleSysteme.UTILISATEUR)
                .statut(StatutMembre.DOCTORANT)
                .etatCompte(EtatCompte.ACTIF)
                .etablissementOrigine("FSBM - UniversitÃƒÂ© Hassan II")
                .laboratoireOrigine("LIAS")
                .biographie("Doctorant en 3ÃƒÂ¨me annÃƒÂ©e travaillant sur l'apprentissage par renforcement pour les vÃƒÂ©hicules autonomes.")
                .centresInteret(List.of("Reinforcement Learning", "VÃƒÂ©hicules autonomes"))
                .dateAffiliation(LocalDate.of(2023, 10, 1))
                .equipeActuelle(sdia)
                .build();
        doctorant = membreRepository.save(doctorant);
        periodeRepository.save(PeriodeAffiliation.builder().dateDebut(LocalDate.of(2023, 10, 1)).membre(doctorant).build());
        affectationRoleRepository.save(AffectationRole.builder()
                .typeRole(TypeRole.MEMBRE_EQUIPE)
                .dateDebut(LocalDate.of(2023, 10, 1))
                .membre(doctorant)
                .equipe(sdia)
                .build());

        // 9. Partenaires et Conventions
        Partenaire part1 = Partenaire.builder()
                .nomInstitution("Sorbonne UniversitÃƒÂ©")
                .typeInstitution(TypeInstitution.UNIVERSITE)
                .pays("France")
                .contactPrincipal("Prof. Michel Bernard")
                .emailContact("contact-recherche@sorbonne-universite.fr")
                .build();
        part1 = partenaireRepository.save(part1);

        Convention conv1 = Convention.builder()
                .titre("Accord-cadre de coopÃƒÂ©ration scientifique en IA et Calcul DistribuÃƒÂ©")
                .dateSignature(LocalDate.of(2023, 1, 15))
                .dateExpiration(LocalDate.of(2027, 1, 14))
                .statut(StatutConvention.EN_COURS)
                .partenaire(part1)
                .build();
        conv1 = conventionRepository.save(conv1);

        // 10. Publications
        Publication pub1 = Publication.builder()
                .titre("Deep Reinforcement Learning for Autonomous Drone Navigation in GPS-Denied Environments")
                .annee(2025)
                .resume("This paper presents a novel deep reinforcement learning architecture enabling agile quadrotor navigation without relying on global positioning systems.")
                .lienDoi("https://doi.org/10.1109/TNNLS.2025.1048291")
                .coAuteursExternes(List.of("Prof. David Clark (MIT)"))
                .auteurs(Set.of(directeur, doctorant))
                .equipe(sdia)
                .convention(conv1)
                .build();
        publicationRepository.save(pub1);

        Publication pub2 = Publication.builder()
                .titre("Energy-Efficient Routing Protocols for Next-Generation Edge-IoT Infrastructure")
                .annee(2024)
                .resume("An adaptive routing algorithm designed to minimize latency and power consumption in dense wireless sensor deployments.")
                .lienDoi("https://doi.org/10.1016/j.comnet.2024.109842")
                .coAuteursExternes(List.of("Dr. Ahmed Mansour"))
                .auteurs(Set.of(chefSeiot))
                .equipe(seiot)
                .build();
        publicationRepository.save(pub2);

        // 11. Ãƒâ€°vÃƒÂ©nements scientifiques
        EvenementScientifique evt1 = EvenementScientifique.builder()
                .titre("ConfÃƒÂ©rence Internationale sur l'IA et la DÃƒÂ©cision MÃƒÂ©dicale (CIDM 2026)")
                .description("Rassemblement international de chercheurs et praticiens autour des innovations de l'IA en mÃƒÂ©decine.")
                .type(TypeEvenement.CONFERENCE)
                .dateDebut(LocalDateTime.of(2026, 11, 10, 9, 0))
                .dateFin(LocalDateTime.of(2026, 11, 12, 18, 0))
                .edition("Ãƒâ€°dition 2026")
                .lieu("Amphi 1, FSBM Casablanca")
                .statut(StatutEvenement.EN_PREPARATION)
                .statutValidation(StatutValidationEvenement.VALIDE)
                .organisateurs(Set.of(directeur, profBenjelloun))
                .convention(conv1)
                .build();
        evenementRepository.save(evt1);

        // 12. ActivitÃƒÂ©s
        Activite act1 = Activite.builder()
                .titre("SÃƒÂ©minaire doctoral sur l'ÃƒÂ©thique et la gouvernance de l'IA")
                .description("JournÃƒÂ©e de formation transversale pour les doctorants de la facultÃƒÂ©.")
                .type(TypeActivite.ENSEIGNEMENT)
                .lieu("Amphi 3, FSBM")
                .dateDebut(LocalDate.of(2026, 3, 20))
                .dateFin(LocalDate.of(2026, 3, 20))
                .membre(directeur)
                .equipe(sdia)
                .build();
        activiteRepository.save(act1);

        // 13. MatÃƒÂ©riel en stock
        Materiel mat1 = Materiel.builder()
                .designation("Station de calcul GPU NVIDIA RTX 4090 24GB")
                .dateArrivage(LocalDate.of(2025, 11, 1))
                .quantiteInitiale(4)
                .quantiteDisponible(3)
                .statut(StatutMateriel.EN_STOCK)
                .build();
        materielRepository.save(mat1);

        Materiel mat2 = Materiel.builder()
                .designation("Kit de dÃƒÂ©veloppement IoT LoRaWAN + Gateway")
                .dateArrivage(LocalDate.of(2025, 12, 10))
                .quantiteInitiale(10)
                .quantiteDisponible(10)
                .statut(StatutMateriel.EN_STOCK)
                .build();
        materielRepository.save(mat2);

        // 14. RÃƒÂ©unions
        Reunion reunion = Reunion.builder()
                .titre("Conseil de laboratoire - Bilan annuel et orientations")
                .dateReunion(LocalDateTime.now().plusDays(5).withHour(10).withMinute(0))
                .lieu("Salle de RÃ©union du Laboratoire LIAS")
                .ordreDuJour("1. Bilan des publications 2025\n2. PrÃƒÂ©paration du rapport annuel pour le budget\n3. Affectation des nouveaux arrivages de matÃƒÂ©riel\n4. Divers.")
                .statut(StatutReunion.PLANIFIEE)
                .organisateur(directeur)
                .participants(Set.of(directeur, chefSeiot, profBenjelloun))
                .build();
        reunionRepository.save(reunion);

        log.info("Initialisation terminÃƒÂ©e avec succÃƒÂ¨s !");
        log.info("Comptes de test disponibles : ");
        log.info(" - Administrateur : admin@lias.ma / Password123!");
        log.info(" - Directeur      : directeur@lias.ma / Password123!");
        log.info(" - Chef d'ÃƒÂ©quipe  : prof.alami@lias.ma / Password123!");
        log.info(" - Membre perm    : dr.benjelloun@lias.ma / Password123!");
        log.info(" - Membre associÃƒÂ© : associe.dupont@univ-paris.fr / Password123!");
        log.info(" - Doctorant      : doctorant.karimi@lias.ma / Password123!");
    }
}
