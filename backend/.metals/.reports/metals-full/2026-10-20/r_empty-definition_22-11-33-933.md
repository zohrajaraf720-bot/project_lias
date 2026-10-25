error id: file:///C:/Users/moham/Documents/Master/JEE/lias/backend/src/main/java/ma/univh2c/fsbm/lias/service/NotificationService.java:_empty_/`<any>`#equal#
file:///C:/Users/moham/Documents/Master/JEE/lias/backend/src/main/java/ma/univh2c/fsbm/lias/service/NotificationService.java
empty definition using pc, found symbol in pc: _empty_/`<any>`#equal#
empty definition using semanticdb
empty definition using fallback
non-local guesses:

offset: 13811
uri: file:///C:/Users/moham/Documents/Master/JEE/lias/backend/src/main/java/ma/univh2c/fsbm/lias/service/NotificationService.java
text:
```scala
package ma.univh2c.fsbm.lias.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.univh2c.fsbm.lias.dto.NotificationDTO;
import ma.univh2c.fsbm.lias.dto.PageDTO;
import ma.univh2c.fsbm.lias.entity.EvenementScientifique;
import ma.univh2c.fsbm.lias.entity.Membre;
import ma.univh2c.fsbm.lias.entity.Notification;
import ma.univh2c.fsbm.lias.enums.TypeNotification;
import ma.univh2c.fsbm.lias.enums.TypeMandat;
import ma.univh2c.fsbm.lias.event.DocumentAjouteEvent;
import ma.univh2c.fsbm.lias.repository.NotificationRepository;
import ma.univh2c.fsbm.lias.repository.MandatRepository;
import ma.univh2c.fsbm.lias.mapper.NotificationMapper;
import ma.univh2c.fsbm.lias.event.DemandeSoumiseEvent;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.Pageable;
import jakarta.persistence.criteria.Predicate;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationMapper notificationMapper;
    private final MandatRepository mandatRepository;

    public List<NotificationDTO> getMesNotifications() {
        Membre membre = getMembreConnecte();
        return notificationMapper
                .toDtoList(notificationRepository.findByDestinataireIdOrderByDateCreationDesc(membre.getId()));
    }

    public long getNombreNonLues() {
        return notificationRepository.countByDestinataireIdAndEstLueFalse(getMembreConnecte().getId());
    }

    @Transactional
    public void marquerCommeLue(Long id) {
        notificationRepository.findByIdAndDestinataireId(id, getMembreConnecte().getId())
                .ifPresent(notif -> {
                    notif.setEstLue(true);
                    notificationRepository.save(notif);
                });
    }

    @Transactional
    public void marquerToutCommeLu(TypeNotification type) {
        List<Notification> nonLues = notificationRepository
                .findByDestinataireIdOrderByDateCreationDesc(getMembreConnecte().getId())
                .stream()
                .filter(n -> !n.getEstLue())
                .filter(n -> type == null || n.getType() == type)
                .toList();

        nonLues.forEach(n -> n.setEstLue(true));
        notificationRepository.saveAll(nonLues);
    }

    private Membre getMembreConnecte() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        return ((ma.univh2c.fsbm.lias.security.MembreDetails) auth.getPrincipal()).getMembre();
    }

    // Cet écouteur se déclenche uniquement SI et APRÈS le commit de la transaction
    // principale
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW) // Isolé en cas d'erreur de base de données
    public void handleDocumentAjoute(DocumentAjouteEvent event) {
        try {
            EvenementScientifique evt = event.getDocument().getEvenementScientifique();
            ma.univh2c.fsbm.lias.entity.Reunion reunion = event.getDocument().getReunion();
            ma.univh2c.fsbm.lias.entity.Convention convention = event.getDocument().getConvention();

            if (evt != null) {
                for (Membre orga : evt.getOrganisateurs()) {
                    creerEtEnvoyerNotification(orga, "Nouveau document ajouté",
                            "Le document a été ajouté à l'événement " + evt.getTitre(), TypeNotification.AJOUT_DOCUMENT,
                            "/evenements/" + evt.getId());
                }
            } else if (reunion != null) {
                for (Membre part : reunion.getParticipants()) {
                    creerEtEnvoyerNotification(part, "PV disponible",
                            "Le PV de la réunion " + reunion.getTitre() + " a été publié.",
                            TypeNotification.AJOUT_DOCUMENT, "/reunions/" + reunion.getId());
                }
            } else if (convention != null) {
                mandatRepository.findMandatActifParType(TypeMandat.DIRECTEUR).ifPresent(mandat -> {
                    creerEtEnvoyerNotification(mandat.getMembre(), "Document de convention",
                            "Un document a été lié à la convention " + convention.getTitre(),
                            TypeNotification.AJOUT_DOCUMENT, "/partenariats");
                });
            }
        } catch (Exception e) {
            log.error("Erreur isolée lors de la génération de la notification", e);
        }
    }

    private void creerEtEnvoyerNotification(Membre destinataire, String titre, String message, TypeNotification type,
            String lien) {
        Notification notification = new Notification();
        notification.setDestinataire(destinataire);
        notification.setTitre(titre);
        notification.setMessage(message);
        notification.setType(type);
        notification.setDateCreation(LocalDateTime.now());
        notification.setEstLue(false);
        notification.setLienRedirection(lien);

        notification = notificationRepository.save(notification);

        // Diffusion WebSocket en temps réel sur la file privée de l'utilisateur
        messagingTemplate.convertAndSendToUser(
                destinataire.getEmail(),
                "/queue/notifications",
                notification);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleDemandeSoumise(DemandeSoumiseEvent event) {
        try {
            mandatRepository.findMandatActifParType(TypeMandat.DIRECTEUR).ifPresent(mandat -> {
                creerEtEnvoyerNotification(
                        mandat.getMembre(),
                        "Nouvelle demande d'adhésion",
                        event.getDemande().getNom() + " " + event.getDemande().getPrenom()
                                + " a soumis une candidature.",
                        TypeNotification.DEMANDE_ADHESION,
                        "/direction/adhesions");
            });
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de la notification de demande d'adhésion", e);
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleEvenementCree(ma.univh2c.fsbm.lias.event.EvenementCreeEvent event) {
        try {
            // 1. Alerter le Directeur pour validation
            mandatRepository.findMandatActifParType(TypeMandat.DIRECTEUR).ifPresent(mandat -> {
                creerEtEnvoyerNotification(
                        mandat.getMembre(),
                        "Nouvel événement à valider",
                        "L'événement " + event.getEvenement().getTitre() + " nécessite votre validation.",
                        TypeNotification.EVENEMENT,
                        "/direction/evenements");
            });

            // 2. Alerter les organisateurs (Ajout manquant)
            for (Membre orga : event.getEvenement().getOrganisateurs()) {
                creerEtEnvoyerNotification(
                        orga,
                        "Nouvel événement",
                        "Vous avez été désigné organisateur de " + event.getEvenement().getTitre(),
                        TypeNotification.EVENEMENT,
                        "/evenements/" + event.getEvenement().getId());
            }
        } catch (Exception e) {
            log.error("Erreur de notification d'événement créé", e);
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleRapportGenere(ma.univh2c.fsbm.lias.event.RapportGenereEvent event) {
        try {
            mandatRepository.findMandatActifParType(TypeMandat.DIRECTEUR).ifPresent(mandat -> {
                creerEtEnvoyerNotification(
                        mandat.getMembre(),
                        "Nouveau rapport annuel",
                        "Le rapport d'activité " + event.getRapport().getAnnee() + " a été généré.",
                        TypeNotification.AJOUT_DOCUMENT,
                        "/direction/rapports");
            });
        } catch (Exception e) {
            log.error("Erreur notification rapport généré", e);
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleDemandeRefusee(ma.univh2c.fsbm.lias.event.DemandeRefuseeEvent event) {
        try {
            mandatRepository.findMandatActifParType(TypeMandat.DIRECTEUR).ifPresent(mandat -> {
                creerEtEnvoyerNotification(
                        mandat.getMembre(),
                        "Adhésion refusée",
                        "La candidature de " + event.getDemande().getNom() + " a été refusée.",
                        TypeNotification.VALIDATION_DEMANDE,
                        "/direction/adhesions");
            });
        } catch (Exception e) {
            log.error("Erreur notification refus adhésion", e);
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleDecisionEvenement(ma.univh2c.fsbm.lias.event.DecisionEvenementEvent event) {
        String decision = event.getEvenement().getStatutValidation().name();
        for (Membre orga : event.getEvenement().getOrganisateurs()) {
            creerEtEnvoyerNotification(
                    orga,
                    "Décision sur votre événement",
                    "L'événement " + event.getEvenement().getTitre() + " a été " + decision + ".",
                    TypeNotification.EVENEMENT,
                    "/evenements/" + event.getEvenement().getId());
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleDemandeMaterielSoumise(ma.univh2c.fsbm.lias.event.DemandeMaterielSoumiseEvent event) {
        mandatRepository.findMandatActifParType(TypeMandat.DIRECTEUR).ifPresent(mandat -> {
            creerEtEnvoyerNotification(
                    mandat.getMembre(),
                    "Nouvelle demande de matériel",
                    event.getDemande().getMembre().getNom() + " a soumis un besoin.",
                    TypeNotification.VALIDATION_DEMANDE,
                    "/direction/besoins");
        });
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleDecisionMateriel(ma.univh2c.fsbm.lias.event.DecisionMaterielEvent event) {
        creerEtEnvoyerNotification(
                event.getDemande().getMembre(),
                "Décision sur votre demande de matériel",
                "Votre demande pour " + event.getDemande().getQuantite() + " équipement(s) a été traitée.",
                TypeNotification.VALIDATION_DEMANDE,
                "/materiel/mes-demandes");
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleConventionEchue(ma.univh2c.fsbm.lias.event.ConventionEchueEvent event) {
        mandatRepository.findMandatActifParType(TypeMandat.DIRECTEUR).ifPresent(mandat -> {
            creerEtEnvoyerNotification(
                    mandat.getMembre(),
                    "Convention arrivée à échéance",
                    "La convention '" + event.getConvention().getTitre() + "' est arrivée à échéance aujourd'hui.",
                    TypeNotification.EVENEMENT,
                    "/direction/conventions");
        });
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleReunionEnAttentePv(ma.univh2c.fsbm.lias.event.ReunionEnAttentePvEvent event) {
        creerEtEnvoyerNotification(
                event.getReunion().getOrganisateur(),
                "PV de réunion à téléverser",
                "La réunion '" + event.getReunion().getTitre() + "' s'est terminée. Veuillez déposer le Procès-Verbal.",
                TypeNotification.EVENEMENT,
                "/reunions/" + event.getReunion().getId());
    }

    public PageDTO<NotificationDTO> rechercherMesNotifications(TypeNotification type, Pageable pageable) {
        Membre membre = getMembreConnecte();
        Specification<Notification> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("destinataire").get("id"), membre.getId()));
            if (type != null) {
                predicates.add(cb.equa@@l(root.get("type"), type));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return PageDTO.of(notificationRepository.findAll(spec, pageable), notificationMapper::toDto);
    }
}
```


#### Short summary: 

empty definition using pc, found symbol in pc: _empty_/`<any>`#equal#