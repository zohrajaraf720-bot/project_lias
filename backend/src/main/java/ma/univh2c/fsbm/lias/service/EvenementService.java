package ma.univh2c.fsbm.lias.service;

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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EvenementService {

    private final EvenementScientifiqueRepository evenementRepository;
    private final ParticipationEvenementRepository participationRepository;
    private final MembreRepository membreRepository;
    private final ConventionRepository conventionRepository;
    private final CanalDiscussionRepository canalRepository;
    private final MandatRepository mandatRepository;
    private final NotificationService notificationService;
    private final SecurityService securityService;
    private final MembreService membreService;

    @Transactional(readOnly = true)
    public PageDTO<EvenementDTO> rechercherEvenements(TypeEvenement type, StatutEvenement statut, StatutValidationEvenement statutValidation, String edition, Pageable pageable) {
        Specification<EvenementScientifique> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            if (type != null) predicates.add(cb.equal(root.get("type"), type));
            if (statut != null) predicates.add(cb.equal(root.get("statut"), statut));
            if (statutValidation != null) predicates.add(cb.equal(root.get("statutValidation"), statutValidation));
            if (edition != null && !edition.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("edition")), "%" + edition.toLowerCase().trim() + "%"));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        Page<EvenementScientifique> page = evenementRepository.findAll(spec, pageable);
        return PageDTO.from(page, page.getContent().stream().map(this::convertirEnDTO).collect(Collectors.toList()));
    }

    @Transactional(readOnly = true)
    public List<EvenementPublicDTO> listerEvenementsPublics() {
        return evenementRepository.findByStatutValidation(StatutValidationEvenement.VALIDE).stream()
                .filter(e -> e.getStatut() != StatutEvenement.ARCHIVE)
                .map(this::convertirEnPublicDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EvenementPublicDTO getEvenementPublic(Long id) {
        EvenementScientifique e = evenementRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Événement introuvable"));
        if (e.getStatutValidation() != StatutValidationEvenement.VALIDE) {
            throw new RessourceIntrouvableException("Événement non disponible");
        }
        return convertirEnPublicDTO(e);
    }

    @Transactional(readOnly = true)
    public EvenementDTO getEvenement(Long id) {
        EvenementScientifique e = evenementRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Événement introuvable"));
        return convertirEnDTO(e);
    }

    @Transactional(readOnly = true)
    public List<EvenementDTO> listerEvenementsAValider() {
        return evenementRepository.findByStatutValidation(StatutValidationEvenement.EN_ATTENTE_VALIDATION).stream()
                .map(this::convertirEnDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EvenementDTO> listerEvenementsGouvernance() {
        return evenementRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt")).stream()
                .map(this::convertirEnDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public EvenementDTO creerEvenement(EvenementRequest request) {
        Long currentId = securityService.getIdUtilisateurConnecte();
        Membre createur = (currentId != null) ? membreRepository.findById(currentId).orElse(null) : null;

        Set<Membre> organisateurs = new HashSet<>();
        if (createur != null) {
            organisateurs.add(createur);
        }
        if (request.getOrganisateursIds() != null) {
            for (Long orgId : request.getOrganisateursIds()) {
                membreRepository.findById(orgId).ifPresent(organisateurs::add);
            }
        }

        Convention convention = null;
        if (request.getConventionId() != null) {
            convention = conventionRepository.findById(request.getConventionId())
                    .filter(c -> c.getStatut() == StatutConvention.EN_COURS)
                    .orElseThrow(() -> new RegleMetierException("La convention sélectionnée n'existe pas ou n'est pas EN_COURS"));
        }

        EvenementScientifique e = EvenementScientifique.builder()
                .titre(request.getTitre().trim())
                .description(request.getDescription())
                .type(request.getType())
                .dateDebut(request.getDateDebut())
                .dateFin(request.getDateFin())
                .edition(request.getEdition())
                .lieu(request.getLieu())
                .lienWebinaire(request.getLienWebinaire())
                .programmeDetaille(request.getProgrammeDetaille())
                .statut(StatutEvenement.EN_PREPARATION)
                .statutValidation(StatutValidationEvenement.EN_ATTENTE_VALIDATION)
                .organisateurs(organisateurs)
                .convention(convention)
                .build();

        EvenementScientifique saved = evenementRepository.save(e);

        // Création automatique du canal de discussion de l'événement
        CanalDiscussion canal = CanalDiscussion.builder()
                .titre("Événement : " + saved.getTitre())
                .typeCanal(TypeCanal.EVENEMENT)
                .dateCreation(LocalDateTime.now())
                .evenement(saved)
                .participants(new HashSet<>(organisateurs))
                .build();
        canalRepository.save(canal);

        // Notifier le Directeur pour validation
        mandatRepository.findByTypeMandatAndDateFinIsNull(TypeMandat.DIRECTEUR).forEach(m -> {
            if (m.estActif()) {
                notificationService.creerNotification(
                        m.getMembre(),
                        "Événement à valider",
                        "L'événement '" + saved.getTitre() + "' a été proposé et nécessite votre validation.",
                        TypeNotification.EVENEMENT,
                        "/evenements/" + saved.getId()
                );
            }
        });

        return convertirEnDTO(saved);
    }

    @Transactional
    public EvenementDTO modifierEvenement(Long id, EvenementRequest request) {
        EvenementScientifique e = evenementRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Événement introuvable"));

        if (e.estArchive()) {
            throw new ConflitEtatException("Impossible de modifier un événement archivé");
        }

        e.setTitre(request.getTitre().trim());
        e.setDescription(request.getDescription());
        e.setType(request.getType());
        e.setDateDebut(request.getDateDebut());
        e.setDateFin(request.getDateFin());
        e.setEdition(request.getEdition());
        e.setLieu(request.getLieu());
        e.setLienWebinaire(request.getLienWebinaire());
        e.setProgrammeDetaille(request.getProgrammeDetaille());

        if (request.getOrganisateursIds() != null) {
            Set<Membre> orgs = new HashSet<>();
            for (Long orgId : request.getOrganisateursIds()) {
                membreRepository.findById(orgId).ifPresent(orgs::add);
            }
            e.setOrganisateurs(orgs);
        }

        if (request.getConventionId() != null) {
            Convention convention = conventionRepository.findById(request.getConventionId())
                    .filter(c -> c.getStatut() == StatutConvention.EN_COURS)
                    .orElseThrow(() -> new RegleMetierException("La convention sélectionnée n'existe pas ou n'est pas EN_COURS"));
            e.setConvention(convention);
        } else {
            e.setConvention(null);
        }

        EvenementScientifique saved = evenementRepository.save(e);
        return convertirEnDTO(saved);
    }

    @Transactional
    public void validerEvenement(Long id, DecisionEvenementRequest request) {
        EvenementScientifique e = evenementRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Événement introuvable"));

        Long currentId = securityService.getIdUtilisateurConnecte();
        Membre directeur = currentId != null ? membreRepository.findById(currentId).orElse(null) : null;

        e.valider(directeur);
        evenementRepository.save(e);

        // Notifier les organisateurs
        for (Membre org : e.getOrganisateurs()) {
            notificationService.creerNotification(
                    org,
                    "Événement validé",
                    "Votre événement '" + e.getTitre() + "' a été validé par la Direction.",
                    TypeNotification.EVENEMENT,
                    "/evenements/" + e.getId()
            );
        }
    }

    @Transactional
    public void refuserEvenement(Long id, DecisionEvenementRequest request) {
        EvenementScientifique e = evenementRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Événement introuvable"));

        String commentaire = (request != null && request.getCommentaire() != null) ? request.getCommentaire() : "";
        if (commentaire.isBlank()) {
            throw new RegleMetierException("Un commentaire explicatif est obligatoire pour rejeter un événement");
        }

        Long currentId = securityService.getIdUtilisateurConnecte();
        Membre directeur = currentId != null ? membreRepository.findById(currentId).orElse(null) : null;

        e.rejeter(directeur, commentaire);
        evenementRepository.save(e);

        // Notifier les organisateurs
        for (Membre org : e.getOrganisateurs()) {
            notificationService.creerNotification(
                    org,
                    "Événement non retenu",
                    "Votre événement '" + e.getTitre() + "' n'a pas été validé. Motif : " + commentaire,
                    TypeNotification.EVENEMENT,
                    "/evenements/" + e.getId()
            );
        }
    }

    @Transactional
    public void archiverEdition(Long id) {
        EvenementScientifique e = evenementRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Événement introuvable"));

        if (e.getStatut() != StatutEvenement.TERMINE) {
            throw new ConflitEtatException("Seul un événement avec le statut TERMINE peut être archivé par édition");
        }

        e.archiverEdition();
        evenementRepository.save(e);
    }

    @Transactional(readOnly = true)
    public List<EvenementDTO> listerArchives() {
        return evenementRepository.findArchivesGroupes().stream()
                .map(this::convertirEnDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void participer(Long id) {
        EvenementScientifique e = evenementRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Événement introuvable"));

        if (e.getStatutValidation() != StatutValidationEvenement.VALIDE) {
            throw new ConflitEtatException("L'événement n'est pas encore validé");
        }
        if (e.estArchive()) {
            throw new ConflitEtatException("L'événement est archivé");
        }
        if (e.getStatut() == StatutEvenement.TERMINE) {
            throw new ConflitEtatException("Cet événement est terminé, les inscriptions sont closes");
        }
        if (e.getDateFin() != null && e.getDateFin().isBefore(LocalDateTime.now())) {
            throw new ConflitEtatException("Cet événement est déjà passé, les inscriptions sont closes");
        }

        Long currentId = securityService.getIdUtilisateurConnecte();
        Membre membre = membreRepository.findById(currentId)
                .orElseThrow(() -> new RessourceIntrouvableException("Membre introuvable"));

        Optional<ParticipationEvenement> existante = participationRepository.findByMembreIdAndEvenementId(membre.getId(), e.getId());
        if (existante.isPresent()) {
            ParticipationEvenement p = existante.get();
            p.setStatut(StatutParticipation.INSCRIT);
            participationRepository.save(p);
        } else {
            ParticipationEvenement nouvelle = ParticipationEvenement.builder()
                    .dateInscription(LocalDateTime.now())
                    .statut(StatutParticipation.INSCRIT)
                    .membre(membre)
                    .evenement(e)
                    .build();
            participationRepository.save(nouvelle);
        }

        // Ajouter le participant au canal de discussion de l'événement s'il existe
        canalRepository.findByEvenementId(e.getId()).ifPresent(c -> {
            c.getParticipants().add(membre);
            canalRepository.save(c);
        });
    }

    @Transactional
    public void annulerParticipation(Long id) {
        EvenementScientifique e = evenementRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Événement introuvable"));
        if (e.getStatut() == StatutEvenement.TERMINE || e.estArchive()) {
            throw new ConflitEtatException("Impossible de modifier l'inscription à un événement terminé ou archivé");
        }
        Long currentId = securityService.getIdUtilisateurConnecte();
        participationRepository.findByMembreIdAndEvenementId(currentId, id).ifPresent(p -> {
            p.setStatut(StatutParticipation.ANNULE);
            participationRepository.save(p);
        });
    }

    @Transactional(readOnly = true)
    public List<MembreResumeDTO> listerParticipants(Long id) {
        return participationRepository.findByEvenementIdAndStatut(id, StatutParticipation.INSCRIT).stream()
                .map(p -> membreService.convertirEnResumeDTO(p.getMembre()))
                .collect(Collectors.toList());
    }

    public EvenementDTO convertirEnDTO(EvenementScientifique e) {
        List<MembreResumeDTO> orgs = e.getOrganisateurs().stream()
                .map(membreService::convertirEnResumeDTO)
                .collect(Collectors.toList());

        Long canalId = canalRepository.findByEvenementId(e.getId()).map(CanalDiscussion::getId).orElse(null);
        int nbPart = (int) e.getParticipations().stream().filter(p -> p.getStatut() == StatutParticipation.INSCRIT).count();

        return EvenementDTO.builder()
                .id(e.getId())
                .titre(e.getTitre())
                .description(e.getDescription())
                .type(e.getType())
                .dateDebut(e.getDateDebut())
                .dateFin(e.getDateFin())
                .edition(e.getEdition())
                .lieu(e.getLieu())
                .lienWebinaire(e.getLienWebinaire())
                .programmeDetaille(e.getProgrammeDetaille())
                .statut(e.getStatut())
                .statutValidation(e.getStatutValidation())
                .dateValidation(e.getDateValidation())
                .commentaireValidation(e.getCommentaireValidation())
                .valideurNom(e.getValideur() != null ? e.getValideur().getPrenom() + " " + e.getValideur().getNom() : null)
                .createdAt(e.getCreatedAt())
                .organisateurs(orgs)
                .conventionId(e.getConvention() != null ? e.getConvention().getId() : null)
                .conventionTitre(e.getConvention() != null ? e.getConvention().getTitre() : null)
                .nombreParticipants(nbPart)
                .canalId(canalId)
                .build();
    }

    public EvenementPublicDTO convertirEnPublicDTO(EvenementScientifique e) {
        return EvenementPublicDTO.builder()
                .id(e.getId())
                .titre(e.getTitre())
                .description(e.getDescription())
                .type(e.getType())
                .dateDebut(e.getDateDebut())
                .dateFin(e.getDateFin())
                .edition(e.getEdition())
                .lieu(e.getLieu())
                .lienWebinaire(e.getLienWebinaire())
                .programmeDetaille(e.getProgrammeDetaille())
                .statut(e.getStatut())
                .build();
    }
}
