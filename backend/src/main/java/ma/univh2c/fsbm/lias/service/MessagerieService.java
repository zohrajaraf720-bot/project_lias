package ma.univh2c.fsbm.lias.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.univh2c.fsbm.lias.dto.*;
import ma.univh2c.fsbm.lias.entity.*;
import ma.univh2c.fsbm.lias.enums.TypeCanal;
import ma.univh2c.fsbm.lias.exception.RegleMetierException;
import ma.univh2c.fsbm.lias.exception.RessourceIntrouvableException;
import ma.univh2c.fsbm.lias.repository.*;
import ma.univh2c.fsbm.lias.security.SecurityService;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessagerieService {

    private final CanalDiscussionRepository canalRepository;
    private final MessageRepository messageRepository;
    private final MessageLectureRepository lectureRepository;
    private final MembreRepository membreRepository;
    private final SecurityService securityService;
    private final MembreService membreService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public List<CanalDiscussionDTO> getMesCanaux() {
        Long currentId = securityService.getIdUtilisateurConnecte();
        if (currentId == null) return Collections.emptyList();

        Membre current = membreRepository.findById(currentId).orElse(null);
        if (current == null) return Collections.emptyList();

        // 1. S'assurer que le canal GENERAL du laboratoire existe et inclut le membre
        CanalDiscussion canalGeneral = canalRepository.findByTypeCanal(TypeCanal.GENERAL).stream().findFirst().orElse(null);
        if (canalGeneral == null) {
            canalGeneral = CanalDiscussion.builder()
                    .titre("Laboratoire LIAS (Général)")
                    .typeCanal(TypeCanal.GENERAL)
                    .dateCreation(LocalDateTime.now())
                    .participants(new HashSet<>(membreRepository.findAll()))
                    .build();
            canalGeneral = canalRepository.save(canalGeneral);
        } else if (!canalGeneral.getParticipants().contains(current)) {
            canalGeneral.getParticipants().add(current);
            canalGeneral = canalRepository.save(canalGeneral);
        }

        // 2. S'assurer que le canal de l'équipe du membre existe et inclut le membre
        if (current.getEquipeActuelle() != null) {
            Equipe eq = current.getEquipeActuelle();
            CanalDiscussion canalEq = canalRepository.findByEquipeId(eq.getId()).orElse(null);
            if (canalEq == null) {
                canalEq = CanalDiscussion.builder()
                        .titre("Équipe " + eq.getNom())
                        .typeCanal(TypeCanal.EQUIPE)
                        .equipe(eq)
                        .dateCreation(LocalDateTime.now())
                        .participants(new HashSet<>(List.of(current)))
                        .build();
                canalRepository.save(canalEq);
            } else if (!canalEq.getParticipants().contains(current)) {
                canalEq.getParticipants().add(current);
                canalRepository.save(canalEq);
            }
        }

        // 3. Récupérer tous les canaux auxquels le membre participe
        List<CanalDiscussion> canaux = canalRepository.findCanauxPourMembre(currentId);
        if (!canaux.contains(canalGeneral)) {
            canaux.add(0, canalGeneral);
        }

        // Tri : GENERAL d'abord, puis EQUIPE, puis canaux DIRECTs
        canaux.sort((c1, c2) -> {
            if (c1.getTypeCanal() == TypeCanal.GENERAL) return -1;
            if (c2.getTypeCanal() == TypeCanal.GENERAL) return 1;
            if (c1.getTypeCanal() == TypeCanal.EQUIPE && c2.getTypeCanal() != TypeCanal.EQUIPE) return -1;
            if (c2.getTypeCanal() == TypeCanal.EQUIPE && c1.getTypeCanal() != TypeCanal.EQUIPE) return 1;
            return c2.getDateCreation().compareTo(c1.getDateCreation());
        });

        return canaux.stream().map(c -> convertirCanalEnDTO(c, currentId)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MessageDTO> getMessagesCanal(Long canalId) {
        return messageRepository.findByCanalIdOrderByDateEnvoiAsc(canalId).stream()
                .map(this::convertirMessageEnDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public MessageDTO envoyerMessage(MessageRequest request) {
        Long currentId = securityService.getIdUtilisateurConnecte();
        Membre auteur = (currentId != null) ? membreRepository.findById(currentId).orElse(null) : null;
        if (auteur == null) throw new RegleMetierException("Utilisateur non authentifié");

        CanalDiscussion canal = null;
        if (request.getCanalId() != null) {
            canal = canalRepository.findById(request.getCanalId())
                    .orElseThrow(() -> new RessourceIntrouvableException("Canal de discussion introuvable"));

            // Si c'est GENERAL ou EQUIPE et que l'auteur n'est pas encore dans participants, l'ajouter
            if ((canal.getTypeCanal() == TypeCanal.GENERAL || canal.getTypeCanal() == TypeCanal.EQUIPE)
                    && !canal.getParticipants().contains(auteur)) {
                canal.getParticipants().add(auteur);
                canalRepository.save(canal);
            }
        } else if (request.getDestinataireId() != null) {
            CanalDiscussionDTO cDto = creerCanalDirect(CanalRequest.builder().destinataireId(request.getDestinataireId()).build());
            canal = canalRepository.findById(cDto.getId()).orElseThrow();
        } else {
            throw new RegleMetierException("L'identifiant du canal ou du destinataire est requis");
        }

        Message m = Message.builder()
                .contenu(request.getContenu().trim())
                .dateEnvoi(LocalDateTime.now())
                .auteur(auteur)
                .canal(canal)
                .build();

        Message saved = messageRepository.save(m);

        // Marquer lu pour l'auteur
        MessageLecture lectureAuteur = MessageLecture.builder()
                .message(saved)
                .membre(auteur)
                .dateLecture(LocalDateTime.now())
                .build();
        lectureRepository.save(lectureAuteur);

        MessageDTO dto = convertirMessageEnDTO(saved);

        // Diffusion WebSocket du nouveau message
        try {
            messagingTemplate.convertAndSend("/topic/canaux/" + canal.getId(), dto);
        } catch (Exception e) {
            log.warn("Erreur diffusion message WebSocket: {}", e.getMessage());
        }

        return dto;
    }

    @Transactional
    public void marquerCanalLu(Long canalId) {
        Long currentId = securityService.getIdUtilisateurConnecte();
        if (currentId == null) return;
        Membre membre = membreRepository.findById(currentId).orElse(null);
        if (membre == null) return;

        List<Message> messages = messageRepository.findByCanalIdOrderByDateEnvoiAsc(canalId);
        LocalDateTime now = LocalDateTime.now();

        for (Message m : messages) {
            if (!lectureRepository.existsByMessageIdAndMembreId(m.getId(), currentId)) {
                MessageLecture ml = MessageLecture.builder()
                        .message(m)
                        .membre(membre)
                        .dateLecture(now)
                        .build();
                lectureRepository.save(ml);
            }
        }
    }

    @Transactional
    public CanalDiscussionDTO creerCanalDirect(CanalRequest request) {
        Long currentId = securityService.getIdUtilisateurConnecte();
        if (currentId == null) throw new RegleMetierException("Utilisateur non authentifié");

        Membre current = membreRepository.findById(currentId).orElseThrow();
        Membre destinataire = membreRepository.findById(request.getDestinataireId())
                .orElseThrow(() -> new RessourceIntrouvableException("Destinataire introuvable"));

        // Vérifier si un canal direct existe déjà
        Optional<CanalDiscussion> directExistant = canalRepository.findCanalDirect(current, destinataire);
        if (directExistant.isPresent()) {
            return convertirCanalEnDTO(directExistant.get(), currentId);
        }

        Set<Membre> participants = new HashSet<>();
        participants.add(current);
        participants.add(destinataire);

        CanalDiscussion nouveauCanal = CanalDiscussion.builder()
                .titre(destinataire.getPrenom() + " " + destinataire.getNom())
                .typeCanal(TypeCanal.DIRECT)
                .dateCreation(LocalDateTime.now())
                .participants(participants)
                .build();

        CanalDiscussion saved = canalRepository.save(nouveauCanal);
        return convertirCanalEnDTO(saved, currentId);
    }

    public CanalDiscussionDTO convertirCanalEnDTO(CanalDiscussion c, Long currentMembreId) {
        List<MembreResumeDTO> participants = c.getParticipants().stream()
                .map(membreService::convertirEnResumeDTO)
                .collect(Collectors.toList());

        Long nonLus = (currentMembreId != null) ? messageRepository.countMessagesNonLus(c.getId(), currentMembreId) : 0L;

        List<Message> msgs = c.getMessages();
        MessageDTO dernierMsg = (msgs != null && !msgs.isEmpty())
                ? convertirMessageEnDTO(msgs.get(msgs.size() - 1))
                : null;

        String titre = c.getTitre();
        if (c.getTypeCanal() == TypeCanal.DIRECT && currentMembreId != null) {
            // Afficher le nom de l'autre participant
            for (Membre p : c.getParticipants()) {
                if (!p.getId().equals(currentMembreId)) {
                    titre = p.getPrenom() + " " + p.getNom();
                    break;
                }
            }
        } else if (c.getTypeCanal() == TypeCanal.GENERAL && (titre == null || titre.isBlank())) {
            titre = "Laboratoire LIAS (Général)";
        } else if (c.getTypeCanal() == TypeCanal.EQUIPE && c.getEquipe() != null && (titre == null || titre.isBlank())) {
            titre = "Équipe " + c.getEquipe().getNom();
        }

        return CanalDiscussionDTO.builder()
                .id(c.getId())
                .titre(titre)
                .typeCanal(c.getTypeCanal())
                .dateCreation(c.getDateCreation())
                .participants(participants)
                .equipeId(c.getEquipe() != null ? c.getEquipe().getId() : null)
                .evenementId(c.getEvenement() != null ? c.getEvenement().getId() : null)
                .messagesNonLus(nonLus)
                .dernierMessage(dernierMsg)
                .build();
    }

    public MessageDTO convertirMessageEnDTO(Message m) {
        return MessageDTO.builder()
                .id(m.getId())
                .contenu(m.getContenu())
                .dateEnvoi(m.getDateEnvoi())
                .auteur(membreService.convertirEnResumeDTO(m.getAuteur()))
                .canalId(m.getCanal().getId())
                .build();
    }
}
