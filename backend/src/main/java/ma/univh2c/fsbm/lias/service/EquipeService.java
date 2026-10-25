package ma.univh2c.fsbm.lias.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.univh2c.fsbm.lias.dto.*;
import ma.univh2c.fsbm.lias.entity.*;
import ma.univh2c.fsbm.lias.enums.EtatCompte;
import ma.univh2c.fsbm.lias.enums.StatutDemande;
import ma.univh2c.fsbm.lias.enums.TypeAction;
import ma.univh2c.fsbm.lias.enums.TypeCanal;
import ma.univh2c.fsbm.lias.enums.TypeMandat;
import ma.univh2c.fsbm.lias.enums.TypeNotification;
import ma.univh2c.fsbm.lias.enums.TypeRole;
import ma.univh2c.fsbm.lias.exception.RegleMetierException;
import ma.univh2c.fsbm.lias.exception.RessourceIntrouvableException;
import ma.univh2c.fsbm.lias.repository.*;
import ma.univh2c.fsbm.lias.security.SecurityService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EquipeService {

    private final EquipeRepository equipeRepository;
    private final MandatRepository mandatRepository;
    private final MembreRepository membreRepository;
    private final CanalDiscussionRepository canalRepository;
    private final MembreService membreService;
    private final PublicationRepository publicationRepository;
    private final DemandeModificationEquipeRepository demandeModificationRepository;
    private final DemandeChangementEquipeRepository demandeChangementRepository;
    private final AffectationRoleRepository affectationRoleRepository;
    private final NotificationService notificationService;
    private final SecurityService securityService;
    private final AuditService auditService;

    public static String extraireAcronyme(String nom) {
        if (nom == null || nom.isBlank()) return "EQ";
        int start = nom.lastIndexOf('(');
        int end = nom.lastIndexOf(')');
        if (start != -1 && end > start + 1) {
            return nom.substring(start + 1, end).trim().toUpperCase();
        }
        String clean = nom.trim();
        if (clean.matches("^[A-Za-z0-9]{2,8}$")) {
            return clean.toUpperCase();
        }
        String[] words = clean.split("[\\s\\-_]+");
        StringBuilder sb = new StringBuilder();
        for (String w : words) {
            if (!w.isBlank() && Character.isLetterOrDigit(w.charAt(0))) {
                sb.append(Character.toUpperCase(w.charAt(0)));
            }
        }
        return sb.length() > 0 ? sb.toString() : "EQ";
    }

    @Transactional(readOnly = true)
    public List<EquipeDTO> listerEquipes() {
        return equipeRepository.findByArchiveFalse().stream()
                .map(this::convertirEnDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EquipePublicDTO getEquipePublique(Long id) {
        Equipe eq = equipeRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Équipe introuvable"));

        MembreResumeDTO chef = getChefActuel(eq);
        List<MembreResumeDTO> membres = eq.getMembres().stream()
                .filter(m -> m.getArchive() == null || !m.getArchive())
                .map(membreService::convertirEnResumeDTO)
                .collect(Collectors.toList());

        List<PublicationDTO> pubs = publicationRepository.findByEquipeId(eq.getId()).stream()
                .map(p -> PublicationDTO.builder()
                        .id(p.getId())
                        .titre(p.getTitre())
                        .annee(p.getAnnee())
                        .resume(p.getResume())
                        .lienDoi(p.getLienDoi())
                        .auteurs(p.getAuteurs().stream().map(membreService::convertirEnResumeDTO).toList())
                        .coAuteursExternes(p.getCoAuteursExternes())
                        .equipeId(eq.getId())
                        .equipeNom(eq.getNom())
                        .build())
                .collect(Collectors.toList());

        String acr = extraireAcronyme(eq.getNom());

        return EquipePublicDTO.builder()
                .id(eq.getId())
                .nom(eq.getNom())
                .acronyme(acr)
                .description(eq.getDescription())
                .thematiques(eq.getThematiques())
                .axesRecherche(eq.getThematiques())
                .logo(eq.getLogo())
                .chefActuel(chef)
                .chefEquipe(chef)
                .membres(membres)
                .publications(pubs)
                .build();
    }

    @Transactional
    public EquipeDTO creerEquipe(EquipeRequest request) {
        if (equipeRepository.existsByNomIgnoreCase(request.getNom().trim())) {
            throw new RegleMetierException("Une équipe avec ce nom existe déjà");
        }

        Equipe eq = Equipe.builder()
                .nom(request.getNom().trim())
                .description(request.getDescription())
                .thematiques(request.getThematiques() != null ? new ArrayList<>(request.getThematiques()) : new ArrayList<>())
                .logo(request.getLogo())
                .build();

        Equipe saved = equipeRepository.save(eq);

        if (request.getChefEquipeId() != null) {
            Membre chef = membreRepository.findById(request.getChefEquipeId())
                    .orElseThrow(() -> new RessourceIntrouvableException("Chef d'équipe introuvable"));

            Mandat mandat = Mandat.builder()
                    .typeMandat(TypeMandat.CHEF_EQUIPE)
                    .dateDebut(LocalDate.now())
                    .membre(chef)
                    .equipe(saved)
                    .build();
            mandatRepository.save(mandat);

            chef.setEquipeActuelle(saved);
            membreRepository.save(chef);
        }

        // Canal de discussion automatique
        CanalDiscussion canal = CanalDiscussion.builder()
                .titre("Canal Équipe - " + saved.getNom())
                .typeCanal(TypeCanal.EQUIPE)
                .dateCreation(LocalDateTime.now())
                .equipe(saved)
                .participants(new HashSet<>())
                .build();

        if (request.getChefEquipeId() != null) {
            membreRepository.findById(request.getChefEquipeId()).ifPresent(chef -> canal.getParticipants().add(chef));
        }

        canalRepository.save(canal);

        return convertirEnDTO(saved);
    }

    @Transactional
    public EquipeDTO modifierEquipe(Long id, EquipeRequest request) {
        Equipe eq = equipeRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Équipe introuvable"));

        // Si l'utilisateur connecté est Chef d'équipe (et non Directeur/Vice-Directeur/Admin),
        // toute tentative de modification génère une proposition soumise à validation
        if (securityService.estChefDeLEquipe(id) && !securityService.estDirection()) {
            demanderModificationParChef(id, DemandeModificationEquipeRequest.builder()
                    .nom(request.getNom())
                    .description(request.getDescription())
                    .thematiques(request.getThematiques())
                    .build());
            return convertirEnDTO(eq);
        }

        // Modification directe par le Directeur
        if (!eq.getNom().equalsIgnoreCase(request.getNom().trim()) && equipeRepository.existsByNomIgnoreCase(request.getNom().trim())) {
            throw new RegleMetierException("Une équipe avec ce nom existe déjà");
        }

        eq.setNom(request.getNom().trim());
        eq.setDescription(request.getDescription());
        if (request.getThematiques() != null) {
            eq.setThematiques(new ArrayList<>(request.getThematiques()));
        }
        if (request.getLogo() != null) {
            eq.setLogo(request.getLogo());
        }

        Equipe saved = equipeRepository.save(eq);
        return convertirEnDTO(saved);
    }

    /**
     * Changement direct du Chef d'Équipe par la Direction.
     * Le nouveau chef doit obligatoirement être un membre rattaché à cette équipe.
     */
    @Transactional
    public EquipeDTO changerChefEquipe(Long equipeId, ChangementChefEquipeRequest request) {
        Equipe eq = equipeRepository.findById(equipeId)
                .orElseThrow(() -> new RessourceIntrouvableException("Équipe introuvable"));

        Membre nouveauChef = membreRepository.findById(request.getNouveauChefId())
                .orElseThrow(() -> new RessourceIntrouvableException("Membre introuvable"));

        // Vérifier que le nouveau chef appartient bien à cette équipe
        if (nouveauChef.getEquipeActuelle() == null || !nouveauChef.getEquipeActuelle().getId().equals(eq.getId())) {
            throw new RegleMetierException("Le nouveau chef d'équipe doit obligatoirement être un membre rattaché à l'équipe " + eq.getNom());
        }

        if (nouveauChef.getEtatCompte() != EtatCompte.ACTIF) {
            throw new RegleMetierException("Le membre sélectionné doit avoir un compte ACTIF pour diriger l'équipe.");
        }

        // Clôturer l'ancien mandat de chef d'équipe s'il existe
        Optional<Mandat> ancienMandatOpt = mandatRepository.findByTypeMandatAndEquipeIdAndDateFinIsNull(TypeMandat.CHEF_EQUIPE, eq.getId());
        if (ancienMandatOpt.isPresent()) {
            Mandat ancienMandat = ancienMandatOpt.get();
            if (ancienMandat.getMembre().getId().equals(nouveauChef.getId())) {
                throw new RegleMetierException(nouveauChef.getPrenom() + " " + nouveauChef.getNom() + " est déjà le chef actif de cette équipe.");
            }

            ancienMandat.cloturerMandat(LocalDate.now());
            mandatRepository.save(ancienMandat);

            // Clôturer l'affectation de rôle de l'ancien chef et le repasser en MEMBRE_EQUIPE
            affectationRoleRepository.findByMembreIdAndDateFinIsNull(ancienMandat.getMembre().getId()).ifPresent(aff -> {
                aff.cloturerRole(LocalDate.now());
                affectationRoleRepository.save(aff);
            });
            AffectationRole ancienChefAff = AffectationRole.builder()
                    .typeRole(TypeRole.MEMBRE_EQUIPE)
                    .dateDebut(LocalDate.now())
                    .membre(ancienMandat.getMembre())
                    .equipe(eq)
                    .build();
            affectationRoleRepository.save(ancienChefAff);

            // Notifier l'ancien chef
            notificationService.creerNotification(
                    ancienMandat.getMembre(),
                    "Passation de direction d'équipe",
                    "Votre mandat de Chef pour l'équipe " + eq.getNom() + " a pris fin. La direction a été confiée à " + nouveauChef.getPrenom() + " " + nouveauChef.getNom() + ".",
                    TypeNotification.VALIDATION_DEMANDE,
                    "/tableau-de-bord"
            );
        }

        // Clôturer l'affectation active du nouveau chef (simple membre)
        affectationRoleRepository.findByMembreIdAndDateFinIsNull(nouveauChef.getId()).ifPresent(aff -> {
            aff.cloturerRole(LocalDate.now());
            affectationRoleRepository.save(aff);
        });

        // Créer le nouveau mandat de Chef d'équipe
        Mandat nouveauMandat = Mandat.builder()
                .typeMandat(TypeMandat.CHEF_EQUIPE)
                .dateDebut(LocalDate.now())
                .membre(nouveauChef)
                .equipe(eq)
                .build();
        mandatRepository.save(nouveauMandat);

        // Notifier le nouveau chef
        notificationService.creerNotification(
                nouveauChef,
                "Nomination Chef d'Équipe",
                "Félicitations ! La Direction du laboratoire vous a nommé Chef de l'équipe " + eq.getNom() + ".",
                TypeNotification.VALIDATION_DEMANDE,
                "/tableau-de-bord"
        );

        log.info("Changement de chef d'équipe effectué pour l'équipe {} : nouveau chef {}", eq.getNom(), nouveauChef.getEmail());
        return convertirEnDTO(eq);
    }

    // =========================================================================
    // DEMANDES DE MOBILITÉ / CHANGEMENT D'ÉQUIPE (Tous membres)
    // =========================================================================

    @Transactional
    public DemandeChangementEquipeDTO demanderChangementEquipe(DemandeChangementEquipeRequest request) {
        Long currentId = securityService.getIdUtilisateurConnecte();
        if (securityService.estAdmin()) {
            throw new RegleMetierException("Un administrateur n'est pas un chercheur et ne peut pas demander de mobilité d'équipe.");
        }
        Membre demandeur = (currentId != null) ? membreRepository.findById(currentId).orElse(null) : null;
        if (demandeur == null) {
            throw new RegleMetierException("Utilisateur non authentifié");
        }

        Equipe ancienneEquipe = demandeur.getEquipeActuelle();
        Equipe nouvelleEquipe = null;

        if (request.getNouvelleEquipeId() == null) {
            // Demande de détachement (quitter son équipe actuelle)
            if (ancienneEquipe == null) {
                throw new RegleMetierException("Vous n'êtes actuellement rattaché à aucune équipe.");
            }
        } else {
            // Demande de rattachement ou de transfert
            if (ancienneEquipe != null && ancienneEquipe.getId().equals(request.getNouvelleEquipeId())) {
                throw new RegleMetierException("Vous appartenez déjà à cette équipe.");
            }
            nouvelleEquipe = equipeRepository.findById(request.getNouvelleEquipeId())
                    .orElseThrow(() -> new RessourceIntrouvableException("L'équipe demandée est introuvable"));
        }

        // Vérifier s'il n'y a pas déjà une demande en attente
        if (demandeChangementRepository.existsByDemandeurIdAndStatut(demandeur.getId(), StatutDemande.EN_ATTENTE)) {
            throw new RegleMetierException("Vous avez déjà une demande de mobilité d'équipe en attente de traitement par la Direction.");
        }

        DemandeChangementEquipe dce = DemandeChangementEquipe.builder()
                .demandeur(demandeur)
                .ancienneEquipe(ancienneEquipe)
                .nouvelleEquipe(nouvelleEquipe)
                .motif(request.getMotif() != null ? request.getMotif().trim() : "")
                .dateDemande(LocalDateTime.now())
                .statut(StatutDemande.EN_ATTENTE)
                .build();

        DemandeChangementEquipe saved = demandeChangementRepository.save(dce);

        // Notifier le Directeur
        String descriptionOperation = (ancienneEquipe == null)
                ? "rattachement à l'équipe " + nouvelleEquipe.getNom()
                : (nouvelleEquipe == null)
                ? "détachement de l'équipe " + ancienneEquipe.getNom()
                : "transfert de " + ancienneEquipe.getNom() + " vers " + nouvelleEquipe.getNom();

        notificationService.notifierDirection(
                "Demande de mobilité d'équipe",
                demandeur.getPrenom() + " " + demandeur.getNom() + " a soumis une demande de " + descriptionOperation + ".",
                TypeNotification.EQUIPE,
                "/gouvernance/equipes"
        );

        return convertirChangementEnDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<DemandeChangementEquipeDTO> listerMesDemandesChangement() {
        Long currentId = securityService.getIdUtilisateurConnecte();
        if (currentId == null) return Collections.emptyList();
        return demandeChangementRepository.findByDemandeurIdOrderByDateDemandeDesc(currentId).stream()
                .map(this::convertirChangementEnDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DemandeChangementEquipeDTO> listerToutesDemandesChangement(StatutDemande statut) {
        List<DemandeChangementEquipe> list = (statut != null)
                ? demandeChangementRepository.findByStatutOrderByDateDemandeDesc(statut)
                : demandeChangementRepository.findAllByOrderByDateDemandeDesc();
        return list.stream()
                .map(this::convertirChangementEnDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public DemandeChangementEquipeDTO accepterDemandeChangement(Long id) {
        DemandeChangementEquipe demande = demandeChangementRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Demande de changement d'équipe introuvable"));

        if (demande.getStatut() != StatutDemande.EN_ATTENTE) {
            throw new RegleMetierException("Cette demande a déjà été traitée");
        }

        Long currentId = securityService.getIdUtilisateurConnecte();
        Membre directeur = (currentId != null) ? membreRepository.findById(currentId).orElse(null) : null;

        Membre membre = demande.getDemandeur();
        Equipe ancienneEq = demande.getAncienneEquipe();
        Equipe nouvelleEq = demande.getNouvelleEquipe();

        // Si le membre était chef d'équipe de son ancienne équipe, clôturer son mandat
        if (ancienneEq != null) {
            mandatRepository.findByTypeMandatAndEquipeIdAndDateFinIsNull(TypeMandat.CHEF_EQUIPE, ancienneEq.getId())
                    .ifPresent(mandat -> {
                        if (mandat.getMembre().getId().equals(membre.getId())) {
                            mandat.cloturerMandat(LocalDate.now());
                            mandatRepository.save(mandat);
                        }
                    });
        }

        // Clôturer l'affectation active de rôle
        affectationRoleRepository.findByMembreIdAndDateFinIsNull(membre.getId()).ifPresent(aff -> {
            aff.cloturerRole(LocalDate.now());
            affectationRoleRepository.save(aff);
        });

        // Appliquer le rattachement ou détachement
        if (nouvelleEq != null) {
            membre.setEquipeActuelle(nouvelleEq);
            AffectationRole nouvelleAff = AffectationRole.builder()
                    .typeRole(TypeRole.MEMBRE_EQUIPE)
                    .dateDebut(LocalDate.now())
                    .membre(membre)
                    .equipe(nouvelleEq)
                    .build();
            affectationRoleRepository.save(nouvelleAff);
        } else {
            membre.setEquipeActuelle(null);
        }
        membreRepository.save(membre);

        demande.accepter(directeur);
        DemandeChangementEquipe saved = demandeChangementRepository.save(demande);

        // Notifier le demandeur
        String detailMessage = (nouvelleEq != null)
                ? "Vous êtes désormais rattaché à l'équipe " + nouvelleEq.getNom() + "."
                : "Votre détachement a été validé. Vous n'êtes plus affecté à une équipe.";
        notificationService.creerNotification(
                membre,
                "Changement d'équipe validé",
                "Votre demande de mobilité d'équipe a été validée par la Direction. " + detailMessage,
                TypeNotification.VALIDATION_DEMANDE,
                "/tableau-de-bord"
        );

        return convertirChangementEnDTO(saved);
    }

    @Transactional
    public DemandeChangementEquipeDTO refuserDemandeChangement(Long id, DecisionChangementEquipeRequest request) {
        DemandeChangementEquipe demande = demandeChangementRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Demande de changement d'équipe introuvable"));

        if (demande.getStatut() != StatutDemande.EN_ATTENTE) {
            throw new RegleMetierException("Cette demande a déjà été traitée");
        }

        Long currentId = securityService.getIdUtilisateurConnecte();
        Membre directeur = (currentId != null) ? membreRepository.findById(currentId).orElse(null) : null;
        String motif = (request != null && request.getMotif() != null) ? request.getMotif().trim() : null;

        demande.refuser(directeur, motif);
        DemandeChangementEquipe saved = demandeChangementRepository.save(demande);

        // Notifier le demandeur
        notificationService.creerNotification(
                demande.getDemandeur(),
                "Demande de changement d'équipe non retenue",
                "Votre demande de mobilité d'équipe a été refusée par la Direction." + (motif != null && !motif.isBlank() ? " Motif : " + motif : ""),
                TypeNotification.VALIDATION_DEMANDE,
                "/tableau-de-bord"
        );

        return convertirChangementEnDTO(saved);
    }

    /**
     * Changement direct d'équipe par le Directeur (sans demande préalable).
     * Gère les 3 cas :
     * 1. Sans équipe -> Équipe cible (Rattachement)
     * 2. Équipe source -> Équipe cible (Transfert)
     * 3. Équipe source -> Sans équipe (Détachement)
     *
     * Conserve également une trace dans DemandeChangementEquipe avec statut ACCEPTEE
     * et notifie le membre concerné.
     */
    @Transactional
    public DemandeChangementEquipeDTO affecterMembreDirectement(AffectationDirecteEquipeRequest request) {
        Membre membre = membreRepository.findById(request.getMembreId())
                .orElseThrow(() -> new RessourceIntrouvableException("Membre introuvable"));

        Equipe ancienneEq = membre.getEquipeActuelle();
        Equipe nouvelleEq = null;

        if (request.getNouvelleEquipeId() != null) {
            nouvelleEq = equipeRepository.findById(request.getNouvelleEquipeId())
                    .orElseThrow(() -> new RessourceIntrouvableException("Équipe de destination introuvable"));
            if (ancienneEq != null && ancienneEq.getId().equals(nouvelleEq.getId())) {
                throw new RegleMetierException("Le membre " + membre.getPrenom() + " " + membre.getNom()
                        + " est déjà rattaché à l'équipe " + nouvelleEq.getNom() + ".");
            }
        } else {
            if (ancienneEq == null) {
                throw new RegleMetierException("Le membre " + membre.getPrenom() + " " + membre.getNom()
                        + " n'est actuellement rattaché à aucune équipe.");
            }
        }

        Long currentId = securityService.getIdUtilisateurConnecte();
        Membre directeur = (currentId != null) ? membreRepository.findById(currentId).orElse(null) : null;

        // Si le membre était chef d'équipe de son ancienne équipe, clôturer son mandat
        if (ancienneEq != null) {
            mandatRepository.findByTypeMandatAndEquipeIdAndDateFinIsNull(TypeMandat.CHEF_EQUIPE, ancienneEq.getId())
                    .ifPresent(mandat -> {
                        if (mandat.getMembre().getId().equals(membre.getId())) {
                            mandat.cloturerMandat(LocalDate.now());
                            mandatRepository.save(mandat);
                        }
                    });
        }

        // Clôturer l'affectation active de rôle
        affectationRoleRepository.findByMembreIdAndDateFinIsNull(membre.getId()).ifPresent(aff -> {
            aff.cloturerRole(LocalDate.now());
            affectationRoleRepository.save(aff);
        });

        // Mettre à jour l'équipe actuelle du membre
        if (nouvelleEq != null) {
            membre.setEquipeActuelle(nouvelleEq);
            AffectationRole nouvelleAff = AffectationRole.builder()
                    .typeRole(TypeRole.MEMBRE_EQUIPE)
                    .dateDebut(LocalDate.now())
                    .membre(membre)
                    .equipe(nouvelleEq)
                    .build();
            affectationRoleRepository.save(nouvelleAff);
        } else {
            membre.setEquipeActuelle(null);
        }
        membreRepository.save(membre);

        // Clôturer d'éventuelles demandes de changement en attente pour ce membre
        demandeChangementRepository.findByDemandeurIdOrderByDateDemandeDesc(membre.getId())
                .stream()
                .filter(d -> d.getStatut() == StatutDemande.EN_ATTENTE)
                .forEach(d -> {
                    d.setStatut(StatutDemande.ACCEPTEE);
                    d.setDateDecision(LocalDateTime.now());
                    d.setDecideur(directeur);
                    demandeChangementRepository.save(d);
                });

        // Enregistrer une trace dans DemandeChangementEquipe pour l'historique
        String motifTrace = "Affectation directe par la Direction";
        if (request.getMotif() != null && !request.getMotif().trim().isEmpty()) {
            motifTrace += " — Motif : " + request.getMotif().trim();
        }

        DemandeChangementEquipe trace = DemandeChangementEquipe.builder()
                .demandeur(membre)
                .ancienneEquipe(ancienneEq)
                .nouvelleEquipe(nouvelleEq)
                .motif(motifTrace)
                .dateDemande(LocalDateTime.now())
                .statut(StatutDemande.ACCEPTEE)
                .dateDecision(LocalDateTime.now())
                .decideur(directeur)
                .build();
        DemandeChangementEquipe savedTrace = demandeChangementRepository.save(trace);

        // Notifier le membre
        String messageNotif;
        if (nouvelleEq != null && ancienneEq != null) {
            messageNotif = "La Direction du laboratoire a modifié votre affectation : vous avez été transféré de l'équipe "
                    + ancienneEq.getNom() + " vers l'équipe " + nouvelleEq.getNom() + ".";
        } else if (nouvelleEq != null) {
            messageNotif = "La Direction du laboratoire vous a affecté à l'équipe " + nouvelleEq.getNom() + " (" + extraireAcronyme(nouvelleEq.getNom()) + ").";
        } else {
            messageNotif = "La Direction du laboratoire a validé votre détachement de l'équipe " + ancienneEq.getNom() + ". Vous êtes désormais sans équipe.";
        }
        if (request.getMotif() != null && !request.getMotif().trim().isEmpty()) {
            messageNotif += " (Motif : " + request.getMotif().trim() + ")";
        }

        notificationService.creerNotification(
                membre,
                "Mise à jour de votre affectation d'équipe",
                messageNotif,
                TypeNotification.VALIDATION_DEMANDE,
                "/tableau-de-bord"
        );

        auditService.enregistrerAudit(
                TypeAction.MODIFICATION,
                "Equipe",
                nouvelleEq != null ? nouvelleEq.getId() : (ancienneEq != null ? ancienneEq.getId() : null),
                "Affectation directe du membre " + membre.getEmail() + " : "
                        + (ancienneEq != null ? ancienneEq.getNom() : "Sans équipe")
                        + " -> " + (nouvelleEq != null ? nouvelleEq.getNom() : "Sans équipe"),
                currentId
        );

        return convertirChangementEnDTO(savedTrace);
    }

    // =========================================================================
    // DEMANDES DE MODIFICATION D'INFORMATIONS D'ÉQUIPE (Nom, tags, description)
    // =========================================================================

    @Transactional
    public DemandeModificationEquipeDTO demanderModificationParChef(Long equipeId, DemandeModificationEquipeRequest request) {
        Equipe eq = equipeRepository.findById(equipeId)
                .orElseThrow(() -> new RessourceIntrouvableException("Équipe introuvable"));

        Long currentId = securityService.getIdUtilisateurConnecte();
        if (securityService.estAdmin()) {
            throw new RegleMetierException("Un administrateur modifie les équipes directement.");
        }
        Membre demandeur = (currentId != null) ? membreRepository.findById(currentId).orElse(null) : null;
        if (demandeur == null) {
            throw new RegleMetierException("Utilisateur non authentifié");
        }

        DemandeModificationEquipe demande = DemandeModificationEquipe.builder()
                .equipe(eq)
                .demandeur(demandeur)
                .nouveauNom(request.getNom() != null ? request.getNom().trim() : eq.getNom())
                .nouvelleDescription(request.getDescription())
                .nouvellesThematiques(request.getThematiques() != null ? new ArrayList<>(request.getThematiques()) : new ArrayList<>())
                .ancienNom(eq.getNom())
                .ancienneDescription(eq.getDescription())
                .anciennesThematiques(eq.getThematiques() != null ? new ArrayList<>(eq.getThematiques()) : new ArrayList<>())
                .dateDemande(LocalDateTime.now())
                .statut(StatutDemande.EN_ATTENTE)
                .build();

        DemandeModificationEquipe saved = demandeModificationRepository.save(demande);

        // Notifier la Direction
        notificationService.notifierDirection(
                "Demande de modification d'équipe",
                "Le chef de l'équipe " + eq.getNom() + " a proposé des modifications pour son équipe.",
                TypeNotification.EQUIPE,
                "/gouvernance/equipes"
        );

        return convertirDemandeEnDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<DemandeModificationEquipeDTO> listerToutesDemandesModification(StatutDemande statut) {
        List<DemandeModificationEquipe> list;
        if (statut != null) {
            list = demandeModificationRepository.findByStatutOrderByDateDemandeDesc(statut);
        } else {
            list = demandeModificationRepository.findAllByOrderByDateDemandeDesc();
        }
        return list.stream().map(this::convertirDemandeEnDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DemandeModificationEquipeDTO> listerDemandesModificationEquipe(Long equipeId) {
        return demandeModificationRepository.findByEquipeIdOrderByDateDemandeDesc(equipeId).stream()
                .map(this::convertirDemandeEnDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public DemandeModificationEquipeDTO accepterDemandeModification(Long demandeId) {
        DemandeModificationEquipe demande = demandeModificationRepository.findById(demandeId)
                .orElseThrow(() -> new RessourceIntrouvableException("Demande de modification introuvable"));

        if (demande.getStatut() != StatutDemande.EN_ATTENTE) {
            throw new RegleMetierException("Cette demande a déjà été traitée");
        }

        Long currentId = securityService.getIdUtilisateurConnecte();
        Membre directeur = (currentId != null) ? membreRepository.findById(currentId).orElse(null) : null;

        Equipe eq = demande.getEquipe();

        // Vérification unicité du nom si modifié
        if (!eq.getNom().equalsIgnoreCase(demande.getNouveauNom().trim()) && equipeRepository.existsByNomIgnoreCase(demande.getNouveauNom().trim())) {
            throw new RegleMetierException("Une équipe portant ce nom existe déjà");
        }

        eq.setNom(demande.getNouveauNom().trim());
        eq.setDescription(demande.getNouvelleDescription());
        if (demande.getNouvellesThematiques() != null) {
            eq.setThematiques(new ArrayList<>(demande.getNouvellesThematiques()));
        }
        equipeRepository.save(eq);

        demande.accepter(directeur);
        DemandeModificationEquipe saved = demandeModificationRepository.save(demande);

        // Notifier le demandeur (Chef d'équipe)
        if (demande.getDemandeur() != null) {
            notificationService.creerNotification(
                    demande.getDemandeur(),
                    "Modifications d'équipe acceptées",
                    "Les modifications pour l'équipe " + eq.getNom() + " ont été validées par la Direction.",
                    TypeNotification.VALIDATION_DEMANDE,
                    "/tableau-de-bord"
            );
        }

        return convertirDemandeEnDTO(saved);
    }

    @Transactional
    public DemandeModificationEquipeDTO refuserDemandeModification(Long demandeId, String motif) {
        DemandeModificationEquipe demande = demandeModificationRepository.findById(demandeId)
                .orElseThrow(() -> new RessourceIntrouvableException("Demande de modification introuvable"));

        if (demande.getStatut() != StatutDemande.EN_ATTENTE) {
            throw new RegleMetierException("Cette demande a déjà été traitée");
        }

        Long currentId = securityService.getIdUtilisateurConnecte();
        Membre directeur = (currentId != null) ? membreRepository.findById(currentId).orElse(null) : null;

        demande.refuser(directeur, motif);
        DemandeModificationEquipe saved = demandeModificationRepository.save(demande);

        // Notifier le demandeur (Chef d'équipe)
        if (demande.getDemandeur() != null) {
            notificationService.creerNotification(
                    demande.getDemandeur(),
                    "Modifications d'équipe non retenues",
                    "Les modifications pour l'équipe " + demande.getEquipe().getNom() + " ont été refusées par la Direction." + (motif != null && !motif.isBlank() ? " Motif : " + motif : ""),
                    TypeNotification.VALIDATION_DEMANDE,
                    "/tableau-de-bord"
            );
        }

        return convertirDemandeEnDTO(saved);
    }

    @Transactional
    public void archiverEquipe(Long id) {
        Equipe eq = equipeRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Équipe introuvable"));

        boolean hasActiveMembers = eq.getMembres().stream()
                .anyMatch(m -> m.getArchive() == null || !m.getArchive());
        if (hasActiveMembers) {
            throw new RegleMetierException("Impossible d'archiver une équipe contenant encore des membres affectés");
        }

        eq.setArchive(true);
        equipeRepository.save(eq);
    }

    public EquipeDTO convertirEnDTO(Equipe eq) {
        MembreResumeDTO chef = getChefActuel(eq);
        List<MembreResumeDTO> membres = eq.getMembres().stream()
                .filter(m -> m.getArchive() == null || !m.getArchive())
                .map(membreService::convertirEnResumeDTO)
                .collect(Collectors.toList());

        return EquipeDTO.builder()
                .id(eq.getId())
                .nom(eq.getNom())
                .acronyme(extraireAcronyme(eq.getNom()))
                .description(eq.getDescription())
                .thematiques(eq.getThematiques())
                .axesRecherche(eq.getThematiques())
                .logo(eq.getLogo())
                .chefActuel(chef)
                .chefEquipe(chef)
                .nombreMembres(membres.size())
                .membres(membres)
                .build();
    }

    public DemandeModificationEquipeDTO convertirDemandeEnDTO(DemandeModificationEquipe d) {
        return DemandeModificationEquipeDTO.builder()
                .id(d.getId())
                .equipeId(d.getEquipe().getId())
                .equipeNom(d.getEquipe().getNom())
                .equipeAcronyme(extraireAcronyme(d.getEquipe().getNom()))
                .demandeurId(d.getDemandeur() != null ? d.getDemandeur().getId() : null)
                .demandeurNom(d.getDemandeur() != null ? d.getDemandeur().getPrenom() + " " + d.getDemandeur().getNom() : null)
                .demandeurEmail(d.getDemandeur() != null ? d.getDemandeur().getEmail() : null)
                .nouveauNom(d.getNouveauNom())
                .nouvelleDescription(d.getNouvelleDescription())
                .nouvellesThematiques(d.getNouvellesThematiques() != null ? new ArrayList<>(d.getNouvellesThematiques()) : Collections.emptyList())
                .ancienNom(d.getAncienNom())
                .ancienneDescription(d.getAncienneDescription())
                .anciennesThematiques(d.getAnciennesThematiques() != null ? new ArrayList<>(d.getAnciennesThematiques()) : Collections.emptyList())
                .dateDemande(d.getDateDemande())
                .statut(d.getStatut())
                .dateDecision(d.getDateDecision())
                .motifRefus(d.getMotifRefus())
                .decideurNom(d.getDecideur() != null ? d.getDecideur().getPrenom() + " " + d.getDecideur().getNom() : null)
                .build();
    }

    public DemandeChangementEquipeDTO convertirChangementEnDTO(DemandeChangementEquipe d) {
        return DemandeChangementEquipeDTO.builder()
                .id(d.getId())
                .demandeurId(d.getDemandeur() != null ? d.getDemandeur().getId() : null)
                .demandeurNom(d.getDemandeur() != null ? d.getDemandeur().getNom() : null)
                .demandeurPrenom(d.getDemandeur() != null ? d.getDemandeur().getPrenom() : null)
                .demandeurEmail(d.getDemandeur() != null ? d.getDemandeur().getEmail() : null)
                .demandeurStatut(d.getDemandeur() != null ? d.getDemandeur().getStatut() : null)
                .demandeurPhoto(d.getDemandeur() != null ? d.getDemandeur().getPhoto() : null)
                .ancienneEquipeId(d.getAncienneEquipe() != null ? d.getAncienneEquipe().getId() : null)
                .ancienneEquipeNom(d.getAncienneEquipe() != null ? d.getAncienneEquipe().getNom() : null)
                .ancienneEquipeAcronyme(d.getAncienneEquipe() != null ? extraireAcronyme(d.getAncienneEquipe().getNom()) : null)
                .nouvelleEquipeId(d.getNouvelleEquipe() != null ? d.getNouvelleEquipe().getId() : null)
                .nouvelleEquipeNom(d.getNouvelleEquipe() != null ? d.getNouvelleEquipe().getNom() : null)
                .nouvelleEquipeAcronyme(d.getNouvelleEquipe() != null ? extraireAcronyme(d.getNouvelleEquipe().getNom()) : null)
                .typeChangement(d.getTypeChangement())
                .motif(d.getMotif())
                .dateDemande(d.getDateDemande())
                .statut(d.getStatut())
                .dateDecision(d.getDateDecision())
                .motifRefus(d.getMotifRefus())
                .decideurNom(d.getDecideur() != null ? d.getDecideur().getPrenom() + " " + d.getDecideur().getNom() : null)
                .build();
    }

    private MembreResumeDTO getChefActuel(Equipe eq) {
        Optional<Mandat> mandat = mandatRepository.findByTypeMandatAndEquipeIdAndDateFinIsNull(TypeMandat.CHEF_EQUIPE, eq.getId());
        return mandat.map(m -> membreService.convertirEnResumeDTO(m.getMembre())).orElse(null);
    }
}
