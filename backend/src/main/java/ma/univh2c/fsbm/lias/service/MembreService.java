package ma.univh2c.fsbm.lias.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.univh2c.fsbm.lias.dto.*;
import ma.univh2c.fsbm.lias.entity.*;
import ma.univh2c.fsbm.lias.enums.*;
import ma.univh2c.fsbm.lias.exception.ConflitEtatException;
import ma.univh2c.fsbm.lias.exception.RegleMetierException;
import ma.univh2c.fsbm.lias.exception.RessourceIntrouvableException;
import ma.univh2c.fsbm.lias.repository.*;
import ma.univh2c.fsbm.lias.security.SecurityService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MembreService {

    private final MembreRepository membreRepository;
    private final EquipeRepository equipeRepository;
    private final MandatRepository mandatRepository;
    private final AffectationRoleRepository affectationRoleRepository;
    private final PeriodeAffiliationRepository periodeAffiliationRepository;
    private final HistoriqueStatutRepository historiqueStatutRepository;
    private final HistoriqueProfilRepository historiqueProfilRepository;
    private final JetonSecuriteRepository jetonRepository;
    private final FileStorageService fileStorageService;
    private final EmailService emailService;
    private final SecurityService securityService;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Transactional(readOnly = true)
    public PageDTO<MembreInterneDTO> rechercherMembres(String q, StatutMembre statut, EtatCompte etatCompte, Long equipeId, Pageable pageable) {
        Specification<Membre> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();

            if (q != null && !q.isBlank()) {
                String pattern = "%" + q.toLowerCase().trim() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("nom")), pattern),
                        cb.like(cb.lower(root.get("prenom")), pattern),
                        cb.like(cb.lower(root.get("email")), pattern)
                ));
            }
            if (statut != null) {
                predicates.add(cb.equal(root.get("statut"), statut));
            }
            if (etatCompte != null) {
                predicates.add(cb.equal(root.get("etatCompte"), etatCompte));
            }
            if (equipeId != null) {
                predicates.add(cb.equal(root.get("equipeActuelle").get("id"), equipeId));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        Page<Membre> page = membreRepository.findAll(spec, pageable);
        return PageDTO.from(page, page.getContent().stream().map(this::convertirEnInterneDTO).collect(Collectors.toList()));
    }

    @Transactional(readOnly = true)
    public MembreInterneDTO getMembreParId(Long id) {
        Membre m = membreRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Membre introuvable avec l'id: " + id));
        return convertirEnInterneDTO(m);
    }

    @Transactional(readOnly = true)
    public MembreProfilDTO getMonProfil() {
        Long currentId = securityService.getIdUtilisateurConnecte();
        if (currentId == null) throw new RessourceIntrouvableException("Non authentifié");

        Membre m = membreRepository.findById(currentId)
                .orElseThrow(() -> new RessourceIntrouvableException("Membre introuvable"));
        return convertirEnProfilDTO(m);
    }

    @Transactional
    public MembreProfilDTO modifierMonProfil(MembreModificationRequest request) {
        Long currentId = securityService.getIdUtilisateurConnecte();
        if (currentId == null) throw new RessourceIntrouvableException("Non authentifié");

        Membre m = membreRepository.findById(currentId)
                .orElseThrow(() -> new RessourceIntrouvableException("Membre introuvable"));

        // Historisation de l'état précédent du profil
        try {
            Map<String, Object> etatPrecedent = new HashMap<>();
            etatPrecedent.put("nom", m.getNom());
            etatPrecedent.put("prenom", m.getPrenom());
            etatPrecedent.put("email", m.getEmail());
            etatPrecedent.put("photo", m.getPhoto());
            etatPrecedent.put("biographie", m.getBiographie());
            etatPrecedent.put("centresInteret", m.getCentresInteret());
            etatPrecedent.put("etablissementOrigine", m.getEtablissementOrigine());
            etatPrecedent.put("laboratoireOrigine", m.getLaboratoireOrigine());

            HistoriqueProfil hist = HistoriqueProfil.builder()
                    .dateModification(LocalDateTime.now())
                    .donneesModifiees(objectMapper.writeValueAsString(etatPrecedent))
                    .membre(m)
                    .build();
            historiqueProfilRepository.save(hist);
        } catch (Exception e) {
            log.warn("Impossible d'historiser le profil: {}", e.getMessage());
        }

        if (request.getNom() != null && !request.getNom().isBlank()) {
            m.setNom(request.getNom().trim());
        }
        if (request.getPrenom() != null && !request.getPrenom().isBlank()) {
            m.setPrenom(request.getPrenom().trim());
        }
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String newEmail = request.getEmail().trim().toLowerCase();
            if (!newEmail.equalsIgnoreCase(m.getEmail())) {
                if (membreRepository.findByEmailIgnoreCase(newEmail).isPresent()) {
                    throw new ConflitEtatException("Cette adresse email est déjà utilisée par un autre compte");
                }
                m.setEmail(newEmail);
            }
        }

        if (request.getPhoto() != null) {
            m.setPhoto(request.getPhoto().isBlank() ? null : request.getPhoto());
        }
        if (request.getBiographie() != null) m.setBiographie(request.getBiographie());
        if (request.getCentresInteret() != null) m.setCentresInteret(request.getCentresInteret());
        if (request.getEtablissementOrigine() != null) m.setEtablissementOrigine(request.getEtablissementOrigine());
        if (request.getLaboratoireOrigine() != null) m.setLaboratoireOrigine(request.getLaboratoireOrigine());

        Membre saved = membreRepository.save(m);
        return convertirEnProfilDTO(saved);
    }

    @Transactional
    public MembreProfilDTO mettreAJourPhoto(Long id, MultipartFile fichier) {
        Membre m = membreRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Membre introuvable"));

        String chemin = fileStorageService.stockerFichier(fichier, "avatars");
        m.setPhoto("/uploads/" + chemin);
        Membre saved = membreRepository.save(m);
        return convertirEnProfilDTO(saved);
    }

    @Transactional
    public MembreProfilDTO supprimerPhoto(Long id) {
        Membre m = membreRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Membre introuvable"));
        m.setPhoto(null);
        Membre saved = membreRepository.save(m);
        return convertirEnProfilDTO(saved);
    }

    @Transactional(readOnly = true)
    public HistoriqueMembreDTO getHistoriqueMembre(Long id) {
        Membre m = membreRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Membre introuvable"));

        List<HistoriqueMembreDTO.EntreeHistoriqueDTO> entrees = new ArrayList<>();

        // Affiliations
        for (PeriodeAffiliation p : m.getPeriodesAffiliation()) {
            entrees.add(HistoriqueMembreDTO.EntreeHistoriqueDTO.builder()
                    .date(p.getDateDebut())
                    .type(TypeEntreeHistorique.AFFILIATION_DEBUT)
                    .libelle("Début d'affiliation au laboratoire LIAS")
                    .build());
            if (p.getDateFin() != null) {
                entrees.add(HistoriqueMembreDTO.EntreeHistoriqueDTO.builder()
                        .date(p.getDateFin())
                        .type(TypeEntreeHistorique.AFFILIATION_FIN)
                        .libelle("Fin de la période d'affiliation")
                        .build());
            }
        }

        // Changements de statut
        for (HistoriqueStatut s : m.getHistoriqueStatuts()) {
            entrees.add(HistoriqueMembreDTO.EntreeHistoriqueDTO.builder()
                    .date(s.getDateChangement())
                    .type(TypeEntreeHistorique.CHANGEMENT_STATUT)
                    .libelle("Changement de statut : " + s.getAncienStatut() + " -> " + s.getNouveauStatut())
                    .build());
        }

        // Mandats
        for (Mandat mandat : m.getMandats()) {
            String nomEq = mandat.getEquipe() != null ? " (" + mandat.getEquipe().getNom() + ")" : "";
            entrees.add(HistoriqueMembreDTO.EntreeHistoriqueDTO.builder()
                    .date(mandat.getDateDebut())
                    .type(TypeEntreeHistorique.MANDAT_DEBUT)
                    .libelle("Début mandat : " + mandat.getTypeMandat() + nomEq)
                    .build());
            if (mandat.getDateFin() != null) {
                entrees.add(HistoriqueMembreDTO.EntreeHistoriqueDTO.builder()
                        .date(mandat.getDateFin())
                        .type(TypeEntreeHistorique.MANDAT_FIN)
                        .libelle("Fin mandat : " + mandat.getTypeMandat() + nomEq)
                        .build());
            }
        }

        // Rôles
        for (AffectationRole a : m.getAffectationsRole()) {
            String nomEq = a.getEquipe() != null ? a.getEquipe().getNom() : "";
            entrees.add(HistoriqueMembreDTO.EntreeHistoriqueDTO.builder()
                    .date(a.getDateDebut())
                    .type(TypeEntreeHistorique.ROLE_DEBUT)
                    .libelle("Affectation à l'équipe " + nomEq)
                    .build());
            if (a.getDateFin() != null) {
                entrees.add(HistoriqueMembreDTO.EntreeHistoriqueDTO.builder()
                        .date(a.getDateFin())
                        .type(TypeEntreeHistorique.ROLE_FIN)
                        .libelle("Départ de l'équipe " + nomEq)
                        .build());
            }
        }

        entrees.sort(Comparator.comparing(HistoriqueMembreDTO.EntreeHistoriqueDTO::getDate));

        return HistoriqueMembreDTO.builder()
                .membreId(m.getId())
                .entrees(entrees)
                .build();
    }

    @Transactional
    public void changerStatut(Long id, StatutMembre nouveauStatut) {
        Membre m = membreRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Membre introuvable"));

        if (m.getEtatCompte() != EtatCompte.ACTIF) {
            throw new ConflitEtatException("Impossible de modifier le statut d'un compte non actif");
        }

        if (m.getStatut() == nouveauStatut) return;

        HistoriqueStatut hist = HistoriqueStatut.builder()
                .ancienStatut(m.getStatut())
                .nouveauStatut(nouveauStatut)
                .dateChangement(LocalDate.now())
                .membre(m)
                .build();
        historiqueStatutRepository.save(hist);

        m.setStatut(nouveauStatut);
        membreRepository.save(m);

        notificationService.creerNotification(
                m,
                "Mise à jour de votre statut",
                "Votre statut de chercheur au sein du laboratoire LIAS est désormais : " + nouveauStatut.name() + ".",
                TypeNotification.MEMBRE,
                "/profil"
        );
    }

    @Transactional
    public void affecterEquipe(Long id, AffectationEquipeRequest request) {
        Membre m = membreRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Membre introuvable"));

        if (request == null || request.getEquipeId() == null) {
            throw new RegleMetierException("L'identifiant de l'équipe est requis");
        }
        Long equipeId = request.getEquipeId();

        Equipe eq = equipeRepository.findById(equipeId)
                .orElseThrow(() -> new RessourceIntrouvableException("Équipe introuvable"));

        // Clôturer l'ancienne affectation de rôle si elle existe
        affectationRoleRepository.findByMembreIdAndDateFinIsNull(m.getId()).ifPresent(aff -> {
            aff.cloturerRole(LocalDate.now());
            affectationRoleRepository.save(aff);
        });

        AffectationRole nouvelleAffectation = AffectationRole.builder()
                .typeRole(TypeRole.MEMBRE_EQUIPE)
                .dateDebut(LocalDate.now())
                .membre(m)
                .equipe(eq)
                .build();
        affectationRoleRepository.save(nouvelleAffectation);

        m.setEquipeActuelle(eq);
        membreRepository.save(m);

        notificationService.creerNotification(
                m,
                "Affectation à l'équipe " + eq.getNom(),
                "Vous avez été affecté(e) à l'équipe de recherche " + eq.getNom() + ".",
                TypeNotification.EQUIPE,
                "/profil"
        );
    }

    @Transactional
    public void promouvoirChefEquipe(Long id, PromotionRequest request) {
        Membre m = membreRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Membre introuvable"));

        Equipe eq = equipeRepository.findById(request.getEquipeId())
                .orElseThrow(() -> new RessourceIntrouvableException("Équipe introuvable"));

        // Clôturer l'affectation MEMBRE_EQUIPE active
        affectationRoleRepository.findByMembreIdAndDateFinIsNull(m.getId()).ifPresent(aff -> {
            aff.cloturerRole(LocalDate.now());
            affectationRoleRepository.save(aff);
        });

        // Clôturer l'ancien chef d'équipe s'il y en avait un
        mandatRepository.findByTypeMandatAndEquipeIdAndDateFinIsNull(TypeMandat.CHEF_EQUIPE, eq.getId()).ifPresent(mandatSortant -> {
            mandatSortant.cloturerMandat(LocalDate.now());
            mandatRepository.save(mandatSortant);

            // L'ancien chef redevient simple membre
            AffectationRole ancienChefAff = AffectationRole.builder()
                    .typeRole(TypeRole.MEMBRE_EQUIPE)
                    .dateDebut(LocalDate.now())
                    .membre(mandatSortant.getMembre())
                    .equipe(eq)
                    .build();
            affectationRoleRepository.save(ancienChefAff);
        });

        Mandat nouveauMandat = Mandat.builder()
                .typeMandat(TypeMandat.CHEF_EQUIPE)
                .dateDebut(LocalDate.now())
                .membre(m)
                .equipe(eq)
                .build();
        mandatRepository.save(nouveauMandat);

        m.setEquipeActuelle(eq);
        membreRepository.save(m);
    }

    @Transactional
    public void declarerDepart(Long id, LocalDate dateDepart) {
        Membre m = membreRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Membre introuvable"));

        // Vérifier qu'il n'est pas le Directeur actif
        boolean estDirecteurActif = mandatRepository.findByMembreIdAndDateFinIsNull(m.getId())
                .stream().anyMatch(mandat -> mandat.getTypeMandat() == TypeMandat.DIRECTEUR && mandat.estActif());
        if (estDirecteurActif) {
            throw new RegleMetierException("Impossible de déclarer le départ du Directeur en mandat actif. Clôturez d'abord son mandat.");
        }

        LocalDate dateEffective = dateDepart != null ? dateDepart : LocalDate.now();

        // Clôturer période d'affiliation active
        periodeAffiliationRepository.findByMembreIdAndDateFinIsNull(m.getId()).ifPresent(p -> {
            p.cloturerPeriode(dateEffective);
            periodeAffiliationRepository.save(p);
        });

        // Clôturer mandats et rôles actifs
        mandatRepository.findByMembreIdAndDateFinIsNull(m.getId()).forEach(mandat -> {
            mandat.cloturerMandat(dateEffective);
            mandatRepository.save(mandat);
        });
        affectationRoleRepository.findByMembreIdAndDateFinIsNull(m.getId()).ifPresent(aff -> {
            aff.cloturerRole(dateEffective);
            affectationRoleRepository.save(aff);
        });

        m.desactiverCompte(dateEffective);
        membreRepository.save(m);

        jetonRepository.revoquerTousJetonsDuMembre(m.getId());

        notificationService.creerNotification(
                m,
                "Départ du laboratoire LIAS",
                "Votre départ à la date du " + dateEffective + " a été enregistré dans le système.",
                TypeNotification.MEMBRE,
                "/profil"
        );
    }

    @Transactional
    public void mettreALaRetraite(Long id, LocalDate dateRetraite) {
        Membre m = membreRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Membre introuvable"));

        LocalDate dateEffective = dateRetraite != null ? dateRetraite : LocalDate.now();

        periodeAffiliationRepository.findByMembreIdAndDateFinIsNull(m.getId()).ifPresent(p -> {
            p.cloturerPeriode(dateEffective);
            periodeAffiliationRepository.save(p);
        });

        mandatRepository.findByMembreIdAndDateFinIsNull(m.getId()).forEach(mandat -> {
            mandat.cloturerMandat(dateEffective);
            mandatRepository.save(mandat);
        });
        affectationRoleRepository.findByMembreIdAndDateFinIsNull(m.getId()).ifPresent(aff -> {
            aff.cloturerRole(dateEffective);
            affectationRoleRepository.save(aff);
        });

        m.gelerCompte(dateEffective);
        membreRepository.save(m);

        jetonRepository.revoquerTousJetonsDuMembre(m.getId());

        notificationService.creerNotification(
                m,
                "Statut de chercheur honoraire / retraité",
                "Votre profil a été configuré en statut honoraire / retraité au sein du laboratoire LIAS.",
                TypeNotification.MEMBRE,
                "/profil"
        );
    }

    @Transactional
    public void reactiverCompte(Long id, LocalDate dateRetour) {
        Membre m = membreRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Membre introuvable"));

        if (m.getEtatCompte() == EtatCompte.GELE) {
            throw new ConflitEtatException("Un compte gelé (retraité) ne peut pas être réactivé");
        }

        LocalDate dateEffective = dateRetour != null ? dateRetour : LocalDate.now();

        PeriodeAffiliation nouvellePeriode = PeriodeAffiliation.builder()
                .dateDebut(dateEffective)
                .membre(m)
                .build();
        periodeAffiliationRepository.save(nouvellePeriode);

        m.reactiverCompte();
        membreRepository.save(m);

        notificationService.creerNotification(
                m,
                "Réactivation de compte",
                "Votre compte au sein du laboratoire LIAS a été réactivé avec succès.",
                TypeNotification.MEMBRE,
                "/profil"
        );
    }

    @Transactional
    public void renvoyerAcces(Long id) {
        Membre m = membreRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Membre introuvable"));

        String motDePasseTemporaire = "Lias@" + (int)(Math.random() * 900000 + 100000);
        m.setMotDePasse(passwordEncoder.encode(motDePasseTemporaire));
        m.setDoitChangerMotDePasse(true);
        membreRepository.save(m);

        emailService.envoyerEmailAcces(m.getEmail(), m.getPrenom() + " " + m.getNom(), motDePasseTemporaire);
    }

    @Transactional(readOnly = true)
    public PageDTO<CompteAdminDTO> listerComptesPourAdmin(StatutMembre statut, EtatCompte etatCompte, Pageable pageable) {
        Specification<Membre> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            if (statut != null) predicates.add(cb.equal(root.get("statut"), statut));
            if (etatCompte != null) predicates.add(cb.equal(root.get("etatCompte"), etatCompte));
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        Page<Membre> page = membreRepository.findAll(spec, pageable);
        return PageDTO.from(page, page.getContent().stream().map(this::convertirEnCompteAdminDTO).collect(Collectors.toList()));
    }

    @Transactional
    public CompteAdminDTO creerMembreParAdmin(AdminCreationCompteRequest request) {
        if (membreRepository.existsByEmail(request.getEmail())) {
            throw new RegleMetierException("Un compte avec cet email existe déjà : " + request.getEmail());
        }
        String motDePasseTemporaire = "Password123!";
        Membre m = Membre.builder()
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .email(request.getEmail().toLowerCase().trim())
                .motDePasse(passwordEncoder.encode(motDePasseTemporaire))
                .roleSysteme(request.getRoleSysteme() != null ? request.getRoleSysteme() : RoleSysteme.UTILISATEUR)
                .statut(request.getStatut() != null ? request.getStatut() : StatutMembre.PERMANENT)
                .etatCompte(EtatCompte.ACTIF)
                .dateAffiliation(LocalDate.now())
                .doitChangerMotDePasse(true)
                .build();

        if (request.getEquipeId() != null) {
            equipeRepository.findById(request.getEquipeId()).ifPresent(m::setEquipeActuelle);
        }

        Membre saved = membreRepository.save(m);

        PeriodeAffiliation periode = PeriodeAffiliation.builder()
                .dateDebut(LocalDate.now())
                .membre(saved)
                .build();
        periodeAffiliationRepository.save(periode);

        if (saved.getEquipeActuelle() != null) {
            AffectationRole affectation = AffectationRole.builder()
                    .typeRole(TypeRole.MEMBRE_EQUIPE)
                    .dateDebut(LocalDate.now())
                    .membre(saved)
                    .equipe(saved.getEquipeActuelle())
                    .build();
            affectationRoleRepository.save(affectation);
        }

        return convertirEnCompteAdminDTO(saved);
    }

    @Transactional
    public String reinitialiserMotDePasseParAdmin(Long id) {
        Membre m = membreRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Membre introuvable avec l'id : " + id));
        String motDePasse = "Password123!";
        m.setMotDePasse(passwordEncoder.encode(motDePasse));
        m.setDoitChangerMotDePasse(true);
        membreRepository.save(m);
        jetonRepository.revoquerTousJetonsDuMembre(m.getId());
        return motDePasse;
    }

    public CompteAdminDTO convertirEnCompteAdminDTO(Membre m) {
        if (m == null) return null;
        return CompteAdminDTO.builder()
                .id(m.getId())
                .nom(m.getNom())
                .prenom(m.getPrenom())
                .email(m.getEmail())
                .roleSysteme(m.getRoleSysteme())
                .statut(m.getStatut())
                .etatCompte(m.getEtatCompte())
                .dateAffiliation(m.getDateAffiliation())
                .equipeNom(m.getEquipeActuelle() != null ? m.getEquipeActuelle().getNom() : null)
                .createdAt(m.getCreatedAt())
                .build();
    }

    public MembreInterneDTO convertirEnInterneDTO(Membre m) {
        return MembreInterneDTO.builder()
                .id(m.getId())
                .photo(m.getPhoto())
                .nom(m.getNom())
                .prenom(m.getPrenom())
                .email(m.getEmail())
                .roleSysteme(m.getRoleSysteme())
                .statut(m.getStatut())
                .etatCompte(m.getEtatCompte())
                .etablissementOrigine(m.getEtablissementOrigine())
                .laboratoireOrigine(m.getLaboratoireOrigine())
                .biographie(m.getBiographie())
                .centresInteret(m.getCentresInteret() != null ? new ArrayList<>(m.getCentresInteret()) : new ArrayList<>())
                .dateEmbauche(m.getDateEmbauche())
                .dateAffiliation(m.getDateAffiliation())
                .dateRetraite(m.getDateRetraite())
                .dateDepart(m.getDateDepart())
                .equipeId(m.getEquipeActuelle() != null ? m.getEquipeActuelle().getId() : null)
                .equipeNom(m.getEquipeActuelle() != null ? m.getEquipeActuelle().getNom() : null)
                .build();
    }

    public MembreProfilDTO convertirEnProfilDTO(Membre m) {
        return MembreProfilDTO.builder()
                .id(m.getId())
                .photo(m.getPhoto())
                .nom(m.getNom())
                .prenom(m.getPrenom())
                .email(m.getEmail())
                .roleSysteme(m.getRoleSysteme())
                .statut(m.getStatut())
                .etatCompte(m.getEtatCompte())
                .etablissementOrigine(m.getEtablissementOrigine())
                .laboratoireOrigine(m.getLaboratoireOrigine())
                .biographie(m.getBiographie())
                .centresInteret(m.getCentresInteret() != null ? new ArrayList<>(m.getCentresInteret()) : new ArrayList<>())
                .dateNaissance(m.getDateNaissance())
                .dateEmbauche(m.getDateEmbauche())
                .dateAffiliation(m.getDateAffiliation())
                .dateRetraite(m.getDateRetraite())
                .dateDepart(m.getDateDepart())
                .equipeId(m.getEquipeActuelle() != null ? m.getEquipeActuelle().getId() : null)
                .equipeNom(m.getEquipeActuelle() != null ? m.getEquipeActuelle().getNom() : null)
                .build();
    }

    public String determinerRoleLibelle(Membre m) {
        if (m == null) return "";

        // 1. Mandats actifs (Directeur, Vice-Directeur, Chef d'équipe)
        try {
            List<Mandat> mandatsActifs = mandatRepository.findByMembreIdAndDateFinIsNull(m.getId());
            for (Mandat mandat : mandatsActifs) {
                if (mandat.estActif()) {
                    if (mandat.getTypeMandat() == TypeMandat.DIRECTEUR) {
                        return "Directeur";
                    } else if (mandat.getTypeMandat() == TypeMandat.VICE_DIRECTEUR) {
                        return "Vice-Directeur";
                    } else if (mandat.getTypeMandat() == TypeMandat.CHEF_EQUIPE) {
                        return "Chef d'équipe";
                    }
                }
            }
        } catch (Exception ignored) {}

        // 2. Administrateur système
        if (m.getRoleSysteme() == RoleSysteme.ADMIN) {
            return "Admin";
        }

        // 3. Statut académique
        if (m.getStatut() != null) {
            switch (m.getStatut()) {
                case DOCTORANT:
                    return "Doctorant";
                case ASSOCIE:
                    return "Chercheur associé";
                case PERMANENT:
                    return "Membre permanent";
                default:
                    return m.getStatut().name();
            }
        }

        return "Membre";
    }

    public MembreResumeDTO convertirEnResumeDTO(Membre m) {
        if (m == null) return null;

        String roleLibelle = determinerRoleLibelle(m);
        String eqNom = null;
        Long eqId = null;
        try {
            if (m.getEquipeActuelle() != null) {
                eqNom = m.getEquipeActuelle().getNom();
                eqId = m.getEquipeActuelle().getId();
            }
        } catch (Exception ignored) {}

        return MembreResumeDTO.builder()
                .id(m.getId())
                .nom(m.getNom())
                .prenom(m.getPrenom())
                .photo(m.getPhoto())
                .email(m.getEmail())
                .roleLibelle(roleLibelle)
                .statut(m.getStatut())
                .roleSysteme(m.getRoleSysteme())
                .equipeNom(eqNom)
                .equipeId(eqId)
                .build();
    }
}
