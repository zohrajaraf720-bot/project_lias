package ma.univh2c.fsbm.lias.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.univh2c.fsbm.lias.dto.*;
import ma.univh2c.fsbm.lias.entity.*;
import ma.univh2c.fsbm.lias.enums.StatutConvention;
import ma.univh2c.fsbm.lias.enums.TypeNotification;
import ma.univh2c.fsbm.lias.enums.TypePublication;
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

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PublicationService {

    private final PublicationRepository publicationRepository;
    private final MembreRepository membreRepository;
    private final EquipeRepository equipeRepository;
    private final ConventionRepository conventionRepository;
    private final SecurityService securityService;
    private final MembreService membreService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public PageDTO<PublicationDTO> rechercherPublications(String q, Long equipeId, Integer annee, Long auteurId, Pageable pageable) {
        return rechercherPublications(q, equipeId, annee, auteurId, null, pageable);
    }

    @Transactional(readOnly = true)
    public PageDTO<PublicationDTO> rechercherPublications(String q, Long equipeId, Integer annee, Long auteurId, TypePublication type, Pageable pageable) {
        Specification<Publication> spec = (root, query, cb) -> {
            query.distinct(true);
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();

            if (q != null && !q.isBlank()) {
                String pattern = "%" + q.toLowerCase().trim() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("titre")), pattern),
                        cb.like(cb.lower(root.get("resume")), pattern)
                ));
            }
            if (equipeId != null) {
                predicates.add(cb.equal(root.get("equipe").get("id"), equipeId));
            }
            if (annee != null) {
                predicates.add(cb.equal(root.get("annee"), annee));
            }
            if (type != null) {
                predicates.add(cb.equal(root.get("type"), type));
            }
            if (auteurId != null) {
                predicates.add(cb.isMember(membreRepository.getReferenceById(auteurId), root.get("auteurs")));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        Page<Publication> page = publicationRepository.findAll(spec, pageable);
        return PageDTO.from(page, page.getContent().stream().map(this::convertirEnDTO).collect(Collectors.toList()));
    }

    @Transactional(readOnly = true)
    public PublicationDTO getPublication(Long id) {
        Publication p = publicationRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Publication introuvable"));
        return convertirEnDTO(p);
    }

    @Transactional(readOnly = true)
    public List<PublicationDTO> listerPublicationsParMembre(Long membreId) {
        return publicationRepository.findByAuteurId(membreId).stream()
                .map(this::convertirEnDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PublicationDTO> listerPublicationsParEquipe(Long equipeId) {
        return publicationRepository.findByEquipeId(equipeId).stream()
                .map(this::convertirEnDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public PublicationDTO ajouterPublication(PublicationRequest request) {
        if (securityService.estAdmin()) {
            throw new RegleMetierException("Un administrateur n'est pas un chercheur et ne peut pas enregistrer d'articles scientifiques.");
        }
        if (request.getLienDoi() != null && !request.getLienDoi().isBlank()) {
            if (publicationRepository.existsByLienDoi(request.getLienDoi().trim())) {
                throw new ConflitEtatException("Une publication avec ce DOI existe déjà dans le système");
            }
        }

        Set<Membre> auteurs = new HashSet<>();
        if (request.getAuteursIds() != null && !request.getAuteursIds().isEmpty()) {
            for (Long aId : request.getAuteursIds()) {
                membreRepository.findById(aId).ifPresent(auteurs::add);
            }
        }

        // Si aucun auteur n'est précisé, lier automatiquement l'auteur connecté
        Long currentId = securityService.getIdUtilisateurConnecte();
        if (auteurs.isEmpty() && currentId != null) {
            membreRepository.findById(currentId).ifPresent(auteurs::add);
        }

        Equipe eq = null;
        if (request.getEquipeId() != null) {
            eq = equipeRepository.findById(request.getEquipeId()).orElse(null);
        } else if (currentId != null) {
            // Assigner l'équipe actuelle du membre connecté par défaut si elle existe
            Membre m = membreRepository.findById(currentId).orElse(null);
            if (m != null) eq = m.getEquipeActuelle();
        }

        Convention convention = null;
        if (request.getConventionId() != null) {
            convention = conventionRepository.findById(request.getConventionId())
                    .filter(c -> c.getStatut() == StatutConvention.EN_COURS)
                    .orElseThrow(() -> new RegleMetierException("La convention sélectionnée n'existe pas ou n'est pas EN_COURS"));
        }

        Publication p = Publication.builder()
                .titre(request.getTitre().trim())
                .type(request.getType() != null ? request.getType() : TypePublication.ARTICLE_JOURNAL)
                .annee(request.getAnnee())
                .resume(request.getResume())
                .lienDoi(request.getLienDoi())
                .coAuteursExternes(request.getCoAuteursExternes() != null ? request.getCoAuteursExternes() : new ArrayList<>())
                .auteurs(auteurs)
                .equipe(eq)
                .convention(convention)
                .build();

        Publication saved = publicationRepository.save(p);

        // Notifications aux co-auteurs
        for (Membre a : auteurs) {
            if (currentId == null || !a.getId().equals(currentId)) {
                notificationService.creerNotification(
                        a,
                        "Nouvelle publication scientifique",
                        "Vous avez été associé(e) comme co-auteur sur la publication : '" + saved.getTitre() + "'.",
                        TypeNotification.PUBLICATION,
                        "/publications-gestion"
                );
            }
        }

        // Notification aux membres de l'équipe
        if (eq != null) {
            notificationService.notifierMembresEquipe(
                    eq.getId(),
                    "Nouvelle publication d'équipe",
                    "Une nouvelle publication a été enregistrée pour l'équipe " + eq.getNom() + " : '" + saved.getTitre() + "'.",
                    TypeNotification.PUBLICATION,
                    "/publications-gestion",
                    currentId
            );
        }

        // Notification à la Direction
        notificationService.notifierDirection(
                "Nouvelle publication enregistrée",
                "La publication '" + saved.getTitre() + "' (" + saved.getAnnee() + ") a été enregistrée.",
                TypeNotification.PUBLICATION,
                "/publications-gestion"
        );

        return convertirEnDTO(saved);
    }

    @Transactional
    public PublicationDTO modifierPublication(Long id, PublicationRequest request) {
        Publication p = publicationRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Publication introuvable"));

        if (request.getLienDoi() != null && !request.getLienDoi().isBlank()
                && !request.getLienDoi().equalsIgnoreCase(p.getLienDoi())) {
            if (publicationRepository.existsByLienDoi(request.getLienDoi().trim())) {
                throw new ConflitEtatException("Une publication avec ce DOI existe déjà dans le système");
            }
        }

        p.setTitre(request.getTitre().trim());
        if (request.getType() != null) {
            p.setType(request.getType());
        }
        p.setAnnee(request.getAnnee());
        p.setResume(request.getResume());
        p.setLienDoi(request.getLienDoi());

        if (request.getCoAuteursExternes() != null) {
            p.setCoAuteursExternes(request.getCoAuteursExternes());
        }

        if (request.getAuteursIds() != null) {
            Set<Membre> auteurs = new HashSet<>();
            for (Long aId : request.getAuteursIds()) {
                membreRepository.findById(aId).ifPresent(auteurs::add);
            }
            p.setAuteurs(auteurs);
        }

        if (request.getEquipeId() != null) {
            p.setEquipe(equipeRepository.findById(request.getEquipeId()).orElse(null));
        }

        if (request.getConventionId() != null) {
            Convention convention = conventionRepository.findById(request.getConventionId())
                    .filter(c -> c.getStatut() == StatutConvention.EN_COURS)
                    .orElseThrow(() -> new RegleMetierException("La convention sélectionnée n'existe pas ou n'est pas EN_COURS"));
            p.setConvention(convention);
        } else {
            p.setConvention(null);
        }

        Publication saved = publicationRepository.save(p);
        return convertirEnDTO(saved);
    }

    @Transactional
    public void archiverPublication(Long id) {
        Publication p = publicationRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Publication introuvable"));
        p.setArchive(true);
        publicationRepository.save(p);
    }

    @Transactional
    public void supprimerPublication(Long id) {
        archiverPublication(id);
    }

    public PublicationDTO convertirEnDTO(Publication p) {
        List<MembreResumeDTO> auteurs = p.getAuteurs().stream()
                .map(membreService::convertirEnResumeDTO)
                .collect(Collectors.toList());

        return PublicationDTO.builder()
                .id(p.getId())
                .titre(p.getTitre())
                .type(p.getType() != null ? p.getType() : TypePublication.ARTICLE_JOURNAL)
                .annee(p.getAnnee())
                .resume(p.getResume())
                .lienDoi(p.getLienDoi())
                .coAuteursExternes(p.getCoAuteursExternes())
                .auteurs(auteurs)
                .equipeId(p.getEquipe() != null ? p.getEquipe().getId() : null)
                .equipeNom(p.getEquipe() != null ? p.getEquipe().getNom() : null)
                .conventionId(p.getConvention() != null ? p.getConvention().getId() : null)
                .conventionTitre(p.getConvention() != null ? p.getConvention().getTitre() : null)
                .build();
    }
}
