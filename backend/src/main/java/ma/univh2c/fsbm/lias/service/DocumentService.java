package ma.univh2c.fsbm.lias.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.univh2c.fsbm.lias.dto.DocumentDTO;
import ma.univh2c.fsbm.lias.dto.DocumentUploadRequest;
import ma.univh2c.fsbm.lias.dto.PageDTO;
import ma.univh2c.fsbm.lias.dto.VersionDocumentDTO;
import ma.univh2c.fsbm.lias.entity.*;
import ma.univh2c.fsbm.lias.enums.TypeDocument;
import ma.univh2c.fsbm.lias.exception.ConflitEtatException;
import ma.univh2c.fsbm.lias.exception.RegleMetierException;
import ma.univh2c.fsbm.lias.exception.RessourceIntrouvableException;
import ma.univh2c.fsbm.lias.repository.*;
import ma.univh2c.fsbm.lias.security.SecurityService;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final HistoriqueDocumentRepository historiqueDocumentRepository;
    private final EvenementScientifiqueRepository evenementRepository;
    private final ConventionRepository conventionRepository;
    private final MembreRepository membreRepository;
    private final FileStorageService fileStorageService;
    private final SecurityService securityService;
    private final MembreService membreService;

    @Transactional
    public DocumentDTO uploaderDocument(DocumentUploadRequest request) {
        Long currentId = securityService.getIdUtilisateurConnecte();
        Membre auteur = (currentId != null) ? membreRepository.findById(currentId).orElse(null) : null;
        if (auteur == null) throw new RegleMetierException("Auteur non authentifié");

        EvenementScientifique evenement = null;
        if (request.getEvenementId() != null) {
            evenement = evenementRepository.findById(request.getEvenementId()).orElse(null);
        }

        Convention convention = null;
        if (request.getConventionId() != null) {
            convention = conventionRepository.findById(request.getConventionId()).orElse(null);
        }

        String chemin = fileStorageService.stockerFichier(request.getFichier(), "documents");
        String sha256 = fileStorageService.calculerSha256(request.getFichier());

        Document doc = Document.builder()
                .titre(request.getTitre().trim())
                .cheminFichier(chemin)
                .typeDocument(request.getTypeDocument())
                .empreinteSha256(sha256)
                .dateUpload(LocalDateTime.now())
                .version(1)
                .evenement(evenement)
                .convention(convention)
                .auteur(auteur)
                .build();

        Document saved = documentRepository.save(doc);
        return convertirEnDTO(saved);
    }

    @Transactional(readOnly = true)
    public PageDTO<DocumentDTO> rechercherDocuments(String titre, TypeDocument type, Long evenementId, Pageable pageable) {
        Specification<Document> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            if (titre != null && !titre.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("titre")), "%" + titre.toLowerCase().trim() + "%"));
            }
            if (type != null) {
                predicates.add(cb.equal(root.get("typeDocument"), type));
            }
            if (evenementId != null) {
                predicates.add(cb.equal(root.get("evenement").get("id"), evenementId));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        Page<Document> page = documentRepository.findAll(spec, pageable);
        return PageDTO.from(page, page.getContent().stream().map(this::convertirEnDTO).collect(Collectors.toList()));
    }

    @Transactional(readOnly = true)
    public DocumentDTO getDocument(Long id) {
        Document d = documentRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Document introuvable"));
        return convertirEnDTO(d);
    }

    @Transactional(readOnly = true)
    public List<VersionDocumentDTO> getHistoriqueVersions(Long id) {
        Document d = documentRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Document introuvable"));

        List<VersionDocumentDTO> result = new ArrayList<>();

        // Version courante
        result.add(VersionDocumentDTO.builder()
                .id(d.getId())
                .version(d.getVersion())
                .cheminFichier(d.getCheminFichier())
                .dateModification(d.getDateUpload())
                .auteurId(d.getAuteur().getId())
                .auteurNom(d.getAuteur().getPrenom() + " " + d.getAuteur().getNom())
                .commentaire("Version courante")
                .build());

        // Versions archivées
        for (HistoriqueDocument hd : d.getHistoriqueVersions()) {
            String auteurNom = "Inconnu";
            if (hd.getAuteurId() != null) {
                auteurNom = membreRepository.findById(hd.getAuteurId())
                        .map(m -> m.getPrenom() + " " + m.getNom()).orElse("Inconnu");
            }
            result.add(VersionDocumentDTO.builder()
                    .id(hd.getId())
                    .version(hd.getVersionArchivee())
                    .cheminFichier(hd.getCheminAncienFichier())
                    .dateModification(hd.getDateModification())
                    .auteurId(hd.getAuteurId())
                    .auteurNom(auteurNom)
                    .tailleFichier(hd.getTailleFichier())
                    .commentaire(hd.getCommentaireModification())
                    .build());
        }

        return result;
    }

    @Transactional
    public DocumentDTO creerNouvelleVersion(Long id, MultipartFile fichier, String commentaire) {
        Document d = documentRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Document introuvable"));

        Long currentId = securityService.getIdUtilisateurConnecte();

        // Archiver la version actuelle
        HistoriqueDocument hist = HistoriqueDocument.builder()
                .cheminAncienFichier(d.getCheminFichier())
                .versionArchivee(d.getVersion())
                .dateModification(LocalDateTime.now())
                .auteurId(currentId)
                .tailleFichier(fichier.getSize())
                .commentaireModification(commentaire)
                .document(d)
                .build();
        historiqueDocumentRepository.save(hist);

        // Sauvegarder le nouveau fichier
        String nouveauChemin = fileStorageService.stockerFichier(fichier, "documents");
        String nouveauSha256 = fileStorageService.calculerSha256(fichier);

        d.setCheminFichier(nouveauChemin);
        d.setEmpreinteSha256(nouveauSha256);
        d.setVersion(d.getVersion() + 1);
        d.setDateUpload(LocalDateTime.now());

        Document saved = documentRepository.save(d);
        return convertirEnDTO(saved);
    }

    @Transactional(readOnly = true)
    public Resource telechargerFichier(Long id, Integer version) {
        Document d = documentRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Document introuvable"));

        if (version == null || version.equals(d.getVersion())) {
            return fileStorageService.chargerFichier(d.getCheminFichier());
        }

        // Rechercher dans les versions archivées
        HistoriqueDocument hist = d.getHistoriqueVersions().stream()
                .filter(h -> h.getVersionArchivee().equals(version))
                .findFirst()
                .orElseThrow(() -> new RessourceIntrouvableException("Version archivée " + version + " introuvable"));

        return fileStorageService.chargerFichier(hist.getCheminAncienFichier());
    }

    public DocumentDTO convertirEnDTO(Document d) {
        return DocumentDTO.builder()
                .id(d.getId())
                .titre(d.getTitre())
                .cheminFichier(d.getCheminFichier())
                .typeDocument(d.getTypeDocument())
                .empreinteSha256(d.getEmpreinteSha256())
                .dateUpload(d.getDateUpload())
                .version(d.getVersion())
                .evenementId(d.getEvenement() != null ? d.getEvenement().getId() : null)
                .conventionId(d.getConvention() != null ? d.getConvention().getId() : null)
                .reunionId(d.getReunion() != null ? d.getReunion().getId() : null)
                .auteur(membreService.convertirEnResumeDTO(d.getAuteur()))
                .build();
    }
}
