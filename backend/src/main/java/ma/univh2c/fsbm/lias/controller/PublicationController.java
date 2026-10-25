package ma.univh2c.fsbm.lias.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.univh2c.fsbm.lias.dto.PageDTO;
import ma.univh2c.fsbm.lias.dto.PublicationDTO;
import ma.univh2c.fsbm.lias.dto.PublicationRequest;
import ma.univh2c.fsbm.lias.service.PublicationService;
import ma.univh2c.fsbm.lias.enums.TypePublication;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/publications")
@RequiredArgsConstructor
public class PublicationController {

    private final PublicationService publicationService;

    @GetMapping
    public ResponseEntity<PageDTO<PublicationDTO>> getPublications(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String titre,
            @RequestParam(required = false) Long equipeId,
            @RequestParam(required = false) Integer annee,
            @RequestParam(required = false) Long auteurId,
            @RequestParam(required = false) TypePublication type,
            Pageable pageable) {
        
        String searchQuery = (q != null && !q.isBlank()) ? q : titre;
        return ResponseEntity.ok(publicationService.rechercherPublications(searchQuery, equipeId, annee, auteurId, type, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PublicationDTO> getPublication(@PathVariable Long id) {
        return ResponseEntity.ok(publicationService.getPublication(id));
    }

    @GetMapping("/membre/{membreId}")
    public ResponseEntity<List<PublicationDTO>> getPublicationsMembre(@PathVariable Long membreId) {
        return ResponseEntity.ok(publicationService.listerPublicationsParMembre(membreId));
    }

    @GetMapping("/equipe/{equipeId}")
    public ResponseEntity<List<PublicationDTO>> getPublicationsEquipe(@PathVariable Long equipeId) {
        return ResponseEntity.ok(publicationService.listerPublicationsParEquipe(equipeId));
    }

    @PostMapping
    @PreAuthorize("@securite.peutPublierArticle()")
    public ResponseEntity<PublicationDTO> ajouterPublication(@Valid @RequestBody PublicationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(publicationService.ajouterPublication(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@securite.peutPublierArticle() or hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<PublicationDTO> modifierPublication(@PathVariable Long id, @Valid @RequestBody PublicationRequest request) {
        return ResponseEntity.ok(publicationService.modifierPublication(id, request));
    }

    @PutMapping("/{id}/archiver")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<Void> archiverPublication(@PathVariable Long id) {
        publicationService.supprimerPublication(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<Void> supprimerPublication(@PathVariable Long id) {
        publicationService.supprimerPublication(id);
        return ResponseEntity.ok().build();
    }
}
