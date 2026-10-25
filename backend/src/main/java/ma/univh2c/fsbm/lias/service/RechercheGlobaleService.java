package ma.univh2c.fsbm.lias.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.univh2c.fsbm.lias.dto.*;
import ma.univh2c.fsbm.lias.entity.*;
import ma.univh2c.fsbm.lias.enums.StatutValidationEvenement;
import ma.univh2c.fsbm.lias.repository.*;
import ma.univh2c.fsbm.lias.security.SecurityService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RechercheGlobaleService {

    private final MembreRepository membreRepository;
    private final DocumentRepository documentRepository;
    private final EvenementScientifiqueRepository evenementRepository;
    private final PublicationRepository publicationRepository;
    private final NotificationRepository notificationRepository;
    private final SecurityService securityService;
    private final MembreService membreService;
    private final DocumentService documentService;
    private final EvenementService evenementService;
    private final PublicationService publicationService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public SearchResultDTO rechercher(String query) {
        if (query == null || query.trim().length() < 2) {
            return SearchResultDTO.builder()
                    .membres(Collections.emptyList())
                    .documents(Collections.emptyList())
                    .evenements(Collections.emptyList())
                    .publications(Collections.emptyList())
                    .notifications(Collections.emptyList())
                    .build();
        }

        String q = query.trim().toLowerCase();
        Long currentId = securityService.getIdUtilisateurConnecte();

        // 1. Membres (visiteurs anonymes n'ont pas accès à l'annuaire interne)
        List<MembreInterneDTO> membres = new ArrayList<>();
        if (currentId != null) {
            membres = membreRepository.findAll().stream()
                    .filter(m -> (m.getNom() != null && m.getNom().toLowerCase().contains(q)) ||
                                 (m.getPrenom() != null && m.getPrenom().toLowerCase().contains(q)) ||
                                 (m.getEmail() != null && m.getEmail().toLowerCase().contains(q)) ||
                                 (m.getBiographie() != null && m.getBiographie().toLowerCase().contains(q)))
                    .limit(10)
                    .map(membreService::convertirEnInterneDTO)
                    .collect(Collectors.toList());
        }

        // 2. Documents (visiteurs anonymes n'ont pas accès aux documents)
        List<DocumentDTO> documents = new ArrayList<>();
        if (currentId != null) {
            documents = documentRepository.findAll().stream()
                    .filter(d -> d.getTitre() != null && d.getTitre().toLowerCase().contains(q))
                    .limit(10)
                    .map(documentService::convertirEnDTO)
                    .collect(Collectors.toList());
        }

        // 3. Événements (visiteurs anonymes ne voient que les validés)
        List<EvenementDTO> evenements = evenementRepository.findAll().stream()
                .filter(e -> currentId != null || e.getStatutValidation() == StatutValidationEvenement.VALIDE)
                .filter(e -> (e.getTitre() != null && e.getTitre().toLowerCase().contains(q)) ||
                             (e.getDescription() != null && e.getDescription().toLowerCase().contains(q)) ||
                             (e.getEdition() != null && e.getEdition().toLowerCase().contains(q)))
                .limit(10)
                .map(evenementService::convertirEnDTO)
                .collect(Collectors.toList());

        // 4. Publications
        List<PublicationDTO> publications = publicationRepository.findAll().stream()
                .filter(p -> (p.getTitre() != null && p.getTitre().toLowerCase().contains(q)) ||
                             (p.getResume() != null && p.getResume().toLowerCase().contains(q)))
                .limit(10)
                .map(publicationService::convertirEnDTO)
                .collect(Collectors.toList());

        // 5. Notifications (uniquement celles de l'utilisateur connecté)
        List<NotificationDTO> notifications = new ArrayList<>();
        if (currentId != null) {
            notifications = notificationRepository.findByDestinataireIdOrderByDateCreationDesc(currentId).stream()
                    .filter(n -> (n.getTitre() != null && n.getTitre().toLowerCase().contains(q)) ||
                                 (n.getMessage() != null && n.getMessage().toLowerCase().contains(q)))
                    .limit(10)
                    .map(notificationService::convertirEnDTO)
                    .collect(Collectors.toList());
        }

        return SearchResultDTO.builder()
                .membres(membres)
                .documents(documents)
                .evenements(evenements)
                .publications(publications)
                .notifications(notifications)
                .build();
    }
}
