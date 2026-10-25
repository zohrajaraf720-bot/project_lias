error id: file:///C:/Users/moham/Documents/JEE/lias/backend/src/main/java/ma/univh2c/fsbm/lias/service/DocumentService.java:_empty_/Membre#
file:///C:/Users/moham/Documents/JEE/lias/backend/src/main/java/ma/univh2c/fsbm/lias/service/DocumentService.java
empty definition using pc, found symbol in pc: _empty_/Membre#
empty definition using semanticdb
empty definition using fallback
non-local guesses:

offset: 4934
uri: file:///C:/Users/moham/Documents/JEE/lias/backend/src/main/java/ma/univh2c/fsbm/lias/service/DocumentService.java
text:
```scala
package ma.univh2c.fsbm.lias.service;

import lombok.RequiredArgsConstructor;
import ma.univh2c.fsbm.lias.aspect.Audite;
import ma.univh2c.fsbm.lias.dto.DocumentDTO;
import ma.univh2c.fsbm.lias.dto.DocumentUploadRequest;
import ma.univh2c.fsbm.lias.dto.PageDTO;
import ma.univh2c.fsbm.lias.dto.VersionDocumentDTO;
import ma.univh2c.fsbm.lias.entity.Document;
import ma.univh2c.fsbm.lias.entity.EvenementScientifique;
import ma.univh2c.fsbm.lias.entity.HistoriqueDocument;
import ma.univh2c.fsbm.lias.entity.Membre;
import ma.univh2c.fsbm.lias.enums.TypeAction;
import ma.univh2c.fsbm.lias.enums.StatutMembre;
import ma.univh2c.fsbm.lias.event.DocumentAjouteEvent;
import ma.univh2c.fsbm.lias.exception.ConflitEtatException;
import ma.univh2c.fsbm.lias.exception.RessourceIntrouvableException;
import ma.univh2c.fsbm.lias.mapper.DocumentMapper;
import ma.univh2c.fsbm.lias.repository.DocumentRepository;
import ma.univh2c.fsbm.lias.repository.EvenementScientifiqueRepository;
import ma.univh2c.fsbm.lias.repository.HistoriqueDocumentRepository;
import ma.univh2c.fsbm.lias.repository.ConventionRepository;
import ma.univh2c.fsbm.lias.security.MembreDetails;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final HistoriqueDocumentRepository historiqueDocumentRepository;
    private final EvenementScientifiqueRepository evenementRepository;
    private final ConventionRepository conventionRepository;
    private final FileStorageService fileStorageService;
    private final DocumentMapper documentMapper;
    private final ApplicationEventPublisher eventPublisher;

    public DocumentDTO getDocument(Long id) {
        return documentMapper.toDto(trouverDocument(id));
    }

    public List<VersionDocumentDTO> getHistoriqueVersions(Long id) {
        Document document = trouverDocument(id);
        return documentMapper.toVersionDtoList(historiqueDocumentRepository.findByDocumentIdOrderByVersionArchiveeDesc(id));
    }

    @Transactional
    @Audite(action = TypeAction.CREATION, entite = "Document")
    public DocumentDTO uploaderDocument(DocumentUploadRequest request) {
        Membre connecte = getMembreConnecte();

        if (connecte.getStatut() == StatutMembre.DOCTORANT) {
            throw new ConflitEtatException("ACCES_REFUSE", "Les doctorants ne sont pas autorisés à ajouter des documents.");
        }
        
        if (request.getFichier() == null || request.getFichier().isEmpty()) {
            throw new ConflitEtatException("FICHIER_ABSENT", "Le fichier est manquant");
        }

        String cheminFichier = fileStorageService.stockerFichier(request.getFichier(), "documents");

        Document document = new Document();
        document.setTitre(request.getFichier().getOriginalFilename());
        document.setCheminFichier(cheminFichier);
        document.setTypeDocument(request.getType());
        document.setDateUpload(LocalDateTime.now());
        document.setVersion(1);
        document.setAuteur(getMembreConnecte());

        if (request.getEvenementId() != null) {
            EvenementScientifique evt = evenementRepository.findById(request.getEvenementId())
                    .orElseThrow(() -> new RessourceIntrouvableException("Événement introuvable"));
            document.setEvenementScientifique(evt);
        }

        if (request.getConventionId() != null) {
            ma.univh2c.fsbm.lias.entity.Convention conv = conventionRepository.findById(request.getConventionId())
                    .orElseThrow(() -> new RessourceIntrouvableException("Convention introuvable"));
            document.setConvention(conv);
        }

        // Sauvegarde de l'entité en base (le document obtient un ID)
        document = documentRepository.save(document);

        // Publication de l'événement pour générer la notification asynchrone (S-NOT-01)
        eventPublisher.publishEvent(new DocumentAjouteEvent(document));

        return documentMapper.toDto(document);
    }

    @Transactional
    @Audite(action = TypeAction.MODIFICATION, entite = "Document")
    public DocumentDTO creerNouvelleVersion(Long id, MultipartFile nouveauFichier, String commentaire) {
        Document document = trouverDocument(id);
        
        @@Membre auteur = getMembreConnecte();
        // Vérification des droits : seul l'auteur original ou la Direction peut modifier (simplifié ici à l'auteur)
        if (!document.getAuteur().getId().equals(auteur.getId())) {
            throw new ConflitEtatException("DROITS_INSUFFISANTS", "Seul l'auteur peut mettre à jour ce document");
        }

        // 1. Archiver l'ancienne version
        HistoriqueDocument historique = HistoriqueDocument.builder()
                .cheminAncienFichier(document.getCheminFichier())
                .versionArchivee(document.getVersion())
                .dateModification(LocalDateTime.now())
                .auteurId(auteur.getId())
                .tailleFichier(nouveauFichier.getSize())
                .commentaireModification(commentaire)
                .document(document)
                .build();
        historiqueDocumentRepository.save(historique);

        // 2. Sauvegarder le nouveau fichier et mettre à jour le document
        String nouveauChemin = fileStorageService.stockerFichier(nouveauFichier, "documents");
        document.setCheminFichier(nouveauChemin);
        document.setVersion(document.getVersion() + 1);
        document.setDateUpload(LocalDateTime.now());

        document = documentRepository.save(document);

        // On peut aussi déclencher l'événement lors de l'ajout d'une version
        eventPublisher.publishEvent(new DocumentAjouteEvent(document));

        return documentMapper.toDto(document);
    }

    public Resource telechargerFichier(Long id, Integer version) {
        Document document = trouverDocument(id);
        
        if (document.getTypeDocument() == ma.univh2c.fsbm.lias.enums.TypeDocument.CONVENTION) {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
                throw new ConflitEtatException("ACCES_REFUSE", "Authentification requise pour lire une convention.");
            }
            boolean isDirection = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_DIRECTEUR") || a.getAuthority().equals("ROLE_VICE_DIRECTEUR"));
            if (!isDirection) {
                throw new ConflitEtatException("ACCES_REFUSE", "Seule la Direction a accès aux pièces contractuelles (RG-15).");
            }
        }
        
        String chemin;

        if (version != null && !version.equals(document.getVersion())) {
            HistoriqueDocument historique = historiqueDocumentRepository.findByDocumentIdAndVersionArchivee(id, version)
                    .orElseThrow(() -> new RessourceIntrouvableException("Version introuvable"));
            chemin = historique.getCheminAncienFichier();
        } else {
            chemin = document.getCheminFichier();
        }

        try {
            Path filePath = Paths.get(chemin).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists()) {
                return resource;
            } else {
                throw new RessourceIntrouvableException("Fichier physique introuvable");
            }
        } catch (MalformedURLException ex) {
            throw new RuntimeException("Chemin de fichier invalide", ex);
        }
    }

    private Document trouverDocument(Long id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Document introuvable"));
    }

    private Membre getMembreConnecte() {
        MembreDetails details = (MembreDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return details.getMembre();
    }

    public PageDTO<DocumentDTO> rechercherDocuments(String titre, ma.univh2c.fsbm.lias.enums.TypeDocument type, Long evenementId, org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.jpa.domain.Specification<Document> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new java.util.ArrayList<>();
            if (titre != null && !titre.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("titre")), "%" + titre.toLowerCase() + "%"));
            }
            if (type != null) {
                predicates.add(cb.equal(root.get("typeDocument"), type));
            }
            if (evenementId != null) {
                predicates.add(cb.equal(root.get("evenementScientifique").get("id"), evenementId));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
        
        return PageDTO.of(documentRepository.findAll(spec, pageable), documentMapper::toDto);
    }
}
```


#### Short summary: 

empty definition using pc, found symbol in pc: _empty_/Membre#