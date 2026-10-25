error id: file:///C:/Users/moham/Documents/JEE/lias/backend/src/main/java/ma/univh2c/fsbm/lias/controller/DemandeAdhesionController.java:_empty_/HttpStatus#CREATED#
file:///C:/Users/moham/Documents/JEE/lias/backend/src/main/java/ma/univh2c/fsbm/lias/controller/DemandeAdhesionController.java
empty definition using pc, found symbol in pc: _empty_/HttpStatus#CREATED#
empty definition using semanticdb
empty definition using fallback
non-local guesses:

offset: 1083
uri: file:///C:/Users/moham/Documents/JEE/lias/backend/src/main/java/ma/univh2c/fsbm/lias/controller/DemandeAdhesionController.java
text:
```scala
package ma.univh2c.fsbm.lias.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.univh2c.fsbm.lias.dto.DemandeAdhesionDTO;
import ma.univh2c.fsbm.lias.dto.DemandeAdhesionRequest;
import ma.univh2c.fsbm.lias.dto.RefusDemandeRequest;
import ma.univh2c.fsbm.lias.service.DemandeAdhesionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

@RestController
@RequestMapping("/api/demandes")
@RequiredArgsConstructor
public class DemandeAdhesionController {

    private final DemandeAdhesionService demandeService;
    

    // Endpoint public pour soumettre une candidature avec CV
    @PostMapping
    public ResponseEntity<DemandeAdhesionDTO> soumettreDemande(@Valid @ModelAttribute DemandeAdhesionRequest request) {
        return ResponseEntity.status(HttpStatus.@@CREATED).body(demandeService.soumettreDemande(request));
    }

    // Endpoints protégés (Normalement réservés au Directeur)
    @GetMapping
    @PreAuthorize("hasRole('DIRECTEUR')")
    public ResponseEntity<List<DemandeAdhesionDTO>> getDemandesEnAttente() {
        return ResponseEntity.ok(demandeService.listerDemandesEnAttente());
    }

    @PostMapping("/{id}/accepter")
    @PreAuthorize("hasRole('DIRECTEUR')")
    public ResponseEntity<Void> accepterDemande(@PathVariable Long id) {
        demandeService.accepterDemande(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/refuser")
    @PreAuthorize("hasRole('DIRECTEUR')")
    public ResponseEntity<Void> refuserDemande(@PathVariable Long id, @RequestBody(required = false) RefusDemandeRequest request) {
        String motif = request != null ? request.getMotif() : null;
        demandeService.refuserDemande(id, motif);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/cv")
    @PreAuthorize("hasRole('DIRECTEUR')")
    public ResponseEntity<org.springframework.core.io.Resource> telechargerCv(@PathVariable Long id, @Autowired ma.univh2c.fsbm.lias.repository.DemandeAdhesionRepository repository, @Autowired ma.univh2c.fsbm.lias.service.FileStorageService fileStorageService) {
        ma.univh2c.fsbm.lias.entity.DemandeAdhesion demande = repository.findById(id).orElseThrow(() -> new ma.univh2c.fsbm.lias.exception.RessourceIntrouvableException("Demande introuvable"));
        org.springframework.core.io.Resource resource = fileStorageService.chargerFichier(demande.getCvUrl());
        return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"CV_" + demande.getNom() + ".pdf\"")
                .body(resource);
    }
}
```


#### Short summary: 

empty definition using pc, found symbol in pc: _empty_/HttpStatus#CREATED#