package ma.univh2c.fsbm.lias.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.univh2c.fsbm.lias.dto.NotificationDTO;
import ma.univh2c.fsbm.lias.dto.PageDTO;
import ma.univh2c.fsbm.lias.entity.Membre;
import ma.univh2c.fsbm.lias.entity.Notification;
import ma.univh2c.fsbm.lias.enums.EtatCompte;
import ma.univh2c.fsbm.lias.enums.RoleSysteme;
import ma.univh2c.fsbm.lias.enums.TypeMandat;
import ma.univh2c.fsbm.lias.enums.TypeNotification;
import ma.univh2c.fsbm.lias.exception.RessourceIntrouvableException;
import ma.univh2c.fsbm.lias.repository.MandatRepository;
import ma.univh2c.fsbm.lias.repository.MembreRepository;
import ma.univh2c.fsbm.lias.repository.NotificationRepository;
import ma.univh2c.fsbm.lias.security.SecurityService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SecurityService securityService;
    private final SimpMessagingTemplate messagingTemplate;
    private final EmailService emailService;
    private final MandatRepository mandatRepository;
    private final MembreRepository membreRepository;

    @Transactional
    public void creerNotification(Membre destinataire, String titre, String message, TypeNotification type, String lienRedirection) {
        if (destinataire == null) return;

        Notification notif = Notification.builder()
                .titre(titre)
                .message(message)
                .type(type)
                .dateCreation(LocalDateTime.now())
                .estLue(false)
                .lienRedirection(lienRedirection)
                .destinataire(destinataire)
                .build();

        Notification saved = notificationRepository.save(notif);
        NotificationDTO dto = convertirEnDTO(saved);

        // 1. Envoi temps réel WebSocket
        try {
            messagingTemplate.convertAndSend("/topic/notifications/" + destinataire.getId(), dto);
        } catch (Exception e) {
            log.warn("Impossible d'envoyer la notification WebSocket: {}", e.getMessage());
        }

        // 2. Envoi automatique par Email
        try {
            if (destinataire.getEmail() != null && !destinataire.getEmail().isBlank()) {
                String nom = (destinataire.getPrenom() != null ? destinataire.getPrenom() + " " : "")
                        + (destinataire.getNom() != null ? destinataire.getNom() : "");
                emailService.envoyerEmailNotification(destinataire.getEmail(), nom.trim(), titre, message, lienRedirection);
            }
        } catch (Exception e) {
            log.warn("Erreur lors de l'envoi de l'email de notification à {}: {}", destinataire.getEmail(), e.getMessage());
        }
    }

    /**
     * Notifier l'équipe de Direction (Directeur, Vice-Directeur et Administrateur)
     */
    @Transactional
    public void notifierDirection(String titre, String message, TypeNotification type, String lienRedirection) {
        Set<Long> notifiedIds = new HashSet<>();

        mandatRepository.findByTypeMandatAndDateFinIsNull(TypeMandat.DIRECTEUR).forEach(m -> {
            if (m.estActif() && m.getMembre() != null && notifiedIds.add(m.getMembre().getId())) {
                creerNotification(m.getMembre(), titre, message, type, lienRedirection);
            }
        });

        mandatRepository.findByTypeMandatAndDateFinIsNull(TypeMandat.VICE_DIRECTEUR).forEach(m -> {
            if (m.estActif() && m.getMembre() != null && notifiedIds.add(m.getMembre().getId())) {
                creerNotification(m.getMembre(), titre, message, type, lienRedirection);
            }
        });

        membreRepository.findAll().stream()
                .filter(m -> m.getRoleSysteme() == RoleSysteme.ADMIN && m.getEtatCompte() == EtatCompte.ACTIF)
                .forEach(admin -> {
                    if (notifiedIds.add(admin.getId())) {
                        creerNotification(admin, titre, message, type, lienRedirection);
                    }
                });
    }

    /**
     * Notifier tous les membres actifs du laboratoire
     */
    @Transactional
    public void notifierTousLesMembres(String titre, String message, TypeNotification type, String lienRedirection) {
        membreRepository.findAll().stream()
                .filter(m -> m.getEtatCompte() == EtatCompte.ACTIF)
                .forEach(m -> creerNotification(m, titre, message, type, lienRedirection));
    }

    /**
     * Notifier tous les membres d'une équipe spécifique
     */
    @Transactional
    public void notifierMembresEquipe(Long equipeId, String titre, String message, TypeNotification type, String lienRedirection, Long excludeMembreId) {
        if (equipeId == null) return;
        membreRepository.findByEquipeActuelleId(equipeId).stream()
                .filter(m -> m.getEtatCompte() == EtatCompte.ACTIF)
                .filter(m -> excludeMembreId == null || !m.getId().equals(excludeMembreId))
                .forEach(m -> creerNotification(m, titre, message, type, lienRedirection));
    }

    @Transactional(readOnly = true)
    public List<NotificationDTO> getMesNotifications() {
        Long currentId = securityService.getIdUtilisateurConnecte();
        if (currentId == null) return Collections.emptyList();

        return notificationRepository.findByDestinataireIdOrderByDateCreationDesc(currentId)
                .stream()
                .map(this::convertirEnDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PageDTO<NotificationDTO> rechercherMesNotifications(TypeNotification type, Pageable pageable) {
        Long currentId = securityService.getIdUtilisateurConnecte();
        if (currentId == null) {
            return PageDTO.<NotificationDTO>builder()
                    .contenu(Collections.emptyList())
                    .build();
        }

        Page<Notification> page = (type != null)
                ? notificationRepository.findByDestinataireIdAndTypeOrderByDateCreationDesc(currentId, type, pageable)
                : notificationRepository.findByDestinataireIdOrderByDateCreationDesc(currentId, pageable);

        return PageDTO.from(page, page.getContent().stream().map(this::convertirEnDTO).collect(Collectors.toList()));
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getNombreNonLues() {
        Long currentId = securityService.getIdUtilisateurConnecte();
        long count = currentId != null ? notificationRepository.countByDestinataireIdAndEstLueFalse(currentId) : 0L;
        return Map.of("count", count);
    }

    @Transactional
    public void marquerCommeLue(Long id) {
        Notification notif = notificationRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Notification introuvable"));
        notif.marquerCommeLue();
        notificationRepository.save(notif);
    }

    @Transactional
    public void marquerToutCommeLu(TypeNotification type) {
        Long currentId = securityService.getIdUtilisateurConnecte();
        if (currentId != null) {
            notificationRepository.marquerToutCommeLu(currentId, type);
        }
    }

    public NotificationDTO convertirEnDTO(Notification n) {
        String lien = n.getLienRedirection();
        return NotificationDTO.builder()
                .id(n.getId())
                .titre(n.getTitre())
                .message(n.getMessage())
                .type(n.getType())
                .dateCreation(n.getDateCreation())
                .estLue(n.getEstLue())
                .lienRedirection(lien)
                .lienCible(lien)
                .build();
    }
}
