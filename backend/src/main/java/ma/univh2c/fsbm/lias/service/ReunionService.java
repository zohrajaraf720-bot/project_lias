package ma.univh2c.fsbm.lias.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.univh2c.fsbm.lias.dto.PageDTO;
import ma.univh2c.fsbm.lias.dto.ReunionDTO;
import ma.univh2c.fsbm.lias.dto.ReunionRequest;
import ma.univh2c.fsbm.lias.entity.Document;
import ma.univh2c.fsbm.lias.entity.Membre;
import ma.univh2c.fsbm.lias.entity.Reunion;
import ma.univh2c.fsbm.lias.enums.StatutReunion;
import ma.univh2c.fsbm.lias.enums.TypeDocument;
import ma.univh2c.fsbm.lias.enums.TypeNotification;
import ma.univh2c.fsbm.lias.exception.ConflitEtatException;
import ma.univh2c.fsbm.lias.exception.RegleMetierException;
import ma.univh2c.fsbm.lias.exception.RessourceIntrouvableException;
import ma.univh2c.fsbm.lias.repository.DocumentRepository;
import ma.univh2c.fsbm.lias.repository.MembreRepository;
import ma.univh2c.fsbm.lias.repository.ReunionRepository;
import ma.univh2c.fsbm.lias.security.SecurityService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReunionService {

    private final ReunionRepository reunionRepository;
    private final MembreRepository membreRepository;
    private final DocumentRepository documentRepository;
    private final FileStorageService fileStorageService;
    private final SecurityService securityService;
    private final MembreService membreService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public PageDTO<ReunionDTO> rechercherReunions(StatutReunion statut, Pageable pageable) {
        Page<Reunion> page = (statut != null)
                ? reunionRepository.findByStatut(statut, pageable)
                : reunionRepository.findAll(pageable);
        return PageDTO.from(page, page.getContent().stream().map(this::convertirEnDTO).collect(Collectors.toList()));
    }

    @Transactional(readOnly = true)
    public List<ReunionDTO> listerReunionsDuMembre() {
        Long currentId = securityService.getIdUtilisateurConnecte();
        if (currentId == null) return Collections.emptyList();

        return reunionRepository.findReunionsPourMembre(currentId).stream()
                .map(this::convertirEnDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ReunionDTO getReunion(Long id) {
        Reunion r = reunionRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Réunion introuvable"));
        return convertirEnDTO(r);
    }

    @Transactional
    public ReunionDTO planifierReunion(ReunionRequest request) {
        Long currentId = securityService.getIdUtilisateurConnecte();
        Membre organisateur = (currentId != null) ? membreRepository.findById(currentId).orElse(null) : null;

        Set<Membre> participants = new HashSet<>();
        if (request.getParticipantsIds() != null) {
            for (Long pId : request.getParticipantsIds()) {
                membreRepository.findById(pId).ifPresent(participants::add);
            }
        }

        LocalDateTime dateReunion = request.getDateReunion();
        if (dateReunion == null) {
            dateReunion = request.getDateHeure();
        }

        Reunion r = Reunion.builder()
                .titre(request.getTitre().trim())
                .dateReunion(dateReunion)
                .lieu(request.getLieu() != null ? request.getLieu().trim() : null)
                .ordreDuJour(request.getOrdreDuJour())
                .statut(StatutReunion.PLANIFIEE)
                .organisateur(organisateur)
                .participants(participants)
                .build();

        Reunion saved = reunionRepository.save(r);

        // Notifier chaque participant convoqué
        for (Membre p : participants) {
            if (organisateur == null || !p.getId().equals(organisateur.getId())) {
                notificationService.creerNotification(
                        p,
                        "Convocation Réunion : " + saved.getTitre(),
                        "Vous êtes convié(e) à la réunion '" + saved.getTitre() + "' prévue le "
                                + (dateReunion != null ? dateReunion.toString().replace('T', ' ') : "")
                                + (saved.getLieu() != null ? " (Lieu : " + saved.getLieu() + ")" : "") + ".",
                        TypeNotification.REUNION,
                        "/reunions/" + saved.getId()
                );
            }
        }

        return convertirEnDTO(saved);
    }

    @Transactional
    public ReunionDTO modifierOrdreDuJour(Long id, String ordreDuJour) {
        Reunion r = reunionRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Réunion introuvable"));

        if (r.getStatut() == StatutReunion.ARCHIVEE) {
            throw new ConflitEtatException("Impossible de modifier l'ordre du jour d'une réunion archivée");
        }

        r.ajouterOrdreDuJour(ordreDuJour);
        Reunion saved = reunionRepository.save(r);

        // Notifier les participants de la mise à jour
        if (r.getParticipants() != null) {
            for (Membre p : r.getParticipants()) {
                notificationService.creerNotification(
                        p,
                        "Ordre du jour actualisé : " + r.getTitre(),
                        "L'ordre du jour de la réunion '" + r.getTitre() + "' a été mis à jour.",
                        TypeNotification.REUNION,
                        "/reunions/" + r.getId()
                );
            }
        }

        return convertirEnDTO(saved);
    }

    @Transactional
    public ReunionDTO attacherPV(Long id, MultipartFile fichier) {
        Reunion r = reunionRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Réunion introuvable"));

        if (r.getStatut() == StatutReunion.ARCHIVEE) {
            throw new ConflitEtatException("Cette réunion a déjà son PV et est archivée");
        }

        Long currentId = securityService.getIdUtilisateurConnecte();
        Membre auteur = (currentId != null) ? membreRepository.findById(currentId).orElse(null) : r.getOrganisateur();

        String chemin = fileStorageService.stockerFichier(fichier, "pv");
        String sha256 = fileStorageService.calculerSha256(fichier);

        Document doc = Document.builder()
                .titre("Procès-Verbal - " + r.getTitre())
                .cheminFichier(chemin)
                .typeDocument(TypeDocument.PV)
                .empreinteSha256(sha256)
                .dateUpload(LocalDateTime.now())
                .version(1)
                .auteur(auteur)
                .build();

        Document savedDoc = documentRepository.save(doc);

        r.setPv(savedDoc);
        r.cloturerEtArchiver();
        Reunion savedReunion = reunionRepository.save(r);

        // Notifier tous les participants que le PV officiel est disponible
        if (r.getParticipants() != null) {
            for (Membre p : r.getParticipants()) {
                notificationService.creerNotification(
                        p,
                        "Procès-Verbal disponible : " + r.getTitre(),
                        "Le Procès-Verbal officiel de la réunion '" + r.getTitre() + "' a été déposé et est consultable.",
                        TypeNotification.REUNION,
                        "/reunions/" + r.getId()
                );
            }
        }

        return convertirEnDTO(savedReunion);
    }

    @Transactional(readOnly = true)
    public Document getPvDocument(Long id) {
        Reunion r = reunionRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Réunion introuvable"));
        if (r.getPv() == null) {
            throw new RessourceIntrouvableException("Aucun PV rattaché à cette réunion");
        }
        return r.getPv();
    }

    public ReunionDTO convertirEnDTO(Reunion r) {
        List<ma.univh2c.fsbm.lias.dto.MembreResumeDTO> parts = r.getParticipants().stream()
                .map(membreService::convertirEnResumeDTO)
                .collect(Collectors.toList());

        return ReunionDTO.builder()
                .id(r.getId())
                .titre(r.getTitre())
                .dateReunion(r.getDateReunion())
                .lieu(r.getLieu())
                .ordreDuJour(r.getOrdreDuJour())
                .statut(r.getStatut())
                .organisateur(membreService.convertirEnResumeDTO(r.getOrganisateur()))
                .participants(parts)
                .pvDocumentId(r.getPv() != null ? r.getPv().getId() : null)
                .build();
    }
}
