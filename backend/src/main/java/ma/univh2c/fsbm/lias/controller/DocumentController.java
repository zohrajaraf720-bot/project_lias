package ma.univh2c.fsbm.lias.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.univh2c.fsbm.lias.dto.DocumentDTO;
import ma.univh2c.fsbm.lias.dto.DocumentUploadRequest;
import ma.univh2c.fsbm.lias.dto.PageDTO;
import ma.univh2c.fsbm.lias.dto.VersionDocumentDTO;
import ma.univh2c.fsbm.lias.service.DocumentService;
import ma.univh2c.fsbm.lias.enums.TypeDocument;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * La bibliothèque documentaire est accessible aux enseignants-chercheurs, permanents, associés, 
 * membres de la direction (Directeur, Vice-Directeur) et administrateurs.
 */
@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('PERMANENT','ASSOCIE','ADMIN','DIRECTEUR','VICE_DIRECTEUR')")
public class DocumentController {

    private final DocumentService documentService;

    @GetMapping
    public ResponseEntity<PageDTO<DocumentDTO>> rechercherDocuments(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String titre,
            @RequestParam(required = false) TypeDocument type,
            @RequestParam(required = false) Long evenementId,
            Pageable pageable) {
        String searchQuery = (q != null && !q.isBlank()) ? q : titre;
        return ResponseEntity.ok(documentService.rechercherDocuments(searchQuery, type, evenementId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentDTO> getDocumentDetail(@PathVariable Long id) {
        return ResponseEntity.ok(documentService.getDocument(id));
    }

    @GetMapping("/{id}/versions")
    public ResponseEntity<List<VersionDocumentDTO>> getHistoriqueVersions(@PathVariable Long id) {
        return ResponseEntity.ok(documentService.getHistoriqueVersions(id));
    }

    @PostMapping
    public ResponseEntity<DocumentDTO> uploaderDocument(@Valid @ModelAttribute DocumentUploadRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(documentService.uploaderDocument(request));
    }

    @PostMapping("/{id}/versions")
    @PreAuthorize("@securite.estAuteurDocument(#id) or hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<DocumentDTO> nouvelleVersion(
            @PathVariable Long id,
            @RequestParam("fichier") org.springframework.web.multipart.MultipartFile fichier,
            @RequestParam(value = "commentaire", required = false) String commentaire) {
        return ResponseEntity.ok(documentService.creerNouvelleVersion(id, fichier, commentaire));
    }

    @GetMapping({"/{id}/download", "/{id}/telecharger"})
    public ResponseEntity<Resource> telechargerDocument(
            @PathVariable Long id,
            @RequestParam(value = "version", required = false) Integer version) {

        Resource resource = documentService.telechargerFichier(id, version);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
}
